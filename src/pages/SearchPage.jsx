import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MiniSearch from 'minisearch'
import { asset } from '../utils/asset'
import { cities } from '../data/cities'
import { INTRO_PDF } from '../data/intropdfs'

const CITY_NAME = Object.fromEntries(cities.map(c => [c.id, c.name]))

const FULLTEXT_CITIES = [
  'biecz', 'bochnia', 'brzeg', 'bydgoszcz', 'chelmno', 'chojnice',
  'elblag', 'fordon', 'gizycko', 'grudziadz',
  'jelenia-gora', 'ketrzyn', 'koronowo', 'kwidzyn', 'lidzbark-warminski',
  'milicz', 'mragowo', 'namyslow', 'nowy-sacz', 'olawa', 'ostroda',
  'puck', 'raciborz', 'stary-sacz', 'strzegom', 'strzelin',
  'swiecie', 'tarnow', 'tczew', 'torun', 'torun-ii', 'wieliczka',
  'wloclawek', 'wroclaw', 'zabkowice-slaskie', 'zamosc', 'ziebice',
]

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildExcerpt(text, queryWords) {
  const lower = text.toLowerCase()
  let bestPos = -1
  for (const word of queryWords) {
    const pos = lower.indexOf(word)
    if (pos !== -1 && (bestPos === -1 || pos < bestPos)) bestPos = pos
  }
  const start = bestPos === -1 ? 0 : Math.max(0, bestPos - 90)
  const end = Math.min(text.length, start + 300)
  const excerpt = text.slice(start, end)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  let escaped = escapeHtml(excerpt)
  for (const word of queryWords) {
    if (word.length < 2) continue
    const re = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    escaped = escaped.replace(re, '<mark>$1</mark>')
  }
  return prefix + escaped + suffix
}

function buildMapExcerpt(words, queryWords) {
  // words is a space-joined string of OCR tokens
  const tokens = words.split(' ')
  const lower = words.toLowerCase()
  let bestTok = 0
  let bestPos = -1
  for (const qw of queryWords) {
    const pos = lower.indexOf(qw)
    if (pos !== -1 && (bestPos === -1 || pos < bestPos)) bestPos = pos
  }
  if (bestPos !== -1) {
    let acc = 0
    for (let i = 0; i < tokens.length; i++) {
      if (acc >= bestPos) { bestTok = i; break }
      acc += tokens[i].length + 1
    }
  }
  const start = Math.max(0, bestTok - 6)
  const end = Math.min(tokens.length, start + 24)
  const excerpt = tokens.slice(start, end).join(' ')
  const prefix = start > 0 ? '…' : ''
  const suffix = end < tokens.length ? '…' : ''
  let escaped = escapeHtml(excerpt)
  for (const word of queryWords) {
    if (word.length < 2) continue
    const re = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    escaped = escaped.replace(re, '<mark>$1</mark>')
  }
  return prefix + escaped + suffix
}

async function buildSearchIndexes(onProgress) {
  const TOTAL = FULLTEXT_CITIES.length + 1
  let loaded = 0
  const tick = () => { loaded++; onProgress(loaded / TOTAL) }

  let ocrEntries = []
  const ocrLoad = fetch(asset('ocr/index.json'))
    .then(r => (r.ok ? r.json() : []))
    .catch(() => [])
    .then(data => { ocrEntries = data; tick() })

  const allChunks = []
  const textLoad = Promise.all(
    FULLTEXT_CITIES.map(async (cityId) => {
      try {
        const res = await fetch(asset(`fulltext/${cityId}.json`))
        if (res.ok) {
          const data = await res.json()
          allChunks.push(...data.chunks.map(c => ({ ...c, cityId })))
        }
      } catch { /* skip */ }
      tick()
    })
  )

  await Promise.all([ocrLoad, textLoad])

  const textMs = new MiniSearch({
    fields: ['text'],
    storeFields: ['id', 'cityId', 'text'],
    searchOptions: { fuzzy: 0.15, prefix: true, combineWith: 'AND' },
  })
  textMs.addAll(allChunks)

  const ocrMs = new MiniSearch({
    fields: ['words', 'title'],
    storeFields: ['id', 'mapId', 'cityId', 'title', 'words'],
    searchOptions: { fuzzy: 0.15, prefix: true, combineWith: 'AND' },
  })
  ocrMs.addAll(ocrEntries)

  const ocrCities = new Set(ocrEntries.map(e => e.cityId))
  return { textMs, ocrMs, ocrCities }
}

export default function SearchPage() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const indexRef = useRef(null)
  const [loadProgress, setLoadProgress] = useState(0)
  const [indexReady, setIndexReady] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [cityFilter, setCityFilter] = useState('all')
  const [allCities, setAllCities] = useState(FULLTEXT_CITIES)
  const [sourceText, setSourceText] = useState(true)
  const [sourceMap, setSourceMap] = useState(true)

  useEffect(() => {
    let cancelled = false
    buildSearchIndexes((p) => {
      if (!cancelled) setLoadProgress(p)
    }).then(({ textMs, ocrMs, ocrCities }) => {
      if (!cancelled) {
        indexRef.current = { textMs, ocrMs }
        const merged = [...new Set([...FULLTEXT_CITIES, ...Array.from(ocrCities)])]
          .sort((a, b) => (CITY_NAME[a] ?? a).localeCompare(CITY_NAME[b] ?? b, 'pl'))
        setAllCities(merged)
        setIndexReady(true)
        setTimeout(() => inputRef.current?.focus(), 30)
      }
    })
    return () => { cancelled = true }
  }, [])

  const runSearch = useCallback((q, city, srcText, srcMap) => {
    if (!indexRef.current || q.trim().length < 2) {
      setResults([])
      return
    }
    const { textMs, ocrMs } = indexRef.current
    const filterFn = city !== 'all' ? { filter: (r) => r.cityId === city } : {}
    let textResults = []
    let ocrResults = []
    if (srcText) {
      try {
        textResults = textMs.search(q.trim(), { limit: 30, fuzzy: 0.15, prefix: true, combineWith: 'AND', ...filterFn })
          .map(r => ({ ...r, type: 'text' }))
      } catch {}
    }
    if (srcMap) {
      try {
        ocrResults = ocrMs.search(q.trim(), { limit: 10, fuzzy: 0.15, prefix: true, combineWith: 'AND', ...filterFn })
          .map(r => ({ ...r, type: 'map' }))
      } catch {}
    }
    setResults([
      ...textResults.sort((a, b) => b.score - a.score),
      ...ocrResults.sort((a, b) => b.score - a.score),
    ])
  }, [])

  const handleQueryChange = useCallback((e) => {
    const q = e.target.value
    setQuery(q)
    runSearch(q, cityFilter, sourceText, sourceMap)
  }, [runSearch, cityFilter, sourceText, sourceMap])

  const handleFilterChange = useCallback((e) => {
    const f = e.target.value
    setCityFilter(f)
    runSearch(query, f, sourceText, sourceMap)
  }, [runSearch, query, sourceText, sourceMap])

  const toggleSource = useCallback((type) => {
    if (type === 'text') {
      const next = !sourceText
      setSourceText(next)
      runSearch(query, cityFilter, next, sourceMap)
    } else {
      const next = !sourceMap
      setSourceMap(next)
      runSearch(query, cityFilter, sourceText, next)
    }
  }, [runSearch, query, cityFilter, sourceText, sourceMap])

  const queryWords = query.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 2)
  const showResults = indexReady && query.trim().length >= 2

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.heading}>Wyszukiwanie w AHMP</h1>
        <p style={s.subheading}>
          Przeszukaj części opisowe atlasów (37 miast, ponad 4 800 fragmentów) oraz treść map historycznych (OCR).
        </p>

        {!indexReady && (
          <div style={s.progressWrap}>
            <div style={s.progressTrack}>
              <div style={{ ...s.progressBar, width: `${Math.round(loadProgress * 100)}%` }} />
            </div>
            <span style={s.progressLabel}>
              Wczytywanie indeksu… {Math.round(loadProgress * 100)}%
            </span>
          </div>
        )}

        <div style={s.controls}>
          <div style={{ ...s.inputWrap, opacity: indexReady ? 1 : 0.5 }}>
            <span style={s.searchIcon}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={handleQueryChange}
              placeholder={indexReady ? 'Szukaj frazy, np. Ropa, fortyfikacje, prawa miejskie…' : 'Wczytywanie indeksu…'}
              disabled={!indexReady}
              spellCheck={false}
              style={s.input}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]) }}
                style={s.clearBtn}
              >×</button>
            )}
          </div>

          {indexReady && (
            <select value={cityFilter} onChange={handleFilterChange} style={s.select}>
              <option value="all">Wszystkie miasta</option>
              {allCities.map(id => (
                <option key={id} value={id}>{CITY_NAME[id] ?? id}</option>
              ))}
            </select>
          )}
        </div>

        {indexReady && (
          <div style={s.sourceRow}>
            <span style={s.sourceLabel}>Źródła:</span>
            <SourcePill active={sourceText} onClick={() => toggleSource('text')}>
              Teksty opisowe
            </SourcePill>
            <SourcePill active={sourceMap} onClick={() => toggleSource('map')}>
              Mapy historyczne (OCR)
            </SourcePill>
          </div>
        )}

        {indexReady && !showResults && (
          <p style={s.hint}>
            Indeks gotowy — {allCities.length} miast.
            Wpisz co najmniej 2 znaki, aby wyszukać.
          </p>
        )}

        {showResults && (
          <div style={s.resultsList}>
            {results.length === 0 && query.trim().length >= 2 ? (
              <p style={s.noResults}>
                Brak wyników dla „{query}"
                {cityFilter !== 'all' && ` w mieście ${CITY_NAME[cityFilter] ?? cityFilter}`}.
              </p>
            ) : (
              <>
                {(() => {
                  const textRes = results.filter(r => r.type === 'text')
                  const mapRes  = results.filter(r => r.type === 'map')
                  return (
                    <>
                      {textRes.length > 0 && (
                        <>
                          <p style={s.resultCount}>
                            {textRes.length}{textRes.length === 30 ? '+' : ''} wynik{textRes.length === 1 ? '' : textRes.length < 5 ? 'i' : 'ów'} w tekstach opisowych
                            {cityFilter !== 'all' && ` · ${CITY_NAME[cityFilter] ?? cityFilter}`}
                          </p>
                          {textRes.map(r => (
                            <ResultCard key={r.id} result={r} queryWords={queryWords} query={query}
                              onOpen={() => navigate(`/atlas/${r.cityId}?historia=${encodeURIComponent(r.id)}&q=${encodeURIComponent(query.trim())}`)} />
                          ))}
                        </>
                      )}
                      {mapRes.length > 0 && (
                        <>
                          <p style={{ ...s.resultCount, marginTop: textRes.length ? 24 : 0, color: 'var(--navy)' }}>
                            {mapRes.length} wynik{mapRes.length === 1 ? '' : mapRes.length < 5 ? 'i' : 'ów'} na mapach historycznych (OCR)
                            {cityFilter !== 'all' && ` · ${CITY_NAME[cityFilter] ?? cityFilter}`}
                          </p>
                          {mapRes.map(r => (
                            <ResultCard key={r.id} result={r} queryWords={queryWords} query={query}
                              onOpen={() => navigate(`/atlas/${r.cityId}?map=${r.mapId}&q=${encodeURIComponent(query.trim())}`)} />
                          ))}
                        </>
                      )}
                      {textRes.length === 0 && mapRes.length === 0 && (
                        <p style={s.noResults}>
                          Brak wyników dla „{query}"
                          {cityFilter !== 'all' && ` w mieście ${CITY_NAME[cityFilter] ?? cityFilter}`}.
                        </p>
                      )}
                    </>
                  )
                })()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SourcePill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      border: `1px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
      background: active ? 'var(--navy)' : '#fff',
      color: active ? '#fff' : 'var(--text-muted)',
      borderRadius: 20,
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      transition: 'all 0.15s',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 10, lineHeight: 1 }}>{active ? '✓' : '○'}</span>
      {children}
    </button>
  )
}

function ResultCard({ result, queryWords, query, onOpen }) {
  if (result.type === 'map') {
    return <MapResultCard result={result} queryWords={queryWords} onOpen={onOpen} />
  }
  const excerptHtml = buildExcerpt(result.text, queryWords)
  const cityName = CITY_NAME[result.cityId] ?? result.cityId
  const pdfBase = INTRO_PDF[result.cityId]
  const pdfUrl  = pdfBase ? `${pdfBase}#search=${encodeURIComponent(query.trim())}` : null

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <span style={s.cardCity}>{cityName}</span>
        <span style={s.cardTag}>Tekst opisowy</span>
      </div>
      <p
        style={s.cardExcerpt}
        dangerouslySetInnerHTML={{ __html: excerptHtml }}
      />
      <div style={s.cardActions}>
        <button onClick={onOpen} style={s.openBtn}>
          Otwórz atlas →
        </button>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={s.pdfLink}
            title="Otwiera PDF z zaznaczoną frazą (Firefox/Edge)"
          >
            Część opisowa PDF ↗
          </a>
        )}
      </div>
    </div>
  )
}

function MapResultCard({ result, queryWords, onOpen }) {
  const excerptHtml = buildMapExcerpt(result.words ?? '', queryWords)
  const cityName = CITY_NAME[result.cityId] ?? result.cityId

  return (
    <div style={{ ...s.card, borderLeft: '3px solid var(--gold)' }}>
      <div style={s.cardHeader}>
        <span style={s.cardCity}>{cityName}</span>
        <span style={{ ...s.cardTag, color: 'var(--navy)', background: 'rgba(0,40,80,0.06)', borderColor: 'rgba(0,40,80,0.2)' }}>
          Mapa historyczna
        </span>
      </div>
      {result.title && (
        <p style={s.mapTitle}>{result.title}</p>
      )}
      <p
        style={{ ...s.cardExcerpt, fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--text-muted)' }}
        dangerouslySetInnerHTML={{ __html: excerptHtml }}
      />
      <div style={s.cardActions}>
        <button onClick={onOpen} style={s.openBtn}>
          Otwórz mapę →
        </button>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100%',
    background: 'var(--cream)',
    padding: '40px 24px 60px',
  },
  inner: {
    maxWidth: 820,
    margin: '0 auto',
  },
  heading: {
    fontFamily: 'var(--font-serif)',
    fontSize: 26,
    color: 'var(--navy)',
    margin: '0 0 8px',
  },
  subheading: {
    fontSize: 14,
    color: 'var(--text-muted)',
    margin: '0 0 28px',
    lineHeight: 1.5,
  },
  progressWrap: {
    marginBottom: 28,
  },
  progressTrack: {
    height: 4,
    background: 'var(--border)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    background: 'var(--gold)',
    borderRadius: 2,
    transition: 'width 0.2s ease',
  },
  progressLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  controls: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  inputWrap: {
    flex: 1,
    minWidth: 200,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--white, #fff)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '0 12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  searchIcon: {
    fontSize: 15,
    opacity: 0.45,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    height: 44,
    border: 'none',
    outline: 'none',
    fontSize: 15,
    fontFamily: 'var(--font-sans)',
    background: 'transparent',
    color: 'var(--text)',
  },
  clearBtn: {
    border: 'none',
    background: 'none',
    fontSize: 20,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 2px',
    flexShrink: 0,
  },
  select: {
    height: 44,
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '0 10px',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text)',
    background: 'var(--white, #fff)',
    cursor: 'pointer',
    minWidth: 180,
  },
  sourceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  sourceLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginRight: 2,
  },
  hint: {
    fontSize: 13,
    color: 'var(--text-muted)',
    margin: '0 0 20px',
    fontStyle: 'italic',
  },
  resultsList: {
    marginTop: 8,
  },
  resultCount: {
    fontSize: 12,
    color: 'var(--text-muted)',
    margin: '0 0 16px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  noResults: {
    fontSize: 14,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '40px 0',
  },
  card: {
    background: '#fff',
    border: '1px solid var(--border-light)',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cardCity: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--navy)',
    fontFamily: 'var(--font-serif)',
  },
  cardTag: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--text-muted)',
    background: 'var(--cream-dark)',
    border: '1px solid var(--border)',
    borderRadius: 3,
    padding: '2px 6px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  mapTitle: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    margin: '0 0 8px',
  },
  cardExcerpt: {
    fontSize: 13,
    lineHeight: 1.65,
    color: 'var(--text)',
    margin: '0 0 14px',
  },
  cardActions: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  openBtn: {
    background: 'var(--navy)',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '0.2px',
  },
  pdfLink: {
    fontSize: 12,
    color: 'var(--text-muted)',
    textDecoration: 'none',
    borderBottom: '1px dashed var(--border)',
  },
}
