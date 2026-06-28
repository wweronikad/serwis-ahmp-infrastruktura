import { cities, MAP_TYPE_LABELS } from '../../data/cities'

const ERA_COLORS = {
  'XVI wiek': '#7c5c2a',
  'XVI/XVII wiek': '#7c5c2a',
  'XVII wiek': '#8a5e35',
  'XVII/XVIII wiek': '#8a6840',
  'XVIII wiek': '#6b7a3a',
  'XVIII/XIX wiek': '#4a6b52',
  'XIX wiek': '#3a6b5c',
  'XIX/XX wiek': '#3a5c6b',
  'XX wiek': '#3a4a6b',
  'XXI wiek': '#2a3a5c',
  'Synteza historyczna': '#5a3a6b',
}

function typeColor(era) {
  return ERA_COLORS[era] ?? '#4a4a4a'
}

export default function MapListPanel({
  activeCity,
  activeMapId,
  onCityChange,
  onMapSelect,
  opacity,
  onOpacityChange,
  splitActive,
  onToggleSplit,
  collapsed,
  onToggle,
  galleryCount,
  onGalleryOpen,
}) {
  const sortedMaps = [...activeCity.maps].sort((a, b) => {
    if (a.year === null) return 1
    if (b.year === null) return -1
    return a.year - b.year
  })

  return (
    <aside style={styles.panel}>
      {/* Top actions */}
      <div style={styles.topActions}>
        <button
          onClick={onToggleSplit}
          style={splitActive ? styles.splitBtnActive : styles.splitBtn}
          title={splitActive ? 'Wyłącz podzielony widok' : 'Podziel ekran — porównaj dwie mapy'}
        >
          {splitActive ? '⊠ Jeden widok' : '⊡ Podziel widok'}
        </button>
        {galleryCount > 0 && (
          <button
            onClick={onGalleryOpen}
            style={styles.galleryBtn}
            title={`Galeria zdjęć historycznych (${galleryCount})`}
          >
            🖼 Galeria <span style={{ opacity: 0.65, fontSize: 10 }}>({galleryCount})</span>
          </button>
        )}
      </div>

      {/* City selector */}
      <div style={styles.section}>
        <label style={styles.label}>Miasto</label>
        <select
          style={styles.select}
          value={activeCity.id}
          onChange={(e) => onCityChange(e.target.value)}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.region}
            </option>
          ))}
        </select>
        <div style={styles.cityMeta}>{activeCity.volume}</div>
      </div>

      <div style={styles.divider} />

      {/* Opacity control */}
      <div style={styles.section}>
        <div style={styles.opacityRow}>
          <label style={styles.label}>Przezroczystość mapy hist.</label>
          <span style={styles.opacityVal}>{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          style={styles.range}
        />
      </div>

      <div style={styles.divider} />

      {/* Map list / timeline */}
      <div style={styles.listHeader}>
        <span style={styles.label}>Mapy ({activeCity.maps.length})</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          ← oś czasu
        </span>
      </div>

      <div style={styles.list}>
        {(() => {
          const items = []
          let currentEra = null
          let eraCount = 0
          sortedMaps.forEach((map) => {
            if (map.era !== currentEra) {
              items.push(
                <div key={`era-${eraCount++}`} style={styles.eraDivider}>
                  <div style={styles.eraDividerLine} />
                  <span style={styles.eraDividerLabel}>{map.era}</span>
                  <div style={styles.eraDividerLine} />
                </div>
              )
              currentEra = map.era
            }
            const active = map.id === activeMapId
            items.push(
              <button
                key={map.id}
                style={active ? styles.mapItemActive : styles.mapItem}
                onClick={() => onMapSelect(map.id)}
              >
                <div style={styles.mapYear}>
                  <span style={{ ...styles.yearDot, background: typeColor(map.era) }} />
                  <span style={styles.yearText}>{map.yearDisplay}</span>
                </div>
                <div style={active ? styles.mapTitleActive : styles.mapTitle}>{map.title}</div>
                <div style={styles.mapType}>{MAP_TYPE_LABELS[map.type] ?? map.type}</div>
              </button>
            )
          })
          return items
        })()}
      </div>
      {/* Toggle strip — always on right edge */}
      <button
        onClick={onToggle}
        style={styles.toggleStrip}
        title={collapsed ? 'Rozwiń panel map' : 'Zwiń panel map'}
      >
        {collapsed && <span style={styles.stripLabel}>Mapy</span>}
        <span style={styles.stripArrow}>{collapsed ? '›' : '‹'}</span>
      </button>
    </aside>
  )
}

const styles = {
  panel: {
    width: '100%',
    height: '100%',
    background: 'var(--cream)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontSize: '13px',
    position: 'relative',
    paddingRight: '28px',
  },
  toggleStrip: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0,
    width: '28px',
    background: 'var(--navy)',
    border: 'none',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px 0',
    color: 'rgba(255,255,255,0.65)',
    zIndex: 1,
  },
  stripLabel: {
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
    fontSize: '9px',
    fontWeight: '600',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: 'var(--gold-light)',
    userSelect: 'none',
  },
  stripArrow: {
    fontSize: '16px',
    lineHeight: 1,
    color: 'rgba(255,255,255,0.55)',
  },
  topActions: {
    padding: '8px 10px',
    borderBottom: '1px solid var(--border-light)',
    display: 'flex',
    gap: '6px',
    flexShrink: 0,
  },
  splitBtn: {
    flex: 1,
    padding: '5px 8px',
    fontSize: '11px',
    fontFamily: 'var(--font-sans)',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    textAlign: 'center',
    letterSpacing: '0.2px',
  },
  splitBtnActive: {
    flex: 1,
    padding: '5px 8px',
    fontSize: '11px',
    fontFamily: 'var(--font-sans)',
    background: 'rgba(26,41,66,0.08)',
    border: '1px solid var(--navy)',
    borderRadius: 'var(--radius)',
    color: 'var(--navy)',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: '0.2px',
  },
  galleryBtn: {
    flex: 1,
    padding: '5px 8px',
    fontSize: '11px',
    fontFamily: 'var(--font-sans)',
    background: 'rgba(184,150,62,0.10)',
    border: '1px solid var(--gold)',
    borderRadius: 'var(--radius)',
    color: 'var(--gold)',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: '0.2px',
    whiteSpace: 'nowrap',
  },
  section: {
    padding: '14px 16px',
  },
  label: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--text-muted)',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    padding: '7px 10px',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'var(--white)',
    color: 'var(--navy)',
    cursor: 'pointer',
    outline: 'none',
  },
  cityMeta: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '5px',
    fontStyle: 'italic',
  },
  divider: {
    borderTop: '1px solid var(--border-light)',
    margin: '0',
    flexShrink: 0,
  },
  opacityRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  opacityVal: {
    fontSize: '12px',
    color: 'var(--navy)',
    fontWeight: '600',
  },
  range: {
    width: '100%',
    accentColor: 'var(--navy)',
    cursor: 'pointer',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px 8px',
    flexShrink: 0,
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 8px 8px',
  },
  mapItem: {
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 'var(--radius)',
    padding: '8px 10px',
    cursor: 'pointer',
    marginBottom: '2px',
    transition: 'background 0.1s',
    fontFamily: 'var(--font-sans)',
  },
  mapItemActive: {
    width: '100%',
    textAlign: 'left',
    background: 'rgba(26,41,66,0.06)',
    border: '1px solid var(--navy)',
    borderRadius: 'var(--radius)',
    padding: '8px 10px',
    cursor: 'pointer',
    marginBottom: '2px',
    fontFamily: 'var(--font-sans)',
  },
  mapYear: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    marginBottom: '2px',
  },
  yearDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  yearText: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  mapTitle: {
    fontSize: '12px',
    color: 'var(--text)',
    lineHeight: '1.4',
    marginBottom: '2px',
  },
  mapTitleActive: {
    fontSize: '12px',
    color: 'var(--navy)',
    lineHeight: '1.4',
    marginBottom: '2px',
    fontWeight: '600',
  },
  mapType: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  eraDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '10px 10px 4px',
    flexShrink: 0,
  },
  eraDividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--navy)',
    opacity: 0.15,
  },
  eraDividerLabel: {
    fontSize: '9px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--navy)',
    opacity: 0.45,
    whiteSpace: 'nowrap',
  },
}
