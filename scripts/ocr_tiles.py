# Tile-based OCR that keeps EVERY word position (ocr_maps.py keeps one position per distinct word
# and OCRs the whole sheet at once, which loses small street names).
#   py scripts/ocr_tiles.py ahmp_bydgoszcz_ii_1 [--score]
# Cuts the rendered map into overlapping tiles, upscales them, runs Tesseract on each and writes
# %TEMP%/ahmp_suggest/<mapId>/tile_words.json: [{text, conf, x, y}] (x,y = fractions of the map;
# x = word start, y = vertical centre, like a pin placed by hand at the start of a label).
# --score compares the result with the hand-made points in public/ocr/manual_words.json.
import sys, json, os, re, math
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from annotator_server import render_page
from PIL import Image, ImageFilter, ImageEnhance
import pytesseract

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
pytesseract.pytesseract.tesseract_cmd = os.environ.get('TESSERACT', r'C:\Program Files\Tesseract-OCR\tesseract.exe')
OUT = Path(os.environ.get('TEMP', '.')) / 'ahmp_suggest'
TILE, OVER, UP = 1400, 140, 1.6
LETTERS = re.compile(r'^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźżÄÖÜäöüß][A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźżÄÖÜäöüß\.\-]{2,}$')


def run(map_id, lang='pol+deu'):
    img = Image.open(render_page(map_id, 1)).convert('L')
    W, H = img.size
    words = {}
    step = TILE - OVER
    for y0 in range(0, H, step):
        for x0 in range(0, W, step):
            box = (x0, y0, min(W, x0 + TILE), min(H, y0 + TILE))
            t = img.crop(box)
            t = t.resize((int(t.size[0] * UP), int(t.size[1] * UP)), Image.LANCZOS)
            t = ImageEnhance.Contrast(t).enhance(1.6)
            d = pytesseract.image_to_data(t, lang=lang, config='--psm 11 --oem 1', output_type=pytesseract.Output.DICT)
            for i, tx in enumerate(d['text']):
                tx = tx.strip()
                c = float(d['conf'][i])
                if c < 60 or not LETTERS.match(tx):
                    continue
                x = (box[0] + d['left'][i] / UP) / W
                y = (box[1] + (d['top'][i] + d['height'][i] / 2) / UP) / H
                key = (tx.lower(), round(x, 2), round(y, 2))   # same word seen in two overlapping tiles
                if key not in words or words[key]['conf'] < c:
                    words[key] = {'text': tx, 'conf': int(c), 'x': round(x, 4), 'y': round(y, 4)}
    res = sorted(words.values(), key=lambda w: (w['y'], w['x']))
    p = OUT / map_id / 'tile_words.json'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(res, ensure_ascii=False), encoding='utf-8')
    return res


def norm(s):
    s = s.lower()
    for a, b in zip('ąćęłńóśźżäöüß', 'acelnoszzaous'):
        s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]', '', s)


def score(map_id, res):
    man = json.loads((ROOT / 'public' / 'ocr' / 'manual_words.json').read_text(encoding='utf-8')).get(map_id, [])
    man = [m for m in man if isinstance(m, dict)]
    hit_first = hit_pos = 0
    for m in man:
        f = norm(m['text'].split()[0])
        cand = [w for w in res if norm(w['text']) == f or (len(f) > 4 and f in norm(w['text']))]
        if cand:
            hit_first += 1
            if min(math.hypot(w['x'] - m['x'], w['y'] - m['y']) for w in cand) < 0.02:
                hit_pos += 1
    print(f'{map_id}: OCR słów {len(res)}; Twoich punktów {len(man)}; '
          f'znalezione słowa {hit_first}; w tym w dobrym miejscu (<2%): {hit_pos}')


if __name__ == '__main__':
    mid = sys.argv[1]
    r = run(mid)
    if '--score' in sys.argv:
        score(mid, r)
    else:
        print(mid, len(r), 'słów')
