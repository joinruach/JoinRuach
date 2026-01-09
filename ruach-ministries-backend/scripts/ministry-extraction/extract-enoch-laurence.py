#!/usr/bin/env python3
"""
Custom extractor for Book of Enoch - Richard Laurence Translation (1883)
Extracts verse-based paragraphs from chapter structure with two-column layout
"""

import pdfplumber
import json
import re
from pathlib import Path
import hashlib

def extract_enoch_laurence(pdf_path: str, output_jsonl: str):
    """Extract Book of Enoch (Richard Laurence 1883 translation)"""

    print(f"📖 Extracting Book of Enoch (Laurence 1883) from: {pdf_path}")

    paragraphs = []
    current_chapter = 0
    paragraph_in_chapter = 0
    current_paragraph = []

    # Open PDF
    with pdfplumber.open(pdf_path) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")

        # Start from page 1 (index 0) where content begins
        for page_num, page in enumerate(pdf.pages, start=1):
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

                # Skip title pages and headers
                if 'The Book of Enoch' in line or 'Richard Laurence' in line:
                    continue
                if line.startswith('Chapter ') and 'carnal' in line:
                    continue  # Skip running headers

                # Check for chapter marker (CHAPTER X)
                chapter_match = re.match(r'^CHAPTER (\d+)', line)
                if chapter_match:
                    # Save any pending paragraph from previous chapter
                    if current_paragraph and current_chapter > 0:
                        para_text = ' '.join(current_paragraph)
                        # Clean up verse numbers embedded in text (e.g., "1The word" -> "The word")
                        para_text = re.sub(r'^(\d+)([A-Z])', r'\2', para_text)
                        para_text = re.sub(r'\s+(\d+)([A-Z])', r' \2', para_text)

                        if len(para_text) > 20:
                            paragraph_in_chapter += 1
                            text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                            paragraphs.append({
                                'book': 'ENOCH-RL',
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

                # Skip if we haven't found a chapter yet
                if current_chapter == 0:
                    continue

                # Skip "(NO CHAPTER X)" markers
                if re.match(r'^\(NO CHAPTER \d+\)', line):
                    continue

                # Detect verse boundaries - lines starting with a number followed by uppercase letter
                # This handles the inline verse numbering like "1The word" or "2From them"
                verse_start_match = re.match(r'^(\d+)([A-Z])', line)

                # If we detect a new verse and have a pending paragraph, save it
                if verse_start_match and current_paragraph:
                    para_text = ' '.join(current_paragraph)
                    # Clean up verse numbers
                    para_text = re.sub(r'^(\d+)([A-Z])', r'\2', para_text)
                    para_text = re.sub(r'\s+(\d+)([A-Z])', r' \2', para_text)

                    if len(para_text) > 20:
                        paragraph_in_chapter += 1
                        text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                        paragraphs.append({
                            'book': 'ENOCH-RL',
                            'chapter': current_chapter,
                            'paragraph': paragraph_in_chapter,
                            'text': para_text,
                            'textHash': text_hash,
                            'pdfPage': page_num,
                            'confidence': 1.0
                        })
                    current_paragraph = []

                # Add line to current paragraph
                current_paragraph.append(line)

        # Save any remaining paragraph
        if current_paragraph and current_chapter > 0:
            para_text = ' '.join(current_paragraph)
            # Clean up verse numbers
            para_text = re.sub(r'^(\d+)([A-Z])', r'\2', para_text)
            para_text = re.sub(r'\s+(\d+)([A-Z])', r' \2', para_text)

            if len(para_text) > 20:
                paragraph_in_chapter += 1
                text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                paragraphs.append({
                    'book': 'ENOCH-RL',
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
        print("Usage: extract-enoch-laurence.py <pdf_path> <output_jsonl>")
        sys.exit(1)

    extract_enoch_laurence(sys.argv[1], sys.argv[2])
