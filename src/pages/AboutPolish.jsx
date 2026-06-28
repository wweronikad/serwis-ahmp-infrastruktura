import { Link } from 'react-router-dom'

export default function AboutPolish() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
    <div style={styles.page}>
      <div style={styles.hero}>
        <p style={styles.kicker}>Projekt polski</p>
        <h1 style={styles.title}>Atlas Historyczny Miast Polskich</h1>
        <p style={styles.subtitle}>
          Wieloletnie przedsięwzięcie dokumentujące genezę i rozwój
          przestrzenny polskich miast — w formie zeszytów atlasowych
          łączących wieloskalową kartografię historyczną z narracją naukową.
        </p>
      </div>

      <div style={styles.content}>
        <section style={styles.section}>
          <h2 style={styles.h2}>Historia i zespoły</h2>
          <p style={styles.p}>
            Projekt zapoczątkował <strong>prof. Antoni Czacharowski</strong> w
            1993 r. w Instytucie Historii i Archiwistyki Uniwersytetu Mikołaja
            Kopernika w Toruniu. Z czasem dołączyły kolejne zespoły regionalne:
          </p>
          <ul style={styles.ul}>
            <li style={styles.li}>
              <strong>Wrocław</strong> — Śląsk; pod kierunkiem prof. Marty
              Młynarskiej‑Kaletynowej
            </li>
            <li style={styles.li}>
              <strong>Kraków</strong> — Małopolska; pod kierunkiem prof.
              Zdzisława Nogi
            </li>
          </ul>
          <p style={styles.p}>
            Redaktorem naczelnym serii jest <strong>prof. Roman Czaja</strong>.
            Dotychczas ukazały się atlasy około{' '}
            <strong>50 miast</strong>; prace prowadzone są interdyscyplinarnie
            przez historyków, historyków sztuki i architektury, archeologów
            oraz kartografów.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Tomy regionalne</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tom</th>
                <th style={styles.th}>Region</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Tom I', 'Prusy Królewskie i Warmia'],
                ['Tom II', 'Kujawy'],
                ['Tom III', 'Mazury i Prusy Książęce'],
                ['Tom IV', 'Śląsk'],
                ['Tom V', 'Małopolska'],
              ].map(([tom, region]) => (
                <tr key={tom}>
                  <td style={styles.td}>{tom}</td>
                  <td style={styles.td}>{region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Kanon edytorski — co zawiera zeszyt</h2>
          <p style={styles.p}>
            Każdy zeszyt AHMP opiera się na tym samym modelu:
          </p>
          <ul style={styles.ul}>
            <li style={styles.li}>
              <strong>Mapa pomiarowa 1:2500</strong> — przerys katastru
              (galicyjskiego, pruskiego lub rosyjskiego) z epoki
              przedprzemysłowej; serce atlasu
            </li>
            <li style={styles.li}>
              Współczesny plan miasta
            </li>
            <li style={styles.li}>
              Historyczna mapa regionu (skala 1:25 000–1:100 000)
            </li>
            <li style={styles.li}>
              Mapa rozwoju przestrzennego 1:10 000 z fazami chronologicznymi
            </li>
            <li style={styles.li}>
              Mapy tematyczne oraz reprodukcje ważnych źródeł kartograficznych
              i widoków (wedut)
            </li>
            <li style={styles.li}>
              Część tekstowa: dzieje miasta ze szczególnym uwzględnieniem
              urbanistyki, opis reprodukcji i bibliografia
            </li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>GIS i nowe atlasy</h2>
          <p style={styles.p}>
            Nowsza odsłona projektu (zespół toruński, od 1999 r.) jako pierwsza
            w polskiej historiografii miast wprowdziła{' '}
            <strong>technologię GIS</strong> oraz szerokie stosowanie map
            tematycznych. Stanowi to naturalne uzasadnienie potrzeby serwisu
            cyfrowego — <em>serwis ten jest jego bezpośrednią kontynuacją</em>.
          </p>
          <p style={styles.p}>
            W przygotowaniu lub planowaniu znajdują się m.in.:
          </p>
          <ul style={styles.ul}>
            <li style={styles.li}>
              <strong>Kazimierz Dolny, Puławy, Wąwolnica</strong> — UMCS w
              Lublinie
            </li>
            <li style={styles.li}>
              Włocławek, Ostróda, Mrągowo, Kętrzyn — zespół toruński
            </li>
          </ul>
        </section>

        <div style={styles.cta}>
          <a
            href="https://atlasmiast.umk.pl/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.btnPrimary}
          >
            Strona projektu: atlasmiast.umk.pl →
          </a>
          <Link to="/atlas" style={styles.btnSecondary}>
            Przejdź do atlasu interaktywnego
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
  ul: { paddingLeft: '24px', marginBottom: '12px' },
  li: { color: 'var(--text)', lineHeight: '1.75', fontSize: '14px', marginBottom: '4px' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
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
  cta: { display: 'flex', gap: '14px', flexWrap: 'wrap', padding: '40px 0 0' },
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
