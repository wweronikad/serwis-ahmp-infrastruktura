import { Link } from 'react-router-dom'

const TEAMS = [
  {
    city: 'Toruń',
    region: 'Prusy Królewskie, Warmia, Kujawy i Mazury',
    note: 'Zespół UMK, inicjator i koordynator całego przedsięwzięcia.',
  },
  {
    city: 'Wrocław',
    region: 'Śląsk',
    note: 'Zespół Instytutu Archeologii i Etnologii PAN, pod kierunkiem prof. Marty Młynarskiej‑Kaletynowej.',
  },
  {
    city: 'Kraków',
    region: 'Małopolska',
    note: 'Zespół pod kierunkiem prof. Zdzisława Nogi.',
  },
  {
    city: 'Lublin',
    region: 'Lubelszczyzna',
    note: 'Zespół Uniwersytetu Marii Curie‑Skłodowskiej, który dołączył do przedsięwzięcia w 2022 r.',
  },
]

const VOLUMES = [
  ['Tom I', 'Prusy Królewskie i Warmia'],
  ['Tom II', 'Kujawy'],
  ['Tom III', 'Mazury i Prusy Książęce'],
  ['Tom IV', 'Śląsk'],
  ['Tom V', 'Małopolska'],
  ['Tom VI', 'Wielkopolska (dotąd Kalisz)'],
]

const CANON = [
  ['Mapa pomiarowa 1:2500', 'Przerys planu katastralnego (pruskiego lub austriackiego) albo planu pomiarowego z okresu Królestwa Kongresowego, z epoki przedprzemysłowej; najważniejsza mapa każdego zeszytu.'],
  ['Współczesny plan miasta', 'Element stały każdego zeszytu.'],
  ['Historyczna mapa regionu', 'Skala od 1:25 000 do 1:100 000.'],
  ['Mapa rozwoju przestrzennego', 'Skala 1:10 000, z fazami chronologicznymi.'],
  ['Mapy tematyczne i reprodukcje', 'Mapy tematyczne oraz reprodukcje ważnych źródeł kartograficznych i widoków (wedut).'],
  ['Część tekstowa', 'Dzieje miasta ze szczególnym uwzględnieniem urbanistyki, opis reprodukcji i bibliografia.'],
]

export default function AboutPolish() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <header style={styles.hero}>
        <div style={styles.inner}>
          <p style={styles.kicker}>Projekt polski</p>
          <h1 style={styles.title}>Atlas Historyczny Miast Polskich</h1>
          <p style={styles.subtitle}>
            Wieloletnie przedsięwzięcie dokumentujące genezę i rozwój
            przestrzenny polskich miast — w formie zeszytów atlasowych
            łączących wieloskalową kartografię historyczną z narracją naukową.
          </p>
        </div>
      </header>

      <div style={{ ...styles.inner, paddingBottom: 64 }}>
        <section style={styles.section}>
          <h2 style={styles.h2}>Historia i zespoły</h2>
          <p style={styles.p}>
            Prace przygotowawcze nad polską edycją atlasu rozpoczęto w{' '}
            <strong>1990 r.</strong> w Instytucie Historii i Archiwistyki
            Uniwersytetu Mikołaja Kopernika w Toruniu, pod kierunkiem{' '}
            <strong>prof. Antoniego Czacharowskiego</strong>; początkowo dotyczyły
            one Atlasu historycznego Elbląga, a pierwsze zeszyty ukazały się od{' '}
            <strong>1993 r.</strong> Zeszyty wydaje Towarzystwo Naukowe w Toruniu.
            Z czasem dołączyły kolejne zespoły regionalne:
          </p>
          <div className="ap-teams">
            {TEAMS.map((t) => (
              <div key={t.city} style={styles.team}>
                <div style={styles.teamCity}>{t.city}</div>
                <div style={styles.teamRegion}>{t.region}</div>
                <p style={styles.teamNote}>{t.note}</p>
              </div>
            ))}
          </div>
          <p style={styles.p}>
            Redaktorem serii jest <strong>prof. Roman Czaja</strong>. Do
            chwili obecnej ukazały się atlasy około{' '}
            <strong>50 miast</strong> (według strony projektu); prace prowadzone
            są interdyscyplinarnie przez historyków, historyków sztuki i
            architektury, archeologów oraz kartografów.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Tomy regionalne i zasięg serii</h2>
          <div className="ap-split">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tom</th>
                  <th style={styles.th}>Region</th>
                </tr>
              </thead>
              <tbody>
                {VOLUMES.map(([tom, region]) => (
                  <tr key={tom}>
                    <td style={{ ...styles.td, whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--navy)' }}>{tom}</td>
                    <td style={styles.td}>{region}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <figure style={styles.fig}>
              <img
                src="https://atlasmiast.umk.pl/wp-content/uploads/2025/10/mapa.png"
                alt="Mapa Polski z zaznaczonymi miastami objętymi seriami atlasowymi AHMP i Deutscher Städte-Atlas"
                style={styles.img}
              />
              <figcaption style={styles.caption}>
                Rozmieszczenie miast objętych seriami atlasowymi — stan aktualny.{' '}
                <a href="https://atlasmiast.umk.pl/" target="_blank" rel="noopener noreferrer" style={styles.src}>
                  Źródło: atlasmiast.umk.pl
                </a>
              </figcaption>
            </figure>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Kanon edytorski — co zawiera zeszyt</h2>
          <p style={styles.p}>Każdy zeszyt AHMP opiera się na tym samym modelu:</p>
          <div className="ap-canon">
            {CANON.map(([title, text], i) => (
              <div key={title} style={styles.canon}>
                <div style={styles.canonNo}>{i + 1}</div>
                <div style={styles.canonTitle}>{title}</div>
                <p style={styles.canonText}>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>GIS i nowe atlasy</h2>
          <p style={styles.p}>
            Zespół toruński rozwija w pracach nad Atlasem techniki
            geoinformacyjne: opisał koncepcję referencyjnej bazy danych
            przestrzennych obiektów topograficzno‑historycznych, opartej na
            planie katastralnym Torunia (Czaja, Golba, Pilarska 2023). Ten kierunek
            uzasadnia potrzebę serwisu cyfrowego — <em>niniejszy serwis jest
            cyfrowym uzupełnieniem wydań drukowanych, a nie oficjalną edycją
            Atlasu</em>.
          </p>
          <p style={styles.p}>
            W opracowaniu są zeszyty dla trzech miast Lubelszczyzny —{' '}
            <strong>Kazimierza Dolnego, Puław i Wąwolnicy</strong> — przygotowywane
            przez zespół UMCS w Lublinie. Materiały robocze prezentujemy w zakładce{' '}
            <Link to="/atlasy-projektowane" style={{ color: 'var(--navy)', fontWeight: 600 }}>Atlasy projektowane</Link>.
          </p>
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
  )
}

const styles = {
  hero: {
    background: 'var(--cream)',
    borderBottom: '1px solid var(--border-light)',
    padding: '48px 0 36px',
  },
  inner: { maxWidth: 1080, margin: '0 auto', padding: '0 32px' },
  kicker: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--gold)',
    marginBottom: '12px',
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: '34px',
    color: 'var(--navy)',
    lineHeight: '1.2',
    marginBottom: '14px',
    fontWeight: 'normal',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    lineHeight: '1.7',
    maxWidth: '640px',
  },
  section: { padding: '40px 0 0' },
  h2: {
    fontFamily: 'var(--font-serif)',
    fontSize: '22px',
    fontWeight: 'normal',
    color: 'var(--navy)',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--border-light)',
  },
  p: {
    color: 'var(--text)',
    lineHeight: '1.75',
    marginBottom: '12px',
    fontSize: '15px',
    maxWidth: '760px',
  },
  team: {
    background: 'var(--white)',
    border: '1px solid var(--border-light)',
    borderTop: '3px solid var(--navy)',
    borderRadius: 'var(--radius)',
    padding: '14px 16px 6px',
  },
  teamCity: { fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy)' },
  teamRegion: { fontSize: '12px', color: 'var(--gold)', fontWeight: 600, margin: '2px 0 8px' },
  teamNote: { fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    background: 'var(--white)',
    border: '1px solid var(--border-light)',
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
    padding: '10px 14px',
    borderBottom: '1px solid var(--border-light)',
    color: 'var(--text)',
  },
  fig: { margin: 0 },
  img: {
    width: '100%',
    display: 'block',
    borderRadius: '4px',
    border: '1px solid var(--border-light)',
    background: 'var(--white)',
  },
  caption: { marginTop: 10, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 },
  src: { color: 'var(--navy)', opacity: 0.75, textDecoration: 'none' },
  canon: {
    background: 'var(--white)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius)',
    padding: '14px 16px 6px',
  },
  canonNo: { fontFamily: 'var(--font-serif)', fontSize: '13px', color: 'var(--gold)', marginBottom: 2 },
  canonTitle: { fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--navy)', marginBottom: 6 },
  canonText: { fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' },
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
