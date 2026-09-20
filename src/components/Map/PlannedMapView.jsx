import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { asset } from '../../utils/asset'

function boundsOf(coords) {
  const lons = coords.map((c) => c[0]); const lats = coords.map((c) => c[1])
  return [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]]
}

// bearing (compass direction shown at the top of the screen) that makes the image upright:
// corners are [top-left, top-right, bottom-right, bottom-left]
function uprightBearing(c) {
  const k = Math.cos((c[0][1] * Math.PI) / 180)
  const dx = (c[3][0] - c[0][0]) * k          // top-left -> bottom-left (image "down")
  const dy = c[3][1] - c[0][1]
  const down = (Math.atan2(dx, dy) * 180) / Math.PI
  return (down + 180 + 360) % 360
}

function fitRotated(glMap, coords, pad) {
  const bearing = uprightBearing(coords)
  const lon = coords.reduce((a, c) => a + c[0], 0) / 4
  const lat = coords.reduce((a, c) => a + c[1], 0) / 4
  glMap.jumpTo({ center: [lon, lat], zoom: 15, bearing })
  const pts = coords.map((c) => glMap.project(c))
  const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x))
  const h = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y))
  const box = glMap.getContainer().getBoundingClientRect()
  const scale = Math.min((box.width - 2 * pad) / w, (box.height - 2 * pad) / h)
  glMap.jumpTo({ zoom: 15 + Math.log2(scale) })
}

export default function PlannedMapView({ map }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [opacity, setOpacity] = useState(0.85)
  const [large, setLarge] = useState(false)
  const [place, setPlace] = useState(null)      // place whose photos are open
  const [photoIdx, setPhotoIdx] = useState(null) // enlarged photo inside that place

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
          historical: map.image
            ? { type: 'image', url: asset(map.image), coordinates: map.coordinates }
            : {
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
      ...(map.image
        ? { bounds: boundsOf(map.coordinates), fitBoundsOptions: { padding: 30 } }
        : { bounds: map.bounds, fitBoundsOptions: { padding: 30 } }),
    })
    // A georeferenced image whose "up" is not north: open the view rotated so the plan
    // stands upright and fills the window (the basemap turns with it).
    if (map.image) fitRotated(glMap, map.coordinates, 40)
    glMap.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = glMap

    // photo pins (places with photographs attached to the plan)
    const markers = (map.places || []).map((pl) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.title = `${pl.name} — zdjęcia (${pl.photos.length})`
      el.textContent = pl.photos.length
      Object.assign(el.style, {
        width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #fff',
        background: '#1a2942', color: '#f0d99a', fontWeight: '700', fontSize: '13px',
        cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
      })
      el.addEventListener('click', (ev) => { ev.stopPropagation(); setPhotoIdx(null); setPlace(pl) })
      return new maplibregl.Marker({ element: el }).setLngLat(pl.lngLat).addTo(glMap)
    })

    return () => {
      markers.forEach((m) => m.remove())
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
      {place && (
        <div style={s.panel}>
          <div style={s.panelHead}>
            <strong style={{ fontFamily: 'var(--font-serif)', fontSize: 15 }}>{place.name}</strong>
            <button type="button" style={s.close} onClick={() => { setPlace(null); setPhotoIdx(null) }} aria-label="Zamknij">×</button>
          </div>
          {photoIdx === null ? (
            <div style={s.thumbs}>
              {place.photos.map((ph, i) => (
                <button key={ph.file} type="button" style={s.thumbBtn} onClick={() => setPhotoIdx(i)} title={ph.title}>
                  <img src={asset(`/galeria/pulawy/${ph.file}`)} alt={ph.title} style={s.thumb} loading="lazy" />
                  <span style={s.thumbCap}>{ph.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <img src={asset(`/galeria/pulawy/${place.photos[photoIdx].file}`)} alt={place.photos[photoIdx].title} style={s.big} />
              <div style={s.bigBar}>
                <button type="button" style={s.nav} onClick={() => setPhotoIdx((photoIdx + place.photos.length - 1) % place.photos.length)}>‹</button>
                <span style={{ flex: 1, textAlign: 'center' }}>{place.photos[photoIdx].title}</span>
                <button type="button" style={s.nav} onClick={() => setPhotoIdx((photoIdx + 1) % place.photos.length)}>›</button>
              </div>
              <button type="button" style={s.back} onClick={() => setPhotoIdx(null)}>← wszystkie zdjęcia</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  panel: {
    position: 'absolute', top: 10, right: 52, maxHeight: 'calc(100% - 44px)', width: 'min(360px, 60%)',
    background: 'rgba(255,255,255,0.97)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '10px 12px', overflowY: 'auto', boxShadow: 'var(--shadow-sm)',
  },
  panelHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, color: 'var(--navy)' },
  close: { background: 'none', border: 'none', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: 'var(--text-muted)' },
  thumbs: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  thumbBtn: { background: 'var(--cream)', border: '1px solid var(--border-light)', borderRadius: 6, padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden' },
  thumb: { width: '100%', height: 96, objectFit: 'cover', display: 'block' },
  thumbCap: { display: 'block', fontSize: 11, lineHeight: 1.35, padding: '4px 6px', color: 'var(--text)' },
  big: { width: '100%', borderRadius: 4, display: 'block' },
  bigBar: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--text)' },
  nav: { background: 'var(--cream-dark)', border: '1px solid var(--border)', borderRadius: 4, width: 30, height: 26, cursor: 'pointer', fontSize: 16 },
  back: { marginTop: 8, background: 'none', border: 'none', color: 'var(--navy)', fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline' },
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
