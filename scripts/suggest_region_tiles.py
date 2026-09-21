# Cuts a chosen region of a map into ruler tiles (for maps with several panels).
#   py scripts/suggest_region_tiles.py ahmp_elblag_ii_4 a 0.04 0.17 0.49 0.94 [cols rows]
# Tiles are named <prefix><row><col> and appended to meta.json, so suggest_convert.py
# accepts ["text", "a01", dx, dy] readings. Region is given as fractions of the whole map.
import sys, json, os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).parent))
from annotator_server import render_page

Image.MAX_IMAGE_PIXELS = None
OUT = Path(os.environ.get('TEMP', '.')) / 'ahmp_suggest'
DISPLAY_W = 1900


def main(map_id, prefix, fx0, fy0, fx1, fy1, cols=3, rows=3):
    img = Image.open(render_page(map_id, 1)).convert('RGB')
    W, H = img.size
    rx0, ry0, rx1, ry1 = fx0 * W, fy0 * H, fx1 * W, fy1 * H
    tw, th = (rx1 - rx0) / cols, (ry1 - ry0) / rows
    out = OUT / map_id
    out.mkdir(parents=True, exist_ok=True)
    meta_path = out / 'meta.json'
    meta = json.loads(meta_path.read_text(encoding='utf-8')) if meta_path.exists() else {'W': W, 'H': H, 'tiles': {}}
    try:
        font = ImageFont.truetype('arial.ttf', 15)
    except Exception:
        font = ImageFont.load_default()
    pad = 60
    for r in range(rows):
        for c in range(cols):
            x0, y0 = max(0, int(rx0 + c * tw - pad)), max(0, int(ry0 + r * th - pad))
            x1, y1 = min(W, int(rx0 + (c + 1) * tw + pad)), min(H, int(ry0 + (r + 1) * th + pad))
            t = img.crop((x0, y0, x1, y1))
            s = DISPLAY_W / t.size[0]
            t = t.resize((DISPLAY_W, int(t.size[1] * s)), Image.LANCZOS)
            d = ImageDraw.Draw(t)
            w2, h2 = t.size
            for gx in range(0, w2, 100):
                d.line([(gx, 0), (gx, 14)], fill=(255, 0, 0), width=2)
                d.text((gx + 2, 14), str(gx), fill=(255, 0, 0), font=font)
                d.line([(gx, h2 - 14), (gx, h2)], fill=(255, 0, 0), width=2)
            for gy in range(0, h2, 100):
                d.line([(0, gy), (14, gy)], fill=(255, 0, 0), width=2)
                d.text((16, gy - 8), str(gy), fill=(255, 0, 0), font=font)
                d.line([(w2 - 14, gy), (w2, gy)], fill=(255, 0, 0), width=2)
            name = f'{prefix}{r}{c}'
            t.save(out / f'{name}.png')
            meta['tiles'][name] = {'x0': x0, 'y0': y0, 'scale': s, 'w': w2, 'h': h2}
    meta_path.write_text(json.dumps(meta), encoding='utf-8')
    print(out, W, H, 'tiles:', rows * cols)


if __name__ == '__main__':
    a = sys.argv[1:]
    main(a[0], a[1], *map(float, a[2:6]), *(int(x) for x in a[6:8]))
