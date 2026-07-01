import { useEffect, useRef, useState, useCallback } from 'react'

export default function CityGallery({ photos, basePath = '', initialIdx = 0, onClose }) {
  const [idx, setIdx]             = useState(initialIdx)
  const [activePin, setActivePin] = useState(null)
  const [zoom, setZoom]           = useState(1)
  const [pan, setPan]             = useState({ x: 0, y: 0 })
  const thumbRef   = useRef(null)
  const imgAreaRef = useRef(null)
  const photo      = photos[idx]

  useEffect(() => { setIdx(initialIdx) }, [initialIdx])

  // Reset zoom + active pin when changing photo
  useEffect(() => {
    setActivePin(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [idx])

  // Keyboard navigation
  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(photos.length - 1, i + 1))
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose, photos.length])

  // Scroll active thumbnail into view
  useEffect(() => {
    const el = thumbRef.current?.querySelector(`[data-idx="${idx}"]`)
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [idx])

  const prev      = useCallback(() => setIdx(i => Math.max(0, i - 1)), [])
  const next      = useCallback(() => setIdx(i => Math.min(photos.length - 1, i + 1)), [photos.length])
  const resetZoom = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

  // ── Scroll-wheel zoom centred on cursor ──────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = imgAreaRef.current.getBoundingClientRect()
    const cx  = e.clientX - rect.left
    const cy  = e.clientY - rect.top
    const cx0 = rect.width  / 2
    const cy0 = rect.height / 2
    const factor = e.deltaY < 0 ? 1.13 : 1 / 1.13

    setZoom(z => {
      const newZ = Math.min(6, Math.max(1, z * factor))
      if (newZ === 1) { setPan({ x: 0, y: 0 }); return 1 }
      const r = newZ / z
      setPan(p => ({
        x: (cx - cx0) * (1 - r) + p.x * r,
        y: (cy - cy0) * (1 - r) + p.y * r,
      }))
      return newZ
    })
  }, [])

  // Attach wheel listener as non-passive so preventDefault works
  useEffect(() => {
    const el = imgAreaRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ── Drag to pan when zoomed ──────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (zoom <= 1) return
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    // Capture pan at mousedown time
    const startPx = pan.x
    const startPy = pan.y
    const onMove = (ev) => {
      setPan({
        x: startPx + (ev.clientX - startX),
        y: startPy + (ev.clientY - startY),
      })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [zoom, pan])

  // ── Render ───────────────────────────────────────────────────────────────

  const frameTransform = zoom > 1
    ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
    : undefined

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={s.header}>
          <div style={s.headerInfo}>
            <span style={s.headerTitle}>{photo.title}</span>
            <span style={s.headerDate}>{photo.date}</span>
            <span style={s.headerCount}>{idx + 1} / {photos.length}</span>
          </div>
          <button style={s.closeBtn} onClick={onClose} title="Zamknij (Esc)">✕</button>
        </div>

        {/* ── Image area ──────────────────────────────────────────── */}
        <div
          ref={imgAreaRef}
          style={{ ...s.imgArea, cursor: zoom > 1 ? 'grab' : 'default' }}
          onMouseDown={handleMouseDown}
          onDoubleClick={zoom > 1 ? resetZoom : undefined}
        >
          {/* Nav arrows — hidden when zoomed in to avoid accidental clicks */}
          {idx > 0 && zoom === 1 && (
            <button style={{ ...s.arrow, left: 12 }} onClick={prev}>‹</button>
          )}

          {/* Image + pins */}
          <div style={{
            ...s.imgFrame,
            transform: frameTransform,
            transformOrigin: 'center center',
          }}>
            <img
              src={basePath + photo.file}
              alt={photo.title}
              style={s.img}
              draggable={false}
            />
            {photo.imgPins?.map((pin, i) => (
              <div
                key={i}
                style={{ ...s.pin, left: `${pin.x}%`, top: `${pin.y}%` }}
                onClick={(e) => { e.stopPropagation(); setActivePin(activePin === i ? null : i) }}
              >
                <div style={{
                  ...s.pinDot,
                  background:  activePin === i ? '#b8963e' : 'rgba(184,150,62,0.25)',
                  border:      activePin === i ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(184,150,62,0.8)',
                  transform:   activePin === i ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.15s, background 0.15s, border-color 0.15s',
                  animation:   activePin === i ? 'none' : 'img-pin-glow 2s ease-in-out infinite',
                }} />
                {activePin === i && (
                  <div style={{ ...s.pinLabel, pointerEvents: 'auto', paddingRight: 22 }}>
                    {pin.label}
                    <button
                      onClick={(e) => { e.stopPropagation(); setActivePin(null) }}
                      style={s.pinClose}
                    >✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {idx < photos.length - 1 && zoom === 1 && (
            <button style={{ ...s.arrow, right: 12 }} onClick={next}>›</button>
          )}

          {/* Zoom indicator */}
          {zoom > 1 && (
            <div style={s.zoomBar}>
              <span style={s.zoomLevel}>{Math.round(zoom * 100)}%</span>
              <span style={s.zoomHint}>przeciągnij · kółko myszy · dwuklik = reset</span>
              <button onClick={resetZoom} style={s.zoomReset}>⟲ Reset</button>
            </div>
          )}
        </div>

        {/* ── Thumbnail strip ──────────────────────────────────────── */}
        <div style={s.strip} ref={thumbRef}>
          {photos.map((p, i) => (
            <button
              key={p.id}
              data-idx={i}
              onClick={() => setIdx(i)}
              style={{ ...s.thumb, ...(i === idx ? s.thumbActive : {}) }}
              title={`${p.title} · ${p.date}`}
            >
              <img src={basePath + p.file} alt="" style={s.thumbImg} draggable={false} />
              <div style={s.thumbDate}>{p.date}</div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(8,14,28,0.88)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    width:  'min(96vw, 1200px)',
    height: 'min(92vh, 860px)',
    display: 'flex',
    flexDirection: 'column',
    background: '#0f1824',
    borderRadius: 6,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
    border: '1px solid rgba(184,150,62,0.25)',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
    background: '#0c1520',
  },
  headerInfo: { display: 'flex', alignItems: 'baseline', gap: 10, flex: 1 },
  headerTitle: { color: '#e8dfc8', fontFamily: 'var(--font-serif, Georgia)', fontSize: 16, fontWeight: 400 },
  headerDate:  { color: '#b8963e', fontSize: 13 },
  headerCount: { color: '#555', fontSize: 12, marginLeft: 'auto' },
  closeBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#aaa',
    width: 30,
    height: 30,
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 10,
  },

  // Image area
  imgArea: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: '#080e1a',
    minHeight: 0,
    userSelect: 'none',
  },
  imgFrame: {
    position: 'relative',
    display: 'inline-block',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  img: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 'calc(min(92vh, 860px) - 160px)',
    objectFit: 'contain',
    pointerEvents: 'none',
  },

  // Pins on image
  pin: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    zIndex: 5,
    cursor: 'pointer',
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    margin: '0 auto',
    boxShadow: '0 0 0 3px rgba(184,150,62,0.25), 0 1px 4px rgba(0,0,0,0.6)',
    position: 'relative',
    zIndex: 2,
  },
  pinLabel: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: 6,
    background: 'rgba(12,21,32,0.92)',
    color: '#e8dfc8',
    border: '1px solid rgba(184,150,62,0.4)',
    padding: '4px 10px',
    borderRadius: 3,
    fontSize: 11,
    fontFamily: 'var(--font-sans, system-ui)',
    whiteSpace: 'nowrap',
    zIndex: 6,
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  pinClose: {
    position: 'absolute',
    top: '50%',
    right: 4,
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontSize: 10,
    lineHeight: 1,
    padding: '2px 3px',
    display: 'flex',
    alignItems: 'center',
  },

  // Navigation arrows
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(12,21,32,0.75)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#e8dfc8',
    width: 40,
    height: 60,
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    lineHeight: 1,
    transition: 'background 0.15s',
  },

  // Zoom indicator bar
  zoomBar: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(8,14,28,0.85)',
    border: '1px solid rgba(184,150,62,0.3)',
    borderRadius: 20,
    padding: '5px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
    backdropFilter: 'blur(6px)',
    pointerEvents: 'auto',
    whiteSpace: 'nowrap',
  },
  zoomLevel: {
    color: '#b8963e',
    fontSize: 12,
    fontWeight: 700,
    minWidth: 36,
  },
  zoomHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
  },
  zoomReset: {
    background: 'rgba(184,150,62,0.15)',
    border: '1px solid rgba(184,150,62,0.4)',
    color: '#b8963e',
    borderRadius: 10,
    padding: '2px 10px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
  },

  // Thumbnail strip
  strip: {
    display: 'flex',
    gap: 6,
    padding: '8px 12px',
    overflowX: 'auto',
    background: '#0c1520',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
    scrollbarWidth: 'thin',
    scrollbarColor: '#333 transparent',
  },
  thumb: {
    flexShrink: 0,
    background: 'none',
    border: '2px solid transparent',
    borderRadius: 3,
    padding: 2,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    opacity: 0.65,
    transition: 'opacity 0.15s, border-color 0.15s',
  },
  thumbActive: {
    borderColor: '#b8963e',
    opacity: 1,
  },
  thumbImg: {
    width: 72,
    height: 50,
    objectFit: 'cover',
    borderRadius: 2,
    display: 'block',
  },
  thumbDate: {
    fontSize: 9,
    color: '#888',
    whiteSpace: 'nowrap',
  },
}
