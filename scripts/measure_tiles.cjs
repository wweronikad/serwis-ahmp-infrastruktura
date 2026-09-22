/*
 * Pomiar transferu danych przy wyświetleniu pierwszego widoku mapy w standardzie IIIF.
 *
 * Dla każdej wskazanej mapy skrypt otwiera w przeglądarce stronę atlasu interaktywnego,
 * nasłuchuje wszystkich żądań sieciowych do serwera z kaflami i sumuje rozmiar odpowiedzi
 * (nagłówki + treść). Wynik porównuje z rozmiarem pliku źródłowego na stronie Atlasu.
 *
 * Jak uruchomić:
 *   1) npm install --no-save playwright-core        (sterowanie przeglądarką; sama przeglądarka
 *                                                    to zainstalowany w systemie Microsoft Edge)
 *   2) npm run build && npm run preview             (serwis na http://localhost:4173)
 *   3) node scripts/measure_tiles.cjs               (pomiar 8 map użytych w pracy)
 *      node scripts/measure_tiles.cjs ahmp_puck_3 ahmp_torun_ii_1     (wybrane mapy)
 *
 * Zmienne środowiskowe:
 *   RUNS=3         liczba powtórzeń pomiaru każdej mapy (podawana jest mediana)
 *   BASE=...       adres serwisu (domyślnie http://localhost:4173/serwis-ahmp-infrastruktura)
 *   EDGE=...       ścieżka do msedge.exe
 *
 * Wynik: tabela w konsoli + plik measure_tiles_results.json w katalogu, z którego uruchomiono skrypt.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE || 'http://localhost:4173/serwis-ahmp-infrastruktura';
const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const RUNS = parseInt(process.env.RUNS || '3', 10);
const ANN_BASE = 'https://raw.githubusercontent.com/wweronikad/serwis-ahmp/main/adnotacje/';

// mapy zmierzone w pracy (od najmniejszej do największej)
const DEFAULT_MAPS = [
  'ahmp_puck_3', 'ahmp_kwidzyn_7', 'ahmp_chelmno_ii_8', 'ahmp_torun_ii_24_3',
  'ahmp_grudziadz_ii_1', 'ahmp_jelenia_gora_ii_2', 'ahmp_wroclaw_2017_ii_11', 'ahmp_torun_ii_1',
];

// ── 1. katalog map z src/data/cities.js ──────────────────────────────────────
function loadCatalog() {
  const src = fs.readFileSync(path.join(ROOT, 'src/data/cities.js'), 'utf8');
  const cityHdr = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g;
  const cities = [];
  for (const m of src.matchAll(cityHdr)) cities.push({ pos: m.index, id: m[1] });
  const mapRe = /\{\s*id:\s*'(ahmp_[^']+)'[^}]*?pdfUrl:\s*'([^']+)'[^}]*?annotationUrl:\s*`\$\{BASE\}\/([^`]+)`/gs;
  const out = {};
  for (const m of src.matchAll(mapRe)) {
    let city = null;
    for (const c of cities) if (c.pos < m.index) city = c.id;
    out[m[1]] = { id: m[1], city, pdfUrl: m[2], ann: m[3] };
  }
  return out;
}

// ── 2. adnotacja → adres usługi obrazu (kafli) i wymiary oryginału ───────────
async function enrich(entry) {
  const ann = await (await fetch(ANN_BASE + entry.ann)).json();
  const source = ann.items[0].target.source;
  entry.sid = source.id;                    // np. https://wweronikad.github.io/serwis-ahmp/puck/ahmp_puck_3
  entry.w = source.width; entry.h = source.height;
  try {
    const head = await fetch(entry.pdfUrl, { method: 'HEAD' });
    entry.orig = parseInt(head.headers.get('content-length') || '0', 10);
  } catch { entry.orig = 0; }
  return entry;
}

// ── 3. pomiar jednej mapy ────────────────────────────────────────────────────
async function measure(browser, m) {
  const runs = [];
  const hostPath = m.sid.replace(/^https?:\/\//, '');   // host + ścieżka zasobu IIIF
  for (let r = 0; r < RUNS; r++) {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });  // czysty kontekst = pusta pamięć podręczna
    const page = await ctx.newPage();
    const events = [];
    ctx.on('requestfinished', async (req) => {
      const u = req.url();
      if (!u.includes(hostPath)) return;                // tylko ruch do serwera z kaflami tej mapy
      let sizes = { responseBodySize: 0, responseHeadersSize: 0 };
      try { sizes = await req.sizes(); } catch {}
      events.push({ url: u, t: Date.now(), body: sizes.responseBodySize, hdr: sizes.responseHeadersSize });
    });
    const t0 = Date.now();
    await page.goto(`${BASE}/atlas/${m.city}?map=${m.id}`, { waitUntil: 'domcontentloaded' });
    // czekaj, aż ruch sieciowy ucichnie na 2,5 s (maksymalnie 45 s)
    let last = 0, quietSince = Date.now();
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      await page.waitForTimeout(300);
      if (events.length !== last) { last = events.length; quietSince = Date.now(); }
      else if (events.length > 0 && Date.now() - quietSince > 2500) break;
    }
    const tiles = events.filter(e => /default\.(jpg|png)$/.test(e.url));
    const bytes = tiles.reduce((s, e) => s + e.body + e.hdr, 0);
    const lastTile = tiles.length ? Math.max(...tiles.map(e => e.t)) - t0 : null;
    // ile żądań dotyczyło obrazu w pełnej rozdzielczości (region szerokości >= szerokość mapy)
    const full = tiles.filter(e => {
      const mm = e.url.match(/\/(\d+),(\d+),(\d+),(\d+)\//);
      return mm && parseInt(mm[3], 10) >= m.w;
    }).length;
    runs.push({ nTiles: tiles.length, bytes, lastTile, fullImageRequests: full });
    await ctx.close();
  }
  const med = (k) => {
    const v = runs.map(x => x[k]).filter(x => x != null).sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] : null;
  };
  return {
    id: m.id, city: m.city, host: m.sid.split('/')[2], px: `${m.w}x${m.h}`,
    origBytes: m.orig, nTiles: med('nTiles'), bytes: med('bytes'),
    lastTileMs: med('lastTile'), fullImageRequests: med('fullImageRequests'), runs,
  };
}

// ── 4. całość ────────────────────────────────────────────────────────────────
(async () => {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_MAPS;
  const catalog = loadCatalog();
  const maps = [];
  for (const id of ids) {
    if (!catalog[id]) { console.error(`  pomijam ${id} — nie ma takiej mapy w cities.js`); continue; }
    maps.push(await enrich(catalog[id]));
  }
  if (!maps.length) { console.error('Brak map do zmierzenia.'); process.exit(1); }

  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
  });
  console.log(`Edge ${browser.version()}  |  serwis: ${BASE}  |  powtórzeń: ${RUNS}\n`);
  const kb = (b) => (b / 1024).toFixed(0) + ' kB';
  console.log('mapa'.padEnd(26), 'rozmiar px'.padEnd(13), 'plik'.padEnd(10), 'kafle'.padEnd(7), 'transfer'.padEnd(10), '% pliku'.padEnd(9), 'czas');
  const results = [];
  for (const m of maps) {
    const row = await measure(browser, m);
    results.push(row);
    const pct = row.origBytes ? (100 * row.bytes / row.origBytes).toFixed(1) + '%' : '—';
    console.log(
      row.id.slice(0, 25).padEnd(26), row.px.padEnd(13), kb(row.origBytes).padEnd(10),
      String(row.nTiles).padEnd(7), kb(row.bytes).padEnd(10), pct.padEnd(9),
      (row.lastTileMs / 1000).toFixed(1) + ' s',
    );
  }
  fs.writeFileSync('measure_tiles_results.json', JSON.stringify(results, null, 1));
  console.log('\nSzczegóły (wszystkie powtórzenia): measure_tiles_results.json');
  await browser.close();
})().catch(e => { console.error('BŁĄD:', e); process.exit(1); });
