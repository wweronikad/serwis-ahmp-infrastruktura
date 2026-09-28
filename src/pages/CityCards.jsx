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

// ── Small centered icons (use currentColor = kategoria.kolor) ────────────────

const KATEGORIA_SVG = {
  'uklad-przestrzenny': (
    <svg viewBox="0 0 64 64" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <rect x="22" y="22" width="20" height="20"/>
      <line x1="32" y1="5" x2="32" y2="22"/>
      <line x1="32" y1="42" x2="32" y2="59"/>
      <line x1="5" y1="32" x2="22" y2="32"/>
      <line x1="42" y1="32" x2="59" y2="32"/>
    </svg>
  ),
  'fortyfikacje': (
    <svg viewBox="0 0 64 64" width="60" height="60" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8,60 L8,22 L17,22 L17,30 L27,30 L27,22 L37,22 L37,30 L47,30 L47,22 L56,22 L56,60 Z M24,60 L24,46 Q32,36 40,46 L40,60 Z"/>
    </svg>
  ),
  'koscioly': (
    <svg viewBox="0 0 64 64" width="60" height="60" fill="currentColor" aria-hidden="true">
      <rect x="29" y="1" width="6" height="12"/>
      <rect x="25" y="5" width="14" height="5"/>
      <polygon points="26,38 32,8 38,38"/>
      <polygon points="8,38 56,38 32,26"/>
      <path fillRule="evenodd" d="M8,38 L56,38 L56,60 L8,60 Z M24,60 L24,47 Q32,39 40,47 L40,60 Z"/>
    </svg>
  ),
  'ludnosc': (
    <svg viewBox="0 0 64 64" width="60" height="60" fill="currentColor" aria-hidden="true">
      <circle cx="14" cy="15" r="6"/>
      <rect x="6" y="26" width="14" height="28" rx="3"/>
      <circle cx="32" cy="10" r="7"/>
      <rect x="23" y="22" width="18" height="32" rx="3"/>
      <circle cx="50" cy="15" r="6"/>
      <rect x="44" y="26" width="14" height="28" rx="3"/>
    </svg>
  ),
  'gospodarka': (
    <svg viewBox="0 0 64 64" width="60" height="60" fill="currentColor" aria-hidden="true">
      <rect x="30" y="14" width="4" height="42" rx="2"/>
      <rect x="18" y="54" width="28" height="4" rx="2"/>
      <rect x="8" y="20" width="48" height="4" rx="2"/>
      <circle cx="32" cy="20" r="6"/>
      <rect x="8" y="24" width="3" height="14" rx="1"/>
      <rect x="53" y="24" width="3" height="14" rx="1"/>
      <path d="M3,38 Q9.5,52 16,38 Z"/>
      <path d="M48,38 Q54.5,52 61,38 Z"/>
    </svg>
  ),
  'wladza': (
    <svg viewBox="0 0 64 64" width="60" height="60" fill="currentColor" aria-hidden="true">
      <path d="M6,50 L6,36 L18,46 L32,22 L46,46 L58,36 L58,50 Z"/>
      <rect x="6" y="50" width="52" height="8" rx="2"/>
    </svg>
  ),
  'srodowisko': (
    <svg viewBox="0 0 64 64" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2,42 Q32,8 62,42"/>
      <path d="M4,52 Q12,46 20,52 Q28,58 36,52 Q44,46 52,52 Q58,56 60,54"/>
      <path d="M2,60 Q12,54 22,60 Q32,66 42,58 Q52,52 62,58"/>
    </svg>
  ),
  'zrodla': (
    <svg viewBox="0 0 64 64" width="60" height="60" fill="currentColor" aria-hidden="true">
      <ellipse cx="32" cy="14" rx="20" ry="6"/>
      <ellipse cx="32" cy="50" rx="20" ry="6"/>
      <path fillRule="evenodd" d="M12,14 L52,14 L52,50 L12,50 Z M18,24 L46,24 L46,27 L18,27 Z M18,31 L46,31 L46,34 L18,34 Z M18,38 L46,38 L46,41 L18,41 Z M18,44 L36,44 L36,47 L18,44 Z"/>
    </svg>
  ),
}

// ── Full-bleed vector thumbnails for three categories ────────────────────────

const NV = '#1a2942'
const BG = '#edeadf'

const KATEGORIA_THUMB = {
  'uklad-przestrzenny': (
    <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <filter id="recolor-plan" colorInterpolationFilters="sRGB">
          {/* black(0,0,0)→navy(26,41,66) white(255,255,255)→cream(237,234,223) */}
          <feColorMatrix type="matrix" values="0.827 0 0 0 0.102  0 0.757 0 0 0.161  0 0 0.616 0 0.259  0 0 0 1 0"/>
        </filter>
      </defs>
      <rect width="400" height="400" fill={BG}/>
      <image
        href={asset('miniaturki-kart/uklad-przestrzenny-v2.png')}
        x="0" y="0" width="400" height="400"
        preserveAspectRatio="xMidYMid slice"
        filter="url(#recolor-plan)"
      />
    </svg>
  ),
  'fortyfikacje': (
    <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="400" height="400" fill={BG}/>
      {/* left tower */}
      <rect x="0" y="100" width="110" height="300" fill={NV}/>
      <rect x="5" y="40" width="28" height="62" fill={NV}/>
      <rect x="43" y="40" width="28" height="62" fill={NV}/>
      <rect x="80" y="40" width="28" height="62" fill={NV}/>
      <rect x="47" y="155" width="12" height="60" fill={BG}/>
      <rect x="38" y="178" width="30" height="12" fill={BG}/>
      <rect x="47" y="265" width="12" height="60" fill={BG}/>
      <rect x="38" y="288" width="30" height="12" fill={BG}/>
      {/* right tower */}
      <rect x="290" y="100" width="110" height="300" fill={NV}/>
      <rect x="292" y="40" width="28" height="62" fill={NV}/>
      <rect x="330" y="40" width="28" height="62" fill={NV}/>
      <rect x="368" y="40" width="28" height="62" fill={NV}/>
      <rect x="341" y="155" width="12" height="60" fill={BG}/>
      <rect x="332" y="178" width="30" height="12" fill={BG}/>
      <rect x="341" y="265" width="12" height="60" fill={BG}/>
      <rect x="332" y="288" width="30" height="12" fill={BG}/>
      {/* connecting wall */}
      <rect x="110" y="160" width="180" height="240" fill={NV}/>
      <rect x="115" y="100" width="32" height="62" fill={NV}/>
      <rect x="159" y="100" width="32" height="62" fill={NV}/>
      <rect x="209" y="100" width="32" height="62" fill={NV}/>
      <rect x="253" y="100" width="32" height="62" fill={NV}/>
      {/* gate arch */}
      <path d="M152,400 L152,278 A48,52 0,0,1 248,278 L248,400 Z" fill={BG}/>
      <rect x="193" y="190" width="14" height="30" fill={BG}/>
      <rect x="186" y="197" width="28" height="10" fill={BG}/>
    </svg>
  ),
  'koscioly': (
    <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="400" height="400" fill={BG}/>
      {/* left tower spire + body */}
      <polygon points="0,110 50,8 100,110" fill={NV}/>
      <rect x="0" y="110" width="100" height="290" fill={NV}/>
      <rect x="46" y="6" width="8" height="24" fill={BG}/>
      <rect x="38" y="16" width="24" height="7" fill={BG}/>
      <path d="M16,250 L16,155 A34,34 0,0,1 84,155 L84,250 Z" fill={BG}/>
      <path d="M50,130 L18,188 A32,11 0,0,0 82,188 L50,130 Z" fill={NV}/>
      {/* right tower spire + body */}
      <polygon points="300,110 350,8 400,110" fill={NV}/>
      <rect x="300" y="110" width="100" height="290" fill={NV}/>
      <rect x="346" y="6" width="8" height="24" fill={BG}/>
      <rect x="338" y="16" width="24" height="7" fill={BG}/>
      <path d="M316,250 L316,155 A34,34 0,0,1 384,155 L384,250 Z" fill={BG}/>
      <path d="M350,130 L318,188 A32,11 0,0,0 382,188 L350,130 Z" fill={NV}/>
      {/* nave gable + body */}
      <polygon points="100,165 200,78 300,165" fill={NV}/>
      <rect x="100" y="165" width="200" height="235" fill={NV}/>
      <circle cx="200" cy="125" r="24" fill={BG}/>
      <circle cx="200" cy="125" r="9" fill={NV}/>
      {/* entrance arch */}
      <path d="M148,400 L148,298 A52,60 0,0,1 252,298 L252,400 Z" fill={BG}/>
    </svg>
  ),
  'ludnosc': (
    <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="400" height="400" fill={BG}/>
      {/* Top row: 4 tenement buildings, y=0–185 */}
      <rect x="0" y="0" width="400" height="185" fill={NV}/>
      <rect x="5" y="6" width="85" height="78" fill={BG}/>
      <rect x="5" y="100" width="85" height="78" fill={BG}/>
      <rect x="96" y="0" width="10" height="185" fill={BG}/>
      <rect x="108" y="6" width="85" height="78" fill={BG}/>
      <rect x="108" y="100" width="85" height="78" fill={BG}/>
      <rect x="199" y="0" width="10" height="185" fill={BG}/>
      <rect x="211" y="6" width="85" height="78" fill={BG}/>
      <rect x="211" y="100" width="85" height="78" fill={BG}/>
      <rect x="302" y="0" width="10" height="185" fill={BG}/>
      <rect x="314" y="6" width="81" height="78" fill={BG}/>
      <rect x="314" y="100" width="81" height="78" fill={BG}/>
      {/* Street: y=185–215 (cream background) */}
      {/* Bottom row: 4 tenement buildings, y=215–400 */}
      <rect x="0" y="215" width="400" height="185" fill={NV}/>
      <rect x="5" y="221" width="85" height="78" fill={BG}/>
      <rect x="5" y="315" width="85" height="78" fill={BG}/>
      <rect x="96" y="215" width="10" height="185" fill={BG}/>
      <rect x="108" y="221" width="85" height="78" fill={BG}/>
      <rect x="108" y="315" width="85" height="78" fill={BG}/>
      <rect x="199" y="215" width="10" height="185" fill={BG}/>
      <rect x="211" y="221" width="85" height="78" fill={BG}/>
      <rect x="211" y="315" width="85" height="78" fill={BG}/>
      <rect x="302" y="215" width="10" height="185" fill={BG}/>
      <rect x="314" y="221" width="81" height="78" fill={BG}/>
      <rect x="314" y="315" width="81" height="78" fill={BG}/>
    </svg>
  ),
  'gospodarka': (
    <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="400" height="400" fill={BG}/>
      {/* Warehouse / granary floor plan */}
      <rect x="20" y="20" width="360" height="360" fill={NV}/>
      {/* Central aisle (horizontal) */}
      <rect x="20" y="178" width="360" height="44" fill={BG}/>
      {/* 7 north storage bays */}
      <rect x="28" y="28" width="46" height="142" fill={BG}/>
      <rect x="82" y="28" width="46" height="142" fill={BG}/>
      <rect x="136" y="28" width="46" height="142" fill={BG}/>
      <rect x="190" y="28" width="46" height="142" fill={BG}/>
      <rect x="244" y="28" width="46" height="142" fill={BG}/>
      <rect x="298" y="28" width="46" height="142" fill={BG}/>
      <rect x="352" y="28" width="20" height="142" fill={BG}/>
      {/* 7 south storage bays */}
      <rect x="28" y="230" width="46" height="142" fill={BG}/>
      <rect x="82" y="230" width="46" height="142" fill={BG}/>
      <rect x="136" y="230" width="46" height="142" fill={BG}/>
      <rect x="190" y="230" width="46" height="142" fill={BG}/>
      <rect x="244" y="230" width="46" height="142" fill={BG}/>
      <rect x="298" y="230" width="46" height="142" fill={BG}/>
      <rect x="352" y="230" width="20" height="142" fill={BG}/>
    </svg>
  ),
  'wladza': (
    <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="400" height="400" fill={BG}/>
      {/* Outer walls with inner courtyard */}
      <path fillRule="evenodd" d="M 25 25 L 375 25 L 375 375 L 25 375 Z M 110 110 L 290 110 L 290 290 L 110 290 Z" fill={NV}/>
      {/* Four corner towers */}
      <rect x="0" y="0" width="60" height="60" fill={NV}/>
      <rect x="340" y="0" width="60" height="60" fill={NV}/>
      <rect x="0" y="340" width="60" height="60" fill={NV}/>
      <rect x="340" y="340" width="60" height="60" fill={NV}/>
      {/* Tower interiors (cream) */}
      <rect x="8" y="8" width="44" height="44" fill={BG}/>
      <rect x="348" y="8" width="44" height="44" fill={BG}/>
      <rect x="8" y="348" width="44" height="44" fill={BG}/>
      <rect x="348" y="348" width="44" height="44" fill={BG}/>
      {/* Gate openings */}
      <rect x="175" y="25" width="50" height="28" fill={BG}/>
      <rect x="175" y="347" width="50" height="28" fill={BG}/>
      <rect x="25" y="175" width="28" height="50" fill={BG}/>
      <rect x="347" y="175" width="28" height="50" fill={BG}/>
      {/* Central keep */}
      <rect x="158" y="158" width="84" height="84" fill={NV}/>
      <rect x="168" y="168" width="64" height="64" fill={BG}/>
      <circle cx="200" cy="200" r="14" fill={NV}/>
      <circle cx="200" cy="200" r="6" fill={BG}/>
    </svg>
  ),
  'srodowisko': (
    <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="400" height="400" fill={BG}/>
      {/* Topographic map: alternating filled ellipses (navy/cream rings) */}
      <ellipse cx="200" cy="215" rx="196" ry="178" fill={NV}/>
      <ellipse cx="200" cy="212" rx="162" ry="145" fill={BG}/>
      <ellipse cx="200" cy="209" rx="128" ry="113" fill={NV}/>
      <ellipse cx="200" cy="206" rx="94" ry="82" fill={BG}/>
      <ellipse cx="200" cy="203" rx="60" ry="52" fill={NV}/>
      <ellipse cx="200" cy="200" rx="28" ry="24" fill={BG}/>
      <circle cx="200" cy="198" r="7" fill={NV}/>
      {/* River valley cutting through the south-east */}
      <path d="M 400 340 Q 310 305 240 330 Q 200 345 196 400 L 400 400 Z" fill={BG}/>
    </svg>
  ),
  'zrodla': (
    <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="400" height="400" fill={NV}/>
      {/* Open manuscript: two cream pages on navy background */}
      {/* Left page */}
      <rect x="16" y="20" width="174" height="360" fill={BG}/>
      {/* Decorative initial capital */}
      <rect x="26" y="28" width="28" height="22" fill={NV}/>
      {/* Left page text lines */}
      <rect x="26" y="58" width="154" height="7" fill={NV}/>
      <rect x="26" y="74" width="154" height="7" fill={NV}/>
      <rect x="26" y="90" width="110" height="7" fill={NV}/>
      <rect x="26" y="106" width="154" height="7" fill={NV}/>
      <rect x="26" y="122" width="154" height="7" fill={NV}/>
      <rect x="26" y="138" width="130" height="7" fill={NV}/>
      <rect x="26" y="154" width="154" height="7" fill={NV}/>
      <rect x="26" y="170" width="154" height="7" fill={NV}/>
      <rect x="26" y="186" width="90" height="7" fill={NV}/>
      <rect x="26" y="202" width="154" height="7" fill={NV}/>
      <rect x="26" y="218" width="154" height="7" fill={NV}/>
      <rect x="26" y="234" width="154" height="7" fill={NV}/>
      <rect x="26" y="250" width="120" height="7" fill={NV}/>
      <rect x="26" y="266" width="154" height="7" fill={NV}/>
      <rect x="26" y="282" width="154" height="7" fill={NV}/>
      <rect x="26" y="298" width="75" height="7" fill={NV}/>
      <rect x="26" y="314" width="154" height="7" fill={NV}/>
      <rect x="26" y="330" width="154" height="7" fill={NV}/>
      <rect x="26" y="346" width="100" height="7" fill={NV}/>
      {/* Spine */}
      <rect x="190" y="20" width="20" height="360" fill={NV}/>
      {/* Right page */}
      <rect x="210" y="20" width="174" height="360" fill={BG}/>
      {/* Right page text lines */}
      <rect x="220" y="28" width="154" height="7" fill={NV}/>
      <rect x="220" y="44" width="154" height="7" fill={NV}/>
      <rect x="220" y="60" width="130" height="7" fill={NV}/>
      <rect x="220" y="76" width="154" height="7" fill={NV}/>
      <rect x="220" y="92" width="154" height="7" fill={NV}/>
      <rect x="220" y="108" width="95" height="7" fill={NV}/>
      <rect x="220" y="124" width="154" height="7" fill={NV}/>
      <rect x="220" y="140" width="154" height="7" fill={NV}/>
      <rect x="220" y="156" width="154" height="7" fill={NV}/>
      <rect x="220" y="172" width="110" height="7" fill={NV}/>
      <rect x="220" y="188" width="154" height="7" fill={NV}/>
      <rect x="220" y="204" width="154" height="7" fill={NV}/>
      <rect x="220" y="220" width="85" height="7" fill={NV}/>
      <rect x="220" y="236" width="154" height="7" fill={NV}/>
      <rect x="220" y="252" width="154" height="7" fill={NV}/>
      <rect x="220" y="268" width="154" height="7" fill={NV}/>
      <rect x="220" y="284" width="140" height="7" fill={NV}/>
      {/* Seal on right page */}
      <circle cx="297" cy="340" r="32" fill={NV}/>
      <circle cx="297" cy="340" r="23" fill={BG}/>
      <circle cx="297" cy="340" r="9" fill={NV}/>
    </svg>
  ),
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
        opacity: hasContent ? 1 : 0.5,
        cursor: hasContent ? 'pointer' : 'default',
        transform: active
          ? 'scale(0.97)'
          : hovered && hasContent
          ? 'translateY(-4px)'
          : 'translateY(0)',
        boxShadow: active
          ? `inset 0 0 0 3px ${kategoria.kolor}`
          : hovered && hasContent
          ? '0 12px 32px rgba(0,0,0,0.18)'
          : '0 2px 8px rgba(0,0,0,0.10)',
      }}
    >
      {/* Thumbnail area */}
      <div style={{
        ...card.thumb,
        background: KATEGORIA_THUMB[kategoria.key] ? BG : (hasContent ? kategoria.kolorBg : '#e8e8e8'),
        color: hasContent ? kategoria.kolor : '#aaa',
      }}>
        {KATEGORIA_THUMB[kategoria.key] ? (
          <div style={{position: 'absolute', inset: 0}}>
            {KATEGORIA_THUMB[kategoria.key]}
          </div>
        ) : (
          KATEGORIA_SVG[kategoria.key]
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: kategoria.kolor }} />
      </div>

      {/* Card body */}
      <div style={card.body}>
        <div style={card.header}>
          <span style={card.nazwa}>{kategoria.nazwa}</span>
          {hasContent && loaded?.era && (
            <span style={card.era}>{loaded.era}</span>
          )}
        </div>
        {hasContent && loaded?.teaser && (
          <p style={card.teaser}>{loaded.teaser}</p>
        )}
        {isEmpty && <span style={card.brak}>brak danych</span>}
        {!hasContent && !isEmpty && <span style={card.brak}>ładowanie…</span>}
        {hasContent && (
          <div style={card.meta}>
            <span style={card.cta}>Czytaj →</span>
          </div>
        )}
      </div>
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
  const isYoutube = sekcja.widget?.typ === 'youtube'

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
        justifyContent: isYoutube && !sekcja.tekst ? 'center' : 'flex-start',
      }}>
        {sekcja.tekst && (
          <div style={{ ...sec.tekst, maxWidth: hasWidget ? '55%' : '680px' }}>
            {sekcja.tekst.split('\n\n').map((p, i) => (
              <p key={i} style={sec.para}>{p}</p>
            ))}
          </div>
        )}
        {hasWidget && (
          <div style={{ ...sec.widgetWrap, ...(sekcja.tekst || isYoutube ? {} : { flex: '1 1 100%' }) }}>
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
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    overflow: 'hidden',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    fontFamily: 'var(--font-sans)',
    textAlign: 'left',
  },
  thumb: {
    position: 'relative',
    height: '340px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  body: { padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' },
  nazwa: { fontSize: '18px', fontFamily: 'var(--font-serif)', color: 'var(--navy)', lineHeight: 1.25 },
  era: { fontSize: '10px', color: 'var(--text-muted)', background: 'var(--cream-dark)', border: '1px solid var(--border-light)', borderRadius: '3px', padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '3px', fontStyle: 'italic' },
  teaser: { fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.55, flex: 1, margin: 0 },
  brak: { fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' },
  meta: { display: 'flex', alignItems: 'center', marginTop: '4px' },
  cta: { fontSize: '11px', color: 'var(--gold)', fontWeight: '600', letterSpacing: '0.3px' },
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
  wrap: { padding:'40px 0', borderBottom:'1px solid var(--border-light)', animation:'fadeInUp 0.4s ease both' },
  h3: { fontSize:'13px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'1.2px', color:'var(--navy)', marginBottom:'20px', paddingLeft:'14px', borderLeft:'3px solid', opacity:0.85 },
  body: { display:'flex', gap:'48px', alignItems:'flex-start' },
  tekst: { flex:1, minWidth:0 },
  para: { fontSize:'15px', color:'var(--text)', lineHeight:1.8, margin:'0 0 16px' },
  widgetWrap: { flex:'0 0 48%', minWidth:0 },
}

const wgt = {
  fig: { margin:0, display:'flex', flexDirection:'column', gap:'10px' },
  img: { width:'100%', borderRadius:'8px', display:'block', objectFit:'contain', maxHeight:'520px' },
  podpis: { fontSize:'13px', color:'var(--text-muted)', fontStyle:'italic', lineHeight:1.5 },
  zrodla: { fontSize:'12px', color:'var(--text-muted)', marginTop:'4px' },
  zrodloLink: { color:'var(--navy)', opacity:0.65 },
  gal: { margin:0 },
  galImgWrap: { position:'relative', overflow:'hidden', borderRadius:'8px', height:'380px', background:'var(--cream)' },
  galImg: { width:'100%', height:'100%', display:'block', objectFit:'contain' },
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
