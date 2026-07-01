import { Link, NavLink } from 'react-router-dom'

const NAV = [
  { to: '/atlas', label: 'Atlas interaktywny' },
  { to: '/karty', label: 'Karty historyczne' },
  { to: '/o-projekcie-polskim', label: 'Projekt polski' },
  { to: '/o-projekcie-europejskim', label: 'Projekt europejski' },
]

export default function Header() {
  return (
    <header style={styles.header}>
      <Link to="/" style={styles.brand}>
        <span style={styles.brandAbbr}>AHMP</span>
        <span style={styles.brandDivider}></span>
        <span style={styles.brandLines}>
          <span style={styles.brandFull}>Atlas Historyczny Miast Polskich</span>
          <span style={styles.brandSub}>Serwis danych przestrzenno-diachronicznych</span>
        </span>
      </Link>
      <nav style={styles.nav}>
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

const styles = {
  header: {
    height: 'var(--header-h)',
    background: 'var(--navy)',
    color: 'var(--white)',
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    padding: '0 28px',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
    zIndex: 100,
    position: 'relative',
    borderBottom: '2px solid var(--gold)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    textDecoration: 'none',
    color: 'inherit',
    marginRight: '8px',
  },
  brandAbbr: {
    fontSize: '26px',
    fontFamily: 'var(--font-serif)',
    fontWeight: 'bold',
    color: 'var(--gold-light)',
    letterSpacing: '2px',
    lineHeight: 1,
  },
  brandDivider: {
    display: 'block',
    width: '1px',
    height: '36px',
    background: 'rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
  brandLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  brandFull: {
    fontSize: '14px',
    color: 'var(--white)',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    letterSpacing: '0.2px',
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '0.1px',
    lineHeight: 1.2,
  },
  nav: {
    display: 'flex',
    gap: '2px',
    marginLeft: 'auto',
  },
  navLink: {
    color: 'rgba(255,255,255,0.82)',
    textDecoration: 'none',
    fontSize: '13px',
    padding: '7px 15px',
    borderRadius: 'var(--radius)',
    transition: 'background 0.15s, color 0.15s',
    letterSpacing: '0.1px',
    fontWeight: '500',
  },
  navLinkActive: {
    background: 'rgba(255,255,255,0.12)',
    color: 'var(--gold-light)',
  },
}
