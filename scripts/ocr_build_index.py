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

OCR_DIR      = Path(r'C:\Users\wer\Desktop\Serwis\public\ocr')
OUT_FILE     = OCR_DIR / 'index.json'
CITIES_JS    = Path(r'C:\Users\wer\Desktop\Serwis\src\data\cities.js')
MANUAL_FILE  = OCR_DIR / 'manual_words.json'

def load_manual_words():
    """mapId -> extra words a human typed in (cursive labels OCR can't read).
    See public/ocr/manual_words.json for the format."""
    if not MANUAL_FILE.exists():
        return {}
    data = json.loads(MANUAL_FILE.read_text(encoding='utf-8'))
    return {k: v for k, v in data.items() if not k.startswith('_')}

def load_map_titles():
    src = CITIES_JS.read_text(encoding='utf-8')
    titles = {}
    for m in re.finditer(r"id:\s*'([^']+)'[^}]*?title:\s*'([^']+)'", src, re.S):
        titles[m.group(1)] = m.group(2)
    return titles

def load_city_ids():
    src = CITIES_JS.read_text(encoding='utf-8')
    return re.findall(r"id:\s*'([^']+)'\s*,\s*name:", src)

def city_for(map_id, city_ids):
    for cid in city_ids:
        slug = cid.replace('-', '_')
        if map_id.startswith(f'ahmp_{slug}_') or map_id.startswith(f'ahmp_{slug}'):
            return cid
    return None

titles      = load_map_titles()
city_ids    = load_city_ids()
manual      = load_manual_words()
print(f'Loaded {len(titles)} map titles, {len(manual)} maps with manual words')

by_map = {}  # mapId -> {cityId, words: [str, ...]}

for json_file in sorted(OCR_DIR.glob('**/*.json')):
    if json_file.name in ('index.json', 'manual_words.json'):
        continue
    try:
        data = json.loads(json_file.read_text(encoding='utf-8'))
        map_id  = data['mapId']
        city_id = data['cityId']
        words   = [w['text'] for w in data['words'] if w['conf'] >= 60]
        by_map[map_id] = {'cityId': city_id, 'words': words}
    except Exception as e:
        print(f'  ERR {json_file}: {e}')

# Merge in manually-typed words — also creates entries for maps where OCR
# never ran at all (e.g. source PDF is currently 404 on atlasmiast.umk.pl).
for map_id, extra_words in manual.items():
    entry = by_map.setdefault(map_id, {'cityId': city_for(map_id, city_ids), 'words': []})
    entry['words'] = entry['words'] + list(extra_words)

entries = []
for map_id, info in sorted(by_map.items()):
    words = info['words']
    if not words:
        continue
    entries.append({
        'id':      map_id,
        'mapId':   map_id,
        'cityId':  info['cityId'],
        'title':   titles.get(map_id, map_id),
        'words':   ' '.join(words),
    })
    tag = ' (+ recznie)' if map_id in manual else ''
    print(f'  {map_id}: {len(words)} words{tag}')

OUT_FILE.write_text(
    json.dumps(entries, ensure_ascii=False, separators=(',', ':')),
    encoding='utf-8'
)
print(f'\nIndex: {len(entries)} maps -> {OUT_FILE}')
