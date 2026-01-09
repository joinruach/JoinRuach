#!/usr/bin/env python3
"""
Custom extractor for The Cross and the Switchblade by David Wilkerson
Extracts paragraphs from chapter-based structure
"""

import pdfplumber
import json
import re
from pathlib import Path
import hashlib

def extract_cross_and_switchblade(pdf_path: str, output_jsonl: str):
    """Extract The Cross and the Switchblade"""

    print(f"📖 Extracting The Cross and the Switchblade from: {pdf_path}")

    paragraphs = []
    current_chapter = 0
    paragraph_in_chapter = 0
    current_paragraph = []

    # Open PDF
    with pdfplumber.open(pdf_path) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")

        # Start from page 13 (index 12) where CHAPTER 1 begins
        for page_num, page in enumerate(pdf.pages[12:], start=13):
            text = page.extract_text()

            if not text:
                continue

            # Split into lines
            lines = text.split('\n')

            for i, line in enumerate(lines):
                line = line.strip()

                # Skip empty lines
                if not line:
                    continue

                # Skip OceanofPDF.com watermarks
                if line == 'OceanofPDF.com':
                    continue

                # Check for chapter heading (e.g., "CHAPTER 1", "CHAPTER 2", etc.)
                chapter_match = re.match(r'^CHAPTER (\d+)$', line)
                if chapter_match:
                    current_chapter = int(chapter_match.group(1))
                    paragraph_in_chapter = 0
                    current_paragraph = []
                    print(f"   Found Chapter {current_chapter}")
                    continue

                # Check for EPILOGUE
                if line == 'EPILOGUE':
                    # Save any pending paragraph
                    if current_paragraph and current_chapter > 0:
                        para_text = ' '.join(current_paragraph)
                        if len(para_text) > 20:
                            paragraph_in_chapter += 1
                            text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                            paragraphs.append({
                                'book': 'CATSB',
                                'chapter': current_chapter,
                                'paragraph': paragraph_in_chapter,
                                'text': para_text,
                                'textHash': text_hash,
                                'pdfPage': page_num,
                                'confidence': 1.0
                            })
                    # Epilogue becomes chapter 24
                    current_chapter = 24
                    paragraph_in_chapter = 0
                    current_paragraph = []
                    print(f"   Found Epilogue (Chapter 24)")
                    continue

                # If we haven't found a chapter yet, skip
                if current_chapter == 0:
                    continue

                # Add line to current paragraph
                current_paragraph.append(line)

                # Check if this line ends a sentence and next line starts a new one
                ends_sentence = line.endswith('.') or line.endswith('"') or line.endswith('!') or line.endswith('?')
                next_starts_sentence = False

                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # Check if next line starts with capital letter or quote (new paragraph)
                    if next_line:
                        next_starts_sentence = (next_line[0].isupper() or next_line[0] == '"' or
                                               next_line == 'OceanofPDF.com' or
                                               next_line.startswith('CHAPTER ') or
                                               next_line == 'EPILOGUE')
                else:
                    # End of page - save paragraph
                    next_starts_sentence = True

                # Save paragraph if it's complete
                if ends_sentence and next_starts_sentence and current_paragraph:
                    para_text = ' '.join(current_paragraph)

                    # Skip very short paragraphs (likely artifacts)
                    if len(para_text) > 20:
                        paragraph_in_chapter += 1
                        text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]

                        paragraphs.append({
                            'book': 'CATSB',
                            'chapter': current_chapter,
                            'paragraph': paragraph_in_chapter,
                            'text': para_text,
                            'textHash': text_hash,
                            'pdfPage': page_num,
                            'confidence': 1.0
                        })

                    current_paragraph = []

        # Save any remaining paragraph
        if current_paragraph and current_chapter > 0:
            para_text = ' '.join(current_paragraph)
            if len(para_text) > 20:
                paragraph_in_chapter += 1
                text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                paragraphs.append({
                    'book': 'CATSB',
                    'chapter': current_chapter,
                    'paragraph': paragraph_in_chapter,
                    'text': para_text,
                    'textHash': text_hash,
                    'pdfPage': page_num,
                    'confidence': 1.0
                })

    print(f"\n✅ Extracted {len(paragraphs)} paragraphs across {current_chapter} chapters")

    # Write JSONL output
    output_path = Path(output_jsonl)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        for para in paragraphs:
            f.write(json.dumps(para, ensure_ascii=False) + '\n')

    print(f"💾 Saved to: {output_jsonl}")

    # Write extraction metadata
    metadata_path = output_path.parent / 'extraction-metadata.json'
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump({
            'extractor_version': '2.0.0',
            'content_type': 'library',
            'source_file': pdf_path,
            'extraction_timestamp': '2026-01-09T00:00:00Z',
            'total_pages': len(pdf.pages),
            'total_items': len(paragraphs),
            'validation_status': 'valid'
        }, f, indent=2)

    print(f"✅ Extraction metadata saved to: {metadata_path}")

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 3:
        print("Usage: extract-cross-and-switchblade.py <pdf_path> <output_jsonl>")
        sys.exit(1)

    extract_cross_and_switchblade(sys.argv[1], sys.argv[2])
