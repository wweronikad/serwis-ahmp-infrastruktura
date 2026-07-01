import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { WarpedMapLayer } from '@allmaps/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

// ── Basemap definitions ───────────────────────────────────────────────────

const BASEMAPS = [
  {
    id: 'osm',
    label: 'Mapa',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxzoom: 19,
  },
  {
    id: 'satellite',
    label: 'Ortofoto',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    attribution: '© Esri, Maxar, Earthstar Geographics',
    maxzoom: 19,
  },
  {
    id: 'topo',
    label: 'Topografia',
    tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxzoom: 17,
  },
  {
    id: 'dark',
    label: 'Ciemna',
    tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
    attribution: '© <a href="https://carto.com">CARTO</a>',
    maxzoom: 20,
  },
]

// ── Distance helpers ──────────────────────────────────────────────────────

function haversineM([lng1, lat1], [lng2, lat2]) {
  const R = 6371000
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmtDist(m) {
  if (m < 1) return '0 m'
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(3)} km`
}

const EMPTY_FC = { type: 'FeatureCollection', features: [] }

// ── Component ─────────────────────────────────────────────────────────────

export default function InteractiveMap({ city, activeAnnotationUrl, opacity = 0.85, galleryPhotos, galleryBasePath = '', onPhotoClick, onMapReady }) {
  const containerRef = useRef(null)
  const mapRef      = useRef(null)
  const layerRef    = useRef(null)
  const prevUrlRef  = useRef(null)
  const onMapReadyRef = useRef(onMapReady)
  useEffect(() => { onMapReadyRef.current = onMapReady }, [onMapReady])

  // Measurement refs (avoid re-registering handlers on every render)
  const measurePtsRef     = useRef([])   // [[lng,lat], ...]
  const measureMarkersRef = useRef([])   // maplibregl.Marker[]
  const measureLabelsRef  = useRef([])   // maplibregl.Popup[] (segment distances)
  const clickHandlerRef   = useRef(null)
  const measuringRef      = useRef(false)

  // Photo gallery markers
  const photoMarkersRef = useRef([])    // maplibregl.Marker[]
  const onPhotoClickRef = useRef(onPhotoClick)
  useEffect(() => { onPhotoClickRef.current = onPhotoClick }, [onPhotoClick])

  const cityFlySkipRef = useRef(true) // skip flyTo on first mount

  const [layerReady, setLayerReady]   = useState(false)
  const [loading,    setLoading]      = useState(false)
  const [error,      setError]        = useState(null)
  const [basemap,    setBasemap]      = useState('osm')
  const [measuring,  setMeasuring]    = useState(false)
  const [measureInfo, setMeasureInfo] = useState({ total: 0, count: 0 }) // reactive display
  const [bearing,    setBearing]      = useState(0)
  const [pinsVisible, setPinsVisible] = useState(true)

  // ── Map init ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        // Public glyphs for symbol layers (distance labels)
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          basemap: {
            type: 'raster',
            tiles: BASEMAPS[0].tiles,
            tileSize: 256,
            attribution: BASEMAPS[0].attribution,
            maxzoom: 19,
          },
        },
        layers: [{ id: 'basemap-layer', type: 'raster', source: 'basemap' }],
      },
      center: city?.coordinates ?? [20.0, 52.0],
      zoom:   city?.defaultZoom ?? 6,
      maxZoom: 20,
      pitchWithRotate: false,
    })

    // Built-in controls (compass shows current bearing & resets on click)
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
      'top-right',
    )
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    // Track bearing for the UI readout
    map.on('rotate', () => setBearing(Math.round(map.getBearing())))

    map.on('load', () => {
      // ── Allmaps warped-map layer (added first = below measurement layers) ─
      const warpedLayer = new WarpedMapLayer()
      map.addLayer(warpedLayer)
      layerRef.current = warpedLayer

      // ── Measurement sources ──────────────────────────────────────────────
      map.addSource('meas-pts',  { type: 'geojson', data: { ...EMPTY_FC } })
      map.addSource('meas-line', { type: 'geojson', data: { ...EMPTY_FC } })
      map.addSource('meas-lbl',  { type: 'geojson', data: { ...EMPTY_FC } })

      // Line: white outline + gold dashed inner (above warped layer)
      map.addLayer({
        id: 'meas-line-bg', type: 'line', source: 'meas-line',
        paint: { 'line-color': '#ffffff', 'line-width': 5, 'line-opacity': 0.7 },
      })
      map.addLayer({
        id: 'meas-line-fg', type: 'line', source: 'meas-line',
        paint: { 'line-color': '#b8963e', 'line-width': 2.5, 'line-dasharray': [4, 3] },
      })

      // Points: gold circles with white border
      map.addLayer({
        id: 'meas-pts-layer', type: 'circle', source: 'meas-pts',
        paint: {
          'circle-radius': 5,
          'circle-color': '#b8963e',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
        },
      })

      // Segment distance labels
      map.addLayer({
        id: 'meas-lbl-layer', type: 'symbol', source: 'meas-lbl',
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 12,
          'text-anchor': 'top',
          'text-offset': [0, 0.4],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': '#1a2942',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
      })

      setLayerReady(true)
    })

    mapRef.current = map
    onMapReadyRef.current?.(map)

    return () => {
      stopMeasureHandler()
      map.remove()
      mapRef.current  = null
      layerRef.current = null
      prevUrlRef.current = null
      measurePtsRef.current = []
      measureMarkersRef.current = []
      measuringRef.current = false
      setLayerReady(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── City change → fly to city ─────────────────────────────────────────────

  useEffect(() => {
    if (cityFlySkipRef.current) { cityFlySkipRef.current = false; return }
    const map = mapRef.current
    if (!map || !city?.coordinates) return
    map.flyTo({ center: city.coordinates, zoom: city.defaultZoom ?? 14, duration: 1200 })
  }, [city?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Basemap switch ────────────────────────────────────────────────────────

  const switchBasemap = useCallback((id) => {
    const bm = BASEMAPS.find((b) => b.id === id)
    if (!bm || !mapRef.current) return
    try { mapRef.current.getSource('basemap').setTiles(bm.tiles) } catch { /* not ready */ }
    setBasemap(id)
  }, [])

  // ── Measurement helpers ───────────────────────────────────────────────────

  const refreshMeasureGeojson = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const pts = measurePtsRef.current

    // Points
    map.getSource('meas-pts')?.setData({
      type: 'FeatureCollection',
      features: pts.map((c) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {},
      })),
    })

    // Line + segment labels
    let total = 0
    const labelFeatures = []

    if (pts.length >= 2) {
      map.getSource('meas-line')?.setData({
        type: 'Feature', geometry: { type: 'LineString', coordinates: pts }, properties: {},
      })
      for (let i = 1; i < pts.length; i++) {
        const d = haversineM(pts[i - 1], pts[i])
        total += d
        const mid = [(pts[i - 1][0] + pts[i][0]) / 2, (pts[i - 1][1] + pts[i][1]) / 2]
        labelFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: mid },
          properties: { label: fmtDist(d) },
        })
      }
    } else {
      map.getSource('meas-line')?.setData({ ...EMPTY_FC })
    }

    map.getSource('meas-lbl')?.setData({ type: 'FeatureCollection', features: labelFeatures })
    setMeasureInfo({ total, count: pts.length })
  }, [])

  const stopMeasureHandler = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (clickHandlerRef.current) {
      map.off('click', clickHandlerRef.current)
      clickHandlerRef.current = null
    }
    map.doubleClickZoom.enable()
    map.getCanvas().style.cursor = ''
  }, [])

  const startMeasureHandler = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    map.doubleClickZoom.disable()
    map.getCanvas().style.cursor = 'crosshair'

    const fn = (e) => {
      if (!measuringRef.current) return
      measurePtsRef.current = [...measurePtsRef.current, [e.lngLat.lng, e.lngLat.lat]]
      refreshMeasureGeojson()
    }
    clickHandlerRef.current = fn
    map.on('click', fn)
  }, [refreshMeasureGeojson])

  const clearMeasure = useCallback(() => {
    measurePtsRef.current = []
    refreshMeasureGeojson()
  }, [refreshMeasureGeojson])

  const toggleMeasure = useCallback(() => {
    if (measuringRef.current) {
      measuringRef.current = false
      stopMeasureHandler()
      setMeasuring(false)
    } else {
      measuringRef.current = true
      startMeasureHandler()
      setMeasuring(true)
    }
  }, [stopMeasureHandler, startMeasureHandler])

  const resetNorth = useCallback(() => {
    mapRef.current?.rotateTo(0, { duration: 500 })
  }, [])

  // ── Annotation swap ───────────────────────────────────────────────────────

  useEffect(() => {
    console.log('[Annotation] effect fired', { layerReady, activeAnnotationUrl, prev: prevUrlRef.current })
    if (!layerReady || !layerRef.current || !mapRef.current) { console.log('[Annotation] SKIP - not ready', { layerReady }); return }
    if (activeAnnotationUrl === prevUrlRef.current) { console.log('[Annotation] SKIP - same url'); return }

    const layer = layerRef.current
    const map   = mapRef.current
    const prev  = prevUrlRef.current
    let cancelled = false

    const swap = async () => {
      setLoading(true)
      setError(null)
      try {
        if (prev) { console.log('[Annotation] removing prev', prev); await layer.removeGeoreferenceAnnotationByUrl(prev) }
        if (activeAnnotationUrl && !cancelled) {
          console.log('[Annotation] loading', activeAnnotationUrl)
          await layer.addGeoreferenceAnnotationByUrl(activeAnnotationUrl)
          console.log('[Annotation] loaded OK')
          if (!cancelled) {
            prevUrlRef.current = activeAnnotationUrl
            let rafCount = 0
            const rafLoop = () => {
              if (!cancelled && mapRef.current && rafCount < 30) {
                mapRef.current.triggerRepaint(); rafCount++
                requestAnimationFrame(rafLoop)
              }
            }
            requestAnimationFrame(rafLoop)
            setTimeout(() => {
              if (!cancelled && mapRef.current) mapRef.current.triggerRepaint()
            }, 800)
          }
        } else {
          prevUrlRef.current = null
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Allmaps error:', err)
          setError('Nie udało się załadować adnotacji.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    swap()
    return () => { cancelled = true }
  }, [layerReady, activeAnnotationUrl])

  // ── Photo gallery markers ─────────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current
    if (!map || !layerReady || !galleryPhotos?.length) return

    // Remove old markers
    photoMarkersRef.current.forEach(m => m.remove())
    photoMarkersRef.current = []

    galleryPhotos.forEach((photo, i) => {
      if (!photo.mapPin) return

      // Custom marker element: camera icon, no hover thumbnail (popup on click)
      const el = document.createElement('div')
      el.className = 'photo-map-marker'
      el.innerHTML = `
        <div class="photo-marker-dot">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      `

      // Bring this marker above its neighbours on hover
      el.addEventListener('mouseenter', () => {
        if (el.parentElement) el.parentElement.style.zIndex = '9999'
      })
      el.addEventListener('mouseleave', () => {
        if (el.parentElement) el.parentElement.style.zIndex = ''
      })
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const rect = el.getBoundingClientRect()
        onPhotoClickRef.current?.(i, rect.left + rect.width / 2, rect.top)
      })

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(photo.mapPin)
        .addTo(map)

      photoMarkersRef.current.push(marker)
    })

    return () => {
      photoMarkersRef.current.forEach(m => m.remove())
      photoMarkersRef.current = []
    }
  }, [layerReady, galleryPhotos]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pin visibility toggle ─────────────────────────────────────────────────

  useEffect(() => {
    photoMarkersRef.current.forEach(m => {
      m.getElement().style.display = pinsVisible ? '' : 'none'
    })
  }, [pinsVisible])

  // ── Opacity sync ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!layerRef.current || !layerReady) return
    try { layerRef.current.setOpacity(opacity) } catch { /* ignore */ }
  }, [opacity, layerReady])

  // ── Render ────────────────────────────────────────────────────────────────

  const absBearing = bearing < 0 ? 360 + bearing : bearing

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div style={ui.toolbar}>

        {/* Basemap switcher */}
        <div style={ui.group}>
          {BASEMAPS.map((bm) => (
            <button
              key={bm.id}
              onClick={() => switchBasemap(bm.id)}
              title={bm.label}
              style={basemap === bm.id ? ui.btnActive : ui.btn}
            >
              {bm.label}
            </button>
          ))}
        </div>

        <div style={ui.sep} />

        {/* Pin layer toggle — only when gallery pins exist */}
        {galleryPhotos?.length > 0 && (
          <button
            onClick={() => setPinsVisible(v => !v)}
            title={pinsVisible ? 'Ukryj pinezki galerii na mapie' : 'Pokaż pinezki galerii na mapie'}
            style={{ ...ui.btn, opacity: pinsVisible ? 1 : 0.45 }}
          >
            📍 Galeria
          </button>
        )}

        <div style={ui.sep} />

        {/* Measure tool */}
        <button
          onClick={toggleMeasure}
          title="Narzędzie pomiaru odległości — kliknij punkty na mapie"
          style={measuring ? ui.btnActive : ui.btn}
        >
          📏 Pomiar
        </button>

        {/* North reset — only when rotated */}
        {absBearing > 0.5 && (
          <>
            <div style={ui.sep} />
            <button
              onClick={resetNorth}
              title={`Kierunek: ${absBearing}° — kliknij aby wrócić do północy`}
              style={ui.btnNorth}
            >
              <span style={{ display: 'inline-block', transform: `rotate(${-bearing}deg)`, fontSize: '14px', lineHeight: 1 }}>
                ↑
              </span>
              <span style={{ fontSize: '10px', marginLeft: '2px' }}>{absBearing}°</span>
            </button>
          </>
        )}
      </div>

      {/* ── Measure info bar ──────────────────────────────────────────────── */}
      {(measuring || measureInfo.count > 0) && (
        <div style={ui.measureBar}>
          {measuring && measureInfo.count === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Klikaj punkty na mapie aby zmierzyć odległość
            </span>
          ) : (
            <>
              <span style={ui.measureDist}>
                📏 <strong>{fmtDist(measureInfo.total)}</strong>
              </span>
              <span style={ui.measurePts}>
                {measureInfo.count} {measureInfo.count === 1 ? 'punkt' : 'punktów'}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                {!measuring && (
                  <button onClick={toggleMeasure} style={ui.measureBtn}>
                    + Dodaj punkty
                  </button>
                )}
                <button onClick={clearMeasure} style={ui.measureBtnDanger}>
                  ✕ Wyczyść
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Loading / Error ───────────────────────────────────────────────── */}
      {loading && (
        <div style={pill}>
          <span style={spinner} />
          <span>Ładowanie mapy…</span>
        </div>
      )}
      {error && (
        <div style={{ ...pill, background: 'rgba(255,235,235,0.95)', color: '#900' }}>
          {error}
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const ui = {
  toolbar: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(245,240,232,0.97)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '4px 6px',
    boxShadow: 'var(--shadow)',
    backdropFilter: 'blur(4px)',
    flexWrap: 'wrap',
  },
  group: {
    display: 'flex',
    gap: '2px',
  },
  sep: {
    width: '1px',
    height: '20px',
    background: 'var(--border)',
    flexShrink: 0,
    margin: '0 2px',
  },
  btn: {
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '3px',
    padding: '4px 9px',
    fontSize: '12px',
    color: 'var(--navy)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-sans)',
    transition: 'background 0.12s',
  },
  btnActive: {
    background: 'var(--navy)',
    border: '1px solid var(--navy)',
    borderRadius: '3px',
    padding: '4px 9px',
    fontSize: '12px',
    color: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-sans)',
  },
  btnNorth: {
    background: 'rgba(184,150,62,0.12)',
    border: '1px solid var(--gold)',
    borderRadius: '3px',
    padding: '4px 8px',
    fontSize: '12px',
    color: 'var(--gold)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '1px',
    fontFamily: 'var(--font-sans)',
  },
  measureBar: {
    position: 'absolute',
    bottom: '44px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(245,240,232,0.97)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '7px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: 'var(--shadow)',
    fontSize: '13px',
    color: 'var(--navy)',
    whiteSpace: 'nowrap',
    maxWidth: 'calc(100% - 80px)',
    zIndex: 10,
  },
  measureDist: {
    fontFamily: 'var(--font-serif)',
  },
  measurePts: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  measureBtn: {
    background: 'var(--navy)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '3px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  measureBtnDanger: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '3px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
}

const pill = {
  position: 'absolute',
  bottom: '44px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(245,240,232,0.95)',
  border: '1px solid var(--border)',
  borderRadius: '20px',
  padding: '7px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  boxShadow: 'var(--shadow)',
  pointerEvents: 'none',
  fontSize: '13px',
  color: 'var(--navy)',
  whiteSpace: 'nowrap',
  zIndex: 10,
}

const spinner = {
  display: 'inline-block',
  width: '14px',
  height: '14px',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderTopColor: 'var(--navy)',
  borderRightColor: 'var(--border)',
  borderBottomColor: 'var(--border)',
  borderLeftColor: 'var(--border)',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
  flexShrink: 0,
}
