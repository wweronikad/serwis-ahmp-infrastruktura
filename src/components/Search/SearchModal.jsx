import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { search } from '../../utils/searchIndex'

const TYPE_ICON = {
  city:  '🏙',
  map:   '🗺',
  photo: '📸',
  opis:  '📜',
}

const TYPE_LABEL = {
  city:  'Miasto',
  map:   'Plan / mapa',
  photo: 'Zdjęcie archiwalne',
  opis:  'Karta historyczna',
}

function resultUrl(item) {
  if (item.type === 'city')  return `/atlas/${item.cityId}`
  if (item.type === 'map')   return `/atlas/${item.cityId}?map=${item.mapId}`
  if (item.type === 'photo') return `/atlas/${item.cityId}?gallery=${item.photoId}`
  if (item.type === 'opis')  return `/atlas/${item.cityId}`
  return '/'
}

export default function SearchModal({ isOpen, onClose }) {
  const navigate  = useNavigate()
  const inputRef  = useRef(null)
  const listRef   = useRef(null)

  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [activeIdx, setActiveIdx] = useState(0)

  // Reset and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [isOpen])

  // Update results on query change
  useEffect(() => {
    setResults(search(query))
    setActiveIdx(0)
  }, [query])

  // Scroll active result into view
  useEffect(() => {
    const el = listRef.current?.children[activeIdx]
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const item = results[activeIdx]
      if (item) { navigate(resultUrl(item)); onClose() }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [results, activeIdx, navigate, onClose])

  const handleResultClick = useCallback((item) => {
    navigate(resultUrl(item))
    onClose()
  }, [navigate, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,18,34,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(620px, 92vw)',
          background: 'var(--cream)',
          borderRadius: '10px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
        }}
      >
        {/* Input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--white)',
        }}>
          <span style={{ fontSize: 16, opacity: 0.45 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Szukaj miast, planów, zabytków, epok…"
            spellCheck={false}
            style={{
              flex: 1, height: 52,
              border: 'none', outline: 'none',
              fontSize: 16, fontFamily: 'var(--font-sans)',
              background: 'transparent',
              color: 'var(--text)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 18, color: 'var(--text-muted)', lineHeight: 1, padding: '0 2px' }}
            >
              ×
            </button>
          )}
          <kbd style={{
            fontSize: 11, color: 'var(--text-muted)',
            background: 'var(--cream-dark)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-sans)',
          }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        {query.trim().length >= 2 && (
          <div
            ref={listRef}
            style={{ overflowY: 'auto', flex: 1 }}
          >
            {results.length === 0 ? (
              <p style={{
                padding: '24px 20px', textAlign: 'center',
                fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic',
              }}>
                Brak wyników dla „{query}"
              </p>
            ) : (
              results.map((item, idx) => {
                const active = idx === activeIdx
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => handleResultClick(item)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      background: active ? 'var(--navy)' : 'transparent',
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background 0.08s',
                    }}
                  >
                    <span style={{ fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0 }}>
                      {TYPE_ICON[item.type]}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: active ? 'var(--white)' : 'var(--text)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.label}
                      </div>
                      <div style={{
                        fontSize: 11, marginTop: 2,
                        color: active ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.sublabel}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, flexShrink: 0,
                      color: active ? 'var(--gold-light)' : 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600,
                    }}>
                      {TYPE_LABEL[item.type]}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Footer hint */}
        {query.trim().length < 2 && (
          <div style={{
            padding: '16px 20px',
            display: 'flex', gap: 20, flexWrap: 'wrap',
          }}>
            {[
              ['🏙 Miasta', 'Biecz, Toruń, Wrocław…'],
              ['🗺 Plany', 'katastralne, rekonstrukcje…'],
              ['📸 Panoramy', 'zabytki na zdjęciach archiwalnych'],
              ['📜 Historia', 'fortyfikacje, handel, ludność…'],
            ].map(([title, desc]) => (
              <div key={title} style={{ minWidth: 120 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
