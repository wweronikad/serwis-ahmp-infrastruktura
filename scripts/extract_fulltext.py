# Extract AHMP descriptive text files to JSON chunks for Serwis fulltext search.
#
# Usage:
#   py scripts/extract_fulltext.py
#
# Input:  C:\Users\wer\Desktop\Częścopisowa\teksty\*.txt
# Output: public/fulltext/<cityId>.json

import os, re, json

TXT_DIR = r"C:\Users\wer\Desktop\Częścopisowa\teksty"
OUT_DIR = r"C:\Users\wer\Desktop\Serwis\public\fulltext"

# Filename stem → cityId in Serwis
CITY_MAP = {
    "AHMP_Biecz_intro":              "biecz",
    "AHMP_Bochnia_intro":            "bochnia",
    "AHMP_Brzeg_opis":               "brzeg",
    "AHMP_Chojnice_intro":           "chojnice",
    "AHMP_Fordon_intro":             "fordon",
    "AHMP_Fordon2_intro":            None,   # skip — separate fascicle, not in cities.js
    "AHMP_Jelenia_Gora_intro":       "jelenia-gora",
    "AHMP_Ketrzyn_intro":            "ketrzyn",
    "AHMP_Koronowo_intro":           "koronowo",
    "AHMP_Kwidzyn_album":            None,   # captions only — merged with opis below
    "AHMP_Kwidzyn_opis":             "kwidzyn",
    "AHMP_Lidzbark_Warminski_album": None,   # captions only — merged with opis below
    "AHMP_Lidzbark_Warminski_opis":  "lidzbark-warminski",
    "AHMP_Milicz_intro":             "milicz",
    "AHMP_Mragowo_intro":            "mragowo",
    "AHMP_Namyslow_intro":           "namyslow",
    "AHMP_Nowy_Sacz_intro":          "nowy-sacz",
    "AHMP_Olawa_intro":              "olawa",
    "AHMP_Puck_album":               None,   # captions only
    "AHMP_Puck_opis":                "puck",
    "AHMP_Raciborz_intro":           "raciborz",
    "AHMP_Stary_Sacz_intro":         "stary-sacz",
    "AHMP_Strzegom_intro":           "strzegom",
    "AHMP_Strzelin_intro":           "strzelin",
    "AHMP_Swiecie_intro":            "swiecie",
    "AHMP_Tarnow_intro":             "tarnow",
    "AHMP_Tczew_album":              None,   # captions only
    "AHMP_Tczew_opis":               "tczew",
    "AHMP_Torun_II_intro":           "torun-ii",
    "AHMP_Wieliczka_intro":          "wieliczka",
    "AHMP_Wloclawek_intro":          "wloclawek",
    "AHMP_Wroclaw_2017_intro":       "wroclaw",
    "AHMP_Zabkowice_intro":          "zabkowice-slaskie",
    "AHMP_Zamosc_intro":             "zamosc",
    "AHMP_Ziebice_intro":            "ziebice",
}

# Lines to skip — typical PDF extraction artifacts
SKIP_PATTERNS = [
    re.compile(r'\.indd\s+\d+'),       # InDesign metadata
    re.compile(r'^\s*\d{4}\s*$'),      # bare year (1850)
    re.compile(r'^\s*\d+\s*$'),        # bare page number
    re.compile(r'^https?://'),          # bare URLs
]

def is_junk_line(line):
    s = line.strip()
    if len(s) < 3:
        return True
    for pat in SKIP_PATTERNS:
        if pat.search(s):
            return True
    return False

def clean_line(line):
    """Fix hyphenated line-breaks common in PDF extraction."""
    return line.strip()

def extract_paragraphs(path):
    """Read txt, drop front matter, return list of paragraph strings."""
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    # Find first major content heading
    start = 0
    for i, line in enumerate(lines):
        s = line.strip()
        if i > 150 and s in ("WSTĘP", "FOREWORD", "WPROWADZENIE", "INTRODUCTION",
                              "PRZEDMOWA", "PREFACE"):
            start = i
            break
    if start == 0:
        start = min(250, len(lines) // 4)

    content_lines = lines[start:]

    paragraphs = []
    current = []
    for line in content_lines:
        stripped = line.strip()
        if stripped == "":
            if current:
                para = " ".join(current)
                para = re.sub(r'-\s+', '', para)
                para = re.sub(r'\s{2,}', ' ', para).strip()
                if len(para) > 60 and not any(p.search(para) for p in SKIP_PATTERNS):
                    paragraphs.append(para)
                current = []
        else:
            if not is_junk_line(line):
                current.append(clean_line(line))
    if current:
        para = " ".join(current)
        para = re.sub(r'-\s+', '', para)
        para = re.sub(r'\s{2,}', ' ', para).strip()
        if len(para) > 60:
            paragraphs.append(para)

    return paragraphs

def make_chunks(paragraphs, city_id, target_words=350):
    """Group paragraphs into chunks of ~target_words words."""
    chunks = []
    buf = []
    word_count = 0
    chunk_idx = 0

    for para in paragraphs:
        words = len(para.split())
        buf.append(para)
        word_count += words
        if word_count >= target_words:
            text = " ".join(buf)
            chunks.append({
                "id": f"{city_id}_{chunk_idx:04d}",
                "text": text,
            })
            chunk_idx += 1
            buf = []
            word_count = 0

    if buf:
        text = " ".join(buf)
        if len(text) > 80:
            chunks.append({
                "id": f"{city_id}_{chunk_idx:04d}",
                "text": text,
            })

    return chunks

os.makedirs(OUT_DIR, exist_ok=True)

for filename in sorted(os.listdir(TXT_DIR)):
    if not filename.endswith(".txt"):
        continue
    stem = filename.replace(".txt", "")
    city_id = CITY_MAP.get(stem)
    if city_id is None:
        print(f"SKIP: {filename}")
        continue

    path = os.path.join(TXT_DIR, filename)
    paragraphs = extract_paragraphs(path)
    chunks = make_chunks(paragraphs, city_id)

    out = {
        "cityId": city_id,
        "source": filename,
        "chunks": chunks,
    }

    out_path = os.path.join(OUT_DIR, f"{city_id}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    total_words = sum(len(c["text"].split()) for c in chunks)
    print(f"OK  {city_id:25s}  {len(chunks):3d} chunks  ~{total_words:6d} words")

print("\nDone.")
