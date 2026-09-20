# Lokalne narzędzie do szybkiego ręcznego "przeklikiwania" nazw na mapach.
#
# Uruchamia lokalny serwer + otwiera w przeglądarce widok mapy, na którym
# klikasz punkt i wpisujesz etykietę (np. nazwę ulicy, rzeki, przedmieścia).
# Punkty zapisują się od razu (autosave) do public/ocr/manual_words.json —
# w tym samym pliku, którego już używa ocr_build_index.py — ale teraz każdy
# wpis ma też pozycję x/y, więc trafia zarówno do wyszukiwarki (index.json),
# jak i jako żółta pinezka na interaktywnej mapie (public/ocr/<city>/<mapId>.json),
# dokładnie tak jak słowa znalezione przez OCR.
#
# Usage:
#   py scripts/annotator_server.py
#   (otwiera się http://localhost:8642 — jeśli nie, wejdź tam ręcznie)
#
# Wymaga tego, co już jest zainstalowane dla reszty pipeline'u OCR:
#   pip install pdf2image pillow requests
#   Poppler: Windows — C:\poppler\poppler-24.08.0\Library\bin (albo zmienna POPPLER_PATH),
#            macOS: brew install poppler; Linux: apt install poppler-utils

import json, os, re, hashlib, mimetypes, sys, subprocess, tempfile
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import requests
from pdf2image import convert_from_path, pdfinfo_from_path

# Poppler: zmienna środowiskowa POPPLER_PATH, albo domyślna ścieżka Windows,
# a jeśli jej nie ma — None (wtedy pdf2image szuka `pdftoppm` w PATH: macOS/Linux).
_WIN_POPPLER = r'C:\poppler\poppler-24.08.0\Library\bin'
POPPLER      = os.environ.get('POPPLER_PATH') or (_WIN_POPPLER if Path(_WIN_POPPLER).exists() else None)
DPI          = 200
ROOT         = Path(__file__).resolve().parent.parent
CITIES_JS    = ROOT / 'src' / 'data' / 'cities.js'
OCR_DIR      = ROOT / 'public' / 'ocr'
MANUAL_FILE  = OCR_DIR / 'manual_words.json'
SUGG_FILE    = OCR_DIR / 'suggested_words.json'   # propozycje do zatwierdzenia (nie trafiają do wyszukiwarki)
PDF_CACHE    = Path(tempfile.gettempdir()) / 'ahmp_pdf_cache'
IMG_CACHE    = Path(__file__).parent / 'annotator' / '.cache'
STATIC_DIR   = Path(__file__).parent / 'annotator'
PORT         = 8642

PDF_CACHE.mkdir(parents=True, exist_ok=True)
IMG_CACHE.mkdir(parents=True, exist_ok=True)

MANUAL_README = (
    'Ręcznie dopisane słowa/podpisy, których OCR nie wyłapał (np. kursywa na '
    'rzekach/lasach), oraz punkty dodane narzędziem scripts/annotator_server.py. '
    'Klucz = mapId z cities.js, wartość = lista wpisów: albo sam string (tylko '
    'do wyszukiwarki, bez pozycji), albo obiekt {"text","x","y"} (pozycja jako '
    'ułamek 0-1 wymiarów obrazu strony — trafia też jako pinezka na mapie). '
    'Uruchom `py scripts/ocr_build_index.py` po ręcznej edycji pliku, żeby '
    'przebudować wyszukiwarkę i pinezki (annotator_server.py robi to sam po '
    'każdym zapisie).'
)


# ── cities.js parsing ───────────────────────────────────────────────────────

def load_catalog():
    """Zwraca listę {cityId, cityName, mapId, title, pdfUrl}, parsując
    cities.js po granicach obiektów miast (a nie po prefiksie id mapy),
    więc jest odporne na miasta o pokrywających się prefiksach."""
    src = CITIES_JS.read_text(encoding='utf-8')

    city_starts = list(re.finditer(r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'", src))
    map_re = re.compile(r"\{\s*id:\s*'([^']+)',\s*title:\s*'([^']*)'.*?pdfUrl:\s*'([^']+)'", re.S)

    result = []
    for i, m in enumerate(city_starts):
        city_id, city_name = m.group(1), m.group(2)
        seg_start = m.end()
        seg_end = city_starts[i + 1].start() if i + 1 < len(city_starts) else len(src)
        segment = src[seg_start:seg_end]
        for mm in map_re.finditer(segment):
            map_id, title, pdf_url = mm.group(1), mm.group(2), mm.group(3)
            result.append({
                'cityId': city_id, 'cityName': city_name,
                'mapId': map_id, 'title': title, 'pdfUrl': pdf_url,
            })
    return result


CATALOG = load_catalog()
BY_MAP_ID = {m['mapId']: m for m in CATALOG}
print(f'Wczytano {len(CATALOG)} map z cities.js')


# ── manual_words.json read/write ────────────────────────────────────────────

def load_manual():
    if not MANUAL_FILE.exists():
        return {}
    return json.loads(MANUAL_FILE.read_text(encoding='utf-8'))


def save_manual(data):
    out = {'_readme': MANUAL_README}
    for k, v in sorted(data.items()):
        if k == '_readme' or not v:
            continue
        out[k] = v
    MANUAL_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')


def points_for_map(map_id):
    """Zwraca tylko wpisy z pozycją (obiekty {text,x,y}) — to one wyświetla narzędzie."""
    manual = load_manual()
    entries = manual.get(map_id, [])
    return [e for e in entries if isinstance(e, dict) and 'x' in e and 'y' in e]


def save_points_for_map(map_id, points):
    manual = load_manual()
    entries = manual.get(map_id, [])
    # zachowaj wpisy bez pozycji (ze starego workflow ocr_compile_skeleton.py)
    text_only = [e for e in entries if isinstance(e, str)]
    manual[map_id] = text_only + points
    save_manual(manual)


# ── suggestions (propozycje) ────────────────────────────────────────────────

def load_suggestions():
    if not SUGG_FILE.exists():
        return {}
    return json.loads(SUGG_FILE.read_text(encoding='utf-8'))


def save_suggestions_for_map(map_id, items):
    data = load_suggestions()
    if items:
        data[map_id] = items
    else:
        data.pop(map_id, None)
    SUGG_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')


# ── rebuild index.json + wstrzyknięcie pinezek do public/ocr/<city>/<mapId>.json ─
# Deleguje do scripts/ocr_build_index.py (ta sama logika, wołana automatycznie
# po każdym zapisie punktów, żeby nie trzeba było osobno pamiętać o
# uruchomieniu tamtego skryptu ręcznie).

def rebuild_index_and_pins():
    subprocess.run(
        [sys.executable, str(Path(__file__).parent / 'ocr_build_index.py')],
        check=True, capture_output=True,
    )


# ── PDF -> PNG rendering (cached) ───────────────────────────────────────────

def download_pdf(url):
    pdf_path = PDF_CACHE / (hashlib.md5(url.encode()).hexdigest() + '.pdf')
    if not pdf_path.exists():
        r = requests.get(url, timeout=60, stream=True)
        r.raise_for_status()
        with open(pdf_path, 'wb') as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)
    return pdf_path


def _is_pdf(path):
    with open(path, 'rb') as fh:
        return fh.read(4).startswith(b'%PDF')


def page_count(map_id):
    entry = BY_MAP_ID[map_id]
    pdf_path = download_pdf(entry['pdfUrl'])
    if not _is_pdf(pdf_path):          # ~polowa map w Atlasie to zwykle pliki JPG
        return 1
    info = pdfinfo_from_path(str(pdf_path), poppler_path=POPPLER)
    return info['Pages']


def render_page(map_id, page):
    cache_path = IMG_CACHE / f'{map_id}_p{page}.png'
    if cache_path.exists():
        return cache_path
    entry = BY_MAP_ID[map_id]
    pdf_path = download_pdf(entry['pdfUrl'])
    if not _is_pdf(pdf_path):
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = None
        Image.open(pdf_path).convert('RGB').save(cache_path, 'PNG')
        return cache_path
    pages = convert_from_path(str(pdf_path), dpi=DPI, poppler_path=POPPLER,
                               first_page=page, last_page=page)
    pages[0].convert('RGB').save(cache_path, 'PNG')
    return cache_path


# ── HTTP handler ─────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _file(self, path, content_type=None):
        data = path.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', content_type or mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)

        try:
            if parsed.path == '/' or parsed.path == '/index.html':
                return self._file(STATIC_DIR / 'index.html', 'text/html; charset=utf-8')
            if parsed.path == '/app.js':
                return self._file(STATIC_DIR / 'app.js', 'application/javascript; charset=utf-8')
            if parsed.path == '/style.css':
                return self._file(STATIC_DIR / 'style.css', 'text/css; charset=utf-8')

            if parsed.path == '/api/maps':
                manual = load_manual()
                sugg = load_suggestions()
                out = []
                for m in CATALOG:
                    ocr_path = OCR_DIR / m['cityId'] / f'{m["mapId"]}.json'
                    ocr_words = 0
                    if ocr_path.exists():
                        try:
                            ocr_words = len(json.loads(ocr_path.read_text(encoding='utf-8')).get('words', []))
                        except Exception:
                            pass
                    manual_points = len([e for e in manual.get(m['mapId'], []) if isinstance(e, dict)])
                    out.append({**m, 'ocrWords': ocr_words, 'manualPoints': manual_points,
                                'suggested': len(sugg.get(m['mapId'], []))})
                return self._json(out)

            if parsed.path == '/api/pagecount':
                map_id = qs['map'][0]
                return self._json({'pages': page_count(map_id)})

            if parsed.path == '/api/image':
                map_id = qs['map'][0]
                page = int(qs.get('page', ['1'])[0])
                img_path = render_page(map_id, page)
                return self._file(img_path, 'image/png')

            if parsed.path == '/api/points':
                map_id = qs['map'][0]
                return self._json(points_for_map(map_id))

            if parsed.path == '/api/suggestions':
                return self._json(load_suggestions().get(qs['map'][0], []))

            self.send_error(404)
        except Exception as e:
            self._json({'error': str(e)}, 500)

    def do_POST(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        try:
            if parsed.path == '/api/suggestions':
                map_id = qs['map'][0]
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                save_suggestions_for_map(map_id, body['suggestions'])
                return self._json({'ok': True, 'count': len(body['suggestions'])})
            if parsed.path == '/api/points':
                map_id = qs['map'][0]
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                save_points_for_map(map_id, body['points'])
                rebuild_index_and_pins()
                return self._json({'ok': True, 'count': len(body['points'])})
            self.send_error(404)
        except Exception as e:
            self._json({'error': str(e)}, 500)


if __name__ == '__main__':
    server = ThreadingHTTPServer(('localhost', PORT), Handler)
    url = f'http://localhost:{PORT}'
    print(f'Serwer działa: {url}')
    print('Zatrzymaj przez Ctrl+C.')
    try:
        import webbrowser
        webbrowser.open(url)
    except Exception:
        pass
    server.serve_forever()
