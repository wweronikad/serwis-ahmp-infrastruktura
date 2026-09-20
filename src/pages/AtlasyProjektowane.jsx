import { useState } from 'react'
import { plannedAtlases } from '../data/plannedAtlases'
import PlannedMapView from '../components/Map/PlannedMapView'

const byId = Object.fromEntries(plannedAtlases.map((c) => [c.id, c]))

export default function AtlasyProjektowane() {
  const waw = byId.wawolnica
  const others = plannedAtlases.filter((c) => !c.map)

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={s.page}>
        {/* ── Hero + quick nav ───────────────────────────────────── */}
        <div style={s.hero}>
          <p style={s.kicker}>Atlasy projektowane</p>
          <h1 style={s.title}>Nowe atlasy w opracowaniu</h1>
          <p style={s.subtitle}>
            Zespół UMCS w Lublinie przygotowuje kolejne zeszyty atlasowe dla
            trzech miast Lubelszczyzny. Jedno ma już pierwszą zgeoreferencjowaną mapę —
            przy pozostałych zebrano na razie to, co wiadomo o ich dziejach.
          </p>
          <div style={s.navRow}>
            {plannedAtlases.map((c) => (
              <a key={c.id} href={`#${c.id}`} style={s.navCard}>
                <span style={s.navName}>{c.name}</span>
                <span style={c.map ? s.chipOn : s.chipOff}>{c.status}</span>
                <span style={s.navLead}>{c.lead}</span>
              </a>
            ))}
          </div>
        </div>

        <div style={s.content}>
          {/* ── Wąwolnica ─────────────────────────────────────────── */}
          <section id={waw.id} style={s.section}>
            <div style={s.sectionHead}>
              <h2 style={s.h2}>{waw.name}</h2>
              <span style={s.badge}>{waw.region} · {waw.team}</span>
            </div>

            {waw.highlight && (
              <div style={s.banner}>
                <div style={s.bannerYears}>
                  <span style={s.bannerYear}>{waw.highlight.from}</span>
                  <span style={s.bannerArrow}>→</span>
                  <span style={{ ...s.bannerYear, color: 'var(--gold-light)' }}>{waw.highlight.to}</span>
                </div>
                <div style={s.bannerBody}>
                  <h3 style={s.bannerTitle}>{waw.highlight.title}</h3>
                  <p style={s.bannerText}>{waw.highlight.text}</p>
                </div>
              </div>
            )}

            <PlannedMapView map={waw.map} />
            <p style={s.mapHint}>
              Przesuń suwak, aby zobaczyć plan z 1820 roku na tle dzisiejszej mapy. Przyciskiem „Powiększ”
              zwiększysz okno mapy.
            </p>

            <h3 style={s.h3}>Najważniejsze daty</h3>
            <div style={s.timeline}>
              {waw.milestones.map((m) => (
                <div key={m.year} style={m.hi ? { ...s.tlCard, ...s.tlCardHi } : s.tlCard}>
                  <span style={m.hi ? { ...s.tlYear, color: 'var(--gold-light)' } : s.tlYear}>{m.year}</span>
                  <span style={m.hi ? { ...s.tlText, color: 'rgba(255,255,255,0.88)' } : s.tlText}>{m.text}</span>
                </div>
              ))}
            </div>

            <h3 style={s.h3}>Warto wiedzieć</h3>
            <div style={s.factRow}>
              {waw.curiosities.map((f) => (
                <div key={f.title} style={s.fact}>
                  <span style={s.factIcon}>{f.icon}</span>
                  <strong style={s.factTitle}>{f.title}</strong>
                  <span style={s.factText}>{f.text}</span>
                </div>
              ))}
            </div>

            <History city={waw} />
            <Sources items={waw.sources} />
          </section>

          {/* ── Puławy i Kazimierz Dolny ──────────────────────────── */}
          <section style={s.section}>
            <div style={s.sectionHead}>
              <h2 style={s.h2}>Puławy i Kazimierz Dolny</h2>
              <span style={s.badge}>Lubelszczyzna · UMCS w Lublinie</span>
            </div>
            <p style={s.intro}>
              Dla tych dwóch miast nie ma jeszcze zgeoreferencjonowanych map. Poniżej kalendarium
              zebrane z ogólnodostępnych źródeł — mapy dodamy, gdy zespół je opracuje.
            </p>
            <div style={s.twoCol}>
              {others.map((c) => (
                <article key={c.id} id={c.id} style={s.card}>
                  <div style={s.cardHead}>
                    <h3 style={s.cardTitle}>{c.name}</h3>
                    <span style={s.chipOff}>{c.status}</span>
                  </div>
                  <p style={s.cardLead}>{c.lead}</p>
                  <ol style={s.list}>
                    {c.milestones.map((m) => (
                      <li key={m.year + m.text} style={s.li}>
                        <span style={s.liYear}>{m.year}</span>
                        <span style={s.liText}>{m.text}</span>
                      </li>
                    ))}
                  </ol>
                  <div style={s.miniFacts}>
                    {c.curiosities.map((f) => (
                      <p key={f.title} style={s.miniFact}>
                        <span style={{ marginRight: 6 }}>{f.icon}</span>
                        <strong>{f.title}.</strong> {f.text}
                      </p>
                    ))}
                  </div>
                  {c.connection && <p style={s.connection}>🔗 {c.connection}</p>}
                  <Sources items={c.sources} />
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function History({ city }) {
  const [open, setOpen] = useState(false)
  if (!city.text) return null
  return (
    <div style={s.history}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={s.historyBtn} aria-expanded={open}>
        <span>Pełna historia miasta (do 1870 r.)</span>
        <span style={{ fontSize: 18 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={s.historyBody}>
          {city.text.map((p, i) => (
            <p key={i} style={s.p}>{p}</p>
          ))}
          {city.textNote && <p style={s.note}>{city.textNote}</p>}
          {city.source && <p style={s.note}>Źródło: {city.source}</p>}
        </div>
      )}
    </div>
  )
}

function Sources({ items }) {
  if (!items?.length) return null
  return (
    <p style={s.sources}>
      Źródła:{' '}
      {items.map((it, i) => (
        <span key={it.label}>
          {i > 0 && ' · '}
          {it.href ? (
            <a href={it.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>
              {it.label}
            </a>
          ) : (
            it.label
          )}
        </span>
      ))}
    </p>
  )
}

const s = {
  page: { maxWidth: '80vw', margin: '0 auto', paddingBottom: 64 },
  hero: { background: 'var(--navy)', color: 'var(--white)', padding: '52px 40px 40px' },
  kicker: {
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '1.5px', color: 'var(--gold-light)', marginBottom: 12,
  },
  title: {
    fontFamily: 'var(--font-serif)', fontSize: 34, color: 'var(--white)',
    lineHeight: 1.2, marginBottom: 16, fontWeight: 'normal',
  },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, maxWidth: 640 },
  navRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16, marginTop: 32,
  },
  navCard: {
    display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 18px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(184,150,62,0.35)',
    borderRadius: 8, textDecoration: 'none',
  },
  navName: { fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--white)' },
  navLead: { fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)' },
  chipOn: {
    alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
    background: 'var(--gold)', color: 'var(--navy)',
  },
  chipOff: {
    alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
    border: '1px dashed var(--border)', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.5)',
  },

  content: { padding: '0 40px' },
  section: { padding: '44px 0 0', scrollMarginTop: 16 },
  sectionHead: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 8, marginBottom: 18, paddingBottom: 8,
    borderBottom: '1px solid var(--border-light)',
  },
  h2: { fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--navy)' },
  h3: { fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--navy)', margin: '30px 0 12px' },
  badge: { fontSize: 11, color: 'var(--text-muted)' },

  banner: {
    display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
    background: 'linear-gradient(160deg, #1e3054 0%, #1a2942 70%, #131e38 100%)',
    border: '1px solid rgba(184,150,62,0.45)', borderRadius: 8,
    padding: '22px 28px', marginBottom: 20,
  },
  bannerYears: { display: 'flex', alignItems: 'baseline', gap: 12 },
  bannerYear: { fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 'bold', color: 'rgba(245,240,232,0.85)', lineHeight: 1 },
  bannerArrow: { color: 'var(--gold)', fontSize: 26 },
  bannerBody: { flex: '1 1 320px' },
  bannerTitle: { fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--gold-light)', fontWeight: 'normal', marginBottom: 6 },
  bannerText: { fontSize: 13.5, lineHeight: 1.65, color: 'rgba(245,240,232,0.82)' },
  mapHint: { fontSize: 12, color: 'var(--text-muted)', marginTop: 8 },

  timeline: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 },
  tlCard: {
    display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px',
    background: 'var(--white)', border: '1px solid var(--border-light)',
    borderTop: '3px solid var(--gold)', borderRadius: 6, boxShadow: 'var(--shadow-sm)',
  },
  tlCardHi: { background: 'var(--navy)', border: '1px solid var(--navy)', borderTop: '3px solid var(--gold-light)' },
  tlYear: { fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 'bold', color: 'var(--navy)' },
  tlText: { fontSize: 12.5, lineHeight: 1.6, color: 'var(--text)' },

  factRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 },
  fact: {
    display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 18px',
    background: 'var(--cream-dark)', borderRadius: 8, border: '1px solid var(--border-light)',
  },
  factIcon: { fontSize: 24 },
  factTitle: { fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--navy)', fontWeight: 'normal' },
  factText: { fontSize: 13, lineHeight: 1.6, color: 'var(--text)' },

  history: { marginTop: 30, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' },
  historyBtn: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', background: 'var(--cream-dark)', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--navy)', textAlign: 'left',
  },
  historyBody: { padding: '16px 20px 6px', background: 'var(--white)' },
  p: { color: 'var(--text)', lineHeight: 1.75, marginBottom: 12, fontSize: 14, textAlign: 'justify' },
  note: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.55, marginBottom: 10 },
  sources: { fontSize: 12, color: 'var(--text-muted)', marginTop: 14, lineHeight: 1.6 },

  intro: { fontSize: 14, lineHeight: 1.7, color: 'var(--text)', maxWidth: 720, marginBottom: 20 },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 },
  card: {
    background: 'var(--white)', border: '1px solid var(--border-light)', borderRadius: 8,
    padding: '22px 24px', boxShadow: 'var(--shadow-sm)', scrollMarginTop: 16,
  },
  cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 },
  cardTitle: { fontFamily: 'var(--font-serif)', fontSize: 21, color: 'var(--navy)', fontWeight: 'normal' },
  cardLead: { fontSize: 13.5, lineHeight: 1.65, color: 'var(--text)', fontStyle: 'italic', marginBottom: 14 },
  list: { listStyle: 'none', padding: 0, margin: 0, borderLeft: '2px solid var(--gold)' },
  li: { display: 'flex', gap: 12, padding: '6px 0 6px 14px' },
  liYear: { flex: '0 0 86px', fontFamily: 'var(--font-serif)', fontWeight: 'bold', fontSize: 13.5, color: 'var(--navy)' },
  liText: { fontSize: 13, lineHeight: 1.6, color: 'var(--text)' },
  miniFacts: { marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)' },
  miniFact: { fontSize: 12.5, lineHeight: 1.6, color: 'var(--text)', marginBottom: 6 },
  connection: {
    marginTop: 10, padding: '10px 12px', background: 'var(--cream-dark)', borderRadius: 6,
    fontSize: 12.5, lineHeight: 1.6, color: 'var(--text)',
  },
}
