#!/usr/bin/env python3
"""
Custom extractor for The Ancient Paths by Craig Hill
Extracts paragraphs from chapter structure
"""

import pdfplumber
import json
import re
from pathlib import Path
import hashlib

def extract_ancient_paths(pdf_path: str, output_jsonl: str):
    """Extract The Ancient Paths"""

    print(f"📖 Extracting The Ancient Paths from: {pdf_path}")

    paragraphs = []
    current_chapter = 0
    paragraph_in_chapter = 0
    current_paragraph = []

    # Open PDF
    with pdfplumber.open(pdf_path) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")

        # Start from page 6 (index 5) where Chapter 1 begins
        for page_num, page in enumerate(pdf.pages[5:], start=6):
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

                # Skip page numbers
                if re.match(r'^\d+$', line) and len(line) <= 3:
                    continue

                # Skip headers/footers
                if line == "The Ancient Paths" or line == "Ask For The Ancient Paths":
                    continue

                # Check for chapter marker (e.g., "Chapter 1" or "Chapter 2")
                chapter_match = re.match(r'^Chapter (\d+)$', line)
                if chapter_match:
                    # Save any pending paragraph from previous chapter
                    if current_paragraph and current_chapter > 0:
                        para_text = ' '.join(current_paragraph)
                        if len(para_text) > 20:
                            paragraph_in_chapter += 1
                            text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                            paragraphs.append({
                                'book': 'ANCIENT-PATHS',
                                'chapter': current_chapter,
                                'paragraph': paragraph_in_chapter,
                                'text': para_text,
                                'textHash': text_hash,
                                'pdfPage': page_num - 1,
                                'confidence': 1.0
                            })

                    current_chapter = int(chapter_match.group(1))
                    paragraph_in_chapter = 0
                    current_paragraph = []
                    print(f"   Found Chapter {current_chapter}")
                    continue

                # Skip chapter titles (usually ALL CAPS on next line after "Chapter X")
                if line.isupper() and len(line) > 10:
                    continue

                # Skip if we haven't found a chapter yet
                if current_chapter == 0:
                    continue

                # Check if this line ends a paragraph (ends with period, question mark, etc.)
                ends_sentence = (line.endswith('.') or line.endswith('?') or
                               line.endswith('!') or line.endswith('"') or
                               line.endswith('.")') or line.endswith('?"') or
                               line.endswith('!"'))

                # Check if next line starts a new paragraph
                next_starts_new = False
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # New paragraph if next line starts with capital or is all caps (subheading)
                    if next_line and len(next_line) > 1:
                        next_starts_new = (next_line[0].isupper() or next_line.isupper())

                # Add line to current paragraph
                current_paragraph.append(line)

                # If paragraph ends here, save it
                if ends_sentence and next_starts_new and current_paragraph:
                    para_text = ' '.join(current_paragraph)
                    if len(para_text) > 20:
                        paragraph_in_chapter += 1
                        text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                        paragraphs.append({
                            'book': 'ANCIENT-PATHS',
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
                    'book': 'ANCIENT-PATHS',
                    'chapter': current_chapter,
                    'paragraph': paragraph_in_chapter,
                    'text': para_text,
                    'textHash': text_hash,
                    'pdfPage': page_num,
                    'confidence': 1.0
                })

    print(f"\n✅ Extracted {len(paragraphs)} paragraphs across {len(set(p['chapter'] for p in paragraphs))} chapters")

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
        print("Usage: extract-ancient-paths.py <pdf_path> <output_jsonl>")
        sys.exit(1)

    extract_ancient_paths(sys.argv[1], sys.argv[2])
