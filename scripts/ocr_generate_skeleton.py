# Generates a plain-text skeleton of OCR candidate words per map, at a
# LOWER confidence threshold than ocr_maps.py uses for the live index
# (conf >= 30 here vs >= 55 there) — so borderline-but-real words that
# ocr_maps.py discards show up here for a human to keep or delete.
#
# IMPORTANT: this does NOT recover text Tesseract never detected as a
# text region at all (e.g. cursive river/forest labels — see
# ocr_debug_visualize.py). Those still have to be typed in by hand.
# This just saves re-typing what Tesseract DID catch, at any confidence.
#
# Usage:
#   py scripts/ocr_generate_skeleton.py                 # all cities
#   py scripts/ocr_generate_skeleton.py biecz bochnia    # just these cities
#
# Output: scripts/ocr_manual_skeleton.txt — edit it, then run
#   py scripts/ocr_compile_skeleton.py
# to fold your edits into public/ocr/manual_words.json.

import re, sys, hashlib, json
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
from pdf2image import convert_from_path
import pytesseract, requests

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
POPPLER   = r'C:\poppler\poppler-24.08.0\Library\bin'
DPI       = 300
LANG      = 'pol+deu+lat'
CONF_MIN  = 30      # lower than ocr_maps.py's 55 — this is a review list, not the live index
LEN_MIN   = 2
CITIES_JS = Path(r'C:\Users\wer\Desktop\Serwis\src\data\cities.js')
CACHE_DIR = Path(r'C:\Users\wer\AppData\Local\Temp\ahmp_pdf_cache')
OUT_FILE  = Path(r'C:\Users\wer\Desktop\Serwis\scripts\ocr_manual_skeleton.txt')

CACHE_DIR.mkdir(parents=True, exist_ok=True)

GARBAGE = re.compile(
    r'^[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻa-zäöüßÄÖÜ]*$'
    r'|.*\d{3,}'
)


def load_maps():
    src = CITIES_JS.read_text(encoding='utf-8')
    city_re = re.compile(r"id:\s*'([^']+)'")
    map_re  = re.compile(r"\{\s*id:\s*'([^']+)',\s*title:\s*'([^']*)'.*?pdfUrl:\s*'([^']+)'", re.S)
    city_ids = city_re.findall(src)
    result = []
    for m in map_re.finditer(src):
        map_id, title, pdf_url = m.group(1), m.group(2), m.group(3)
        city_id = None
        for cid in city_ids:
            slug = cid.replace('-', '_')
            if map_id.startswith(f'ahmp_{slug}_') or map_id.startswith(f'ahmp_{slug}'):
                city_id = cid
                break
        if city_id:
            result.append({'cityId': city_id, 'mapId': map_id, 'title': title, 'pdfUrl': pdf_url})
    return result


def download_pdf(url, dest):
    if dest.exists():
        return True
    try:
        r = requests.get(url, timeout=30, stream=True)
        if r.status_code != 200:
            return False
        with open(dest, 'wb') as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)
        return True
    except Exception:
        return False


def preprocess(img):
    img = img.convert('L')
    img = ImageEnhance.Contrast(img).enhance(2.5)
    img = img.filter(ImageFilter.SHARPEN)
    return img


def ocr_candidates(img):
    proc = preprocess(img)
    data = pytesseract.image_to_data(
        proc, lang=LANG, config='--psm 11 --oem 1',
        output_type=pytesseract.Output.DICT
    )
    seen, words = set(), []
    for i, text in enumerate(data['text']):
        txt = text.strip()
        conf = int(data['conf'][i])
        if (not txt or conf < CONF_MIN or len(txt) < LEN_MIN
                or GARBAGE.match(txt) or txt.lower() in seen):
            continue
        seen.add(txt.lower())
        words.append((txt, conf))
    words.sort(key=lambda w: -w[1])
    return words


def process_map(entry):
    map_id, pdf_url = entry['mapId'], entry['pdfUrl']
    pdf_name = hashlib.md5(pdf_url.encode()).hexdigest() + '.pdf'
    pdf_path = CACHE_DIR / pdf_name
    if not download_pdf(pdf_url, pdf_path):
        return None  # 404 or network error — nothing to prefill
    try:
        pages = convert_from_path(str(pdf_path), dpi=DPI, poppler_path=POPPLER)
    except Exception as e:
        print(f'    FAIL convert: {e}')
        return None
    words = ocr_candidates(pages[0])
    return words


if __name__ == '__main__':
    only = set(sys.argv[1:]) or None
    maps = load_maps()
    if only:
        maps = [m for m in maps if m['cityId'] in only]
    print(f'Do przetworzenia: {len(maps)} map\n')

    lines = [
        '# Szkielet slow OCR do uzupelnienia recznie.',
        '# Kazda sekcja = jedna mapa. Linie po naglowku "# <mapId> | ..." to',
        '# kandydaci znalezieni przez Tesseract (nawet o niskiej pewnosci) —',
        '# usun smieci, zostaw/dopisz prawdziwe slowa (rowniez te kursywa,',
        '# ktorych Tesseract nie widzi wcale — dopisz je z reki, ogladajac mape).',
        '# Puste sekcje = albo PDF niedostepny (404), albo Tesseract nic nie zlapal.',
        '#',
        '# Po edycji uruchom: py scripts/ocr_compile_skeleton.py',
        '',
    ]

    no_pdf = []
    for i, entry in enumerate(maps, 1):
        print(f'[{i}/{len(maps)}] {entry["mapId"]}')
        words = process_map(entry)
        lines.append('# ' + '=' * 70)
        lines.append(f'# {entry["mapId"]} | {entry["title"]}')
        lines.append('# ' + '=' * 70)
        if words is None:
            lines.append('# (PDF niedostepny — 404 na atlasmiast.umk.pl)')
            no_pdf.append(entry['mapId'])
        elif not words:
            lines.append('# (Tesseract nic nie znalazl)')
        else:
            for txt, conf in words:
                lines.append(f'{txt}')
            print(f'    {len(words)} kandydatow')
        lines.append('')

    OUT_FILE.write_text('\n'.join(lines), encoding='utf-8')
    print(f'\nZapisano: {OUT_FILE}')
    print(f'Map bez dostepnego PDF: {len(no_pdf)}')
