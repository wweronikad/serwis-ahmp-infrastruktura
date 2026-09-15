# OCR for "część opisowa" PDFs that turned out to be pure scans with no
# text layer at all (pdfplumber finds 0 chars — confirmed for Bydgoszcz,
# Chelmno, Elblag, Gizycko, Grudziadz, Ostroda, Torun). Unlike ocr_maps.py
# (built for maps: scattered labels, PSM 11) this targets normal book
# pages and writes plain per-page text, same shape as
# extract_pdfs_to_txt.py's output, so extract_fulltext.py can consume it
# unchanged. Uses PSM 3 (full automatic page segmentation) rather than
# PSM 6 (single text block) because these are two-column academic pages —
# PSM 6 reads both columns line-by-line and interleaves them into
# nonsense; PSM 3 detects the columns and reads each one fully, in order.
#
# Usage:
#   py scripts/ocr_text_pdfs.py                          # all missing-text PDFs
#   py scripts/ocr_text_pdfs.py AHMP_Torun_intro.pdf      # just one

import sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
from pdf2image import convert_from_path
import pdfplumber
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
POPPLER  = r'C:\poppler\poppler-24.08.0\Library\bin'
DPI      = 300
LANG     = 'pol+deu+lat'
PDF_DIR  = Path(r'C:\Users\wer\Desktop\Częścopisowa')
TXT_DIR  = PDF_DIR / 'teksty'
TXT_DIR.mkdir(exist_ok=True)


def has_text_layer(pdf_path: Path) -> bool:
    """True if pdfplumber finds real characters anywhere in the first 5 pages."""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages[:5]:
            if len(page.chars) > 0:
                return True
    return False


def preprocess(img):
    img = img.convert('L')
    img = ImageEnhance.Contrast(img).enhance(1.8)
    img = img.filter(ImageFilter.SHARPEN)
    return img


def ocr_pdf(pdf_path: Path) -> str:
    print(f'  Renderuje strony ({DPI} DPI) ...')
    pages = convert_from_path(str(pdf_path), dpi=DPI, poppler_path=POPPLER)
    texts = []
    for i, page in enumerate(pages, 1):
        proc = preprocess(page)
        text = pytesseract.image_to_string(proc, lang=LANG, config='--psm 3 --oem 1')
        text = text.strip()
        if text:
            texts.append(text)
        print(f'    strona {i}/{len(pages)}: {len(text)} znakow')
    return '\n\n'.join(texts)


def process(pdf_path: Path, force=False):
    txt_path = TXT_DIR / (pdf_path.stem + '.txt')
    if txt_path.exists() and txt_path.stat().st_size > 0 and not force:
        print(f'SKIP {pdf_path.name} (juz ma niepusty tekst)')
        return
    print(f'{pdf_path.name}:')
    if has_text_layer(pdf_path):
        print('  Ma warstwe tekstowa - to nie jest przypadek dla tego skryptu, '
              'uzyj extract_pdfs_to_txt.py')
        return
    full_text = ocr_pdf(pdf_path)
    txt_path.write_text(full_text, encoding='utf-8')
    print(f'  -> zapisano {len(full_text)} znakow do {txt_path.name}')


if __name__ == '__main__':
    args = sys.argv[1:]
    if args:
        targets = [PDF_DIR / a for a in args]
    else:
        # every PDF whose .txt is missing or empty
        targets = []
        for pdf_path in sorted(PDF_DIR.glob('*.pdf')):
            txt_path = TXT_DIR / (pdf_path.stem + '.txt')
            if not txt_path.exists() or txt_path.stat().st_size == 0:
                targets.append(pdf_path)

    print(f'Do przetworzenia: {len(targets)} plikow\n')
    for pdf_path in targets:
        process(pdf_path)
    print('\nGotowe.')
