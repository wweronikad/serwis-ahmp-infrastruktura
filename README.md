# Serwis AHMP — Atlas Historyczny Miast Polskich

Interaktywny serwis danych przestrzenno-diachronicznych: zgeoreferencjonowane mapy historyczne
nakładane na współczesny podkład, opisy historyczne miast, materiały ikonograficzne i wyszukiwanie
w treści map. Praca dyplomowa: *Opracowanie prototypu serwisu interaktywnego danych przestrzenno-diachronicznych
Atlasu Historycznego Miast Polskich* (UMCS, 2026).

Serwis: https://wweronikad.github.io/serwis-ahmp-infrastruktura/

## Architektura

Aplikacja jest w całości statyczna (bez serwera i bazy danych) i korzysta z dwóch repozytoriów:

| Repozytorium | Zawartość |
|---|---|
| `serwis-ahmp-infrastruktura` (to) | kod aplikacji (React + Vite), dane opisowe, indeksy wyszukiwania, skrypty przetwarzające |
| [`serwis-ahmp`](https://github.com/wweronikad/serwis-ahmp) | kafle IIIF (Image API 3.0, poziom 0) oraz adnotacje georeferencyjne Allmaps (`adnotacje/`) |

Technologie: React, React Router, MapLibre GL JS, `@allmaps/maplibre` (warstwa `WarpedMapLayer`),
MiniSearch (wyszukiwanie pełnotekstowe), Fuse.js (wyszukiwanie nawigacyjne Ctrl+K).
Wdrożenie: GitHub Actions (`.github/workflows/deploy.yml`) buduje aplikację po każdym pushu na `main`
i publikuje ją na GitHub Pages.

## Uruchomienie lokalne

```bash
npm ci
npm run dev        # serwer deweloperski (Vite)
npm run build      # kompilacja produkcyjna do dist/
npm run lint
```

## Struktura repozytorium

| Ścieżka | Zawartość |
|---|---|
| `src/data/cities.js` | lista miast i map (tytuł, datowanie, typ, adres pliku źródłowego i adnotacji) |
| `src/data/opisy/*.json` | opisy tematyczne miast (8 kart: układ przestrzenny, fortyfikacje, kościoły, ludność, gospodarka, władza, środowisko, źródła) |
| `src/data/galeria/*.json` | materiały ikonograficzne z opisami punktów na obrazach |
| `src/pages/`, `src/components/` | strony i komponenty aplikacji |
| `public/galeria/`, `public/panoramy/` | obrazy do galerii i kafli miast |
| `public/ocr/` | wyniki rozpoznawania tekstu na mapach: `<miasto>/<mapa>.json`, `index.json` (indeks wyszukiwania), `manual_words.json` (punkty opisane ręcznie), `suggested_words.json` (propozycje do zatwierdzenia), `map_metadata.json` |
| `public/fulltext/` | tekst opisowy wyodrębniony z plików PDF zeszytów (indeks tekstowy) |
| `scripts/` | skrypty przetwarzające dane (poniżej) |

## Skrypty (`scripts/`)

Wymagają Pythona 3.10+, Tesseracta 5 (modele `pol`, `deu`, `lat`) i Poppler (`pdftoppm`).

| Skrypt | Do czego służy |
|---|---|
| `ocr_maps.py` | automatyczne rozpoznawanie tekstu na mapach (`--shard=i/n` pozwala uruchomić kilka procesów) |
| `ocr_build_index.py` | buduje `public/ocr/index.json` z wyników OCR i z `manual_words.json` |
| `annotator_server.py`, `annotator/` | lokalne narzędzie do ręcznego opisywania map (`py scripts/annotator_server.py`, adres `http://localhost:8642`); zawiera tryb sprawdzania propozycji |
| `suggest_tiles.py`, `suggest_convert.py` | pomocnicze: cięcie mapy na fragmenty z podziałką i zamiana odczytów na propozycje |
| `extract_map_metadata.py` | odczyt tomu, zeszytu, skali i autorów z warstwy tekstowej plików PDF |
| `extract_fulltext.py`, `extract_pdfs_to_txt.py`, `ocr_text_pdfs.py` | wyodrębnianie tekstu opisowego zeszytów |
| `fix_pdf_urls.py` | kontrola i naprawa odnośników do plików źródłowych na atlasmiast.umk.pl |
| `ocr_generate_skeleton.py`, `ocr_compile_skeleton.py`, `ocr_debug_visualize.py` | starszy sposób ręcznego uzupełniania OCR (zastąpiony przez `annotator_server.py`) |

## Dane źródłowe

Mapy, opisy i ikonografia pochodzą z oficjalnej strony Atlasu (https://atlasmiast.umk.pl/).
Opisy dla Legnicy, Niemczy, Środy Śląskiej, Świdnicy i Trzebnicy nie są tłumaczeniem zeszytów Atlasu
(dla tych miast Atlas nie udostępnia części opisowej) — przygotowano je na podstawie wskazanych w kartach źródeł.
