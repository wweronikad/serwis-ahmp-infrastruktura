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

ROOT         = Path(__file__).resolve().parent.parent
OCR_DIR      = ROOT / 'public' / 'ocr'
OUT_FILE     = OCR_DIR / 'index.json'
CITIES_JS    = ROOT / 'src' / 'data' / 'cities.js'
MANUAL_FILE  = OCR_DIR / 'manual_words.json'

def load_manual_words():
    """mapId -> extra entries a human typed in (cursive labels OCR can't read),
    or clicked in scripts/annotator_server.py. Each entry is either a plain
    string (search-only, no position) or {"text","x","y"} (also gets a pin
    on the interactive map). See public/ocr/manual_words.json for the format."""
    if not MANUAL_FILE.exists():
        return {}
    data = json.loads(MANUAL_FILE.read_text(encoding='utf-8'))
    return {k: v for k, v in data.items() if not k.startswith('_')}

def load_map_titles():
    # NOTE: scans per-city segments (bounded by the next "id: '...', name: '...'"
    # city header) rather than a single global regex — a flat `id...title`
    # regex over the whole file matches each city's own `id` against the
    # *first map's* title inside it (since a city object has no `title` key
    # of its own), which then swallows that map's real id/title pair too and
    # leaves it missing from the result.
    src = CITIES_JS.read_text(encoding='utf-8')
    city_starts = list(re.finditer(r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'", src))
    map_re = re.compile(r"\{\s*id:\s*'([^']+)',\s*title:\s*'([^']*)'", re.S)
    titles = {}
    for i, m in enumerate(city_starts):
        seg_start = m.end()
        seg_end = city_starts[i + 1].start() if i + 1 < len(city_starts) else len(src)
        for mm in map_re.finditer(src[seg_start:seg_end]):
            titles[mm.group(1)] = mm.group(2)
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

by_map = {}  # mapId -> {cityId, path, raw_words: [{text,conf,x,y}, ...], had_manual}

for json_file in sorted(OCR_DIR.glob('**/*.json')):
    if json_file.name in ('index.json', 'manual_words.json'):
        continue
    try:
        data = json.loads(json_file.read_text(encoding='utf-8'))
        map_id  = data['mapId']
        city_id = data['cityId']
        words   = data.get('words', [])
        # conf==100 marks a word injected here from manual_words.json on a
        # previous run — strip it and recompute fresh from the current
        # manual_words.json below, so an edit or removal there (e.g. via
        # scripts/annotator_server.py) is reflected instead of accumulating
        # stale pins forever.
        ocr_words = [w for w in words if w.get('conf') != 100]
        by_map[map_id] = {
            'cityId': city_id, 'path': json_file, 'raw_words': ocr_words,
            'had_manual': len(ocr_words) != len(words),
        }
    except Exception as e:
        print(f'  ERR {json_file}: {e}')

# Merge in manually-typed/clicked entries — also creates entries for maps
# where OCR never ran at all (e.g. source PDF is currently 404 on
# atlasmiast.umk.pl). Dict entries ({"text","x","y"}, from
# scripts/annotator_server.py) also get written back into the per-map OCR
# JSON so they show up as pins on the interactive map, exactly like OCR'd
# words; plain-string entries (from the old skeleton-txt workflow) are
# search-only since they have no position.
for map_id, extra in manual.items():
    city_id = city_for(map_id, city_ids)
    entry = by_map.setdefault(map_id, {
        'cityId': city_id,
        'path': (OCR_DIR / city_id / f'{map_id}.json') if city_id else None,
        'raw_words': [], 'had_manual': False,
    })
    # Dedup key is (text, position) not just text — the same label can
    # legitimately appear twice at different spots on a map (e.g. a city
    # name written at both edges of a cadastral sheet), and each should
    # get its own pin.
    seen_keys = {(w['text'].lower(), round(w['x'], 4), round(w['y'], 4)) for w in entry['raw_words']}
    for item in extra:
        if isinstance(item, dict) and 'x' in item and 'y' in item:
            key = (item['text'].lower(), round(item['x'], 4), round(item['y'], 4))
            if key in seen_keys:
                continue
            entry['raw_words'].append({'text': item['text'], 'conf': 100, 'x': item['x'], 'y': item['y']})
            seen_keys.add(key)

# Write manual pins back into the per-map OCR JSON files the frontend reads
# for map highlighting (InteractiveMap.jsx fetches ocr/<city>/<mapId>.json
# directly — it never sees manual_words.json). Only touch files that are
# currently affected, or were affected by manual data on a previous run
# (so editing/removing a point in the annotator actually takes effect here,
# instead of the stale pin lingering in the file forever).
for map_id, info in by_map.items():
    has_manual_now = any(isinstance(e, dict) for e in manual.get(map_id, []))
    if not (has_manual_now or info['had_manual']) or info['path'] is None:
        continue
    if info['raw_words']:
        info['path'].parent.mkdir(parents=True, exist_ok=True)
        info['path'].write_text(
            json.dumps({'mapId': map_id, 'cityId': info['cityId'], 'words': info['raw_words']},
                       ensure_ascii=False, separators=(',', ':')),
            encoding='utf-8'
        )
    elif info['path'].exists():
        # was manual-only and all its points got removed — nothing left to keep
        info['path'].unlink()

entries = []
for map_id, info in sorted(by_map.items()):
    words = [w['text'] for w in info['raw_words'] if w['conf'] >= 60]
    for item in manual.get(map_id, []):
        if isinstance(item, str):
            words.append(item)
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
