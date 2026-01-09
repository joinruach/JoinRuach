#!/usr/bin/env python3
"""
Quick extractor for Counsels on Health
Extracts paragraphs treating sections as chapters
"""

import pdfplumber
import json
import re
from pathlib import Path

def extract_counsels_on_health(pdf_path: str, output_jsonl: str):
    """Extract Counsels on Health treating sections as chapters"""

    print(f"📖 Extracting Counsels on Health from: {pdf_path}")

    paragraphs = []
    current_chapter = 0
    paragraph_in_chapter = 0

    # Open PDF
    with pdfplumber.open(pdf_path) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")

        # Start from page 50 (skip preface and TOC based on our sample)
        # Go through each page and extract text
        for page_num, page in enumerate(pdf.pages[49:], start=50):  # Start at page 50
            text = page.extract_text()

            if not text:
                continue

            # Split into lines
            lines = text.split('\n')
            current_paragraph = []

            for line in lines:
                line = line.strip()

                if not line:
                    # Empty line - save current paragraph if it exists
                    if current_paragraph:
                        para_text = ' '.join(current_paragraph)

                        # Skip headers/footers (short lines, page numbers, etc.)
                        if len(para_text) > 30 and not re.match(r'^\d+$', para_text):
                            # Check if this looks like a section heading (all caps, short)
                            if line.isupper() and len(para_text) < 100:
                                current_chapter += 1
                                paragraph_in_chapter = 0

                            paragraph_in_chapter += 1

                            # Ensure we have at least chapter 1
                            if current_chapter == 0:
                                current_chapter = 1

                            paragraphs.append({
                                'book': 'COH',
                                'chapter': current_chapter,
                                'paragraph': paragraph_in_chapter,
                                'text': para_text,
                                'pdfPage': page_num,
                                'confidence': 1.0
                            })

                        current_paragraph = []
                else:
                    current_paragraph.append(line)

            # Save last paragraph on page
            if current_paragraph:
                para_text = ' '.join(current_paragraph)
                if len(para_text) > 30 and not re.match(r'^\d+$', para_text):
                    paragraph_in_chapter += 1
                    if current_chapter == 0:
                        current_chapter = 1

                    paragraphs.append({
                        'book': 'COH',
                        'chapter': current_chapter,
                        'paragraph': paragraph_in_chapter,
                        'text': para_text,
                        'pdfPage': page_num,
                        'confidence': 1.0
                    })

            if (page_num - 49) % 100 == 0:
                print(f"   Processed page {page_num}...")

    # Write JSONL
    print(f"\n💾 Saving {len(paragraphs)} paragraphs...")
    output_path = Path(output_jsonl)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_jsonl, 'w') as f:
        for para in paragraphs:
            f.write(json.dumps(para) + '\n')

    print(f"✅ Saved to: {output_jsonl}")
    print(f"   Total paragraphs: {len(paragraphs)}")
    print(f"   Chapters detected: {current_chapter}")

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 3:
        print("Usage: python extract-counsels-on-health.py <pdf_path> <output_jsonl>")
        sys.exit(1)

    extract_counsels_on_health(sys.argv[1], sys.argv[2])
