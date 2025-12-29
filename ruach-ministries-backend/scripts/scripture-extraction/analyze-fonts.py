#!/usr/bin/env python3
"""Debug script to analyze font sizes in the PDF"""
import pdfplumber
from collections import Counter

pdf_path = "../../../scripts/scripture-extraction/input/yahscriptures.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Analyze a sample page (e.g., page 20 which should be in Genesis)
    page = pdf.pages[20]
    chars = page.chars

    # Collect all numeric text with their font sizes
    number_fonts = {}
    for char in chars:
        text = char.get('text', '').strip()
        if text.isdigit():
            size = char.get('size', 0)
            if text not in number_fonts:
                number_fonts[text] = []
            number_fonts[text].append(size)

    # Average and display
    print("=" * 60)
    print(f"Font Size Analysis for Page 21 (Genesis)")
    print("=" * 60)
    for num in sorted(number_fonts.keys(), key=int):
        sizes = number_fonts[num]
        avg_size = sum(sizes) / len(sizes)
        print(f"Digit '{num}': avg={avg_size:.1f}pt, count={len(sizes)}, all sizes={set([round(s, 1) for s in sizes])}")

    print("\n" + "=" * 60)
    print("Overall font size distribution:")
    print("=" * 60)
    all_sizes = []
    for char in chars:
        text = char.get('text', '').strip()
        if text.isdigit():
            all_sizes.append(round(char.get('size', 0), 1))

    size_counts = Counter(all_sizes)
    for size, count in sorted(size_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"{size}pt: {count} occurrences")
