import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cities } from '../data/cities'
import HeroSlider from '../components/HeroSlider'

// Panorama images with Ken Burns animation variant (a/b/c/d)
const CITY_PANORAMAS = {
  biecz:                ['/panoramy/biecz.png',                'a'],
  bochnia:              ['/panoramy/bochnia.png',              'b'],
  brzeg:                ['/panoramy/brzeg.png',                'c'],
  bydgoszcz:            ['/panoramy/bydgoszcz.png',            'd'],
  chelmno:              ['/panoramy/chelmno.png',              'a'],
  chojnice:             ['/panoramy/chojnice.png',             'b'],
  elblag:               ['/panoramy/elblag.png',               'c'],
  fordon:               ['/panoramy/fordon.png',               'd'],
  gizycko:              ['/panoramy/gizycko.png',              'a'],
  grudziadz:            ['/panoramy/grudziadz.png',            'b'],
  'jelenia-gora':       ['/panoramy/jelenia-gora.jpg',         'c'],
  ketrzyn:              ['/panoramy/ketrzyn.png',              'd'],
  koronowo:             ['/panoramy/koronowo.png',             'a'],
  kwidzyn:              ['/panoramy/kwidzyn.png',              'b'],
  legnica:              ['/panoramy/legnica.png',              'c'],
  'lidzbark-warminski': ['/panoramy/lidzbark-warminski.png',   'd'],
}

export default function Home() {
  const [mapFullscreen, setMapFullscreen] = useState(false)
  return (
    // Scroll wrapper — keeps footer pinned at bottom of viewport
    <div style={styles.scrollWrapper}>

      {/* ── Hero Slider — Wąwolnica 1820 vs dziś ─────────────── */}
      <HeroSlider>
        <p style={styles.heroKicker}>Atlas Historyczny Miast Polskich</p>
        <h1 style={styles.heroTitle}>
          Serwis danych<br />przestrzenno‑diachronicznych
        </h1>
        <p style={styles.heroDesc}>
          Georeferencjonowane mapy historyczne miast polskich osadzone na osi czasu —
          nakładane na mapę współczesną, mierzalne i porównywalne.
        </p>
        <div style={styles.heroCta}>
          <Link to="/atlas/biecz" style={styles.btnPrimary}>
            Otwórz Atlas interaktywny
          </Link>
          <Link to="/o-projekcie-polskim" style={styles.btnSecondary}>
            O projekcie
          </Link>
        </div>
      </HeroSlider>

      <ProjectIntro />

      <StatsSection />

      {/* ── Centred content ───────────────────────────────────── */}
      <div style={styles.page}>

        {/* European Atlas map */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Europejski Atlas Historyczny Miast</h2>
          <p style={styles.sectionDesc}>
            Inicjatywa AHMP jest częścią szerszego projektu europejskiego koordynowanego przez
            Instytut Historyczny Westfalskiego Uniwersytetu Wilhelma w Münster (ISIG).
            Mapa prezentuje zasięg atlasów historycznych miast w całej Europie.
          </p>
          <div style={{ position: 'relative' }}>
            <div style={styles.iframeWrap}>
              <iframe
                src="https://www.uni-muenster.de/Staedtegeschichte/Interaktiv/Europaeische_Verbreitungskarte/index_en.html#4/52.0/10.0"
                title="Mapa europejskich atlasów historycznych miast"
                style={styles.iframe}
                allowFullScreen
              />
            </div>
            <div style={styles.iframeButtons}>
              <a
                href="https://www.uni-muenster.de/Staedtegeschichte/en/portal/staedteatlanten/index.html"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.iframeBtn}
              >
                Strona projektu europejskiego ↗
              </a>
              <a
                href="https://www.uni-muenster.de/imperia/md/content/staedtegeschichte/portal/europaeischestaedteatlanten/european_towns_atlases_updated_master.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.iframeBtn}
              >
                Pełna lista miast (PDF)
              </a>
              <button
                onClick={() => setMapFullscreen(true)}
                style={styles.iframeBtn}
              >
                Otwórz w pełnym widoku ↗
              </button>
            </div>
          </div>
          <p style={styles.iframeCaption}>
            Źródło:{' '}
            <a
              href="https://www.uni-muenster.de/Staedtegeschichte/en/portal/staedteatlanten/karte.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--gold)', textDecoration: 'none' }}
            >
              ISIG / Westfälische Wilhelms-Universität Münster
            </a>
          </p>
        </section>

        {/* Cities grid with thumbnails */}
        <section style={{ ...styles.section, background: 'var(--cream-dark)', padding: '48px 0' }}>
          <div style={{ padding: '0 32px' }}>
            <h2 style={styles.sectionTitle}>Dostępne miasta</h2>
            <p style={styles.sectionDesc}>
              Prototyp obejmuje reprezentatywną próbkę miast z pełną serią
              zgeoreferencjonowanych plansz atlasowych.
            </p>
            <div style={styles.cityGrid}>
              {cities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          </div>
        </section>

      </div>

      {mapFullscreen && (
        <div style={styles.fsOverlay} onClick={() => setMapFullscreen(false)}>
          <div style={styles.fsContent} onClick={e => e.stopPropagation()}>
            <button style={styles.fsClose} onClick={() => setMapFullscreen(false)}>✕</button>
            <iframe
              src="https://www.uni-muenster.de/Staedtegeschichte/Interaktiv/Europaeische_Verbreitungskarte/index_en.html#4/52.0/10.0"
              title="Mapa europejskich atlasów historycznych miast"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── City card with optional thumbnail ─────────────────────────────────────

function CityCard({ city }) {
  const pan = CITY_PANORAMAS[city.id]

  return (
    <Link to={`/atlas/${city.id}`} className="city-card" style={styles.cityCard}>
      {/* Ken Burns animated thumbnail */}
      <div style={styles.cityThumb}>
        {pan ? (
          <div
            className={`kb kb-${pan[1]}`}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${pan[0]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'sepia(8%) contrast(1.02) brightness(1.08)',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(145deg, #253659 0%, #1a2942 100%)',
          }} />
        )}
        {/* Gradient veil — bottom fade for text contrast */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 50%, rgba(10,18,36,0.32) 100%)',
          pointerEvents: 'none',
        }} />
        {/* City name over image */}
        <span style={{
          position: 'absolute', bottom: '10px', left: '12px',
          fontFamily: 'var(--font-serif)',
          fontSize: '11px', letterSpacing: '1.4px',
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}>
          {city.name}
        </span>
      </div>

      {/* Card body */}
      <div style={styles.cityCardBody}>
        <div style={styles.cityCardHeader}>
          <span style={styles.cityName}>{city.name}</span>
          <span style={styles.cityVolume}>{city.volume}</span>
        </div>
        <p style={styles.cityDesc}>{city.description}</p>
        <div style={styles.cityMeta}>
          <span style={styles.cityMapCount}>
            {city.maps.length} dokumentów zgeoreferencjonowanych
          </span>
          <span style={styles.cityArrow}>→</span>
        </div>
      </div>
    </Link>
  )
}

// ── Project intro ─────────────────────────────────────────────────────────

function ProjectIntro() {
  return (
    <section style={pi.wrap}>
      <div style={pi.inner}>
        <div style={pi.badge}>Atlas Historyczny Miast Polskich</div>
        <h2 style={pi.heading}>Cyfrowe dziedzictwo kartograficzne polskich miast</h2>
        <div style={pi.cols}>
          <p style={pi.lead}>
            AHMP to naukowy projekt badawczy zapoczątkowany w&nbsp;1993&nbsp;roku
            przez prof.&nbsp;Antoniego Czacharowskiego w&nbsp;Instytucie Historycznym
            Uniwersytetu Mikołaja Kopernika w&nbsp;Toruniu. Jest polską częścią europejskiej
            inicjatywy Komisji Historii Miast — największego międzynarodowego przedsięwzięcia
            z&nbsp;zakresu historii urbanistycznej.
          </p>
          <p style={pi.body}>
            Każdy zeszyt atlasu zawiera zgeoreferencjonowane plansze kartograficzne, widoki,
            weduty i&nbsp;plany katastralne ukazujące miasto od średniowiecza po czasy
            współczesne. Niniejszy serwis digitalizuje te materiały i&nbsp;osadza je
            w&nbsp;interaktywnym środowisku GIS — umożliwiając nakładanie historycznych planów
            na mapę współczesną, pomiary i&nbsp;porównania chronologiczne.
          </p>
        </div>
        <Link to="/o-projekcie-polskim" style={pi.link}>
          Dowiedz się więcej o projekcie →
        </Link>
      </div>
    </section>
  )
}

const pi = {
  wrap: {
    background: 'var(--cream)',
    borderBottom: '1px solid var(--border)',
    padding: '56px 0',
  },
  inner: {
    maxWidth: '80vw',
    margin: '0 auto',
    padding: '0 32px',
  },
  badge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '1.8px',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    border: '1px solid var(--gold)',
    borderRadius: '2px',
    padding: '3px 10px',
    marginBottom: '18px',
  },
  heading: {
    fontFamily: 'var(--font-serif)',
    fontSize: '30px',
    color: 'var(--navy)',
    fontWeight: 'normal',
    lineHeight: '1.3',
    marginBottom: '28px',
    maxWidth: '700px',
  },
  cols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    marginBottom: '28px',
  },
  lead: {
    fontSize: '15px',
    color: 'var(--text)',
    lineHeight: '1.8',
  },
  body: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    lineHeight: '1.8',
  },
  link: {
    color: 'var(--navy)',
    fontWeight: '600',
    fontSize: '13px',
    textDecoration: 'none',
    borderBottom: '1px solid var(--gold)',
    paddingBottom: '2px',
  },
}

// ── Stats + Timeline ──────────────────────────────────────────────────────

const STATS = [
  { n: '530+', label: 'Atlasów w Europie' },
  { n: '18',   label: 'Krajów uczestniczących' },
  { n: '30+',  label: 'Polskich miast' },
  { n: '1993', label: 'Rok rozpoczęcia w Polsce' },
]

const EVENTS = [
  { year: '1965', text: 'Międzynarodowa Komisja Historii Miast uznaje wydawanie atlasów miast europejskich za główny cel swojej działalności naukowej.' },
  { year: '1968', text: 'Konferencja w Oxfordzie – wypracowanie podstawowych zasad edycji atlasów historycznych miast.' },
  { year: '1993', text: 'Rozpoczęcie polskiego projektu przez prof. Antoniego Czacharowskiego w UMK Toruń.' },
  { year: 'DZIŚ', text: 'Ponad 30 polskich miast w projekcie, współpraca z zespołami w Toruniu, Wrocławiu i Krakowie.', hi: true },
]

function StatsSection() {
  return (
    <section style={ss.wrap}>
      <div style={ss.inner}>
        {/* Stat cards */}
        <div style={ss.statsRow}>
          {STATS.map(({ n, label }) => (
            <div key={label} style={ss.statCard}>
              <span style={ss.statNum}>{n}</span>
              <span style={ss.statLbl}>{label}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div>
          {/* Year labels */}
          <div style={ss.tlGrid}>
            {EVENTS.map(({ year, hi }) => (
              <div key={year} style={ss.tlYearCell}>
                <span style={hi ? { ...ss.tlYear, ...ss.tlYearHi } : ss.tlYear}>{year}</span>
              </div>
            ))}
          </div>

          {/* Line + dots */}
          <div style={ss.tlLineRow}>
            <div style={ss.tlLine} />
            {EVENTS.map(({ year }) => (
              <div key={year} style={ss.tlDotCell}>
                <div style={ss.tlDot} />
              </div>
            ))}
          </div>

          {/* Cards */}
          <div style={ss.tlGrid}>
            {EVENTS.map(({ year, text }) => (
              <div key={year} style={ss.tlCardCell}>
                <div style={ss.tlCard}>
                  <p style={ss.tlCardText}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const ss = {
  wrap: {
    background: 'linear-gradient(160deg, #1e3054 0%, #1a2942 65%, #131e38 100%)',
    padding: '52px 0',
    borderTop: '3px solid var(--gold)',
    borderBottom: '1px solid rgba(184,150,62,0.2)',
  },
  inner: {
    maxWidth: '80vw',
    margin: '0 auto',
    padding: '0 32px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '56px',
  },
  statCard: {
    border: '1px solid rgba(184,150,62,0.3)',
    borderRadius: '8px',
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.04)',
  },
  statNum: {
    fontFamily: 'var(--font-serif)',
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'var(--gold)',
    lineHeight: 1,
  },
  statLbl: {
    fontSize: '13px',
    color: 'rgba(245,240,232,0.65)',
    textAlign: 'center',
    letterSpacing: '0.2px',
  },
  tlGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },
  tlYearCell: {
    display: 'flex',
    justifyContent: 'center',
    paddingBottom: '10px',
  },
  tlYear: {
    fontFamily: 'var(--font-serif)',
    fontSize: '26px',
    fontWeight: 'bold',
    color: 'rgba(245,240,232,0.85)',
  },
  tlYearHi: {
    color: 'var(--gold-light)',
  },
  tlLineRow: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    margin: '0 0 4px',
  },
  tlLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '2px',
    background: 'var(--gold)',
    transform: 'translateY(-50%)',
    zIndex: 0,
  },
  tlDotCell: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px 0',
    position: 'relative',
    zIndex: 1,
  },
  tlDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: 'var(--gold)',
    boxShadow: '0 0 0 3px rgba(184,150,62,0.25)',
    flexShrink: 0,
  },
  tlCardCell: {
    paddingTop: '10px',
  },
  tlCard: {
    border: '1px solid rgba(184,150,62,0.2)',
    borderRadius: '8px',
    padding: '16px',
    background: 'rgba(255,255,255,0.05)',
    height: '100%',
    boxSizing: 'border-box',
  },
  tlCardText: {
    fontSize: '13px',
    color: 'rgba(245,240,232,0.7)',
    lineHeight: '1.65',
    margin: 0,
  },
}

// ── Small components ───────────────────────────────────────────────────────



// ── Styles ─────────────────────────────────────────────────────────────────

const styles = {
  // Scroll wrapper keeps footer pinned: content scrolls here, not in main-content
  scrollWrapper: {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
  },

  // Panorama — full width static hero
  panoramaHero: {
    position: 'relative',
    width: '100vw',
    height: '600px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  panoramaBg: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    filter: 'sepia(20%) contrast(1.06) brightness(0.90)',
    transition: 'opacity 0.6s ease',
  },
  panoramaOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(to bottom, rgba(10,20,40,0.08) 0%, rgba(10,20,40,0.30) 40%, rgba(10,20,40,0.88) 100%)',
    pointerEvents: 'none',
  },
  panoramaTopBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '3px',
    background: 'var(--gold)',
    zIndex: 3,
  },
  panoramaContent: {
    position: 'relative',
    zIndex: 2,
    padding: '0 48px 20px',
    maxWidth: '900px',
  },
  panoramaBar: {
    position: 'relative',
    zIndex: 2,
    background: 'rgba(0,0,0,0.45)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '9px 48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  panoramaCaption: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.50)',
    fontStyle: 'italic',
  },

  // Hero text
  heroKicker: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: 'var(--gold-light)',
    marginBottom: '12px',
  },
  heroTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '46px',
    color: 'var(--white)',
    lineHeight: '1.18',
    marginBottom: '16px',
    fontWeight: 'normal',
    textShadow: '0 2px 16px rgba(0,0,0,0.5)',
  },
  heroDesc: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.78)',
    lineHeight: '1.7',
    marginBottom: '26px',
    maxWidth: '560px',
  },
  heroCta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    background: 'var(--gold)',
    color: 'var(--navy)',
    padding: '11px 26px',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '13px',
    letterSpacing: '0.3px',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.10)',
    color: 'var(--white)',
    padding: '11px 22px',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    fontSize: '13px',
    border: '1px solid rgba(255,255,255,0.28)',
    backdropFilter: 'blur(4px)',
  },

  // Centred content
  page: {
    maxWidth: '80vw',
    margin: '0 auto',
    paddingBottom: '48px',
  },
  section: { padding: '48px 32px' },
  sectionTitle: { fontSize: '26px', marginBottom: '12px', color: 'var(--navy)' },
  sectionDesc: {
    color: 'var(--text-muted)',
    marginBottom: '28px',
    maxWidth: '620px',
    lineHeight: '1.7',
  },

  // City cards
  cityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  cityCard: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'none',
  },
  cityThumb: {
    position: 'relative',
    height: '150px',
    overflow: 'hidden',
    flexShrink: 0,
    borderRadius: 'var(--radius) var(--radius) 0 0',
    background: '#1a2942',
    perspective: '1000px',          /* GPU compositing dla płynności */
    transform: 'translateZ(0)',
  },
  cityCardBody: {
    padding: '16px 18px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  cityCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  cityName: {
    fontSize: '18px',
    fontFamily: 'var(--font-serif)',
    color: 'var(--navy)',
  },
  cityVolume: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    background: 'var(--cream-dark)',
    padding: '2px 7px',
    borderRadius: '10px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    marginTop: '3px',
  },
  cityDesc: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
    flex: 1,
  },
  cityMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  },
  cityMapCount: {
    fontSize: '11px',
    color: 'var(--gold)',
    fontWeight: '600',
  },
  cityArrow: { color: 'var(--navy)', fontSize: '16px' },


  // European iframe
  iframeWrap: {
    width: '100%', height: '500px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  },
  iframe: { width: '100%', height: '100%', border: 'none', display: 'block' },
  iframeCaption: { marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' },
  iframeButtons: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    display: 'flex',
    gap: '8px',
    zIndex: 10,
  },
  iframeBtn: {
    background: 'var(--navy)',
    color: '#fff',
    border: '1px solid rgba(184,150,62,0.6)',
    borderRadius: 'var(--radius)',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'inherit',
    letterSpacing: '0.2px',
    backdropFilter: 'blur(4px)',
  },
  // Fullscreen modal
  fsOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.88)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsContent: {
    position: 'relative',
    width: '95vw',
    height: '92vh',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid rgba(184,150,62,0.4)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
  },
  fsClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    zIndex: 10,
    background: 'rgba(26,41,66,0.92)',
    border: '1px solid rgba(184,150,62,0.5)',
    color: '#fff',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    lineHeight: 1,
  },
}
