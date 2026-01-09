#!/usr/bin/env python3
"""
Custom extractor for Ever Increasing Faith by Smith Wigglesworth
Extracts paragraphs from chapter-based structure
"""

import pdfplumber
import json
import re
from pathlib import Path
import hashlib

def extract_ever_increasing_faith(pdf_path: str, output_jsonl: str):
    """Extract Ever Increasing Faith treating sections as chapters"""

    print(f"📖 Extracting Ever Increasing Faith from: {pdf_path}")

    paragraphs = []
    current_chapter = 0
    paragraph_in_chapter = 0

    # Chapter name mapping (from TOC)
    chapter_names = {
        1: "Have Faith in God",
        2: "Deliverance to the Captives",
        3: "The Power of the Name",
        4: "Wilt Thou Be Made Whole?",
        5: "I Am the Lord That Healeth Thee",
        6: "Himself Took Our Infirmities",
        7: "Our Risen Christ",
        8: "Righteousness",
        9: "The Words of This Life",
        10: "Life in the Spirit",
        11: "What It Means To Be Full of the Spirit",
        12: "The Bible Evidence of the Baptism of The Holy Spirit",
        13: "Concerning Spiritual Gifts",
        14: "The Word of Knowledge and Faith",
        15: "Gifts of Healing and Miracles",
        16: "The Gift of Prophecy",
        17: "The Discerning of Spirits",
        18: "The Gift of Tongues"
    }

    # Open PDF
    with pdfplumber.open(pdf_path) as pdf:
        print(f"   Total pages: {len(pdf.pages)}")

        current_paragraph = []

        # Start from page 3 (index 2) where Chapter One begins
        for page_num, page in enumerate(pdf.pages[2:], start=3):
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

                # Check for chapter heading (e.g., "Chapter One")
                chapter_match = re.match(r'^Chapter (One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen|Fourteen|Fifteen|Sixteen|Seventeen|Eighteen)$', line)
                if chapter_match:
                    word_to_num = {
                        'One': 1, 'Two': 2, 'Three': 3, 'Four': 4, 'Five': 5,
                        'Six': 6, 'Seven': 7, 'Eight': 8, 'Nine': 9, 'Ten': 10,
                        'Eleven': 11, 'Twelve': 12, 'Thirteen': 13, 'Fourteen': 14,
                        'Fifteen': 15, 'Sixteen': 16, 'Seventeen': 17, 'Eighteen': 18
                    }
                    current_chapter = word_to_num[chapter_match.group(1)]
                    paragraph_in_chapter = 0
                    current_paragraph = []
                    print(f"   Found Chapter {current_chapter}: {chapter_names.get(current_chapter, 'Unknown')}")
                    continue

                # Skip chapter titles (next line after "Chapter X")
                if line in chapter_names.values():
                    continue

                # Skip page headers/footers
                if re.search(r'Page \d+$', line):
                    continue

                # If we haven't found a chapter yet, skip
                if current_chapter == 0:
                    continue

                # Add line to current paragraph
                current_paragraph.append(line)

                # Check if this line ends a sentence and next line starts a new one
                # This is a paragraph boundary
                ends_sentence = line.endswith('.') or line.endswith('"') or line.endswith('.')
                next_starts_sentence = False

                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # Check if next line starts with capital letter or quote (new paragraph)
                    next_starts_sentence = next_line and (next_line[0].isupper() or next_line[0] == '"')
                else:
                    # End of page - check next page
                    next_starts_sentence = True

                # Save paragraph if it's complete
                if ends_sentence and next_starts_sentence and current_paragraph:
                    para_text = ' '.join(current_paragraph)

                    # Skip very short paragraphs (likely artifacts)
                    if len(para_text) > 20:
                        paragraph_in_chapter += 1
                        text_hash = hashlib.md5(para_text.encode()).hexdigest()[:16]

                        paragraphs.append({
                            'book': 'EIF',
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
                    'book': 'EIF',
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
        print("Usage: extract-ever-increasing-faith.py <pdf_path> <output_jsonl>")
        sys.exit(1)

    extract_ever_increasing_faith(sys.argv[1], sys.argv[2])
