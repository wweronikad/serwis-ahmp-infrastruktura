import { useNavigate } from 'react-router-dom'
import { cities } from '../data/cities'
import { INTRO_PDF, FULLTEXT_CITIES } from '../data/intropdfs'

// Group cities by volume, preserving order from cities.js
function groupByVolume(cityList) {
  const groups = []
  const seen = new Map()
  for (const city of cityList) {
    const vol = city.volume ?? 'Inne'
    if (!seen.has(vol)) {
      seen.set(vol, [])
      groups.push({ volume: vol, items: seen.get(vol) })
    }
    seen.get(vol).push(city)
  }
  return groups
}

const groups = groupByVolume(cities)

export default function AtlasyPage() {
  const navigate = useNavigate()

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.heading}>Atlasy historyczne miast polskich</h1>
        <p style={s.subheading}>
          Części opisowe atlasów dostępne w formacie PDF na stronie{' '}
          <a href="https://atlasmiast.umk.pl/" target="_blank" rel="noopener noreferrer" style={s.extLink}>
            atlasmiast.umk.pl
          </a>
          . Oznaczone pozycje są dostępne w{' '}
          <a onClick={() => navigate('/wyszukiwanie')} style={s.internalLink}>
            wyszukiwarce pełnotekstowej
          </a>
          .
        </p>

        {groups.map(({ volume, items }) => (
          <section key={volume} style={s.section}>
            <h2 style={s.volumeHeading}>{volume}</h2>
            <div style={s.grid}>
              {items.map(city => {
                const pdfUrl = INTRO_PDF[city.id]
                const hasFulltext = FULLTEXT_CITIES.has(city.id)
                return (
                  <div key={city.id} style={s.card}>
                    <div style={s.cardTop}>
                      <div>
                        <div style={s.cardName}>{city.name}</div>
                        <div style={s.cardRegion}>{city.region}</div>
                      </div>
                      {hasFulltext && (
                        <span style={s.badge} title="Dostępne wyszukiwanie pełnotekstowe">
                          📄 tekst
                        </span>
                      )}
                    </div>
                    <p style={s.cardDesc}>{city.description}</p>
                    <div style={s.cardActions}>
                      <button
                        onClick={() => navigate(`/atlas/${city.id}`)}
                        style={s.atlasBtn}
                      >
                        Atlas →
                      </button>
                      {pdfUrl ? (
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={s.pdfLink}
                        >
                          Część opisowa PDF ↗
                        </a>
                      ) : (
                        <span style={s.noPdf}>brak PDF</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100%',
    background: 'var(--cream)',
    padding: '40px 24px 60px',
  },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  heading: {
    fontFamily: 'var(--font-serif)',
    fontSize: 26,
    color: 'var(--navy)',
    margin: '0 0 8px',
  },
  subheading: {
    fontSize: 14,
    color: 'var(--text-muted)',
    margin: '0 0 36px',
    lineHeight: 1.6,
  },
  extLink: {
    color: 'var(--navy)',
    fontWeight: 600,
  },
  internalLink: {
    color: 'var(--navy)',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  section: {
    marginBottom: 36,
  },
  volumeHeading: {
    fontFamily: 'var(--font-serif)',
    fontSize: 16,
    color: 'var(--navy)',
    margin: '0 0 14px',
    paddingBottom: 8,
    borderBottom: '2px solid var(--gold)',
    display: 'inline-block',
    paddingRight: 24,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
  },
  card: {
    background: '#fff',
    border: '1px solid var(--border-light)',
    borderRadius: 8,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--navy)',
    fontFamily: 'var(--font-serif)',
    lineHeight: 1.2,
  },
  cardRegion: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  badge: {
    fontSize: 10,
    background: 'var(--cream-dark)',
    border: '1px solid var(--border)',
    borderRadius: 3,
    padding: '2px 6px',
    color: 'var(--navy)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 1.55,
    color: 'var(--text-muted)',
    margin: 0,
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardActions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  atlasBtn: {
    background: 'var(--navy)',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  pdfLink: {
    fontSize: 12,
    color: 'var(--text-muted)',
    textDecoration: 'none',
    borderBottom: '1px dashed var(--border)',
  },
  noPdf: {
    fontSize: 11,
    color: 'var(--border)',
    fontStyle: 'italic',
  },
}
