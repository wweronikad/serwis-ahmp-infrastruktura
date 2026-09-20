import { plannedAtlases } from '../data/plannedAtlases'
import PlannedMapView from '../components/Map/PlannedMapView'
import { asset } from '../utils/asset'

export default function AtlasyProjektowane() {
  return (
    <div style={s.page}>
      <div style={s.hero}>
        <p style={s.kicker}>Atlasy projektowane</p>
        <h1 style={s.title}>Nowe atlasy w opracowaniu</h1>
        <p style={s.subtitle}>
          Zespół UMCS w Lublinie przygotowuje kolejne zeszyty atlasowe dla
          miast Lubelszczyzny: Wąwolnicy, Puław i Kazimierza Dolnego. Poniżej
          materiały robocze udostępniane w miarę powstawania.
        </p>
      </div>

      <div style={s.content}>
        {plannedAtlases.map((city) => (
          <section key={city.id} style={s.section}>
            <div style={s.sectionHead}>
              <h2 style={s.h2}>{city.name}</h2>
              <span style={s.badge}>{city.region} · {city.team}</span>
            </div>

            {city.intro ? <Featured city={city} /> : (
              <>
                {city.map ? (
                  <PlannedMapView map={city.map} />
                ) : (
                  <div style={s.placeholder}>
                    Materiały kartograficzne w opracowaniu — brak zgeoreferencjonowanej mapy.
                  </div>
                )}
                <p style={s.placeholderText}>Opis historyczny w opracowaniu.</p>
              </>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

function Featured({ city }) {
  return (
    <>
      <div style={s.introRow}>
        <div style={s.introText}>
          {city.intro.map((p, i) => (
            <p key={i} style={s.p}>{p}</p>
          ))}
        </div>
        {city.photo && (
          <figure style={s.figure}>
            <img src={asset(city.photo.src)} alt={city.photo.alt} style={s.photo} />
            <figcaption style={s.figcaption}>{city.photo.caption}</figcaption>
          </figure>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <PlannedMapView map={city.map} />
        {city.mapCaption && <p style={s.mapCaption}>{city.mapCaption}</p>}
      </div>

      <h3 style={s.h3}>{city.historyTitle}</h3>
      <div style={s.history}>
        {city.history.map((p, i) => (
          <p key={i} style={s.p}>{p}</p>
        ))}
      </div>
      {city.sources && (
        <p style={s.source}>
          Źródła:{' '}
          {city.sources.map((it, i) => (
            <span key={it.label}>
              {i > 0 && ' · '}
              {it.href ? (
                <a href={it.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>{it.label}</a>
              ) : it.label}
            </span>
          ))}
        </p>
      )}
    </>
  )
}

const s = {
  page: { maxWidth: '80vw', margin: '0 auto', paddingBottom: 64 },
  hero: {
    background: 'var(--navy)',
    color: 'var(--white)',
    padding: '52px 40px',
  },
  kicker: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--gold-light)',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 34,
    color: 'var(--white)',
    lineHeight: 1.2,
    marginBottom: 16,
    fontWeight: 'normal',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 1.7,
    maxWidth: 580,
  },
  content: { padding: '0 40px' },
  section: { padding: '40px 0 0' },
  sectionHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: '1px solid var(--border-light)',
  },
  h2: {
    fontFamily: 'var(--font-serif)',
    fontSize: 22,
    color: 'var(--navy)',
  },
  badge: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  placeholder: {
    padding: '32px 16px',
    textAlign: 'center',
    background: 'var(--cream-dark)',
    border: '1px dashed var(--border)',
    borderRadius: 8,
    color: 'var(--text-muted)',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  introRow: { display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' },
  introText: { flex: '1 1 360px', minWidth: 0 },
  figure: { flex: '1 1 380px', margin: 0, minWidth: 0 },
  photo: {
    width: '100%', display: 'block', borderRadius: 6,
    border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
  },
  figcaption: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8 },
  mapCaption: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8 },
  h3: { fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--navy)', margin: '28px 0 12px' },
  history: { maxWidth: 820 },
  p: {
    color: 'var(--text)',
    lineHeight: 1.75,
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'justify',
  },
  note: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    lineHeight: 1.55,
  },
  source: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
}
