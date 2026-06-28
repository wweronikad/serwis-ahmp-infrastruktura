import { MAP_TYPE_LABELS } from '../../data/cities'

export default function InfoPanel({ map, city, collapsed, onToggle }) {
  if (!map) return null

  const allmapsId = extractAllmapsId(map.annotationUrl)

  return (
    <aside style={styles.panel}>
      {/* Toggle strip — always visible on left edge */}
      <button
        onClick={onToggle}
        style={styles.toggleStrip}
        title={collapsed ? 'Rozwiń kartę informacyjną' : 'Zwiń kartę informacyjną'}
      >
        {collapsed && (
          <span style={styles.stripLabel}>Karta inf.</span>
        )}
        <span style={styles.stripArrow}>{collapsed ? '‹' : '›'}</span>
      </button>

      {/* Scrollable content */}
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerLabel}>Karta informacyjna</div>
          <h3 style={styles.title}>{map.title}</h3>
          {map.subtitle && <p style={styles.subtitle}>{map.subtitle}</p>}
        </div>

        <div style={styles.body}>
          <MetaRow label="Datowanie" value={map.yearDisplay} />
          <MetaRow label="Epoka" value={map.era} />
          <MetaRow label="Typ mapy" value={MAP_TYPE_LABELS[map.type] ?? map.type} />
          {map.source && <MetaRow label="Źródło / seria" value={map.source} />}
          <MetaRow label="Miasto" value={city.name} />
          <MetaRow label="Tom AHMP" value={city.volume} />
          <MetaRow label="Sygnatura" value={map.id.replace(/_/g, '.')} />
        </div>

        <div style={styles.divider} />

        <div style={styles.links}>
          <p style={styles.linksLabel}>Zewnętrzne narzędzia</p>

          {allmapsId && (
            <a
              href={`https://viewer.allmaps.org/#map=${allmapsId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.extLink}
            >
              <span style={styles.extIcon}>🗺</span>
              Otwórz w Allmaps Viewer
            </a>
          )}

          <a
            href={map.annotationUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.extLink}
          >
            <span style={styles.extIcon}>⬇</span>
            Pobierz adnotację georeferencyjną
          </a>

          <a
            href={`https://atlasmiast.umk.pl/atlasy/${city.id}/`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.extLink}
          >
            <span style={styles.extIcon}>🏛</span>
            Przejdź do atlasu miasta
          </a>

          {map.pdfUrl && (
          <a
            href={map.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.extLink}
          >
            <span style={styles.extIcon}>📄</span>
            Przejdź do dokumentu
          </a>
          )}
        </div>

        <div style={styles.divider} />

        <div style={styles.cityDesc}>
          <p style={styles.linksLabel}>O mieście</p>
          <p style={styles.descText}>{city.description}</p>
          <a
            href="https://atlasmiast.umk.pl/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '8px', display: 'inline-block' }}
          >
            atlasmiast.umk.pl →
          </a>
        </div>
      </div>
    </aside>
  )
}

function MetaRow({ label, value }) {
  if (!value) return null
  return (
    <div style={styles.metaRow}>
      <dt style={styles.metaLabel}>{label}</dt>
      <dd style={styles.metaValue}>{value}</dd>
    </div>
  )
}

function extractAllmapsId(url) {
  if (!url) return null
  const match = url.match(/maps\/([a-f0-9]+)/)
  return match ? match[1] : null
}

const styles = {
  panel: {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: 'var(--cream)',
    borderLeft: '1px solid var(--border)',
    overflow: 'hidden',
    fontSize: '13px',
  },
  toggleStrip: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: '28px',
    background: 'var(--navy)',
    border: 'none',
    borderRight: '1px solid rgba(255,255,255,0.08)',
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
    transform: 'rotate(180deg)',
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
  content: {
    position: 'absolute',
    left: '28px',
    top: 0, right: 0, bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    background: 'var(--cream)',
  },
  header: {
    padding: '16px',
    background: 'var(--navy)',
    color: 'var(--white)',
    flexShrink: 0,
  },
  headerLabel: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--gold-light)',
    marginBottom: '6px',
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: '15px',
    color: 'var(--white)',
    lineHeight: '1.35',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.65)',
    fontStyle: 'italic',
    lineHeight: '1.4',
  },
  body: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    fontWeight: '600',
    flexShrink: 0,
    listStyle: 'none',
  },
  metaValue: {
    fontSize: '12px',
    color: 'var(--text)',
    textAlign: 'right',
    listStyle: 'none',
  },
  divider: {
    borderTop: '1px solid var(--border-light)',
    flexShrink: 0,
  },
  links: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexShrink: 0,
  },
  linksLabel: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  extLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '7px 10px',
    background: 'var(--cream-dark)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius)',
    color: 'var(--navy)',
    textDecoration: 'none',
    fontSize: '12px',
    transition: 'background 0.1s',
  },
  extIcon: {
    fontSize: '14px',
  },
  cityDesc: {
    padding: '12px 16px 16px',
    flexShrink: 0,
  },
  descText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
  },
}
