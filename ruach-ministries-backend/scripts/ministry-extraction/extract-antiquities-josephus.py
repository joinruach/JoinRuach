#!/usr/bin/env python3
"""
Custom extractor for The Antiquities of the Jews by Flavius Josephus
Extracts paragraphs from book/chapter/paragraph structure
"""

import pdfplumber
import json
import re
from pathlib import Path
import hashlib

def extract_antiquities_josephus(pdf_path: str, output_jsonl: str):
    """Extract The Antiquities of the Jews"""

    print(f"📖 Extracting The Antiquities of the Jews from: {pdf_path}")

    paragraphs = []
    current_book = 0
    current_chapter = 0
    paragraph_in_chapter = 0
    current_paragraph = []

    # Track last known book/chapter from header
    last_book = 0
    last_chapter = 0

    # Open PDF
    with pdfplumber.open(pdf_path) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")
        print(f"   This is a large work - extraction may take a few minutes...")

        # Start from page 60 (index 59) where content begins
        for page_num, page in enumerate(pdf.pages[59:], start=60):
            text = page.extract_text()

            if not text:
                continue

            # Split into lines
            lines = text.split('\n')

            for line in lines:
                line = line.strip()

                # Skip empty lines
                if not line:
                    continue

                # Check for book/chapter marker in header
                # Format: "Flavius JosephusTHE ANTIQUITIES OF THE JEWS : L.1, C.18."
                header_match = re.search(r'L\.(\d+),\s*C\.(\d+)', line)
                if header_match:
                    last_book = int(header_match.group(1))
                    last_chapter = int(header_match.group(2))
                    continue

                # Skip header/footer lines
                if 'Flavius Josephus' in line or 'ANTIQUITIES OF THE JEWS' in line:
                    continue
                if line.startswith('file:///'):
                    continue
                if re.match(r'^\d{4}-\d{2}-\d{2}', line):  # Date stamps
                    continue

                # Check for chapter titles (all caps, usually starting with CHAPTER)
                if line.startswith('CHAPTER '):
                    # Save any pending paragraph
                    if current_paragraph and current_book > 0 and current_chapter > 0:
                        para_text = ' '.join(current_paragraph)
                        if len(para_text) > 20:
                            paragraph_in_chapter += 1
                            text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                            paragraphs.append({
                                'book': 'JOSEPHUS-ANT',
                                'chapter': (current_book * 100) + current_chapter,  # Composite chapter number
                                'paragraph': paragraph_in_chapter,
                                'text': para_text,
                                'textHash': text_hash,
                                'pdfPage': page_num - 1,
                                'confidence': 1.0,
                                'metadata': {
                                    'bookNumber': current_book,
                                    'chapterNumber': current_chapter
                                }
                            })

                    # Start new chapter
                    current_book = last_book
                    current_chapter = last_chapter
                    paragraph_in_chapter = 0
                    current_paragraph = []

                    if current_book > 0 and current_chapter > 0:
                        print(f"   Found Book {current_book}, Chapter {current_chapter}")
                    continue

                # If we don't have a book/chapter yet, skip
                if current_book == 0 or current_chapter == 0:
                    continue

                # Check for paragraph number at start of line
                para_num_match = re.match(r'^(\d+)\.\s+(.+)', line)

                # If we find a new paragraph number and have a pending paragraph, save it
                if para_num_match and current_paragraph:
                    para_text = ' '.join(current_paragraph)
                    if len(para_text) > 20:
                        paragraph_in_chapter += 1
                        text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                        paragraphs.append({
                            'book': 'JOSEPHUS-ANT',
                            'chapter': (current_book * 100) + current_chapter,
                            'paragraph': paragraph_in_chapter,
                            'text': para_text,
                            'textHash': text_hash,
                            'pdfPage': page_num,
                            'confidence': 1.0,
                            'metadata': {
                                'bookNumber': current_book,
                                'chapterNumber': current_chapter
                            }
                        })
                    current_paragraph = []

                # Add line to current paragraph
                current_paragraph.append(line)

            # Progress indicator every 100 pages
            if (page_num - 59) % 100 == 0:
                print(f"   Processed {page_num - 59} pages... ({len(paragraphs)} paragraphs so far)")

        # Save any remaining paragraph
        if current_paragraph and current_book > 0 and current_chapter > 0:
            para_text = ' '.join(current_paragraph)
            if len(para_text) > 20:
                paragraph_in_chapter += 1
                text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                paragraphs.append({
                    'book': 'JOSEPHUS-ANT',
                    'chapter': (current_book * 100) + current_chapter,
                    'paragraph': paragraph_in_chapter,
                    'text': para_text,
                    'textHash': text_hash,
                    'pdfPage': page_num,
                    'confidence': 1.0,
                    'metadata': {
                        'bookNumber': current_book,
                        'chapterNumber': current_chapter
                    }
                })

    print(f"\n✅ Extracted {len(paragraphs)} paragraphs")

    # Count unique book/chapter combinations
    unique_chapters = set((p['metadata']['bookNumber'], p['metadata']['chapterNumber']) for p in paragraphs)
    unique_books = set(p['metadata']['bookNumber'] for p in paragraphs)

    print(f"   Books: {len(unique_books)}, Chapters: {len(unique_chapters)}")

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
            'validation_status': 'valid',
            'books_count': len(unique_books),
            'chapters_count': len(unique_chapters)
        }, f, indent=2)

    print(f"✅ Extraction metadata saved to: {metadata_path}")

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 3:
        print("Usage: extract-antiquities-josephus.py <pdf_path> <output_jsonl>")
        sys.exit(1)

    extract_antiquities_josephus(sys.argv[1], sys.argv[2])
