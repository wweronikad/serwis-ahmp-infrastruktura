# Extract text from PDFs in Częścopisowa folder that don't yet have TXT files.
# Usage: py scripts/extract_pdfs_to_txt.py

import re
from pathlib import Path
import pdfplumber

PDF_DIR = Path(r'C:\Users\wer\Desktop\Częścopisowa')
TXT_DIR = PDF_DIR / 'teksty'
TXT_DIR.mkdir(exist_ok=True)

for pdf_path in sorted(PDF_DIR.glob('*.pdf')):
    txt_path = TXT_DIR / (pdf_path.stem + '.txt')
    if txt_path.exists():
        print(f'SKIP {pdf_path.name}')
        continue
    print(f'Extracting {pdf_path.name} ...')
    try:
        with pdfplumber.open(pdf_path) as pdf:
            pages = []
            for page in pdf.pages:
                text = page.extract_text(x_tolerance=2, y_tolerance=2)
                if text:
                    pages.append(text)
        full_text = '\n\n'.join(pages)
        txt_path.write_text(full_text, encoding='utf-8')
        print(f'  -> {len(full_text)} chars, {len(pages)} pages')
    except Exception as e:
        print(f'  ERR: {e}')

print('Done.')
