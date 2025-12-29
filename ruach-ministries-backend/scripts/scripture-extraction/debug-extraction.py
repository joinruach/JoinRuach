#!/usr/bin/env python3
"""Debug script to see what's being extracted from a sample page"""
import pdfplumber
import re
from collections import Counter

pdf_path = "../../../scripts/scripture-extraction/input/yahscriptures.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Analyze page 20 (Genesis chapter 1/2)
    page = pdf.pages[20]
    text = page.extract_text()
    lines = text.split('\n')
    chars = page.chars
    page_height = page.height

    # Build font size map like in the real code
    line_font_sizes = {}
    line_positions = {}
    for char in chars:
        line_text = char.get('text', '').strip()
        if line_text.isdigit():
            size = char.get('size', 0)
            y_pos = char.get('y0', 0)
            if line_text not in line_font_sizes:
                line_font_sizes[line_text] = []
                line_positions[line_text] = []
            line_font_sizes[line_text].append(size)
            line_positions[line_text].append(y_pos)

    avg_sizes = {text: sum(sizes)/len(sizes) for text, sizes in line_font_sizes.items() if sizes}
    avg_positions = {text: sum(positions)/len(positions) for text, positions in line_positions.items() if positions}

    chapter_threshold = 10.6

    print("=" * 80)
    print(f"Page 21 Analysis (page_height={page_height:.1f})")
    print("=" * 80)

    standalone_numbers = []
    for i, line in enumerate(lines[:50]):  # First 50 lines
        line = line.strip()
        if re.match(r'^\d+$', line):
            # This is a standalone number
            digit_sizes = [avg_sizes.get(d, 0) for d in line]
            font_size = sum(digit_sizes) / len(digit_sizes) if digit_sizes else 0

            y_pos = avg_positions.get(line[0], page_height / 2)
            in_header = y_pos < page_height * 0.12
            in_footer = y_pos > page_height * 0.88

            is_large = font_size > chapter_threshold
            marker_type = "CHAPTER" if (is_large and not in_header and not in_footer) else "VERSE"

            print(f"Line {i:3d}: '{line}' → {marker_type:7s} (font={font_size:.1f}pt, y={y_pos:.1f}, header={in_header}, footer={in_footer})")
            standalone_numbers.append((line, marker_type, font_size))

    print("\n" + "=" * 80)
    print(f"Detected {len([x for x in standalone_numbers if x[1] == 'CHAPTER'])} chapters")
    print(f"Detected {len([x for x in standalone_numbers if x[1] == 'VERSE'])} verses")
    print("=" * 80)
