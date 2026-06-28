import { useEffect, useRef, useState } from 'react'
import { asset } from '../utils/asset'

const ANIM_PERIOD = 12000 // ms for full sweep left → right

export default function HeroSlider({ children }) {
  const [pos, setPos] = useState(0)
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const dragging = useRef(false)
  const pausedPos = useRef(null)

  // Auto-animation: 0% → 100% (OSM fully visible → historical map fully revealed), then reset
  useEffect(() => {
    const animate = (t) => {
      if (!startRef.current) startRef.current = t
      if (!dragging.current) {
        const elapsed = (t - startRef.current) % ANIM_PERIOD
        setPos((elapsed / ANIM_PERIOD) * 100)
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Drag
  const onDragStart = (e) => { dragging.current = true; e.preventDefault() }
  const onTouchStart = () => { dragging.current = true }

  useEffect(() => {
    const move = (clientX) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const p = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
      pausedPos.current = p
      setPos(p)
    }
    const end = () => {
      if (dragging.current && pausedPos.current !== null) {
        startRef.current = performance.now() - (pausedPos.current / 100) * ANIM_PERIOD
        pausedPos.current = null
      }
      dragging.current = false
    }
    window.addEventListener('mousemove', (e) => move(e.clientX))
    window.addEventListener('mouseup', end)
    window.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true })
    window.addEventListener('touchend', end)
    return () => {
      window.removeEventListener('mousemove', (e) => move(e.clientX))
      window.removeEventListener('mouseup', end)
    }
  }, [])

  // Feathered mask: 5% soft edge on each side of the divider, in wrapper's own coords
  const fadeHalf = 5
  const maskL = Math.max(0, pos - fadeHalf)
  const maskR = Math.min(100, pos + fadeHalf)
  const maskStyle = {
    WebkitMaskImage: `linear-gradient(to right, black ${maskL}%, white ${pos}%, transparent ${maskR}%)`,
    maskImage: `linear-gradient(to right, black ${maskL}%, white ${pos}%, transparent ${maskR}%)`,
  }

  return (
    <section ref={containerRef} style={s.wrap}>

      {/* ── Modern: OSM (base, always full) ─────────────────── */}
      <img
        src={asset('/wawolnica/nowoczesna.jpg')}
        alt=""
        style={s.imgFull}
        draggable={false}
      />

      {/* ── Historical: same layout as modern, mask fades the edge ─ */}
      <div style={{ ...s.histWrapper, ...maskStyle }}>
        <img
          src={asset('/wawolnica/mapa.webp')}
          alt=""
          style={s.imgFull}
          draggable={false}
        />
      </div>

      {/* ── Divider line (thin, no handle) ───────────────────── */}
      <div
        style={s.divider(pos)}
        onMouseDown={onDragStart}
        onTouchStart={onTouchStart}
      />

      {/* ── Dark gradient for text legibility ─────────────────── */}
      <div style={s.textGradient} />

      {/* ── Labels ───────────────────────────────────────────── */}
      {pos > 12 && (
        <div style={{ ...s.label, left: '14px' }}>
          Plan Wąwolnicy 1820 · J. Kierłowicz
        </div>
      )}
      {pos < 88 && (
        <div style={{ ...s.label, right: '14px' }}>
          Dziś · OSM
        </div>
      )}

      {/* ── Hero text ────────────────────────────────────────── */}
      <div style={s.content}>
        {children}
      </div>

    </section>
  )
}

const s = {
  wrap: {
    position: 'relative',
    width: '100vw',
    height: '68vh',
    minHeight: '420px',
    overflow: 'hidden',
    userSelect: 'none',
    borderBottom: '2px solid var(--gold)',
  },
  imgFull: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 40%',
    pointerEvents: 'none',
  },
  histWrapper: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
  },
  imgInset: {
    position: 'absolute',
    inset: '-10%',
    width: '120%',
    height: '120%',
    objectFit: 'cover',
    objectPosition: 'center 40%',
    pointerEvents: 'none',
  },
  divider: (pos) => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: `${pos}%`,
    transform: 'translateX(-50%)',
    width: '1.5px',
    background: 'rgba(255,255,255,0.85)',
    boxShadow: '0 0 6px rgba(0,0,0,0.4)',
    cursor: 'col-resize',
    zIndex: 10,
  }),
  textGradient: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to right, rgba(10,18,36,0.70) 0%, rgba(10,18,36,0.38) 36%, transparent 58%)',
    pointerEvents: 'none',
    zIndex: 5,
  },
  label: {
    position: 'absolute',
    top: '16px',
    background: 'rgba(26,41,66,0.78)',
    color: 'var(--gold-light)',
    padding: '4px 12px',
    borderRadius: '2px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.3px',
    pointerEvents: 'none',
    zIndex: 8,
    backdropFilter: 'blur(3px)',
  },
  content: {
    position: 'absolute',
    bottom: '48px',
    left: '40px',
    zIndex: 9,
    maxWidth: '500px',
    pointerEvents: 'auto',
  },
}
