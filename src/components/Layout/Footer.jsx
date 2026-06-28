export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <span>
          Atlas Historyczny Miast Polskich —{' '}
          <a
            href="https://atlasmiast.umk.pl/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            atlasmiast.umk.pl
          </a>
        </span>
        <span style={styles.sep}>·</span>
        <span>
          Georeferencja:{' '}
          <a
            href="https://allmaps.org"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            Allmaps
          </a>
        </span>
        <span style={styles.sep}>·</span>
        <span>
          Podkład:{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            © OpenStreetMap
          </a>
        </span>
        <span style={styles.sep}>·</span>
        <span>
          Mapa europejska:{' '}
          <a
            href="https://www.uni-muenster.de/Staedtegeschichte/en/portal/staedteatlanten/karte.html"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            ISIG / Uni Münster
          </a>
        </span>
        <span style={styles.sep}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Prototyp badawczy</span>
      </div>
    </footer>
  )
}

const styles = {
  footer: {
    background: 'var(--navy)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    flexShrink: 0,
    borderTop: '1px solid rgba(255,255,255,0.1)',
    height: 'var(--footer-h)',
    display: 'flex',
    alignItems: 'center',
  },
  inner: {
    padding: '0 28px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
    width: '100%',
  },
  link: {
    color: 'var(--gold-light)',
    textDecoration: 'none',
  },
  sep: {
    color: 'rgba(255,255,255,0.25)',
  },
}
