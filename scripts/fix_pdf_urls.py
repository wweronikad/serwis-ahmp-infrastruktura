# Fixes stale pdfUrl values in cities.js by cross-checking each map against
# its city's official catalog page (https://atlasmiast.umk.pl/atlasy/<city>/),
# rather than guessing at UMK's naming convention (which varies: dot vs
# underscore in the number, .pdf vs .jpg, sometimes a different folder name
# entirely, sometimes one map split across several numbered files).
#
# For each map whose current pdfUrl 404s, this looks for a link on the
# catalog page whose filename matches after stripping separators/case (so
# "AHMP_Bochnia_B1.1.pdf" matches catalog's "AHMP_Bochnia_B1_1.pdf") and:
#   - exactly one match  -> fixes it in cities.js directly
#   - several matches (a map split into part files, e.g. Włocławek's
#     AHMP_Wloclawek_II_1.1/.2/.3.jpg) -> reported, not auto-applied
#   - no match at all    -> reported, not auto-applied
#
# Usage:
#   py scripts/fix_pdf_urls.py            # audit + fix what's unambiguous
#   py scripts/fix_pdf_urls.py --dry-run  # report only, don't touch cities.js

import re, sys, time
from pathlib import Path
import requests

CITIES_JS = Path(r'C:\Users\wer\Desktop\Serwis\src\data\cities.js')
LINK_RE = re.compile(r'href="(https?://atlasmiast\.umk\.pl/pliki/[^"]+\.(?:pdf|jpe?g))"', re.I)


def normalize(url):
    """Filename only, extension stripped, alnum-lowercase — so dot vs
    underscore in the number, and pdf vs jpg (UMK serves the same map as
    either depending on the city), don't matter, only the actual characters
    of the base name do."""
    name = url.rsplit('/', 1)[-1]
    name = re.sub(r'\.(pdf|jpe?g)$', '', name, flags=re.I)
    return re.sub(r'[^a-z0-9]', '', name.lower())


def load_catalog():
    src = CITIES_JS.read_text(encoding='utf-8')
    city_starts = list(re.finditer(r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'", src))
    map_re = re.compile(r"\{\s*id:\s*'([^']+)'[^}]*?pdfUrl:\s*'([^']+)'", re.S)
    result = []
    for i, m in enumerate(city_starts):
        city_id = m.group(1)
        seg_end = city_starts[i + 1].start() if i + 1 < len(city_starts) else len(src)
        for mm in map_re.finditer(src[m.end():seg_end]):
            result.append({'cityId': city_id, 'mapId': mm.group(1), 'pdfUrl': mm.group(2)})
    return result


def fetch_catalog_links(city_id):
    try:
        r = requests.get(f'https://atlasmiast.umk.pl/atlasy/{city_id}/', timeout=20)
        if r.status_code != 200:
            return None
        return LINK_RE.findall(r.text)
    except requests.RequestException:
        return None


def url_is_reachable(url):
    try:
        r = requests.head(url, timeout=15, allow_redirects=True)
        if r.status_code == 405:  # some servers don't support HEAD
            r = requests.get(url, timeout=15, stream=True)
        return r.status_code == 200
    except requests.RequestException:
        return False


if __name__ == '__main__':
    dry_run = '--dry-run' in sys.argv
    maps = load_catalog()
    city_ids = sorted({m['cityId'] for m in maps})
    print(f'{len(maps)} map, {len(city_ids)} miast\n')

    fixed = ambiguous = no_match = still_broken_ok = 0
    src = CITIES_JS.read_text(encoding='utf-8')

    for ci, city_id in enumerate(city_ids, 1):
        city_maps = [m for m in maps if m['cityId'] == city_id]
        broken = [m for m in city_maps if not url_is_reachable(m['pdfUrl'])]
        if not broken:
            continue
        print(f'[{ci}/{len(city_ids)}] {city_id}: {len(broken)}/{len(city_maps)} niedziałających pdfUrl')

        links = fetch_catalog_links(city_id)
        if links is None:
            print(f'    brak strony katalogu dla {city_id} — pomijam')
            no_match += len(broken)
            continue
        by_norm = {}
        for link in links:
            by_norm.setdefault(normalize(link), []).append(link)
        by_norm = {k: sorted(set(v)) for k, v in by_norm.items()}  # same map
        # often linked twice on one catalog page (main list + thumbnail)

        for m in broken:
            key = normalize(m['pdfUrl'])
            candidates = by_norm.get(key, [])
            if len(candidates) == 1 and candidates[0] != m['pdfUrl']:
                print(f'    FIX {m["mapId"]}: {m["pdfUrl"]} -> {candidates[0]}')
                if not dry_run:
                    src = src.replace(f"pdfUrl: '{m['pdfUrl']}'", f"pdfUrl: '{candidates[0]}'", 1)
                fixed += 1
            elif len(candidates) > 1:
                print(f'    WIELE CZĘŚCI {m["mapId"]}: {candidates}')
                ambiguous += 1
            elif candidates and candidates[0] == m['pdfUrl']:
                # catalog itself points at a URL that still 404s — genuinely gone
                still_broken_ok += 1
            else:
                print(f'    BRAK DOPASOWANIA {m["mapId"]}: {m["pdfUrl"]}')
                no_match += 1
        time.sleep(0.15)  # be polite to UMK's server across ~40 catalog pages

    if not dry_run and fixed:
        CITIES_JS.write_text(src, encoding='utf-8')

    print(f'\nNaprawione automatycznie: {fixed}')
    print(f'Podzielone na kilka plików (do ręcznej decyzji): {ambiguous}')
    print(f'Bez dopasowania na stronie katalogu (prawdopodobnie faktycznie zdjęte): {no_match + still_broken_ok}')
    if dry_run:
        print('\n(--dry-run: cities.js NIE zostało zmienione)')
