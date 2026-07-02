import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cities, getCityById } from '../data/cities'
import { asset } from '../utils/asset'
import InteractiveMap from '../components/Map/InteractiveMap'
import MapListPanel from '../components/Map/MapListPanel'
import InfoPanel from '../components/Map/InfoPanel'
import CityGallery from '../components/Gallery/CityGallery'
import bieczGallery from '../data/galeria/biecz_gallery.json'
import brzegGallery from '../data/galeria/brzeg_gallery.json'
import bydgoszczGallery from '../data/galeria/bydgoszcz_gallery.json'
import chelmnoGallery from '../data/galeria/chelmno_gallery.json'
import elblagGallery from '../data/galeria/elblag_gallery.json'
import chojniceGallery from '../data/galeria/chojnice_gallery.json'
import gizyckoGallery from '../data/galeria/gizycko_gallery.json'
import grudziadzGallery from '../data/galeria/grudziadz_gallery.json'
import ketrzymGallery from '../data/galeria/ketrzyn_gallery.json'
import kwidzynGallery from '../data/galeria/kwidzyn_gallery.json'
import legnicaGallery from '../data/galeria/legnica_gallery.json'
import lidzbarGallery from '../data/galeria/lidzbark_warminski_gallery.json'
import miliczGallery from '../data/galeria/milicz_gallery.json'
import namyslowGallery from '../data/galeria/namyslow_gallery.json'
import ostrodaGallery from '../data/galeria/ostroda_gallery.json'
import puckGallery from '../data/galeria/puck_gallery.json'
import srodaSlaskaGallery from '../data/galeria/sroda_slaska_gallery.json'
import strzegomGallery from '../data/galeria/strzegom_gallery.json'
import swidnicaGallery from '../data/galeria/swidnica_gallery.json'
import swiecieGallery from '../data/galeria/swiecie_gallery.json'
import tarnowGallery from '../data/galeria/tarnow_gallery.json'
import tczewGallery from '../data/galeria/tczew_gallery.json'
import torunGallery from '../data/galeria/torun_gallery.json'
import trzebnicaGallery from '../data/galeria/trzebnica_gallery.json'
import wloclawekGallery from '../data/galeria/wloclawek_gallery.json'
import wroclawGallery from '../data/galeria/wroclaw_gallery.json'
import zamoscGallery from '../data/galeria/zamosc_gallery.json'
import ziebiceGallery from '../data/galeria/ziebice_gallery.json'

// Gallery data per city id
const GALLERY_DATA = {
  biecz:     { photos: bieczGallery,     basePath: asset('/galeria/biecz/') },
  brzeg:     { photos: brzegGallery,     basePath: asset('/galeria/brzeg/') },
  bydgoszcz: { photos: bydgoszczGallery, basePath: asset('/galeria/bydgoszcz/') },
  chelmno:   { photos: chelmnoGallery,   basePath: asset('/galeria/chelmno/') },
  chojnice:  { photos: chojniceGallery,  basePath: asset('/galeria/chojnice/') },
  elblag:    { photos: elblagGallery,    basePath: asset('/galeria/elblag/') },
  gizycko:   { photos: gizyckoGallery,   basePath: asset('/galeria/gizycko/') },
  grudziadz: { photos: grudziadzGallery, basePath: asset('/galeria/grudziadz/') },
  ketrzyn:   { photos: ketrzymGallery,   basePath: asset('/galeria/ketrzyn/') },
  kwidzyn:   { photos: kwidzynGallery,   basePath: asset('/galeria/kwidzyn/') },
  legnica:   { photos: legnicaGallery,   basePath: asset('/galeria/legnica/') },
  'lidzbark-warminski': { photos: lidzbarGallery,   basePath: asset('/galeria/lidzbark_warminski/') },
  milicz:              { photos: miliczGallery,    basePath: asset('/galeria/milicz/') },
  namyslow:            { photos: namyslowGallery,  basePath: asset('/galeria/namyslow/') },
  ostroda:             { photos: ostrodaGallery,   basePath: asset('/galeria/ostroda/') },
  puck:                { photos: puckGallery,      basePath: asset('/galeria/puck/') },
  'sroda-slaska':      { photos: srodaSlaskaGallery, basePath: asset('/galeria/sroda_slaska/') },
  strzegom:            { photos: strzegomGallery,  basePath: asset('/galeria/strzegom/') },
  swidnica:            { photos: swidnicaGallery,  basePath: asset('/galeria/swidnica/') },
  swiecie:             { photos: swiecieGallery,   basePath: asset('/galeria/swiecie/') },
  tarnow:              { photos: tarnowGallery,    basePath: asset('/galeria/tarnow/') },
  tczew:               { photos: tczewGallery,     basePath: asset('/galeria/tczew/') },
  torun:               { photos: torunGallery,     basePath: asset('/galeria/torun/') },
  trzebnica:           { photos: trzebnicaGallery, basePath: asset('/galeria/trzebnica/') },
  wloclawek:           { photos: wloclawekGallery, basePath: asset('/galeria/wloclawek/') },
  wroclaw:             { photos: wroclawGallery,   basePath: asset('/galeria/wroclaw/') },
  zamosc:              { photos: zamoscGallery,    basePath: asset('/galeria/zamosc/') },
  ziebice:             { photos: ziebiceGallery,   basePath: asset('/galeria/ziebice/') },
}

const MIN_LIST_W = 180
const MAX_LIST_W = 460
const MIN_INFO_W = 200
const MAX_INFO_W = 520

// ── Compact selector for the split (second) map ───────────────────────────

function SplitMapSelector({ splitCityId, splitMapId, onCityChange, onMapSelect, opacity, onOpacityChange }) {
  const [open, setOpen] = useState(true)
  const city = getCityById(splitCityId) ?? cities[0]
  const sortedMaps = [...city.maps].sort((a, b) => {
    if (a.year === null) return 1
    if (b.year === null) return -1
    return a.year - b.year
  })

  const PANEL_W = 210

  return (
    <>
      {/* Slide-in panel */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: open ? PANEL_W : 0,
        overflow: 'hidden',
        transition: 'width 0.25s ease',
        background: 'rgba(245,240,232,0.97)',
        borderRight: '1px solid var(--border)',
        backdropFilter: 'blur(6px)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        fontSize: '13px',
        flexShrink: 0,
      }}>
        <div style={{ width: PANEL_W, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
            <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Mapa do porównania
            </div>
            <select
              value={splitCityId}
              onChange={(e) => onCityChange(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', fontSize: '12px', fontFamily: 'var(--font-sans)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--white)', color: 'var(--navy)', cursor: 'pointer', outline: 'none' }}
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Opacity */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                Przezroczystość
              </span>
              <span style={{ fontSize: '11px', color: 'var(--navy)', fontWeight: '600' }}>
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range" min="0" max="1" step="0.01"
              value={opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--navy)', cursor: 'pointer' }}
            />
          </div>

          {/* Map list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px 8px' }}>
            {sortedMaps.map((map) => {
              const active = map.id === splitMapId
              return (
                <button
                  key={map.id}
                  onClick={() => onMapSelect(map.id)}
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: active ? 'rgba(26,41,66,0.06)' : 'transparent',
                    border: active ? '1px solid var(--navy)' : '1px solid transparent',
                    borderRadius: 'var(--radius)',
                    padding: '7px 8px', marginBottom: '2px',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '1px' }}>
                    {map.yearDisplay}
                  </span>
                  <span style={{ fontSize: '11px', color: active ? 'var(--navy)' : 'var(--text)', fontWeight: active ? '600' : 'normal', lineHeight: '1.4' }}>
                    {map.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Toggle button — slides with panel */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'absolute',
          top: '10px',
          left: open ? PANEL_W + 8 : 10,
          transition: 'left 0.25s ease',
          zIndex: 21,
          background: 'rgba(245,240,232,0.97)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '4px 9px',
          fontSize: '12px',
          color: 'var(--navy)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          boxShadow: 'var(--shadow)',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(4px)',
        }}
        title={open ? 'Ukryj panel mapy' : 'Wybierz mapę do porównania'}
      >
        {open ? '← Ukryj' : '≡ Mapa 2'}
      </button>
    </>
  )
}

// ── Main Atlas page ───────────────────────────────────────────────────────

// ── Photo popup (shown above map pin on click) ────────────────────────────

function PhotoPopup({ photo, basePath, x, y, onOpen, onClose }) {
  // Position above the marker; keep within viewport
  const PAD = 16
  const W   = 220
  const left = Math.min(Math.max(PAD, x - W / 2), window.innerWidth - W - PAD)
  const top  = y - 8  // popup appears above the marker (transform moves it up)

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        transform: 'translateY(-100%)',
        zIndex: 500,
        width: W,
        background: 'rgba(12,21,32,0.97)',
        border: '1px solid rgba(184,150,62,0.5)',
        borderRadius: 5,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
      }}
    >
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#aaa', width: 22, height: 22, borderRadius: 3, cursor: 'pointer', fontSize: 11, zIndex: 1 }}
      >✕</button>
      <img
        src={`${basePath}${photo.file}`}
        alt={photo.title}
        style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
        onClick={onOpen}
      />
      <div style={{ padding: '9px 12px 11px' }}>
        <div style={{ color: '#e8dfc8', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-serif)', lineHeight: 1.3 }}>{photo.title}</div>
        <div style={{ color: '#b8963e', fontSize: 11, marginTop: 2 }}>{photo.date}</div>
        <button
          onClick={onOpen}
          style={{ marginTop: 9, width: '100%', padding: '6px', background: '#b8963e', color: '#0c1520', border: 'none', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.2px' }}
        >
          Przejdź do galerii →
        </button>
      </div>
    </div>
  )
}

export default function Atlas() {
  const { cityId } = useParams()
  const navigate = useNavigate()

  const city = getCityById(cityId) ?? cities[0]
  const [selectedMapId, setSelectedMapId] = useState(city.maps[0].id)
  const [opacity, setOpacity] = useState(0.85)

  // Split view
  const [splitView, setSplitView] = useState(false)
  const [splitCityId, setSplitCityId] = useState(city.id)
  const [splitMapId, setSplitMapId] = useState(city.maps[0].id)
  const [splitOpacity, setSplitOpacity] = useState(0.85)
  const [splitRatio, setSplitRatio] = useState(0.5)

  // Panel widths + collapse state
  const [listPanelWidth, setListPanelWidth] = useState(260)
  const [infoPanelWidth, setInfoPanelWidth] = useState(290)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false)

  // Gallery pins visibility
  const [pinsVisible, setPinsVisible] = useState(true)

  // Gallery
  const [galleryOpen,   setGalleryOpen]   = useState(false)
  const [galleryIdx,    setGalleryIdx]    = useState(0)
  const [photoPopup,    setPhotoPopup]    = useState(null) // { idx, x, y }
  const galleryMeta    = GALLERY_DATA[city.id] ?? null
  const galleryPhotos  = galleryMeta?.photos ?? null
  const galleryBasePath = galleryMeta?.basePath ?? ''

  // Synchronized split view
  const [syncEnabled, setSyncEnabled] = useState(true)
  const primaryMapRef   = useRef(null)
  const secondaryMapRef = useRef(null)

  const handlePhotoMarkerClick = useCallback((idx, x, y) => {
    setPhotoPopup({ idx, x, y })
  }, [])

  const openGalleryAt = useCallback((idx) => {
    setGalleryIdx(idx)
    setGalleryOpen(true)
    setPhotoPopup(null)
  }, [])

  // Reset selected map when city changes
  useEffect(() => {
    setSelectedMapId(city.maps[0].id)
    setPhotoPopup(null)
    setGalleryOpen(false)
  }, [city.id])

  // Clear secondary map ref when split view closes
  useEffect(() => {
    if (!splitView) secondaryMapRef.current = null
  }, [splitView])

  // Wire synchronized movement between the two maps
  useEffect(() => {
    if (!splitView || !syncEnabled) return

    const wire = () => {
      const primary   = primaryMapRef.current
      const secondary = secondaryMapRef.current
      if (!primary || !secondary) return null

      const guard = { syncing: false }

      const syncAtoB = () => {
        if (guard.syncing) return
        guard.syncing = true
        secondary.jumpTo({ center: primary.getCenter(), zoom: primary.getZoom(), bearing: primary.getBearing() })
        setTimeout(() => { guard.syncing = false }, 0)
      }
      const syncBtoA = () => {
        if (guard.syncing) return
        guard.syncing = true
        primary.jumpTo({ center: secondary.getCenter(), zoom: secondary.getZoom(), bearing: secondary.getBearing() })
        setTimeout(() => { guard.syncing = false }, 0)
      }

      primary.on('move', syncAtoB)
      secondary.on('move', syncBtoA)
      return () => {
        primary.off('move', syncAtoB)
        secondary.off('move', syncBtoA)
      }
    }

    let dispose = wire()
    let timer = null
    if (!dispose) {
      // Secondary map may not be mounted yet — retry after it renders
      timer = setTimeout(() => { dispose = wire() }, 500)
    }
    return () => { clearTimeout(timer); dispose?.() }
  }, [splitView, syncEnabled])

  const selectedMap = city.maps.find((m) => m.id === selectedMapId) ?? city.maps[0]
  const splitCity = getCityById(splitCityId) ?? cities[0]
  const splitMap = splitCity.maps.find((m) => m.id === splitMapId) ?? splitCity.maps[0]

  const handleCityChange = (newId) => navigate(`/atlas/${newId}`)

  const handleToggleSplit = () => {
    if (!splitView) {
      setSplitCityId(city.id)
      setSplitMapId(city.maps[0].id)
      setSplitRatio(0.5)
    }
    setSplitView((v) => !v)
  }

  // ── List panel resize ─────────────────────────────────────────────────────

  const listResizeRef = useRef({ active: false, startX: 0, startW: 0 })

  const onListResizeDown = useCallback((e) => {
    e.preventDefault()
    listResizeRef.current = { active: true, startX: e.clientX, startW: listPanelWidth }

    const onMove = (ev) => {
      if (!listResizeRef.current.active) return
      const delta = ev.clientX - listResizeRef.current.startX
      setListPanelWidth(
        Math.min(MAX_LIST_W, Math.max(MIN_LIST_W, listResizeRef.current.startW + delta))
      )
    }
    const onUp = () => {
      listResizeRef.current.active = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [listPanelWidth])

  // ── Info panel resize ─────────────────────────────────────────────────────

  const infoResizeRef = useRef({ active: false, startX: 0, startW: 0 })

  const onInfoResizeDown = useCallback((e) => {
    e.preventDefault()
    infoResizeRef.current = { active: true, startX: e.clientX, startW: infoPanelWidth }

    const onMove = (ev) => {
      if (!infoResizeRef.current.active) return
      const delta = infoResizeRef.current.startX - ev.clientX
      setInfoPanelWidth(
        Math.min(MAX_INFO_W, Math.max(MIN_INFO_W, infoResizeRef.current.startW + delta))
      )
    }
    const onUp = () => {
      infoResizeRef.current.active = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [infoPanelWidth])

  // ── Split divider drag ────────────────────────────────────────────────────

  const mapWrapRef = useRef(null)
  const splitDivRef = useRef({ active: false, startX: 0, startRatio: 0.5 })

  const onSplitDividerDown = useCallback((e) => {
    e.preventDefault()
    const wrap = mapWrapRef.current
    if (!wrap) return
    splitDivRef.current = { active: true, startX: e.clientX, startRatio: splitRatio }
    const wrapW = wrap.getBoundingClientRect().width

    const onMove = (ev) => {
      if (!splitDivRef.current.active) return
      const delta = ev.clientX - splitDivRef.current.startX
      const newRatio = splitDivRef.current.startRatio + delta / wrapW
      setSplitRatio(Math.min(0.82, Math.max(0.18, newRatio)))
    }
    const onUp = () => {
      splitDivRef.current.active = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [splitRatio])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.layout}>
      {/* Gallery modal */}
      {galleryOpen && galleryPhotos && (
        <CityGallery
          photos={galleryPhotos}
          basePath={galleryBasePath}
          initialIdx={galleryIdx}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* Left panel with resize handle */}
      <div
        className="panel-collapse-wrapper"
        style={{
          width: leftPanelCollapsed ? '28px' : listPanelWidth,
          flexShrink: 0,
          position: 'relative',
          height: '100%',
          transition: 'width 0.25s ease',
        }}
      >
        {/* Inner clip wrapper — overflow:hidden only here so resize handle isn't clipped */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <MapListPanel
            activeCity={city}
            activeMapId={selectedMapId}
            onCityChange={handleCityChange}
            onMapSelect={setSelectedMapId}
            opacity={opacity}
            onOpacityChange={setOpacity}
            splitActive={splitView}
            onToggleSplit={handleToggleSplit}
            collapsed={leftPanelCollapsed}
            onToggle={() => setLeftPanelCollapsed((v) => !v)}
            galleryCount={galleryPhotos?.length ?? 0}
            onGalleryOpen={() => openGalleryAt(0)}
            pinsVisible={pinsVisible}
            onTogglePins={() => setPinsVisible(v => !v)}
          />
        </div>
        {!leftPanelCollapsed && (
          <div
            onPointerDown={onListResizeDown}
            className="resize-handle"
            title="Przeciągnij aby zmienić szerokość panelu"
          />
        )}
      </div>

      {/* Map area */}
      <div ref={mapWrapRef} style={{ ...styles.mapWrap, display: 'flex' }}>
        {/* Primary map */}
        <div style={{
          flexGrow: splitView ? splitRatio : 1,
          flexShrink: 1,
          flexBasis: '0%',
          minWidth: 200,
          position: 'relative',
          height: '100%',
        }}>
          <InteractiveMap
            city={city}
            activeAnnotationUrl={selectedMap.annotationUrl}
            opacity={opacity}
            galleryPhotos={galleryPhotos}
            galleryBasePath={galleryBasePath}
            onPhotoClick={handlePhotoMarkerClick}
            onMapReady={(m) => { primaryMapRef.current = m }}
            pinsVisible={pinsVisible}
          />

          {/* Photo popup on marker click */}
          {photoPopup && galleryPhotos && (
            <PhotoPopup
              photo={galleryPhotos[photoPopup.idx]}
              basePath={galleryBasePath}
              x={photoPopup.x}
              y={photoPopup.y}
              onOpen={() => openGalleryAt(photoPopup.idx)}
              onClose={() => setPhotoPopup(null)}
            />
          )}
        </div>

        {/* Split divider + second map */}
        {splitView && (
          <>
            {/* Split divider with sync toggle button */}
            <div
              onPointerDown={onSplitDividerDown}
              style={{ ...styles.splitDivider, position: 'relative' }}
              title="Przeciągnij aby zmienić podział ekranu"
            >
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setSyncEnabled(v => !v)}
                title={syncEnabled ? 'Widoki zsynchronizowane — kliknij aby rozłączyć' : 'Widoki niezależne — kliknij aby zsynchronizować'}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 28,
                  height: 28,
                  background: syncEnabled ? 'var(--navy)' : 'rgba(245,240,232,0.97)',
                  border: `2px solid ${syncEnabled ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 13,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  zIndex: 10,
                  color: syncEnabled ? 'var(--gold-light)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  pointerEvents: 'auto',
                }}
              >
                {syncEnabled ? '=' : '≠'}
              </button>
            </div>
            <div style={{
              flexGrow: 1 - splitRatio,
              flexShrink: 1,
              flexBasis: '0%',
              minWidth: 200,
              position: 'relative',
              height: '100%',
            }}>
              <InteractiveMap
                city={splitCity}
                activeAnnotationUrl={splitMap.annotationUrl}
                opacity={splitOpacity}
                onMapReady={(m) => { secondaryMapRef.current = m }}
              />
              <SplitMapSelector
                splitCityId={splitCityId}
                splitMapId={splitMapId}
                onCityChange={(id) => {
                  setSplitCityId(id)
                  setSplitMapId((getCityById(id) ?? cities[0]).maps[0].id)
                }}
                onMapSelect={setSplitMapId}
                opacity={splitOpacity}
                onOpacityChange={setSplitOpacity}
              />
            </div>
          </>
        )}
      </div>

      <div
        className="panel-collapse-wrapper"
        style={{
          width: infoPanelCollapsed ? '28px' : infoPanelWidth,
          flexShrink: 0,
          position: 'relative',
          height: '100%',
          transition: 'width 0.25s ease',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <InfoPanel
            map={selectedMap}
            city={city}
            collapsed={infoPanelCollapsed}
            onToggle={() => setInfoPanelCollapsed((v) => !v)}
          />
        </div>
        {!infoPanelCollapsed && (
          <div
            onPointerDown={onInfoResizeDown}
            className="resize-handle-left"
            title="Przeciągnij aby zmienić szerokość panelu"
          />
        )}
      </div>
    </div>
  )
}

const styles = {
  layout: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
  },
  mapWrap: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  splitDivider: {
    width: '5px',
    flexShrink: 0,
    background: 'var(--border)',
    cursor: 'col-resize',
    position: 'relative',
    zIndex: 5,
    transition: 'background 0.15s',
  },
}
