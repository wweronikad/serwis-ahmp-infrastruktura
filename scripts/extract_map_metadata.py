# Extracts bibliographic metadata straight from each map PDF's embedded text
# layer — no OCR involved, so it's exact. Every AHMP map PDF carries a short
# real-text caption in its footer (not a scan of one):
#
#   1.1. Plan katastralny Biecza i Korczyny (centrum, przerys), 1850
#   Cadastral plan of Biecz and Korczyna (town centre, copy), 1850
#   BIECZ, Atlas historyczny miast polskich (V, 7, 2021)
#
# That gives the full publication citation (tom, zeszyt, rok wydania) and,
# for reproduced originals, a reproduction-scale note ("[skala reprodukcji
# 40%]"). Maps of type 'reconstruction'/'map' (the "Synteza historyczna" /
# "Rozwój przestrzenny" sheets) are vector graphics, not scans, and additionally
# carry "Skala 1:10 000" and an "Opracowali: <authors>" credit line in the
# same cleanly-encoded caption font (the legend body itself uses a custom
# font pdfplumber can't decode for Polish diacritics — skipped, not needed
# here).
#
# Usage:
#   py scripts/extract_map_metadata.py                 # all maps
#   py scripts/extract_map_metadata.py biecz bochnia    # just these cities
#
# Output: public/ocr/map_metadata.json — {mapId: {tom, zeszyt, rokWydania,
#         skalaReprodukcji?, skala?, autorzy?}}

import json, re, sys, hashlib
from pathlib import Path
import requests
import pdfplumber

ROOT      = Path(r'C:\Users\wer\Desktop\Serwis')
CITIES_JS = ROOT / 'src' / 'data' / 'cities.js'
OUT_FILE  = ROOT / 'public' / 'ocr' / 'map_metadata.json'
PDF_CACHE = Path(r'C:\Users\wer\AppData\Local\Temp\ahmp_pdf_cache')
PDF_CACHE.mkdir(parents=True, exist_ok=True)

CITATION_RE = re.compile(
    r'Atlas historyczny miast polskich\s*\(([IVXLCDM]+),\s*(\d+),\s*(\d{4})\)'
)
REPRO_SCALE_RE = re.compile(r'\[\s*skala reprodukcji\s*([\d]+\s*%)\s*\]', re.I)
MAP_SCALE_RE   = re.compile(r'Skala\s+(1\s*:\s*[\d\s]+?)(?:\s*\n|\s{2,}|Scale)', re.I)
AUTHORS_RE     = re.compile(r'Opracowa(?:li|ł)\s*:\s*([^\n]+)', re.I)


def load_catalog():
    """{cityId, mapId, pdfUrl} for every map, parsed per-city segment (not by
    mapId-prefix guessing) so it can't misattribute a map to the wrong city."""
    src = CITIES_JS.read_text(encoding='utf-8')
    city_starts = list(re.finditer(r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'", src))
    map_re = re.compile(r"\{\s*id:\s*'([^']+)'[^}]*?pdfUrl:\s*'([^']+)'", re.S)
    result = []
    for i, m in enumerate(city_starts):
        city_id = m.group(1)
        seg_start = m.end()
        seg_end = city_starts[i + 1].start() if i + 1 < len(city_starts) else len(src)
        for mm in map_re.finditer(src[seg_start:seg_end]):
            result.append({'cityId': city_id, 'mapId': mm.group(1), 'pdfUrl': mm.group(2)})
    return result


class DownloadError(Exception):
    pass


def download_pdf(url):
    pdf_path = PDF_CACHE / (hashlib.md5(url.encode()).hexdigest() + '.pdf')
    if pdf_path.exists():
        return pdf_path
    r = requests.get(url, timeout=30)
    if r.status_code != 200:
        raise DownloadError(f'HTTP {r.status_code}')
    pdf_path.write_bytes(r.content)
    return pdf_path


def extract_page_text(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        # use_text_flow keeps each text run's original character order —
        # the plain default re-sorts purely by position, and on maps whose
        # PL/EN captions sit at (almost) the same baseline that interleaves
        # the two strings letter-by-letter. Still imperfect (can interleave
        # whole words when two lines share a baseline), so the citation is
        # extracted separately per *city* below rather than trusted per-map.
        return pdf.pages[0].extract_text(use_text_flow=True) or ''


def extract_metadata(text):
    """Scale + authors only — independent of whether the citation line (at
    the very bottom, most prone to the overlap-interleaving above) parses."""
    out = {}

    m = REPRO_SCALE_RE.search(text)
    if m:
        out['skalaReprodukcji'] = re.sub(r'\s+', '', m.group(1))

    m = MAP_SCALE_RE.search(text)
    if m:
        out['skala'] = re.sub(r'\s+', ' ', m.group(1)).strip()

    m = AUTHORS_RE.search(text)
    if m:
        authors = m.group(1).strip()
        if len(authors) < 200 and 'Prepared by' not in authors:
            out['autorzy'] = authors

    return out


def extract_citation(text):
    """(tom, zeszyt, rok) if this page's citation line happened to parse
    cleanly — same for every map in a city, so one clean hit per city
    (see main loop) is all that's needed."""
    citations = CITATION_RE.findall(text)
    return citations[-1] if citations else None


if __name__ == '__main__':
    only = set(sys.argv[1:]) or None
    maps = load_catalog()
    if only:
        maps = [m for m in maps if m['cityId'] in only]
    print(f'Do przetworzenia: {len(maps)} map\n')

    existing = {}
    if OUT_FILE.exists():
        existing = json.loads(OUT_FILE.read_text(encoding='utf-8'))
        existing = {k: v for k, v in existing.items() if not k.startswith('_')}

    page_text = {}     # mapId -> extracted text (cached so we hit the PDF once)
    per_map_meta = {}  # mapId -> {skala?, skalaReprodukcji?, autorzy?}
    city_citation = {} # cityId -> (tom, zeszyt, rok) — first clean hit wins,
                        # then applied to every map in that city (same fascicle)

    n404 = nerr = 0
    for i, entry in enumerate(maps, 1):
        map_id, city_id = entry['mapId'], entry['cityId']
        print(f'[{i}/{len(maps)}] {map_id}', end='  ')
        try:
            try:
                pdf_path = download_pdf(entry['pdfUrl'])
            except DownloadError as e:
                print(f'PDF niedostępny ({e})')
                n404 += 1
                continue
            text = extract_page_text(pdf_path)
            page_text[map_id] = (text, city_id)
            per_map_meta[map_id] = extract_metadata(text)
            if city_id not in city_citation:
                citation = extract_citation(text)
                if citation:
                    city_citation[city_id] = citation
            print(per_map_meta[map_id])
        except Exception as e:
            print(f'BŁĄD: {e}')
            nerr += 1

    # Second pass: a city whose first few maps all had a garbled citation
    # line still gets one, as long as ANY of its maps parsed cleanly.
    missing_cities = {city_id for _, city_id in page_text.values()} - set(city_citation)
    for map_id, (text, city_id) in page_text.items():
        if city_id in missing_cities:
            citation = extract_citation(text)
            if citation:
                city_citation[city_id] = citation
                missing_cities.discard(city_id)

    ok = 0
    for map_id, (_, city_id) in page_text.items():
        meta = dict(per_map_meta[map_id])
        citation = city_citation.get(city_id)
        if citation:
            meta['tom'], meta['zeszyt'], meta['rokWydania'] = citation
        # Keep skala/autorzy even when this city's citation never parsed
        # cleanly (~10 cities — same caption-overlap issue, just a variant
        # that also displaces the year) — no reason to throw that away too.
        if meta:
            existing[map_id] = meta
            ok += 1

    out = {'_readme': ('Metadane wyciągnięte automatycznie z warstwy tekstowej PDF-ów map '
                        '(bez OCR — 100% dokładne, poza pojedynczymi mapami bez cytowania). '
                        'Zbudowane przez scripts/extract_map_metadata.py.'),
           **{k: v for k, v in sorted(existing.items())}}
    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
    no_citation = len(page_text) - ok
    print(f'\nOK: {ok}  |  404: {n404}  |  błędy: {nerr}  |  bez cytowania (całe miasto): {no_citation}')
    if missing_cities:
        print(f'Miasta bez ŻADNEGO czystego cytowania: {sorted(missing_cities)}')
    print(f'Zapisano: {OUT_FILE}')
