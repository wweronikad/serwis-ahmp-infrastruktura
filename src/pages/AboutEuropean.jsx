import { Link } from 'react-router-dom'

export default function AboutEuropean() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
    <div style={styles.page}>
      <div style={styles.hero}>
        <p style={styles.kicker}>Projekt europejski</p>
        <h1 style={styles.title}>
          European Historic Towns Atlases
        </h1>
        <p style={styles.subtitle}>
          Wielonarodowe przedsięwzięcie badające genezę i rozwój europejskiej
          urbanizacji, prowadzone pod auspicjami Międzynarodowej Komisji
          Historii Miast od 1965 r.
        </p>
      </div>

      <div style={styles.content}>
        <section style={styles.section}>
          <h2 style={styles.h2}>Geneza programu</h2>
          <p style={styles.p}>
            Decyzję o wydawaniu atlasów miast europejskich{' '}
            <strong>
              Międzynarodowa Komisja Historii Miast (International Commission
              for the History of Towns)
            </strong>{' '}
            i jej Atlas Working Group podjęła na kongresie w{' '}
            <strong>Wiedniu w 1965 r.</strong> Podstawowe zasady edytorskie
            ustalono na konferencji w <strong>Oksfordzie w 1968 r.</strong>,
            a następnie uzupełniono podczas spotkania w{' '}
            <strong>Münster w 1995 r.</strong>
          </p>
          <p style={styles.p}>
            Program realizowany jest obecnie w kilkunastu projektach
            narodowych; łącznie ukazały się atlasy ponad{' '}
            <strong>530 miast z 18 krajów Europy</strong>.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Rdzeń każdego atlasu</h2>
          <p style={styles.p}>
            Sercem każdego tomu jest <strong>mapa zasadnicza (core map)</strong>{' '}
            — wielkoskalowy plan parcelacyjny, oparty w większości na
            XIX‑wiecznych mapach katastralnych (skala zwykle 1:2500).
            Wspólne wytyczne edytorskie zapewniają{' '}
            <strong>porównywalność materiału w skali europejskiej</strong>.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Centrum koordynujące</h2>
          <p style={styles.p}>
            Centralnym ośrodkiem dokumentującym jest{' '}
            <strong>
              Institut für vergleichende Städtegeschichte
            </strong>{' '}
            na Uniwersytecie w Münster (portal „Städtegeschichte"). Tam
            zgromadzone są metadane, linki i mapa rozmieszczenia atlasów.
          </p>
          <div style={styles.linkBox}>
            <a
              href="https://www.uni-muenster.de/Staedtegeschichte/en/portal/staedteatlanten/index.html"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.extLink}
            >
              Portal atlasów europejskich — Universität Münster →
            </a>
            <a
              href="https://www.uni-muenster.de/Staedtegeschichte/en/portal/staedteatlanten/karte.html"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.extLink}
            >
              Mapa rozmieszczenia atlasów w Europie →
            </a>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Projekty narodowe — wybór</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Kraj</th>
                <th style={styles.th}>Nazwa projektu / instytucja</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Polska', 'Atlas Historyczny Miast Polskich — UMK Toruń / UWr / IJA PAN'],
                ['Niemcy', 'Deutscher Städteatlas — Westfälisches Institut'],
                ['Irlandia', 'Irish Historic Towns Atlas — Royal Irish Academy'],
                ['Wielka Brytania', 'Historic Towns Atlas — British Academy'],
                ['Czechy', 'Atlas historický měst ČR — Historický ústav AV ČR'],
                ['Austria', 'Österreichischer Städteatlas — Wiener Stadt- und Landesarchiv'],
                ['Szwecja', 'Historisk tätortsatlas — Riksantikvarieämbetet'],
              ].map(([kraj, opis]) => (
                <tr key={kraj}>
                  <td style={styles.td}><strong>{kraj}</strong></td>
                  <td style={styles.td}>{opis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div style={styles.cta}>
          <a
            href="https://www.uni-muenster.de/Staedtegeschichte/en/portal/staedteatlanten/karte.html"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.btnPrimary}
          >
            Mapa atlasów europejskich →
          </a>
          <Link to="/o-projekcie-polskim" style={styles.btnSecondary}>
            Projekt polski
          </Link>
          <Link to="/atlas" style={styles.btnSecondary}>
            Atlas interaktywny
          </Link>
        </div>
      </div>
    </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: '820px', margin: '0 auto', paddingBottom: '64px' },
  hero: {
    background: 'var(--navy)',
    color: 'var(--white)',
    padding: '52px 40px',
  },
  kicker: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--gold-light)',
    marginBottom: '12px',
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: '34px',
    color: 'var(--white)',
    lineHeight: '1.2',
    marginBottom: '16px',
    fontWeight: 'normal',
  },
  subtitle: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.78)',
    lineHeight: '1.7',
    maxWidth: '580px',
  },
  content: { padding: '0 40px' },
  section: { padding: '36px 0 0' },
  h2: {
    fontFamily: 'var(--font-serif)',
    fontSize: '22px',
    color: 'var(--navy)',
    marginBottom: '14px',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--border-light)',
  },
  p: {
    color: 'var(--text)',
    lineHeight: '1.75',
    marginBottom: '12px',
    fontSize: '14px',
  },
  linkBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  extLink: {
    display: 'inline-block',
    background: 'var(--cream-dark)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '10px 16px',
    color: 'var(--navy)',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: {
    background: 'var(--navy)',
    color: 'var(--white)',
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '12px',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
  },
  td: {
    padding: '9px 14px',
    borderBottom: '1px solid var(--border-light)',
    color: 'var(--text)',
  },
  cta: { display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '40px 0 0' },
  btnPrimary: {
    background: 'var(--navy)',
    color: 'var(--white)',
    padding: '11px 22px',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
  },
  btnSecondary: {
    background: 'var(--cream-dark)',
    color: 'var(--navy)',
    padding: '11px 22px',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    fontSize: '14px',
    border: '1px solid var(--border)',
  },
}
