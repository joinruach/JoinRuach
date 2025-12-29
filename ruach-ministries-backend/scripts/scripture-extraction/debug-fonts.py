#!/usr/bin/env python3
"""Debug font sizes to understand chapter vs verse markers"""

import pdfplumber
from collections import defaultdict

pdf_path = "../../../scripts/scripture-extraction/input/yahscriptures.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Check pages 10-50 (Genesis range)
    for page_num in range(10, 50, 10):  # Pages 10, 20, 30, 40
        page = pdf.pages[page_num]
        chars = page.chars

        # Collect all standalone numbers with their font sizes
        number_sizes = defaultdict(list)

        for char in chars:
            text = char.get('text', '').strip()
            if text.isdigit():
                size = char.get('size', 0)
                number_sizes[text].append(size)

        # Average the sizes
        avg_sizes = {num: sum(sizes)/len(sizes) for num, sizes in number_sizes.items() if sizes}

        # Sort by size to see distribution
        sorted_nums = sorted(avg_sizes.items(), key=lambda x: x[1], reverse=True)

        print(f"\n{'='*60}")
        print(f"PAGE {page_num + 1}")
        print(f"{'='*60}")
        print(f"Numbers sorted by font size:")
        for num, size in sorted_nums[:20]:  # Top 20
            print(f"  {num:>3s}: {size:6.2f}pt")

        if avg_sizes:
            all_sizes = list(avg_sizes.values())
            median = sorted(all_sizes)[len(all_sizes)//2]
            threshold = median * 1.3
            print(f"\nMedian size: {median:.2f}pt")
            print(f"Chapter threshold (1.3x): {threshold:.2f}pt")
            print(f"Numbers >= threshold: {[num for num, size in avg_sizes.items() if size >= threshold]}")
