import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const CENTER = [22.14783, 51.29467]
const ZOOM = 15

// Corners of the georeferenced historical map (WGS84)
const IMG_COORDS = [
  [22.142637, 51.298213], // top-left
  [22.153028, 51.298213], // top-right
  [22.153028, 51.291125], // bottom-right
  [22.142637, 51.291125], // bottom-left
]

const OSM_STYLE = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

export default function WawolnicaSlider({ height = 480 }) {
  const containerRef = useRef(null)
  const modernRef = useRef(null)
  const histRef = useRef(null)
  const mapModern = useRef(null)
  const mapHist = useRef(null)
  const syncing = useRef(false)
  const dragging = useRef(false)
  const [pos, setPos] = useState(50) // slider position in %

  useEffect(() => {
    // Modern map — bottom, receives all interactions
    mapModern.current = new maplibregl.Map({
      container: modernRef.current,
      style: OSM_STYLE,
      center: CENTER,
      zoom: ZOOM,
      attributionControl: false,
    })

    // Historical map — top, clipped, no interactions
    mapHist.current = new maplibregl.Map({
      container: histRef.current,
      style: OSM_STYLE,
      center: CENTER,
      zoom: ZOOM,
      attributionControl: false,
      interactive: false,
    })

    mapHist.current.on('load', () => {
      mapHist.current.addSource('hist-img', {
        type: 'image',
        url: '/wawolnica/mapa.webp',
        coordinates: IMG_COORDS,
      })
      mapHist.current.addLayer({
        id: 'hist-layer',
        type: 'raster',
        source: 'hist-img',
        paint: { 'raster-opacity': 1.0, 'raster-resampling': 'linear' },
      })
    })

    // Sync: modern drives historical
    const syncViews = () => {
      if (syncing.current) return
      syncing.current = true
      mapHist.current.jumpTo({
        center: mapModern.current.getCenter(),
        zoom: mapModern.current.getZoom(),
        bearing: mapModern.current.getBearing(),
        pitch: mapModern.current.getPitch(),
      })
      syncing.current = false
    }
    mapModern.current.on('move', syncViews)

    mapModern.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    return () => {
      mapModern.current?.remove()
      mapHist.current?.remove()
    }
  }, [])

  // Drag logic
  const onMouseDown = (e) => {
    dragging.current = true
    e.preventDefault()
  }
  const onTouchStart = (e) => {
    dragging.current = true
  }

  useEffect(() => {
    const move = (clientX) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const p = ((clientX - rect.left) / rect.width) * 100
      setPos(Math.max(4, Math.min(96, p)))
    }
    const onMouseMove = (e) => move(e.clientX)
    const onTouchMove = (e) => move(e.touches[0].clientX)
    const stop = () => { dragging.current = false }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', stop)
    }
  }, [])

  return (
    <div ref={containerRef} style={s.wrap(height)}>
      {/* Modern OSM — receives mouse events */}
      <div ref={modernRef} style={s.mapFull} />

      {/* Historical map — clipped to left of slider */}
      <div
        ref={histRef}
        style={{ ...s.mapFull, clipPath: `inset(0 ${100 - pos}% 0 0)`, pointerEvents: 'none' }}
      />

      {/* Divider line */}
      <div style={s.line(pos)} onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
        <div style={s.handle}>
          <span style={s.arrow}>◀</span>
          <span style={s.arrow}>▶</span>
        </div>
      </div>

      {/* Labels */}
      <div style={s.labelLeft}>Plan Wąwolnicy 1820 · J. Kierłowicz</div>
      <div style={s.labelRight}>Współcześnie · OpenStreetMap</div>
    </div>
  )
}

const s = {
  wrap: (h) => ({
    position: 'relative',
    height: `${h}px`,
    overflow: 'hidden',
    userSelect: 'none',
    cursor: 'default',
    borderTop: '2px solid var(--gold)',
    borderBottom: '2px solid var(--gold)',
  }),
  mapFull: {
    position: 'absolute',
    inset: 0,
  },
  line: (pos) => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: `${pos}%`,
    transform: 'translateX(-50%)',
    width: '3px',
    background: 'rgba(255,255,255,0.9)',
    boxShadow: '0 0 8px rgba(0,0,0,0.5)',
    cursor: 'col-resize',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  handle: {
    width: '44px',
    height: '44px',
    background: 'var(--navy)',
    border: '2px solid var(--gold)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.45)',
    flexShrink: 0,
  },
  arrow: {
    fontSize: '10px',
    color: 'var(--gold-light)',
    lineHeight: 1,
  },
  labelLeft: {
    position: 'absolute',
    top: '14px',
    left: '14px',
    background: 'rgba(26,41,66,0.82)',
    color: '#d4b26a',
    padding: '5px 12px',
    borderRadius: '2px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.3px',
    pointerEvents: 'none',
    zIndex: 9,
    backdropFilter: 'blur(2px)',
  },
  labelRight: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    background: 'rgba(26,41,66,0.82)',
    color: '#d4b26a',
    padding: '5px 12px',
    borderRadius: '2px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.3px',
    pointerEvents: 'none',
    zIndex: 9,
    backdropFilter: 'blur(2px)',
  },
}
