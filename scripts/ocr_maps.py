# OCR pipeline for AHMP historical maps.
# Downloads map PDFs from atlasmiast.umk.pl, runs Tesseract, saves JSON to public/ocr/.
#
# Usage:
#   py scripts/ocr_maps.py                   # process all cities
#   py scripts/ocr_maps.py biecz torun       # process specific cities
#
# Requirements:
#   pip install pytesseract pdf2image pillow requests
#   Tesseract 5+ at C:\Program Files\Tesseract-OCR\tesseract.exe
#   Poppler at C:\poppler\poppler-24.08.0\Library\bin
#   tessdata_best models: pol, deu, lat

import os, sys, json, re, time, hashlib
import requests
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
from pdf2image import convert_from_path
import pytesseract

# ── Config ────────────────────────────────────────────────────────────────────
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
POPPLER      = r'C:\poppler\poppler-24.08.0\Library\bin'
DPI          = 300
LANG         = 'pol+deu+lat'
CONF_MIN     = 55       # discard words with confidence below this
LEN_MIN      = 3        # discard tokens shorter than this
OUT_DIR      = Path(r'C:\Users\wer\Desktop\Serwis\public\ocr')
CACHE_DIR    = Path(r'C:\Users\wer\AppData\Local\Temp\ahmp_pdf_cache')
CITIES_JS    = Path(r'C:\Users\wer\Desktop\Serwis\src\data\cities.js')

CACHE_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

GARBAGE = re.compile(
    r'^[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻa-zäöüßÄÖÜ]*$'  # no letters at all
    r'|.*\d{3,}'                                     # 3+ consecutive digits
)

# ── Parse cities.js with a simple regex (no JS interpreter needed) ─────────────
sys.path.insert(0, str(Path(__file__).parent))
from annotator_server import load_catalog   # parses cities.js per city block (no id-prefix clashes)

def load_maps():
    return [{'cityId': e['cityId'], 'mapId': e['mapId'], 'pdfUrl': e['pdfUrl']}
            for e in load_catalog()]


def download_pdf(url, dest):
    if dest.exists():
        return True
    try:
        r = requests.get(url, timeout=60, stream=True)
        if r.status_code != 200:
            print(f'    HTTP {r.status_code}')
            return False
        with open(dest, 'wb') as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)
        return True
    except Exception as e:
        print(f'    Download error: {e}')
        return False


def preprocess(img):
    img = img.convert('L')
    img = ImageEnhance.Contrast(img).enhance(2.5)
    img = img.filter(ImageFilter.SHARPEN)
    return img


MAX_PIXELS = 12_000_000     # bigger scans are scaled down first: Tesseract time grows with pixels
                            # (a 95 Mpx map ran for hours); positions are normalised, so nothing shifts

def ocr_image(img):
    W, H = img.size
    if W * H > MAX_PIXELS:
        f = (MAX_PIXELS / (W * H)) ** 0.5
        img = img.resize((int(W * f), int(H * f)), Image.LANCZOS)
        W, H = img.size
    proc = preprocess(img)
    data = pytesseract.image_to_data(
        proc, lang=LANG,
        config='--psm 11 --oem 1',
        output_type=pytesseract.Output.DICT
    )
    words = []
    seen  = set()
    for i, text in enumerate(data['text']):
        txt  = text.strip()
        conf = int(data['conf'][i])
        if (not txt or conf < CONF_MIN or len(txt) < LEN_MIN
                or GARBAGE.match(txt) or txt in seen):
            continue
        seen.add(txt)
        words.append({
            'text': txt,
            'conf': conf,
            'x':    round(data['left'][i] / W, 4),
            'y':    round(data['top'][i]  / H, 4),
        })
    return words


def process_map(entry, filter_cities=None):
    city_id = entry['cityId']
    map_id  = entry['mapId']
    pdf_url = entry['pdfUrl']

    if filter_cities and city_id not in filter_cities:
        return

    out_path = OUT_DIR / city_id / f'{map_id}.json'
    if out_path.exists():
        # a file holding only hand-made pins (conf == 100, written by ocr_build_index.py)
        # does not count as OCR'd; ocr_build_index.py re-adds the pins afterwards
        try:
            existing = json.loads(out_path.read_text(encoding='utf-8')).get('words', [])
        except Exception:
            existing = []
        if any(w.get('conf') != 100 for w in existing):
            print(f'  SKIP  {map_id}  (cached)')
            return

    print(f'  OCR   {map_id}')

    pdf_name = hashlib.md5(pdf_url.encode()).hexdigest() + '.pdf'
    pdf_path = CACHE_DIR / pdf_name
    if not download_pdf(pdf_url, pdf_path):
        print(f'        FAIL download')
        return

    try:
        with open(pdf_path, 'rb') as fh:
            magic = fh.read(4)
        if magic.startswith(b'%PDF'):
            pages = convert_from_path(str(pdf_path), dpi=DPI, poppler_path=POPPLER)
        else:                                  # many "pdfUrl" targets are plain JPG/PNG/TIFF scans
            pages = [Image.open(pdf_path)]
        all_words = []
        for page in pages:
            all_words.extend(ocr_image(page))
    except Exception as e:                     # one bad map must not stop the batch
        print(f'        FAIL {type(e).__name__}: {e}')
        return

    # Deduplicate across pages
    seen  = set()
    dedup = []
    for w in all_words:
        if w['text'] not in seen:
            seen.add(w['text'])
            dedup.append(w)

    dedup.sort(key=lambda w: -w['conf'])

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps({'mapId': map_id, 'cityId': city_id, 'words': dedup},
                   ensure_ascii=False, separators=(',', ':')),
        encoding='utf-8'
    )
    print(f'        {len(dedup)} words -> {out_path.name}')


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    Image.MAX_IMAGE_PIXELS = None              # large-format sheets exceed PIL's default limit
    shard = None                               # --shard=i/n : every n-th map, offset i (parallel runs)
    for a in sys.argv[1:]:
        if a.startswith('--shard='):
            i, n = a.split('=')[1].split('/'); shard = (int(i), int(n))
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    filter_cities = set(args) if args else None

    maps = load_maps()
    print(f'Loaded {len(maps)} maps from cities.js')
    if filter_cities:
        subset = [m for m in maps if m['cityId'] in filter_cities]
        print(f'Filtered to {len(subset)} maps for: {", ".join(filter_cities)}')
    else:
        subset = maps

    if shard:
        subset = [m for k, m in enumerate(subset) if k % shard[1] == shard[0]]
        print(f'Shard {shard[0]}/{shard[1]}: {len(subset)} maps')

    by_city = {}
    for m in subset:
        by_city.setdefault(m['cityId'], []).append(m)

    for city_id, city_maps in sorted(by_city.items()):
        print(f'\n[{city_id}] — {len(city_maps)} maps')
        for entry in city_maps:
            process_map(entry)

    print('\nDone.')
