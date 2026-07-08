# Build public/ocr/index.json — flat search index for all OCR'd maps.
# Run after ocr_maps.py to regenerate the frontend search index.
#
# Usage:
#   py scripts/ocr_build_index.py
#
# Input:  public/ocr/<cityId>/<mapId>.json  (produced by ocr_maps.py)
# Output: public/ocr/index.json

import json, re
from pathlib import Path

OCR_DIR   = Path(r'C:\Users\wer\Desktop\Serwis\public\ocr')
OUT_FILE  = OCR_DIR / 'index.json'
CITIES_JS = Path(r'C:\Users\wer\Desktop\Serwis\src\data\cities.js')

def load_map_titles():
    src = CITIES_JS.read_text(encoding='utf-8')
    titles = {}
    for m in re.finditer(r"id:\s*'([^']+)'[^}]*?title:\s*'([^']+)'", src, re.S):
        titles[m.group(1)] = m.group(2)
    return titles

titles = load_map_titles()
print(f'Loaded {len(titles)} map titles')

entries = []
for json_file in sorted(OCR_DIR.glob('**/*.json')):
    if json_file.name == 'index.json':
        continue
    try:
        data = json.loads(json_file.read_text(encoding='utf-8'))
        map_id  = data['mapId']
        city_id = data['cityId']
        words   = [w['text'] for w in data['words'] if w['conf'] >= 60]
        if not words:
            continue
        entries.append({
            'id':      map_id,
            'mapId':   map_id,
            'cityId':  city_id,
            'title':   titles.get(map_id, map_id),
            'words':   ' '.join(words),
        })
        print(f'  {map_id}: {len(words)} words')
    except Exception as e:
        print(f'  ERR {json_file}: {e}')

OUT_FILE.write_text(
    json.dumps(entries, ensure_ascii=False, separators=(',', ':')),
    encoding='utf-8'
)
print(f'\nIndex: {len(entries)} maps -> {OUT_FILE}')
