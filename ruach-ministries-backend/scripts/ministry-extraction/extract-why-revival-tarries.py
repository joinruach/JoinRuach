#!/usr/bin/env python3
"""
Custom extractor for Why Revival Tarries by Leonard Ravenhill
Extracts paragraphs from chapter-based structure
"""

import pdfplumber
import json
import re
from pathlib import Path
import hashlib

def extract_why_revival_tarries(pdf_path: str, output_jsonl: str):
    """Extract Why Revival Tarries"""

    print(f"📖 Extracting Why Revival Tarries from: {pdf_path}")

    paragraphs = []
    current_chapter = 0
    paragraph_in_chapter = 0
    current_paragraph = []

    # Open PDF
    with pdfplumber.open(pdf_path) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")

        # Start from page 9 (index 8) where CHAPTER ONE begins
        for page_num, page in enumerate(pdf.pages[8:], start=9):
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

                # Skip page numbers and headers
                if re.match(r'^\d{1,3}$', line):
                    continue
                if line == 'WHY REVIVAL TARRIES':
                    continue
                if re.match(r'^WITH ALL THY GETTING.*', line):
                    if current_chapter > 0:  # Only skip if we're past chapter 1
                        continue

                # Check for chapter heading (e.g., "CHAPTER ONE", "CHAPTER TWO", etc.)
                chapter_match = re.match(r'^CHAPTER (ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)$', line)
                if chapter_match:
                    # Save any pending paragraph from previous chapter
                    if current_paragraph and current_chapter > 0:
                        para_text = ' '.join(current_paragraph)
                        if len(para_text) > 20:
                            paragraph_in_chapter += 1
                            text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]
                            paragraphs.append({
                                'book': 'WRT',
                                'chapter': current_chapter,
                                'paragraph': paragraph_in_chapter,
                                'text': para_text,
                                'textHash': text_hash,
                                'pdfPage': page_num - 1,
                                'confidence': 1.0
                            })

                    word_to_num = {
                        'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5,
                        'SIX': 6, 'SEVEN': 7, 'EIGHT': 8, 'NINE': 9, 'TEN': 10,
                        'ELEVEN': 11, 'TWELVE': 12, 'THIRTEEN': 13, 'FOURTEEN': 14,
                        'FIFTEEN': 15, 'SIXTEEN': 16, 'SEVENTEEN': 17, 'EIGHTEEN': 18,
                        'NINETEEN': 19, 'TWENTY': 20
                    }
                    current_chapter = word_to_num[chapter_match.group(1)]
                    paragraph_in_chapter = 0
                    current_paragraph = []
                    print(f"   Found Chapter {current_chapter}")
                    continue

                # Skip chapter titles (all caps titles that appear after chapter number)
                if current_chapter > 0 and line.isupper() and len(line) < 60:
                    continue

                # Skip lines that are just dashes or separators
                if re.match(r'^[_\-\s]+$', line):
                    continue

                # Skip quote attributions (lines starting with dash)
                if line.startswith('-') and len(line) < 60:
                    continue

                # If we haven't found chapter one yet, skip
                if current_chapter == 0:
                    continue

                # Add line to current paragraph
                current_paragraph.append(line)

                # Check if this line ends a sentence and next line starts a new one
                ends_sentence = line.endswith('.') or line.endswith('"') or line.endswith('!') or line.endswith('?') or line.endswith('."') or line.endswith('?"') or line.endswith('!')
                next_starts_sentence = False

                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # Check if next line starts with capital letter or quote (new paragraph)
                    if next_line and not re.match(r'^\d{1,3}$', next_line):
                        next_starts_sentence = (next_line[0].isupper() or next_line[0] == '"' or
                                               next_line.startswith('CHAPTER ') or
                                               next_line == 'WHY REVIVAL TARRIES')
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
                            'book': 'WRT',
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
                    'book': 'WRT',
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
        print("Usage: extract-why-revival-tarries.py <pdf_path> <output_jsonl>")
        sys.exit(1)

    extract_why_revival_tarries(sys.argv[1], sys.argv[2])
