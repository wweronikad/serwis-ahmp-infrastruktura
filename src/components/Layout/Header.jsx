import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import SearchModal from '../Search/SearchModal'

const NAV = [
  { to: '/atlas', label: 'Atlas interaktywny' },
  { to: '/karty', label: 'Karty historyczne' },
  { to: '/o-projekcie-polskim', label: 'Projekt polski' },
  { to: '/o-projekcie-europejskim', label: 'Projekt europejski' },
]

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
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
          <button
            onClick={() => setSearchOpen(true)}
            style={styles.searchBtn}
            title="Szukaj (Ctrl+K)"
          >
            <span style={{ fontSize: 13 }}>🔍</span>
            <span style={styles.searchBtnText}>Szukaj</span>
            <kbd style={styles.searchKbd}>Ctrl K</kbd>
          </button>
        </nav>
      </header>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
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
  searchBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '6px 12px',
    marginLeft: '8px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 'var(--radius)',
    color: 'rgba(255,255,255,0.75)',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    transition: 'background 0.15s, border-color 0.15s',
  },
  searchBtnText: {
    fontSize: '13px',
    fontWeight: '500',
  },
  searchKbd: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.45)',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '3px',
    padding: '1px 5px',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '0.3px',
  },
}
