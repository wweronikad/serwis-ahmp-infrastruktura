# -*- coding: utf-8 -*-
"""
map_to_iiif.py
==============
Konwersja map Atlasu Historycznego Miast Polskich (PDF lub obraz rastrowy)
na statyczny zasob IIIF Image API 3.0, profil Level 0 - gotowy do hostingu
na GitHub Pages i georeferencji w Allmaps Editor.

Potok (odtwarza strukture kafli zaobserwowana w repozytorium serwis-ahmp):
  1. Rasteryzacja PDF -> obraz (Poppler / pdf2image). Renderowanie strony,
     a nie ekstrakcja, poprawnie obsluguje pliki w przestrzeni CMYK i nie
     odwraca kolorow.
  2. Kafelkowanie libvips: `vips dzsave --layout iiif3 --tile-size 256`
     -> katalog z kaflami JPEG 256x256, poziomy powiekszenia [1,2,4,8]
     oraz plik info.json (ImageService3, profile level0).
  3. Ustawienie pola "id" w info.json na docelowy adres publikacji.

Wynik dla jednej mapy:
  <OUT>/<nazwa>/
      info.json
      <region>/<rozmiar>/0/default.jpg   (np. 1024,0,512,512/256,256/0/default.jpg)

Wymagania:
  - libvips (narzedzie `vips` w PATH)         https://www.libvips.org
  - Poppler (dla pdf2image)                   https://poppler.freedesktop.org
  - Python: pip install pdf2image pillow requests

Przyklady uzycia:
  # pojedyncza mapa z lokalnego PDF
  py map_to_iiif.py single --input AHMP_Biecz_1.1.pdf ^
       --out public_iiif --name biecz/ahmp_biecz_1_1 ^
       --id-base https://wweronikad.github.io/serwis-ahmp

  # wsadowo: wszystkie mapy z cities.js (pobiera PDF-y ze strony Atlasu)
  py map_to_iiif.py batch --cities src/data/cities.js ^
       --out public_iiif ^
       --id-base https://wweronikad.github.io/serwis-ahmp
"""

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# -- Parametry domyslne (zgodne z zaobserwowana struktura kafli) --
DEFAULT_DPI = 150          # rozdzielczosc rasteryzacji PDF (natywna rozdzielczosc obrazu)
DEFAULT_TILE = 256         # rozmiar kafla w pikselach
DEFAULT_Q = 90             # jakosc JPEG kafli


# -- Krok 1: rasteryzacja PDF -> obraz --
def render_pdf_to_image(pdf_path: Path, dpi: int, tmp_dir: Path) -> Path:
    """Renderuje pierwsza strone PDF do bezstratnego PNG przez Poppler.

    Renderowanie (a nie ekstrakcja) zapewnia poprawne barwy takze dla plikow
    zapisanych w CMYK.
    """
    try:
        from pdf2image import convert_from_path
    except ImportError:
        sys.exit("Brak pakietu pdf2image. Zainstaluj: pip install pdf2image pillow "
                 "oraz Poppler (patrz naglowek skryptu).")

    pages = convert_from_path(str(pdf_path), dpi=dpi)
    if not pages:
        raise RuntimeError("Nie udalo sie wyrenderowac: %s" % pdf_path)
    if len(pages) > 1:
        print("    Uwaga: PDF ma %d stron - uzyto pierwszej." % len(pages))

    out_png = tmp_dir / "render.png"
    pages[0].convert("RGB").save(out_png, "PNG")
    return out_png


def ensure_raster(input_path: Path, dpi: int, tmp_dir: Path) -> Path:
    """Zwraca sciezke do obrazu rastrowego gotowego do kafelkowania."""
    if input_path.suffix.lower() == ".pdf":
        return render_pdf_to_image(input_path, dpi, tmp_dir)
    # juz obraz rastrowy (png/jpg/tif/...) - libvips wczyta go bezposrednio
    return input_path


# -- Krok 2: kafelkowanie libvips (IIIF 3, Level 0) --
def tile_iiif(raster_path: Path, out_root: Path, name: str,
              vips_bin: str, tile: int, quality: int) -> Path:
    """Uruchamia `vips dzsave --layout iiif3` i zwraca sciezke katalogu wyniku."""
    target_dir = out_root / name
    if target_dir.exists():
        shutil.rmtree(target_dir)
    target_dir.parent.mkdir(parents=True, exist_ok=True)

    # dzsave tworzy katalog o nazwie = ostatni segment sciezki wyjsciowej
    out_base = str(out_root / name)   # bez rozszerzenia; libvips dopisze katalog
    cmd = [
        vips_bin, "dzsave", str(raster_path), out_base,
        "--layout", "iiif3",
        "--tile-size", str(tile),
        "--suffix", ".jpg[Q=%d]" % quality,
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except FileNotFoundError:
        sys.exit("Nie znaleziono narzedzia libvips '%s'. "
                 "Zainstaluj libvips albo wskaz sciezke opcja --vips-bin." % vips_bin)
    except subprocess.CalledProcessError as e:
        sys.exit("Blad vips dzsave:\n%s" % e.stderr)

    if not (target_dir / "info.json").exists():
        sys.exit("Nie powstal info.json w %s - sprawdz wersje libvips "
                 "(potrzebne wsparcie layoutu iiif3)." % target_dir)
    return target_dir


# -- Krok 3: ustawienie pola "id" w info.json --
def set_info_id(tile_dir: Path, id_base: str, name: str) -> str:
    """Ustawia info.json['id'] na <id_base>/<name> (bez koncowego ukosnika)."""
    info_path = tile_dir / "info.json"
    data = json.loads(info_path.read_text(encoding="utf-8"))
    full_id = "%s/%s" % (id_base.rstrip("/"), name.strip("/"))
    data["id"] = full_id
    info_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return full_id


# -- Zlozenie potoku dla jednej mapy --
def process_one(input_path: Path, out_root: Path, name: str, id_base: str,
                dpi: int, tile: int, quality: int, vips_bin: str) -> None:
    print("  -> %s" % name)
    with tempfile.TemporaryDirectory() as tmp:
        raster = ensure_raster(input_path, dpi, Path(tmp))
        tile_dir = tile_iiif(raster, out_root, name, vips_bin, tile, quality)
    full_id = set_info_id(tile_dir, id_base, name)
    n_tiles = sum(1 for _ in tile_dir.rglob("*.jpg"))
    print("     OK  %d kafli, id = %s" % (n_tiles, full_id))


# -- Tryb wsadowy: parsowanie cities.js --
def load_maps_from_cities(cities_js: Path):
    """Wyciaga (cityId, mapId, pdfUrl) z pliku cities.js.

    Miasto rozpoznaje sie po tym, ze pole id jest bezposrednio nastepowane
    przez name: (obiekt miasta), a mapy po tym, ze zawieraja pdfUrl:. Kazda
    mape przypisuje sie do miasta, ktorego naglowek poprzedza ja w pliku —
    dzieki temu przypisanie nie zalezy od zgodnosci nazw (id mapy nie musi
    zaczynac sie od id miasta).
    """
    src = cities_js.read_text(encoding="utf-8")

    # Naglowki miast: id: '...' , (nastepnie) name:
    city_hdr = re.compile(r"id:\s*'([^']+)'\s*,\s*name:", re.S)
    cities = [(m.start(), m.group(1)) for m in city_hdr.finditer(src)]

    def city_for(pos):
        current = None
        for start, cid in cities:
            if start <= pos:
                current = cid
            else:
                break
        return current

    # Obiekty map: { id: '...' ... pdfUrl: '...' }.
    # Negatywny lookahead (?!id:) gwarantuje, ze miedzy przechwyconym id
    # a pdfUrl nie pojawia sie kolejne id: — dzieki temu dopasowanie zaczyna
    # sie od wlasciwego obiektu mapy, a nie od obejmujacego go obiektu miasta.
    map_re = re.compile(
        r"\{\s*id:\s*'([^']+)'(?:(?!\bid:).)*?pdfUrl:\s*'([^']+)'", re.S)
    result = []
    for m in map_re.finditer(src):
        map_id, pdf_url = m.group(1), m.group(2)
        city_id = city_for(m.start())
        if city_id:
            result.append((city_id, map_id, pdf_url))
    return result


def download_pdf(url: str, dest: Path) -> bool:
    if dest.exists():
        return True
    try:
        import requests
    except ImportError:
        sys.exit("Brak pakietu requests. Zainstaluj: pip install requests")
    try:
        r = requests.get(url, timeout=60, stream=True)
        if r.status_code != 200:
            print("     HTTP %s - pomijam" % r.status_code)
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)
        return True
    except Exception as e:
        print("     Blad pobierania: %s" % e)
        return False


def run_batch(args):
    maps = load_maps_from_cities(Path(args.cities))
    if args.only:
        wanted = set(args.only)
        maps = [m for m in maps if m[0] in wanted]
    print("Do przetworzenia: %d map" % len(maps))

    cache = Path(args.cache)
    cache.mkdir(parents=True, exist_ok=True)
    out_root = Path(args.out)

    for city_id, map_id, pdf_url in maps:
        name = "%s/%s" % (city_id, map_id)
        if (out_root / name / "info.json").exists() and not args.overwrite:
            print("  SKIP %s (istnieje)" % name)
            continue
        print("[%s] %s" % (city_id, map_id))
        ext = Path(pdf_url.split("?")[0]).suffix.lower() or ".pdf"   # .pdf albo .jpg
        pdf_name = hashlib.md5(pdf_url.encode()).hexdigest() + ext
        pdf_path = cache / pdf_name
        if not download_pdf(pdf_url, pdf_path):
            continue
        try:
            process_one(pdf_path, out_root, name, args.id_base,
                        args.dpi, args.tile, args.quality, args.vips_bin)
        except Exception as e:
            print("     BLAD: %s" % e)
    print("\nGotowe.")


def run_single(args):
    process_one(Path(args.input), Path(args.out), args.name, args.id_base,
                args.dpi, args.tile, args.quality, args.vips_bin)
    print("\nGotowe.")


# -- CLI --
def build_parser():
    ap = argparse.ArgumentParser(
        description="Konwersja map PDF/obraz -> kafle IIIF 3 Level 0.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--out", required=True, help="Katalog wyjsciowy z kaflami.")
    common.add_argument("--id-base", required=True,
                        help="Bazowy adres hostingu, np. "
                             "https://wweronikad.github.io/serwis-ahmp")
    common.add_argument("--dpi", type=int, default=DEFAULT_DPI,
                        help="Rozdzielczosc rasteryzacji PDF (domyslnie %d)." % DEFAULT_DPI)
    common.add_argument("--tile", type=int, default=DEFAULT_TILE,
                        help="Rozmiar kafla (domyslnie %d)." % DEFAULT_TILE)
    common.add_argument("--quality", type=int, default=DEFAULT_Q,
                        help="Jakosc JPEG kafli (domyslnie %d)." % DEFAULT_Q)
    common.add_argument("--vips-bin", default="vips",
                        help="Sciezka do narzedzia vips (domyslnie 'vips' w PATH).")

    s = sub.add_parser("single", parents=[common], help="Jedna mapa z pliku.")
    s.add_argument("--input", required=True, help="Plik PDF lub obraz rastrowy.")
    s.add_argument("--name", required=True,
                   help="Sciezka-nazwa zasobu, np. biecz/ahmp_biecz_1_1")
    s.set_defaults(func=run_single)

    b = sub.add_parser("batch", parents=[common],
                        help="Wsadowo wg cities.js (pobiera PDF-y ze strony Atlasu).")
    b.add_argument("--cities", required=True, help="Sciezka do src/data/cities.js")
    b.add_argument("--only", nargs="*", help="Ogranicz do wskazanych miast (id).")
    b.add_argument("--cache", default=".pdf_cache", help="Katalog na pobrane PDF-y.")
    b.add_argument("--overwrite", action="store_true",
                   help="Nadpisz istniejace zasoby.")
    b.set_defaults(func=run_batch)
    return ap


if __name__ == "__main__":
    parser = build_parser()
    ns = parser.parse_args()
    ns.func(ns)
