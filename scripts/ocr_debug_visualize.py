# Visual OCR debug tool — renders a map and draws a box around every word
# Tesseract detected, color-coded by confidence, so you can SEE exactly
# what got read vs missed (and compare against the confidence/length
# filters used in ocr_maps.py).
#
# Usage:
#   py scripts/ocr_debug_visualize.py --pdf AHMP_Biecz_1.1.pdf --out debug_biecz.png
#   py scripts/ocr_debug_visualize.py --city biecz --map ahmp_biecz_1_1 --out debug.png
#
# Output: a PNG the same size as the rendered map, with:
#   green box  = word kept by ocr_maps.py (conf >= CONF_MIN, len >= LEN_MIN, not garbage)
#   red box    = word Tesseract found but ocr_maps.py would discard
#   label text = "<recognized text> (<confidence>)"
#
# Also prints a summary: total words seen by Tesseract vs kept after filtering,
# and the raw text dump so you can read what Tesseract saw with no filtering
# at all (useful to eyeball whether handwritten sections produced any output).

import argparse, re, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from pdf2image import convert_from_path
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
POPPLER  = r'C:\poppler\poppler-24.08.0\Library\bin'
DPI      = 300
LANG     = 'pol+deu+lat'
CONF_MIN = 55
LEN_MIN  = 3
CITIES_JS = Path(r'C:\Users\wer\Desktop\Serwis\src\data\cities.js')

GARBAGE = re.compile(
    r'^[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻa-zäöüßÄÖÜ]*$'
    r'|.*\d{3,}'
)


def find_pdf_url(city_id, map_id):
    src = CITIES_JS.read_text(encoding='utf-8')
    m = re.search(r"\{\s*id:\s*'%s'[^}]*?pdfUrl:\s*'([^']+)'" % re.escape(map_id), src, re.S)
    if not m:
        sys.exit(f"Nie znaleziono mapy '{map_id}' w cities.js")
    return m.group(1)


def preprocess(img):
    img = img.convert('L')
    img = ImageEnhance.Contrast(img).enhance(2.5)
    img = img.filter(ImageFilter.SHARPEN)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pdf', help='Lokalny plik PDF mapy')
    ap.add_argument('--city', help='cityId z cities.js (uzyj razem z --map)')
    ap.add_argument('--map', help='mapId z cities.js (uzyj razem z --city)')
    ap.add_argument('--out', required=True, help='Sciezka wyjsciowego PNG')
    ap.add_argument('--dpi', type=int, default=DPI)
    args = ap.parse_args()

    if args.pdf:
        pdf_path = Path(args.pdf)
    elif args.city and args.map:
        import requests, tempfile
        url = find_pdf_url(args.city, args.map)
        print(f'Pobieram: {url}')
        r = requests.get(url, timeout=60)
        if r.status_code != 200:
            sys.exit(f'HTTP {r.status_code} przy pobieraniu {url}')
        pdf_path = Path(tempfile.gettempdir()) / f'{args.map}.pdf'
        pdf_path.write_bytes(r.content)
    else:
        sys.exit('Podaj --pdf ALBO --city + --map')

    print(f'Renderuje {pdf_path} przy {args.dpi} DPI ...')
    pages = convert_from_path(str(pdf_path), dpi=args.dpi, poppler_path=POPPLER)
    img = pages[0].convert('RGB')
    W, H = img.size
    print(f'Rozmiar obrazu: {W}x{H}')

    proc = preprocess(img)
    data = pytesseract.image_to_data(
        proc, lang=LANG, config='--psm 11 --oem 1',
        output_type=pytesseract.Output.DICT
    )

    canvas = img.copy()
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("arial.ttf", 14)
    except Exception:
        font = ImageFont.load_default()

    total_seen = 0
    total_kept = 0
    raw_words = []

    for i, text in enumerate(data['text']):
        txt = text.strip()
        if not txt:
            continue
        total_seen += 1
        conf = int(data['conf'][i])
        x, y = data['left'][i], data['top'][i]
        w, h = data['width'][i], data['height'][i]
        raw_words.append((txt, conf))

        keep = not (conf < CONF_MIN or len(txt) < LEN_MIN or GARBAGE.match(txt))
        color = (0, 200, 0) if keep else (230, 0, 0)
        if keep:
            total_kept += 1

        draw.rectangle([x, y, x + w, y + h], outline=color, width=2)
        draw.text((x, max(0, y - 16)), f'{txt} ({conf})', fill=color, font=font)

    canvas.save(args.out)
    print(f'\nZapisano: {args.out}')
    print(f'Slow wykrytych przez Tesseract (raw, przed filtrem): {total_seen}')
    print(f'Slow zachowanych po filtrze ocr_maps.py (conf>={CONF_MIN}, len>={LEN_MIN}, nie-smiec): {total_kept}')
    print(f'Odrzuconych: {total_seen - total_kept}  ({100*(total_seen-total_kept)/max(1,total_seen):.0f}%)')

    print('\n--- Pelny surowy zrzut (co Tesseract w ogole "zobaczyl") ---')
    for txt, conf in sorted(raw_words, key=lambda w: -w[1])[:60]:
        print(f'  {conf:3d}  {txt}')
    if len(raw_words) > 60:
        print(f'  ... i {len(raw_words) - 60} wiecej (zobacz --out PNG dla pelnego obrazu)')


if __name__ == '__main__':
    main()
