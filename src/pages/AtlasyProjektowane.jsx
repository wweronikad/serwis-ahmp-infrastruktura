import { plannedAtlases } from '../data/plannedAtlases'
import PlannedMapView from '../components/Map/PlannedMapView'

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

            {city.map ? (
              <PlannedMapView map={city.map} />
            ) : (
              <div style={s.placeholder}>
                Materiały kartograficzne w opracowaniu — brak zgeoreferencjonowanej mapy.
              </div>
            )}

            {city.text ? (
              <div style={s.text}>
                {city.text.map((p, i) => (
                  <p key={i} style={s.p}>{p}</p>
                ))}
                {city.textNote && <p style={s.note}>{city.textNote}</p>}
                {city.source && <p style={s.source}>Źródło: {city.source}</p>}
              </div>
            ) : (
              <p style={s.placeholderText}>Opis historyczny w opracowaniu.</p>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

const s = {
  page: { maxWidth: 820, margin: '0 auto', paddingBottom: 64 },
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
  text: { marginTop: 16 },
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
