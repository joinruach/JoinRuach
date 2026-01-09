#!/usr/bin/env python3
"""
Custom extractor for Apostolic Foundations by Art Katz
Extracts paragraphs from chapter-based structure
"""

import pdfplumber
import json
import re
from pathlib import Path
import hashlib

def extract_apostolic_foundations(pdf_path: str, output_jsonl: str):
    """Extract Apostolic Foundations"""

    print(f"📖 Extracting Apostolic Foundations from: {pdf_path}")

    paragraphs = []
    current_chapter = 0
    paragraph_in_chapter = 0
    current_paragraph = []

    # Open PDF
    with pdfplumber.open(pdf_path) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")

        # Start from page 5 (index 4) where Preface begins
        for page_num, page in enumerate(pdf.pages[4:], start=5):
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

                # Skip page numbers (single digits or small numbers at start/end of line)
                if re.match(r'^\d{1,3}$', line):
                    continue

                # Check for Preface
                if line == 'Preface' and current_chapter == 0:
                    current_chapter = -1  # Use -1 for Preface
                    paragraph_in_chapter = 0
                    current_paragraph = []
                    print(f"   Found Preface")
                    continue

                # Check for Introduction
                if line == 'Introduction' and current_chapter == -1:
                    # Save any pending paragraph from Preface
                    if current_paragraph:
                        para_text = ' '.join(current_paragraph)
                        if len(para_text) > 20:
                            paragraph_in_chapter += 1
                            text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                            paragraphs.append({
                                'book': 'AF',
                                'chapter': -1,  # Preface
                                'paragraph': paragraph_in_chapter,
                                'text': para_text,
                                'textHash': text_hash,
                                'pdfPage': page_num - 1,
                                'confidence': 1.0
                            })

                    current_chapter = 0  # Use 0 for Introduction
                    paragraph_in_chapter = 0
                    current_paragraph = []
                    print(f"   Found Introduction")
                    continue

                # Check for chapter heading (e.g., "Chapter 1 - Apostolic Service: Priestliness")
                chapter_match = re.match(r'^Chapter (\d+) -', line)
                if chapter_match:
                    # Save any pending paragraph from previous section
                    if current_paragraph and current_chapter >= -1:
                        para_text = ' '.join(current_paragraph)
                        if len(para_text) > 20:
                            paragraph_in_chapter += 1
                            text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                            paragraphs.append({
                                'book': 'AF',
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

                # Skip section headers (short lines that appear to be titles)
                if len(line) < 60 and line[0].isupper() and i < 5:
                    # Might be a section header, skip it
                    continue

                # If we haven't found Preface yet, skip
                if current_chapter < -1:
                    continue

                # Add line to current paragraph
                current_paragraph.append(line)

                # Check if this line ends a sentence and next line starts a new one
                ends_sentence = line.endswith('.') or line.endswith('"') or line.endswith('!') or line.endswith('?') or line.endswith('."') or line.endswith('?"')
                next_starts_sentence = False

                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # Check if next line starts with capital letter or quote (new paragraph)
                    if next_line and not re.match(r'^\d{1,3}$', next_line):
                        next_starts_sentence = (next_line[0].isupper() or next_line[0] == '"' or
                                               next_line == 'Preface' or next_line == 'Introduction' or
                                               next_line.startswith('Chapter '))
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
                            'book': 'AF',
                            'chapter': current_chapter,
                            'paragraph': paragraph_in_chapter,
                            'text': para_text,
                            'textHash': text_hash,
                            'pdfPage': page_num,
                            'confidence': 1.0
                        })

                    current_paragraph = []

        # Save any remaining paragraph
        if current_paragraph and current_chapter >= -1:
            para_text = ' '.join(current_paragraph)
            if len(para_text) > 20:
                paragraph_in_chapter += 1
                text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                paragraphs.append({
                    'book': 'AF',
                    'chapter': current_chapter,
                    'paragraph': paragraph_in_chapter,
                    'text': para_text,
                    'textHash': text_hash,
                    'pdfPage': page_num,
                    'confidence': 1.0
                })

    print(f"\n✅ Extracted {len(paragraphs)} paragraphs across {current_chapter} chapters (plus Preface and Introduction)")

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
        print("Usage: extract-apostolic-foundations.py <pdf_path> <output_jsonl>")
        sys.exit(1)

    extract_apostolic_foundations(sys.argv[1], sys.argv[2])
