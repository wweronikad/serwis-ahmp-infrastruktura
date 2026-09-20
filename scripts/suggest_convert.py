# Converts label readings made on an overview image into suggestions for the annotator.
#   py scripts/suggest_convert.py readings.json [--qa]
# readings.json: {"map": id, "w": overview width, "h": overview height, "items": [[text, x, y], ...]}
# Writes/merges public/ocr/suggested_words.json (fractions of the whole map image) and,
# with --qa, an overlay PNG in <TEMP>/ahmp_suggest/<mapId>/qa.png to check pin positions.
import sys, json, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'ocr' / 'suggested_words.json'


def main(path, qa=False):
    d = json.load(open(path, encoding='utf-8'))
    if 'w' not in d:                           # default: size of the overview image
        from PIL import Image
        d['w'], d['h'] = Image.open(Path(os.environ.get('TEMP', '.')) / 'ahmp_suggest' / d['map'] / 'overview.png').size
    items = []
    tiles = None
    for it in d['items']:
        if len(it) == 3:                       # [text, x, y] on the overview image
            t, x, y = it
            items.append({'text': t, 'x': round(x / d['w'], 4), 'y': round(y / d['h'], 4)})
        else:                                  # [text, tile, dx, dy] on a ruler tile
            if tiles is None:
                tiles = json.load(open(Path(os.environ.get('TEMP', '.')) / 'ahmp_suggest' / d['map'] / 'meta.json', encoding='utf-8'))
            t, tn, dx, dy = it
            m = tiles['tiles'][tn]
            items.append({'text': t, 'x': round((m['x0'] + dx / m['scale']) / tiles['W'], 4),
                          'y': round((m['y0'] + dy / m['scale']) / tiles['H'], 4)})
    data = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    data[d['map']] = items
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print(d['map'], len(items), 'propozycji ->', OUT)
    if qa:
        from PIL import Image, ImageDraw, ImageFont
        base = Path(os.environ.get('TEMP', '.')) / 'ahmp_suggest' / d['map']
        ov = Image.open(base / 'overview.png').convert('RGB')
        dr = ImageDraw.Draw(ov)
        try: f = ImageFont.truetype('arial.ttf', 11)
        except Exception: f = ImageFont.load_default()
        for i, it in enumerate(items):
            x, y = it['x'] * ov.size[0], it['y'] * ov.size[1]
            dr.ellipse([x - 4, y - 4, x + 4, y + 4], outline=(255, 0, 255), width=2)
            dr.text((x + 6, y - 6), str(i), fill=(255, 0, 255), font=f)
        ov.save(base / 'qa.png')


if __name__ == '__main__':
    main(sys.argv[1], '--qa' in sys.argv)
