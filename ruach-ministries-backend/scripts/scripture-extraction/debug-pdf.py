#!/usr/bin/env python3
"""Debug script to examine PDF structure"""

import pdfplumber
import re

pdf_path = "../../../scripts/scripture-extraction/input/yahscriptures.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Check first few pages of Genesis (around page 10-15)
    for page_num in range(10, 20):
        page = pdf.pages[page_num]
        text = page.extract_text()
        lines = text.split('\n')

        print(f"\n{'='*60}")
        print(f"PAGE {page_num + 1}")
        print(f"{'='*60}")

        # Show first 40 lines
        for i, line in enumerate(lines[:40]):
            line = line.strip()
            # Highlight potential chapter markers
            if re.match(r'^(?:Chapter|CHAPTER|Ch\.?)\s*\d+', line, re.IGNORECASE):
                print(f"  >>> {i:3d}: {line}")
            elif re.match(r'^\d{1,3}$', line):
                print(f"  [{i:3d}]: {line}")
            else:
                print(f"      {i:3d}: {line}")
