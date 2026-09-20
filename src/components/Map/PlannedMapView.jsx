import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function PlannedMapView({ map }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [opacity, setOpacity] = useState(0.85)
  const [large, setLarge] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const glMap = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
          historical: {
            type: 'raster',
            tiles: [map.tiles],
            tileSize: 256,
            minzoom: map.minzoom,
            maxzoom: map.maxzoom,
          },
        },
        layers: [
          { id: 'osm', type: 'raster', source: 'osm' },
          { id: 'historical', type: 'raster', source: 'historical', paint: { 'raster-opacity': opacity } },
        ],
      },
      bounds: map.bounds,
      fitBoundsOptions: { padding: 30 },
    })
    glMap.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = glMap

    return () => {
      glMap.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    const glMap = mapRef.current
    if (!glMap) return
    const apply = () => {
      if (glMap.getLayer('historical')) glMap.setPaintProperty('historical', 'raster-opacity', opacity)
    }
    if (glMap.isStyleLoaded()) apply()
    else glMap.once('load', apply)
  }, [opacity])

  // the container changes height when toggled — MapLibre must recompute its canvas
  useEffect(() => {
    mapRef.current?.resize()
  }, [large])

  return (
    <div style={s.wrap}>
      <div ref={containerRef} style={{ ...s.map, height: large ? 'min(86vh, 900px)' : 'min(62vh, 620px)' }} />
      <div style={s.controls}>
        <span style={s.label}>Przezroczystość mapy hist.</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          style={s.slider}
        />
        <span style={s.value}>{Math.round(opacity * 100)}%</span>
        <button
          type="button"
          onClick={() => setLarge((v) => !v)}
          style={s.sizeBtn}
          title={large ? 'Zmniejsz okno mapy' : 'Powiększ okno mapy'}
        >
          {large ? '⤡ Zmniejsz' : '⤢ Powiększ'}
        </button>
      </div>
      <div style={s.caption}>
        {map.title} — {map.author}, {map.year}
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position: 'relative',
    border: '1px solid var(--border-light)',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  map: {
    width: '100%',
    height: 620,
  },
  controls: {
    position: 'absolute',
    top: 10,
    left: 10,
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    boxShadow: 'var(--shadow-sm)',
  },
  label: {
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  slider: {
    width: 110,
  },
  sizeBtn: {
    marginLeft: 6,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--navy)',
    background: 'var(--cream)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  value: {
    color: 'var(--navy)',
    fontWeight: 600,
    width: 34,
  },
  caption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(26,41,66,0.85)',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    padding: '5px 12px',
  },
}
