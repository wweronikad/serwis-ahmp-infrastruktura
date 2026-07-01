import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import { WarpedMapLayer } from '@allmaps/maplibre'
import { cities, getCityById } from '../data/cities'
import { KARTY_KATEGORIE } from '../data/kartyKategorie'
import { asset } from '../utils/asset'

// ── City selector bar ────────────────────────────────────────────────────────

function CityBar({ cityId, onCityChange }) {
  const city = getCityById(cityId) ?? cities[0]
  return (
    <div style={bar.wrap}>
      <div style={bar.left}>
        <span style={bar.label}>Karty historyczne</span>
        <span style={bar.divider} />
        <select
          style={bar.select}
          value={city.id}
          onChange={(e) => onCityChange(e.target.value)}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <span style={bar.region}>{city.region} · {city.volume}</span>
      </div>
      <Link to={`/atlas/${city.id}`} style={bar.atlasLink}>Otwórz w atlasie →</Link>
    </div>
  )
}

// ── Portrait card in grid ────────────────────────────────────────────────────

function KartaCard({ kategoria, loaded, active, onClick }) {
  const hasContent = loaded !== null && loaded !== undefined
  const isEmpty = loaded === null
  const [hovered, setHovered] = useState(false)

  return (
    <div
      role="button"
      tabIndex={hasContent ? 0 : undefined}
      onClick={hasContent ? onClick : undefined}
      onKeyDown={hasContent ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...card.wrap,
        background: hasContent
          ? (hovered || active ? kategoria.kolor : shadeColor(kategoria.kolor, -15))
          : '#c8c8c8',
        opacity: hasContent ? 1 : 0.5,
        cursor: hasContent ? 'pointer' : 'default',
        transform: active
          ? 'scale(0.97)'
          : hovered && hasContent
          ? 'translateY(-4px)'
          : 'translateY(0)',
        boxShadow: active
          ? 'inset 0 0 0 3px rgba(255,255,255,0.6)'
          : hovered && hasContent
          ? '0 12px 32px rgba(0,0,0,0.28)'
          : '0 3px 10px rgba(0,0,0,0.18)',
      }}
    >
      <div style={card.top}>
        <span style={card.ikona}>{kategoria.ikona}</span>
      </div>
      <span style={card.nazwa}>{kategoria.nazwa}</span>
      {hasContent && loaded?.era && (
        <span style={card.era}>{loaded.era}</span>
      )}
      {hasContent && loaded?.teaser && (
        <span style={card.teaser}>{loaded.teaser}</span>
      )}
      {isEmpty && (
        <span style={card.brak}>brak danych</span>
      )}
      {!hasContent && !isEmpty && (
        <span style={card.brak}>ładowanie…</span>
      )}
      {hasContent && (
        <span style={card.cta}>Czytaj →</span>
      )}
    </div>
  )
}

// ── Image widget ─────────────────────────────────────────────────────────────

function ZrodlaLinks({ zrodla }) {
  if (!zrodla?.length) return null
  return (
    <div style={wgt.zrodla}>
      Źródło:{' '}
      {zrodla.map((url, i) => {
        let label = url
        try { label = new URL(url).hostname.replace(/^www\./, '') } catch {}
        return (
          <span key={url}>
            {i > 0 && ', '}
            <a href={url} target="_blank" rel="noopener noreferrer" style={wgt.zrodloLink}>{label}</a>
          </span>
        )
      })}
    </div>
  )
}

function WidgetObraz({ widget }) {
  const zrodla = widget.zrodla ? (Array.isArray(widget.zrodla) ? widget.zrodla : [widget.zrodla]) : []
  return (
    <figure style={wgt.fig}>
      <img src={asset(widget.src)} alt={widget.podpis ?? ''} style={wgt.img} />
      {widget.podpis && <figcaption style={wgt.podpis}>{widget.podpis}</figcaption>}
      <ZrodlaLinks zrodla={zrodla} />
    </figure>
  )
}

function WidgetGaleria({ widget }) {
  const [current, setCurrent] = useState(0)
  const [tick, setTick]       = useState(0)
  const imgs = widget.obrazy ?? []
  if (!imgs.length) return null
  const img    = imgs[current]
  const zrodla = img.zrodla ? (Array.isArray(img.zrodla) ? img.zrodla : [img.zrodla]) : []

  // Auto-advance every 5 s; tick resets the interval when user navigates manually
  useEffect(() => {
    if (imgs.length <= 1) return
    const id = setInterval(() => setCurrent(c => (c + 1) % imgs.length), 5000)
    return () => clearInterval(id)
  }, [imgs.length, tick])

  const goTo = (i) => { setCurrent(i); setTick(t => t + 1) }

  return (
    <figure style={wgt.gal}>
      {/* Fixed-height box — all images stacked absolutely, cross-fade via opacity */}
      <div style={wgt.galImgWrap}>
        {imgs.map((im, i) => (
          <img
            key={im.src}
            src={asset(im.src)}
            alt={im.podpis ?? ''}
            style={{ ...wgt.galImg, position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: 'opacity 2s ease' }}
          />
        ))}
        {imgs.length > 1 && (
          <>
            <button onClick={() => goTo((current - 1 + imgs.length) % imgs.length)} style={wgt.arrow('left')}>‹</button>
            <button onClick={() => goTo((current + 1) % imgs.length)} style={wgt.arrow('right')}>›</button>
            <div style={wgt.galDots}>
              {imgs.map((_, i) => (
                <span key={i} onClick={() => goTo(i)} style={{ ...wgt.dot, opacity: i === current ? 1 : 0.35, transition: 'opacity 0.4s' }} />
              ))}
            </div>
          </>
        )}
      </div>
      {img.podpis && <figcaption style={wgt.podpis}>{img.podpis}</figcaption>}
      <ZrodlaLinks zrodla={zrodla} />
    </figure>
  )
}

function WidgetSliderMapa({ widget }) {
  const [pos, setPos] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)

  const updatePos = (clientX) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const p = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100))
    setPos(p)
  }

  const onMouseDown = (e) => { dragging.current = true; e.preventDefault() }
  const onMouseMove = (e) => { if (dragging.current) updatePos(e.clientX) }
  const onMouseUp = () => { dragging.current = false }
  const onTouchMove = (e) => updatePos(e.touches[0].clientX)

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseUp}
      style={sl.wrap}
    >
      {/* Base image (right) */}
      <img src={asset(widget.warstwy[1]?.src ?? '')} alt={widget.warstwy[1]?.etykieta ?? ''} style={sl.imgBase} />
      {/* Overlay image (left), clipped */}
      <div style={{ ...sl.overlay, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={asset(widget.warstwy[0]?.src ?? '')} alt={widget.warstwy[0]?.etykieta ?? ''} style={sl.imgBase} />
      </div>
      {/* Divider handle */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={(e) => { dragging.current = true; updatePos(e.touches[0].clientX) }}
        style={{ ...sl.handle, left: `${pos}%` }}
      >
        <div style={sl.handleLine} />
        <div style={sl.handleKnob}>⟺</div>
      </div>
      {/* Labels */}
      <span style={{ ...sl.label, left: '8px' }}>{widget.warstwy[0]?.etykieta}</span>
      <span style={{ ...sl.label, right: '8px', left: 'auto' }}>{widget.warstwy[1]?.etykieta}</span>
    </div>
  )
}

// ── Historical map (MapLibre split-view: plan 1850 left / OSM right) ─────────

function WidgetMapaHistoryczna({ widget }) {
  const containerRef  = useRef(null)
  const histRef       = useRef(null)
  const modernRef     = useRef(null)
  const histMapInst   = useRef(null)
  const modernMapInst = useRef(null)
  const syncingRef    = useRef(false)
  const dragging      = useRef(false)
  const [pos, setPos] = useState(50)

  const center = widget.center ?? [21.2486, 49.7314]
  const zoom   = widget.zoom   ?? 15

  const osmStyle = {
    version: 8,
    sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>', maxzoom: 19 } },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
  }

  useEffect(() => {
    if (!histRef.current || histMapInst.current) return

    const histMap   = new maplibregl.Map({ container: histRef.current,   style: osmStyle, center, zoom })
    const modernMap = new maplibregl.Map({ container: modernRef.current, style: osmStyle, center, zoom })
    modernMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    histMap.on('load', async () => {
      const warpedLayer = new WarpedMapLayer()
      histMap.addLayer(warpedLayer)
      try {
        await warpedLayer.addGeoreferenceAnnotationByUrl(widget.annotationUrl)
      } catch (err) { console.warn('Allmaps error:', err) }
    })

    const syncFrom = (src, dst) => {
      if (syncingRef.current) return
      syncingRef.current = true
      dst.jumpTo({ center: src.getCenter(), zoom: src.getZoom(), bearing: src.getBearing(), pitch: src.getPitch() })
      syncingRef.current = false
    }
    histMap.on('move',   () => syncFrom(histMap,   modernMap))
    modernMap.on('move', () => syncFrom(modernMap, histMap))

    histMapInst.current   = histMap
    modernMapInst.current = modernMap
    return () => {
      histMap.remove(); modernMap.remove()
      histMapInst.current = null; modernMapInst.current = null
    }
  }, []) // eslint-disable-line

  const updatePos = (clientX) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos(Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100)))
  }

  return (
    <figure style={{ margin: 0 }}>
      <div
        ref={containerRef}
        onMouseMove={(e) => { if (dragging.current) updatePos(e.clientX) }}
        onMouseUp={() => { dragging.current = false }}
        onMouseLeave={() => { dragging.current = false }}
        onTouchMove={(e) => { if (dragging.current) updatePos(e.touches[0].clientX) }}
        onTouchEnd={() => { dragging.current = false }}
        style={{ ...sl.wrap, height: mh.mapBox.height, borderRadius: mh.mapBox.borderRadius }}
      >
        {/* Historical map — plan 1850 (bottom, full width) */}
        <div ref={histRef} style={{ position: 'absolute', inset: 0 }} />
        {/* Modern OSM map (top, clipped to right portion) */}
        <div ref={modernRef} style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${pos}%)` }} />

        {/* Divider handle */}
        <div
          onMouseDown={(e) => { dragging.current = true; e.preventDefault() }}
          onTouchStart={(e) => { dragging.current = true; updatePos(e.touches[0].clientX) }}
          style={{ ...sl.handle, left: `${pos}%` }}
        >
          <div style={sl.handleLine} />
          <div style={sl.handleKnob}>⟺</div>
        </div>

        {/* Labels */}
        <span style={{ ...sl.label, left: '8px' }}>Plan 1850</span>
        <span style={{ ...sl.label, right: '8px', left: 'auto' }}>Mapa dziś</span>
      </div>
      {widget.podpis && <figcaption style={wgt.podpis}>{widget.podpis}</figcaption>}
    </figure>
  )
}

// ── 3D terrain viewer ────────────────────────────────────────────────────────

function WidgetTeren3D({ widget }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  const center  = widget.center  ?? [21.248, 49.730]
  const zoom    = widget.zoom    ?? 13
  const pitch   = widget.pitch   ?? 60
  const bearing = widget.bearing ?? 0

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
            maxzoom: 19,
          },
          terrain: {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            encoding: 'terrarium',
            maxzoom: 14,
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        terrain: { source: 'terrain', exaggeration: widget.exaggeration ?? 1.8 },
      },
      center,
      zoom,
      pitch,
      bearing,
      maxPitch: 85,
      antialias: true,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line

  return (
    <figure style={{ margin: 0 }}>
      <div ref={containerRef} style={mh.mapBox} />
      {widget.podpis && <figcaption style={wgt.podpis}>{widget.podpis}</figcaption>}
    </figure>
  )
}

// ── External link card ───────────────────────────────────────────────────────

function WidgetLinkZewnetrzny({ widget }) {
  return (
    <a href={widget.url} target="_blank" rel="noopener noreferrer" style={lz.card}>
      <span style={lz.ikona}>{widget.ikona ?? '🗺️'}</span>
      <div style={lz.body}>
        <span style={lz.naglowek}>{widget.naglowek}</span>
        {widget.podpis && <span style={lz.podpisLz}>{widget.podpis}</span>}
      </div>
      <span style={lz.arrow}>Otwórz →</span>
    </a>
  )
}

// ── YouTube embed ────────────────────────────────────────────────────────────

function WidgetYoutube({ widget }) {
  if (!widget.videoId) return null
  return (
    <figure style={{ margin: 0 }}>
      <div style={yt.wrap}>
        <iframe
          src={`https://www.youtube.com/embed/${widget.videoId}?rel=0`}
          style={yt.frame}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={widget.podpis ?? 'Film'}
          loading="lazy"
        />
      </div>
      {widget.podpis && <figcaption style={wgt.podpis}>{widget.podpis}</figcaption>}
    </figure>
  )
}

function renderWidget(widget) {
  if (!widget) return null
  if (widget.typ === 'obraz') return <WidgetObraz widget={widget} />
  if (widget.typ === 'galeria') return <WidgetGaleria widget={widget} />
  if (widget.typ === 'slider-mapa') return <WidgetSliderMapa widget={widget} />
  if (widget.typ === 'mapa-historyczna') return <WidgetMapaHistoryczna widget={widget} />
  if (widget.typ === 'teren-3d') return <WidgetTeren3D widget={widget} />
  if (widget.typ === 'youtube') return <WidgetYoutube widget={widget} />
  if (widget.typ === 'link-zewnetrzny') return <WidgetLinkZewnetrzny widget={widget} />
  return null
}

// ── Single section in expanded card ─────────────────────────────────────────

function CardSection({ sekcja, kolor, index }) {
  const hasWidget = !!sekcja.widget
  const isEven = index % 2 === 0

  return (
    <div style={{
      ...sec.wrap,
      animationDelay: `${index * 80}ms`,
    }}>
      {sekcja.naglowek && (
        <h3 style={{ ...sec.h3, borderLeftColor: kolor }}>{sekcja.naglowek}</h3>
      )}
      <div style={{
        ...sec.body,
        flexDirection: hasWidget ? (isEven ? 'row' : 'row-reverse') : 'column',
        alignItems: hasWidget ? 'center' : 'flex-start',
      }}>
        {sekcja.tekst && (
          <div style={{ ...sec.tekst, maxWidth: hasWidget ? '55%' : '680px' }}>
            {sekcja.tekst.split('\n\n').map((p, i) => (
              <p key={i} style={sec.para}>{p}</p>
            ))}
          </div>
        )}
        {hasWidget && (
          <div style={{ ...sec.widgetWrap, ...(sekcja.tekst ? {} : { flex: '1 1 100%' }) }}>
            {renderWidget(sekcja.widget)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Expanded card view ───────────────────────────────────────────────────────

function ExpandedCard({ kategoria, data, onClose }) {
  const sekcje = data?.sekcje ?? []
  // Fallback: convert old `content` string to single section
  const sections = sekcje.length > 0
    ? sekcje
    : data?.content
      ? [{ tekst: data.content.replace(/^##\s.+$/gm, '').trim() }]
      : []

  return (
    <div style={exp.wrap}>
      {/* Colored header */}
      <div style={{ ...exp.header, background: kategoria.kolor }}>
        <div style={exp.headerInner}>
          <div style={exp.headerLeft}>
            <span style={exp.ikona}>{kategoria.ikona}</span>
            <div>
              <h2 style={exp.title}>{kategoria.nazwa}</h2>
              {data?.era && <p style={exp.era}>{data.era}</p>}
            </div>
          </div>
          <button onClick={onClose} style={exp.close}>← Wróć do kart</button>
        </div>
        {data?.teaser && (
          <p style={exp.teaser}>{data.teaser}</p>
        )}
      </div>

      {/* Sections */}
      <div style={exp.sections}>
        {sections.map((sek, i) => (
          <CardSection key={i} sekcja={sek} kolor={kategoria.kolor} index={i} />
        ))}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CityCards() {
  const { cityId } = useParams()
  const navigate = useNavigate()

  const city = getCityById(cityId) ?? cities[0]
  const effectiveCityId = city.id

  const [activeKey, setActiveKey] = useState(null)
  const [showExpanded, setShowExpanded] = useState(false)
  const [loaded, setLoaded] = useState({})

  useEffect(() => {
    setActiveKey(null)
    setShowExpanded(false)
    setLoaded({})
  }, [effectiveCityId])

  useEffect(() => {
    KARTY_KATEGORIE.forEach(({ key }) => {
      fetch(asset(`/karty/${effectiveCityId}/${key}.json`))
        .then((r) => { if (!r.ok) throw new Error(); return r.json() })
        .then((data) => setLoaded((prev) => ({ ...prev, [key]: data })))
        .catch(() => setLoaded((prev) => ({ ...prev, [key]: null })))
    })
  }, [effectiveCityId])

  useEffect(() => {
    if (!activeKey) return
    const id = setTimeout(() => setShowExpanded(true), 20)
    return () => clearTimeout(id)
  }, [activeKey])

  const handleCardClick = (key) => {
    setShowExpanded(false)
    setActiveKey(key)
  }

  const handleClose = () => {
    setShowExpanded(false)
    setTimeout(() => setActiveKey(null), 320)
  }

  const activeKategoria = KARTY_KATEGORIE.find((k) => k.key === activeKey)
  const activeData = activeKey ? loaded[activeKey] : null

  return (
    <div style={page.wrap}>
      <CityBar cityId={effectiveCityId} onCityChange={(id) => navigate(`/karty/${id}`)} />

      <div style={page.body}>
        <div style={page.intro}>
          <h1 style={page.cityName}>{city.name}</h1>
          <p style={page.cityDesc}>{city.description}</p>
        </div>

        {/* Grid — fades out when card expanded */}
        <div style={{
          ...page.gridOuter,
          opacity: showExpanded ? 0 : 1,
          pointerEvents: showExpanded ? 'none' : 'all',
          position: activeKey ? 'absolute' : 'relative',
          inset: activeKey ? 0 : 'auto',
          visibility: showExpanded ? 'hidden' : 'visible',
        }}>
          <div style={grid.wrap}>
            {KARTY_KATEGORIE.map((kat) => (
              <KartaCard
                key={kat.key}
                kategoria={kat}
                loaded={loaded[kat.key]}
                active={activeKey === kat.key}
                onClick={() => handleCardClick(kat.key)}
              />
            ))}
          </div>
        </div>

        {/* Expanded card — fades in */}
        {activeKey && (
          <div style={{
            ...page.expandedOuter,
            opacity: showExpanded ? 1 : 0,
            transform: showExpanded ? 'translateY(0)' : 'translateY(16px)',
          }}>
            <ExpandedCard
              kategoria={activeKategoria}
              data={activeData}
              onClose={handleClose}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function shadeColor(hex, pct) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + pct))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + pct))
  const b = Math.max(0, Math.min(255, (num & 0xff) + pct))
  return `rgb(${r},${g},${b})`
}

// ── Styles ────────────────────────────────────────────────────────────────────

const bar = {
  wrap: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 28px', background:'var(--navy)', borderBottom:'1px solid rgba(255,255,255,0.1)', flexShrink:0 },
  left: { display:'flex', alignItems:'center', gap:'14px' },
  label: { fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'1px', color:'var(--gold-light)' },
  divider: { display:'inline-block', width:'1px', height:'18px', background:'rgba(255,255,255,0.2)' },
  select: { background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'var(--radius)', color:'#fff', fontSize:'14px', fontFamily:'var(--font-sans)', padding:'5px 10px', cursor:'pointer', outline:'none' },
  region: { fontSize:'12px', color:'rgba(255,255,255,0.5)', fontStyle:'italic' },
  atlasLink: { fontSize:'12px', color:'var(--gold-light)', textDecoration:'none', padding:'5px 12px', border:'1px solid rgba(184,150,62,0.4)', borderRadius:'var(--radius)' },
}

const page = {
  wrap: { display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:'var(--cream)' },
  body: { flex:1, overflowY:'auto', padding:'28px', display:'flex', flexDirection:'column', gap:'20px', position:'relative' },
  intro: { flexShrink:0 },
  cityName: { fontFamily:'var(--font-serif)', fontSize:'28px', color:'var(--navy)', marginBottom:'6px', lineHeight:1.2 },
  cityDesc: { fontSize:'14px', color:'var(--text-muted)', lineHeight:1.6, maxWidth:'680px' },
  gridOuter: { transition:'opacity 0.28s ease, visibility 0.28s ease' },
  expandedOuter: { transition:'opacity 0.32s ease, transform 0.32s ease' },
}

const grid = {
  wrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
}

const card = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '24px 20px 20px',
    borderRadius: '10px',
    border: 'none',
    color: '#fff',
    textAlign: 'left',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
    minHeight: '300px',
    gap: '10px',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
  },
  top: { marginBottom: '4px' },
  ikona: { fontSize: '30px', lineHeight: 1 },
  nazwa: { fontSize: '18px', fontWeight: '700', lineHeight: 1.25, letterSpacing: '-0.2px', fontFamily: 'var(--font-serif)' },
  era: { fontSize: '12px', opacity: 0.75, fontStyle: 'italic' },
  teaser: { fontSize: '13px', opacity: 0.88, lineHeight: 1.55, flex: 1 },
  brak: { fontSize: '12px', opacity: 0.55, fontStyle: 'italic', marginTop: 'auto' },
  cta: { fontSize: '12px', marginTop: 'auto', opacity: 0.7, letterSpacing: '0.3px', fontWeight: '600' },
}

const exp = {
  wrap: { background:'var(--white)', borderRadius:'10px', overflow:'hidden', border:'1px solid var(--border)', boxShadow:'var(--shadow)' },
  header: { padding:'28px 32px 24px', color:'#fff' },
  headerInner: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px' },
  headerLeft: { display:'flex', alignItems:'center', gap:'16px' },
  ikona: { fontSize:'36px', lineHeight:1 },
  title: { fontFamily:'var(--font-serif)', fontSize:'26px', color:'#fff', marginBottom:'4px', lineHeight:1.2 },
  era: { fontSize:'13px', color:'rgba(255,255,255,0.7)', fontStyle:'italic' },
  close: { background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', padding:'8px 16px', borderRadius:'var(--radius)', cursor:'pointer', fontSize:'13px', fontFamily:'var(--font-sans)', whiteSpace:'nowrap', transition:'background 0.15s' },
  teaser: { fontSize:'15px', lineHeight:1.6, color:'rgba(255,255,255,0.92)', maxWidth:'700px', fontStyle:'italic', borderTop:'1px solid rgba(255,255,255,0.2)', paddingTop:'16px', margin:0 },
  sections: { padding:'0 32px 40px', display:'flex', flexDirection:'column' },
}

const sec = {
  wrap: { padding:'28px 0', borderBottom:'1px solid var(--border-light)', animation:'fadeInUp 0.4s ease both' },
  h3: { fontSize:'14px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'1px', color:'var(--navy)', marginBottom:'14px', paddingLeft:'12px', borderLeft:'3px solid', opacity:0.85 },
  body: { display:'flex', gap:'32px', alignItems:'flex-start' },
  tekst: { flex:1, minWidth:0 },
  para: { fontSize:'14px', color:'var(--text)', lineHeight:1.7, margin:'0 0 12px' },
  widgetWrap: { flex:'0 0 42%', minWidth:0 },
}

const wgt = {
  fig: { margin:0, display:'flex', flexDirection:'column', gap:'8px' },
  img: { width:'100%', borderRadius:'6px', display:'block', objectFit:'cover', maxHeight:'380px' },
  podpis: { fontSize:'12px', color:'var(--text-muted)', fontStyle:'italic', lineHeight:1.4 },
  zrodla: { fontSize:'11px', color:'var(--text-muted)', marginTop:'3px' },
  zrodloLink: { color:'var(--navy)', opacity:0.65 },
  gal: { margin:0 },
  galImgWrap: { position:'relative', overflow:'hidden', borderRadius:'6px', height:'260px' },
  galImg: { width:'100%', height:'100%', display:'block', objectFit:'cover' },
  arrow: (side) => ({
    position:'absolute', top:'50%', [side]:'10px', transform:'translateY(-50%)',
    background:'rgba(0,0,0,0.5)', color:'#fff', border:'none', borderRadius:'50%',
    width:'36px', height:'36px', fontSize:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
  }),
  galDots: { position:'absolute', bottom:'10px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'6px' },
  dot: { width:'8px', height:'8px', borderRadius:'50%', background:'#fff', cursor:'pointer', transition:'opacity 0.15s' },
}

const mh = {
  mapBox:    { width:'100%', height:360, borderRadius:6, overflow:'hidden' },
  ctrl:      { display:'flex', alignItems:'center', gap:8, padding:'8px 2px 4px' },
  ctrlLabel: { fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', flexShrink:0 },
  range:     { flex:1, cursor:'pointer', accentColor:'var(--gold)', height:4 },
}

const lz = {
  card:     { display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'var(--navy)', borderRadius:8, textDecoration:'none', color:'#fff', border:'1px solid rgba(184,150,62,0.3)', transition:'opacity 0.15s' },
  ikona:    { fontSize:26, flexShrink:0, lineHeight:1 },
  body:     { flex:1, display:'flex', flexDirection:'column', gap:3, minWidth:0 },
  naglowek: { fontSize:14, fontWeight:600, color:'#e8dfc8', fontFamily:'var(--font-serif)', lineHeight:1.3 },
  podpisLz: { fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.4 },
  arrow:    { fontSize:12, color:'var(--gold)', whiteSpace:'nowrap', flexShrink:0, fontWeight:700 },
}

const yt = {
  wrap:  { position:'relative', paddingBottom:'56.25%', height:0, borderRadius:6, overflow:'hidden', background:'#000' },
  frame: { position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' },
}

const sl = {
  wrap: { position:'relative', overflow:'hidden', borderRadius:'8px', userSelect:'none', cursor:'col-resize', height:'340px' },
  imgBase: { position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block' },
  overlay: { position:'absolute', inset:0, transition:'clip-path 0.02s' },
  handle: { position:'absolute', top:0, bottom:0, transform:'translateX(-50%)', width:'40px', display:'flex', flexDirection:'column', alignItems:'center', cursor:'col-resize', zIndex:10 },
  handleLine: { width:'2px', flex:1, background:'#fff', opacity:0.9 },
  handleKnob: { position:'absolute', top:'50%', transform:'translateY(-50%)', background:'#fff', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.35)', color:'#333' },
  label: { position:'absolute', bottom:'12px', background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:'11px', padding:'3px 8px', borderRadius:'3px', pointerEvents:'none' },
}
