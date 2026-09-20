# Cuts a map into tiles with a coordinate ruler, for reading labels by eye.
#   py scripts/suggest_tiles.py ahmp_brzeg_4 [cols rows]
# Output: <TEMP>/ahmp_suggest/<mapId>/t<r><c>.png + meta.json. The ruler numbers are
# pixel positions inside the tile *as displayed*; convert_suggestions.py turns
# (tile, dx, dy) readings into x/y fractions of the whole map image.
import sys, json, os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).parent))
from annotator_server import render_page

Image.MAX_IMAGE_PIXELS = None
OUT = Path(os.environ.get('TEMP', '.')) / 'ahmp_suggest'
DISPLAY_W = 1900          # width at which a tile is shown / read


def main(map_id, cols=3, rows=3):
    img = Image.open(render_page(map_id, 1)).convert('RGB')
    W, H = img.size
    tw, th = W / cols, H / rows
    out = OUT / map_id
    out.mkdir(parents=True, exist_ok=True)
    try:
        font = ImageFont.truetype('arial.ttf', 15)
    except Exception:
        font = ImageFont.load_default()
    meta = {'W': W, 'H': H, 'tiles': {}}
    pad = 70
    for r in range(rows):
        for c in range(cols):
            x0, y0 = max(0, int(c * tw - pad)), max(0, int(r * th - pad))
            x1, y1 = min(W, int((c + 1) * tw + pad)), min(H, int((r + 1) * th + pad))
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
            name = f't{r}{c}'
            t.save(out / f'{name}.png')
            meta['tiles'][name] = {'x0': x0, 'y0': y0, 'scale': s, 'w': w2, 'h': h2}
    (out / 'meta.json').write_text(json.dumps(meta), encoding='utf-8')
    ov = img.copy(); ov.thumbnail((1600, 1600)); ov.save(out / 'overview.png')
    print(out, W, H, 'tiles:', rows * cols)


if __name__ == '__main__':
    a = sys.argv[1:]
    main(a[0], int(a[1]) if len(a) > 2 else 3, int(a[2]) if len(a) > 2 else 3)
