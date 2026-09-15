# Compiles your edited scripts/ocr_manual_skeleton.txt into
# public/ocr/manual_words.json (merging with whatever is already there —
# existing words for a mapId are replaced by what's in the skeleton for
# that mapId; mapIds not present in the skeleton are left untouched).
#
# Usage:
#   py scripts/ocr_compile_skeleton.py
#   py scripts/ocr_build_index.py      # then rebuild the search index

import json, re
from pathlib import Path

SKELETON = Path(r'C:\Users\wer\Desktop\Serwis\scripts\ocr_manual_skeleton.txt')
MANUAL   = Path(r'C:\Users\wer\Desktop\Serwis\public\ocr\manual_words.json')

HEADER_RE = re.compile(r'^#\s*(ahmp_[a-z0-9_\-]+)\s*\|')

def parse_skeleton(text):
    sections = {}
    current = None
    for line in text.splitlines():
        s = line.strip()
        m = HEADER_RE.match(s)
        if m:
            current = m.group(1)
            sections.setdefault(current, [])
            continue
        if not s or s.startswith('#'):
            continue
        if current:
            sections[current].append(s)
    return {k: v for k, v in sections.items() if v}

if not SKELETON.exists():
    raise SystemExit(f'Brak pliku {SKELETON} — najpierw uruchom ocr_generate_skeleton.py')

parsed = parse_skeleton(SKELETON.read_text(encoding='utf-8'))
print(f'Znaleziono {len(parsed)} map ze slowami w szkielecie')

manual = {}
if MANUAL.exists():
    manual = json.loads(MANUAL.read_text(encoding='utf-8'))

readme = manual.get('_readme', 'Recznie dopisane slowa/podpisy, ktorych OCR nie wylapal. '
                                'Klucz = mapId z cities.js, wartosc = lista slow/fraz. '
                                'Uruchom `py scripts/ocr_build_index.py` po edycji.')
manual = {k: v for k, v in manual.items() if not k.startswith('_')}
manual.update(parsed)

out = {'_readme': readme, **manual}
MANUAL.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Zapisano {len(manual)} map do {MANUAL}')
print('Teraz uruchom: py scripts/ocr_build_index.py')
