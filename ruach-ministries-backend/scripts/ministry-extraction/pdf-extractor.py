#!/usr/bin/env python3
"""
Ministry Text PDF Extractor
Extracts EGW ministry books (Ministry of Healing, etc.) to JSONL format

Extends BaseExtractor with ministry-specific logic:
- Chapter detection (multiple patterns: font size, regex, spacing)
- Paragraph segmentation (visual spacing + line breaks)
- Zone filtering (HEADER/FOOTER/MARGIN/BODY)
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Optional, Tuple

# Add parent directory to path for base-extractor import
sys.path.insert(0, str(Path(__file__).parent.parent / "unified-extraction"))

try:
    from base_extractor import (
        BaseExtractor,
        LayoutAwareBlock,
        ExtractionResult,
        classify_zone,
        looks_like_toc_line,
    )
except ImportError:
    print("ERROR: Could not import base_extractor. Make sure base-extractor.py exists.")
    sys.exit(1)

try:
    import pdfplumber
except ImportError:
    print("ERROR: pdfplumber not installed. Run: pip install pdfplumber")
    sys.exit(1)


@dataclass
class MinistryParagraph:
    """Extracted paragraph from ministry book"""
    book: str
    chapter: int
    paragraph: int
    text: str
    pdfPage: int
    heading: Optional[str] = None
    confidence: float = 1.0


class MinistryPDFExtractor(BaseExtractor):
    """Extract ministry texts from PDF"""

    # Chapter heading patterns
    CHAPTER_PATTERNS = [
        r"^Chapter\s+(\d+|[IVXLCDM]+)[—\-:]\s*.+$",  # "Chapter 1—Title" (em-dash, hyphen, or colon)
        r"^CHAPTER\s+(\d+|[IVXLCDM]+)\.?\s*$",  # "CHAPTER 1" or "CHAPTER I"
        r"^(\d+|[IVXLCDM]+)\.\s+[A-Z][A-Za-z\s]{3,50}$",  # "1. The Title"
    ]

    # Font size threshold for headings (relative to body text)
    HEADING_FONT_THRESHOLD = 1.3  # 30% larger than body text

    def __init__(self, pdf_path: str, book_code: str):
        super().__init__(pdf_path, "library")  # Use "library" content type
        self.book_code = book_code
        self.pdf = None
        self.avg_body_font_size = 11.0  # Will be updated during extraction
        self.current_chapter = 0
        self.current_heading = None

    def extract_blocks(self) -> List[LayoutAwareBlock]:
        """Extract layout-aware blocks from PDF"""
        with pdfplumber.open(self.source_path) as pdf:
            self.pdf = pdf
            blocks = self.extract_blocks_with_layout(pdf)
        return blocks

    def parse_structure(self, blocks: List[LayoutAwareBlock]) -> List[MinistryParagraph]:
        """
        Parse layout blocks into ministry paragraphs

        Steps:
        1. Filter to BODY zone only
        2. Detect chapter boundaries
        3. Segment paragraphs
        4. Extract text
        """
        print("   → Parsing ministry structure...")

        # Step 1: Filter to BODY zone
        body_blocks = [b for b in blocks if b.zone == "BODY"]
        print(f"   → {len(body_blocks)} body blocks after zone filtering")

        # Step 2: Calculate average body font size
        font_sizes = [b.font_size for b in body_blocks if b.font_size > 0]
        if font_sizes:
            self.avg_body_font_size = sum(font_sizes) / len(font_sizes)
        print(f"   → Average body font size: {self.avg_body_font_size:.1f}pt")

        # Step 3: Group blocks by page and line
        page_lines = self._group_blocks_into_lines(body_blocks)

        # Step 4: Detect chapters and paragraphs
        paragraphs = self._extract_paragraphs_from_lines(page_lines)

        print(f"   → Extracted {len(paragraphs)} paragraphs across {self.current_chapter} chapters")

        return paragraphs

    def _group_blocks_into_lines(self, blocks: List[LayoutAwareBlock]) -> dict:
        """Group blocks into lines by page"""
        from collections import defaultdict

        page_lines = defaultdict(list)

        # Group by page
        pages = defaultdict(list)
        for block in blocks:
            pages[block.page].append(block)

        # For each page, group into lines (similar y-coordinate)
        for page_num, page_blocks in sorted(pages.items()):
            # Sort by top coordinate
            page_blocks.sort(key=lambda b: (b.top, b.x0))

            current_line = []
            current_top = None
            line_tolerance = 3.0  # pixels

            for block in page_blocks:
                if current_top is None or abs(block.top - current_top) <= line_tolerance:
                    # Same line
                    current_line.append(block)
                    current_top = block.top
                else:
                    # New line
                    if current_line:
                        page_lines[page_num].append(current_line)
                    current_line = [block]
                    current_top = block.top

            # Add last line
            if current_line:
                page_lines[page_num].append(current_line)

        return page_lines

    def _extract_paragraphs_from_lines(self, page_lines: dict) -> List[MinistryParagraph]:
        """Extract paragraphs from grouped lines"""
        paragraphs = []
        current_para_lines = []
        paragraph_num = 0

        for page_num in sorted(page_lines.keys()):
            lines = page_lines[page_num]

            for line_blocks in lines:
                # Combine blocks in line to form text
                line_text = " ".join(b.text for b in line_blocks).strip()

                if not line_text:
                    # Empty line - potential paragraph break
                    if current_para_lines:
                        para = self._create_paragraph(current_para_lines, page_num)
                        if para:
                            paragraph_num += 1
                            para.paragraph = paragraph_num
                            paragraphs.append(para)
                        current_para_lines = []
                    continue

                # Skip Table of Contents lines
                if looks_like_toc_line(line_text):
                    continue

                # Check if this is a chapter heading
                if self._is_chapter_heading(line_blocks, line_text):
                    # Flush current paragraph
                    if current_para_lines:
                        para = self._create_paragraph(current_para_lines, page_num)
                        if para:
                            paragraph_num += 1
                            para.paragraph = paragraph_num
                            paragraphs.append(para)
                        current_para_lines = []

                    # Extract chapter number
                    chapter_num = self._extract_chapter_number(line_text)
                    if chapter_num > 0:
                        self.current_chapter = chapter_num
                        paragraph_num = 0  # Reset paragraph numbering
                        print(f"   → Detected Chapter {self.current_chapter}: {line_text[:50]}")

                    # Store as current heading
                    self.current_heading = line_text
                    continue

                # Check if this is a section heading (larger font but not chapter)
                if self._is_section_heading(line_blocks, line_text):
                    # Flush current paragraph
                    if current_para_lines:
                        para = self._create_paragraph(current_para_lines, page_num)
                        if para:
                            paragraph_num += 1
                            para.paragraph = paragraph_num
                            paragraphs.append(para)
                        current_para_lines = []

                    # Store as current heading
                    self.current_heading = line_text
                    continue

                # Skip content before first chapter is detected (front matter)
                if self.current_chapter == 0:
                    continue

                # Check for paragraph break (visual spacing)
                if current_para_lines and self._is_paragraph_break(current_para_lines[-1], line_blocks):
                    para = self._create_paragraph(current_para_lines, page_num)
                    if para:
                        paragraph_num += 1
                        para.paragraph = paragraph_num
                        paragraphs.append(para)
                    current_para_lines = []

                # Add line to current paragraph
                current_para_lines.append((line_blocks, line_text, page_num))

        # Flush remaining paragraph
        if current_para_lines:
            para = self._create_paragraph(current_para_lines, current_para_lines[-1][2])
            if para:
                paragraph_num += 1
                para.paragraph = paragraph_num
                paragraphs.append(para)

        return paragraphs

    def _is_chapter_heading(self, line_blocks: List[LayoutAwareBlock], line_text: str) -> bool:
        """Detect if line is a chapter heading"""
        # Skip page markers (numbers in brackets)
        if re.match(r"^\[\s*\d+\s*\]\s*$", line_text.strip()):
            return False

        # STRICT: Only use explicit chapter patterns (no font size heuristic)
        # This prevents title pages and author names from being detected as chapters
        for pattern in self.CHAPTER_PATTERNS:
            if re.match(pattern, line_text.strip(), re.IGNORECASE):
                return True

        return False

    def _is_section_heading(self, line_blocks: List[LayoutAwareBlock], line_text: str) -> bool:
        """Detect if line is a section heading (not chapter-level)"""
        # Font size heuristic (moderately larger)
        avg_font_size = sum(b.font_size for b in line_blocks) / len(line_blocks)
        if avg_font_size >= self.avg_body_font_size * self.HEADING_FONT_THRESHOLD:
            # Check if it's short enough to be a heading
            if len(line_text) < 100:
                return True

        return False

    def _extract_chapter_number(self, text: str) -> int:
        """Extract chapter number from heading text"""
        # Try numeric patterns
        match = re.search(r'\b(\d+)\b', text)
        if match:
            return int(match.group(1))

        # Try Roman numerals
        roman_map = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
            'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
            'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15,
        }
        for roman, num in roman_map.items():
            if roman in text.upper():
                return num

        # Increment current chapter if no number found
        return self.current_chapter + 1

    def _is_paragraph_break(self, prev_line_data: tuple, curr_line_blocks: List[LayoutAwareBlock]) -> bool:
        """Detect if there's a paragraph break between lines"""
        prev_blocks, prev_text, prev_page = prev_line_data

        # Different pages = paragraph break
        if curr_line_blocks[0].page != prev_page:
            return True

        # Calculate vertical gap
        prev_bottom = max(b.bottom for b in prev_blocks)
        curr_top = min(b.top for b in curr_line_blocks)
        gap = curr_top - prev_bottom

        # Paragraph break if gap > 1.5x line height
        avg_line_height = self.avg_body_font_size * 1.2
        if gap > avg_line_height * 1.5:
            return True

        # Check indentation (first line indented = new paragraph)
        prev_x0 = min(b.x0 for b in prev_blocks)
        curr_x0 = min(b.x0 for b in curr_line_blocks)
        if curr_x0 - prev_x0 > 15:  # Indented by >15 pixels
            return True

        return False

    def _create_paragraph(self, lines_data: List[tuple], page_num: int) -> Optional[MinistryParagraph]:
        """Create MinistryParagraph from accumulated lines"""
        if not lines_data:
            return None

        # Combine all line texts
        texts = [line_text for _, line_text, _ in lines_data]
        full_text = " ".join(texts)

        # Normalize text
        full_text = self.normalize_text(full_text)

        # Skip if too short (likely artifact)
        if len(full_text) < 10:
            return None

        # Calculate confidence (based on average font size consistency)
        all_blocks = [block for blocks, _, _ in lines_data for block in blocks]
        font_sizes = [b.font_size for b in all_blocks if b.font_size > 0]
        if font_sizes:
            font_std = (sum((f - self.avg_body_font_size) ** 2 for f in font_sizes) / len(font_sizes)) ** 0.5
            confidence = max(0.5, 1.0 - (font_std / self.avg_body_font_size))
        else:
            confidence = 0.8

        return MinistryParagraph(
            book=self.book_code,
            chapter=self.current_chapter,
            paragraph=0,  # Will be set by caller
            text=full_text,
            pdfPage=page_num,
            heading=self.current_heading,
            confidence=round(confidence, 2),
        )

    def validate(self, structured_data: List[MinistryParagraph]) -> Tuple[bool, List[str], List[str]]:
        """Validate extracted paragraphs"""
        errors = []
        warnings = []

        if not structured_data:
            errors.append("No paragraphs extracted")
            return False, errors, warnings

        # Check for first paragraph
        has_first_para = any(p.chapter == 1 and p.paragraph == 1 for p in structured_data)
        if not has_first_para:
            warnings.append("No paragraph found for Chapter 1, Paragraph 1")

        # Check for very short paragraphs
        short_paras = [p for p in structured_data if len(p.text) < 20]
        if len(short_paras) > len(structured_data) * 0.1:  # >10% short
            warnings.append(f"{len(short_paras)} paragraphs are very short (<20 chars)")

        # Check for missing headings
        no_heading = [p for p in structured_data if not p.heading]
        if len(no_heading) > len(structured_data) * 0.7:  # >70% missing
            warnings.append(f"{len(no_heading)} paragraphs have no heading")

        # Check chapter sequence
        chapters = sorted(set(p.chapter for p in structured_data))
        if chapters and chapters[0] != 1:
            warnings.append(f"First chapter is {chapters[0]}, expected 1")

        return True, errors, warnings

    def save_jsonl(self, output_path: str, paragraphs: List[MinistryParagraph]):
        """Save paragraphs to JSONL format"""
        with open(output_path, "w", encoding="utf-8") as f:
            for para in paragraphs:
                f.write(json.dumps(asdict(para)) + "\n")

        print(f"\n💾 Saved {len(paragraphs)} paragraphs to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Extract ministry text from PDF")
    parser.add_argument("--pdf", required=True, help="Path to PDF file")
    parser.add_argument("--out", required=True, help="Output JSONL file")
    parser.add_argument("--book-code", required=True, help="Book code (e.g., MOH)")
    args = parser.parse_args()

    # Run extraction
    extractor = MinistryPDFExtractor(args.pdf, args.book_code)
    result = extractor.extract()

    # Save JSONL
    extractor.save_jsonl(args.out, result.items)

    # Save metadata
    output_dir = Path(args.out).parent
    extractor.save_json(str(output_dir), result)

    # Exit with error code if validation failed
    if result.errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
