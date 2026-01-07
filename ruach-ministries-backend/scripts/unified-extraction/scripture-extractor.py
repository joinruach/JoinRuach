#!/usr/bin/env python3
"""
Scripture Extractor v3.0 - Layout-First, Two-Pass Architecture

MAJOR REWRITE (2026-01-07):
- Stop treating PDF as plain text
- Use spatial zones (HEADER/FOOTER/MARGIN/BODY) to filter false positives
- Two-pass extraction: Parse TOC for page ranges, then bounded extraction
- Deterministic grammar instead of confidence scoring
- Hard validation against canonical structure

Key Improvements:
1. Layout-First: Word coordinates + font metadata → zone classification
2. Two-Pass: TOC parsing → page ranges → bounded extraction (not linear scan)
3. Deterministic: Hard grammar rules, no probabilistic confidence
4. Validated: Compare against canonical-structure.json, fail loudly
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import pdfplumber
except ImportError:
    print("ERROR: pdfplumber not installed. Run: pip install pdfplumber")
    import sys
    sys.exit(1)

from base_extractor import (
    BaseExtractor,
    LayoutAwareBlock,
    ExtractionResult,
    ContentType,
)
from toc_parser import parse_toc


@dataclass
class ScriptureVerse:
    """Structured scripture verse"""
    verse_id: str  # Format: yah-gen-001-001
    work_id: str  # Format: yah-gen
    chapter: int
    verse: int
    text: str
    formatting: Optional[Dict] = None
    segments: Optional[List] = None
    paleo_hebrew_divine_names: bool = True
    has_footnotes: bool = False
    footnotes: Optional[str] = None


@dataclass
class ScriptureWork:
    """Book metadata"""
    work_id: str
    canonical_name: str
    translated_title: str
    short_code: str
    testament: str
    canonical_order: int
    genre: str
    total_chapters: int
    total_verses: int
    verses: List[str]  # List of verse IDs


class ScriptureExtractor(BaseExtractor):
    """
    Scripture-specific extractor with layout-first, two-pass architecture
    """

    # Book mapping (simplified subset - full version in production)
    BOOK_MAPPING = {
        # Tanakh - Torah
        "Genesis": {"shortCode": "GEN", "testament": "tanakh", "order": 1, "genre": "law"},
        "Exodus": {"shortCode": "EXO", "testament": "tanakh", "order": 2, "genre": "law"},
        "Leviticus": {"shortCode": "LEV", "testament": "tanakh", "order": 3, "genre": "law"},
        "Numbers": {"shortCode": "NUM", "testament": "tanakh", "order": 4, "genre": "law"},
        "Deuteronomy": {"shortCode": "DEU", "testament": "tanakh", "order": 5, "genre": "law"},
        # Tanakh - Former Prophets
        "Joshua": {"shortCode": "JOS", "testament": "tanakh", "order": 6, "genre": "history"},
        "Judges": {"shortCode": "JDG", "testament": "tanakh", "order": 7, "genre": "history"},
        "Ruth": {"shortCode": "RUT", "testament": "tanakh", "order": 8, "genre": "history"},
        "1 Samuel": {"shortCode": "1SA", "testament": "tanakh", "order": 9, "genre": "history"},
        "2 Samuel": {"shortCode": "2SA", "testament": "tanakh", "order": 10, "genre": "history"},
        "1 Kings": {"shortCode": "1KG", "testament": "tanakh", "order": 11, "genre": "history"},
        "2 Kings": {"shortCode": "2KG", "testament": "tanakh", "order": 12, "genre": "history"},
        # Tanakh - Latter Prophets
        "Isaiah": {"shortCode": "ISA", "testament": "tanakh", "order": 23, "genre": "prophecy"},
        "Jeremiah": {"shortCode": "JER", "testament": "tanakh", "order": 24, "genre": "prophecy"},
        "Ezekiel": {"shortCode": "EZE", "testament": "tanakh", "order": 26, "genre": "prophecy"},
        # Tanakh - Writings
        "Psalms": {"shortCode": "PSA", "testament": "tanakh", "order": 19, "genre": "poetry"},
        "Proverbs": {"shortCode": "PRO", "testament": "tanakh", "order": 20, "genre": "poetry"},
        # Renewed Covenant - Gospels
        "Matthew": {"shortCode": "MAT", "testament": "renewed_covenant", "order": 40, "genre": "gospel"},
        "Mark": {"shortCode": "MAR", "testament": "renewed_covenant", "order": 41, "genre": "gospel"},
        "Luke": {"shortCode": "LUK", "testament": "renewed_covenant", "order": 42, "genre": "gospel"},
        "John": {"shortCode": "JOH", "testament": "renewed_covenant", "order": 43, "genre": "gospel"},
        # Renewed Covenant - Epistles
        "Romans": {"shortCode": "ROM", "testament": "renewed_covenant", "order": 45, "genre": "epistle"},
        "Revelation": {"shortCode": "REV", "testament": "renewed_covenant", "order": 66, "genre": "apocalyptic"},
        # Apocrypha - Deuterocanonical (add more as needed)
        "Tobit": {"shortCode": "TOB", "testament": "apocrypha", "order": 67, "genre": "narrative"},
        "Judith": {"shortCode": "JDT", "testament": "apocrypha", "order": 68, "genre": "narrative"},
        # NOTE: Full mapping should include all 103 books - this is a starter set
    }

    def __init__(self, source_path: str, book_filter: Optional[str] = None):
        super().__init__(source_path, content_type="scripture")

        self.book_filter = book_filter  # Extract only this book (e.g., "Genesis")
        self.current_book: Optional[str] = None
        self.current_chapter: int = 0

        self.works: Dict[str, ScriptureWork] = {}
        self.verses: List[ScriptureVerse] = []

        # Decision log for debugging
        self.decision_log: List[Dict] = []

    def extract_blocks(self) -> List:
        """
        NOT USED - Replaced by extract_blocks_with_layout()
        Kept for abstract method compliance
        """
        return []

    def extract_from_pdf(self, pdf_path: str) -> Dict:
        """
        Main extraction entry point with two-pass architecture

        Pass 1: Parse TOC to get book page ranges
        Pass 2: Extract only pages in range for target book(s)
        """
        print(f"📖 Extracting scripture from: {Path(pdf_path).name}")

        with pdfplumber.open(pdf_path) as pdf:
            # PASS 1: Parse TOC
            page_ranges = parse_toc(pdf)

            # If book_filter is set, extract only that book
            if self.book_filter:
                if self.book_filter not in page_ranges:
                    raise ValueError(f"Book '{self.book_filter}' not found in TOC. Available: {list(page_ranges.keys())}")

                print(f"\n📌 Filtering to book: {self.book_filter}")
                page_ranges = {self.book_filter: page_ranges[self.book_filter]}

            # PASS 2: Extract each book from its page range
            for book_name, (start_page, end_page) in page_ranges.items():
                print(f"\n📖 Extracting {book_name} (pages {start_page} → {end_page if end_page != -1 else 'END'})...")

                self._extract_book(pdf, book_name, start_page, end_page)

        # Return structured data
        return {"works": list(self.works.values()), "verses": self.verses}

    def _extract_book(self, pdf, book_name: str, start_page: int, end_page: int):
        """
        Extract a single book from its page range using layout-aware extraction

        Args:
            pdf: pdfplumber.PDF object
            book_name: Book name (e.g., "Genesis")
            start_page: Starting page (1-indexed)
            end_page: Ending page (1-indexed), or -1 for end of document
        """
        # Register this book
        self._register_work(book_name)
        self.current_book = book_name
        self.current_chapter = 0

        # Determine actual end page
        if end_page == -1:
            end_page = len(pdf.pages)

        # Convert to 0-indexed
        start_idx = start_page - 1
        end_idx = end_page

        # Extract layout-aware blocks from page range
        blocks = []
        for page_idx in range(start_idx, min(end_idx, len(pdf.pages))):
            page = pdf.pages[page_idx]
            page_blocks = self._extract_page_blocks(page, page_idx + 1)
            blocks.extend(page_blocks)

        # Filter to BODY zone only (eliminate headers/footers/margins)
        body_blocks = [b for b in blocks if b.zone == 'BODY']
        print(f"   → Filtered to {len(body_blocks)} BODY blocks (from {len(blocks)} total)")

        # Assemble words into lines
        line_blocks = self._assemble_lines(body_blocks)
        print(f"   → Assembled {len(line_blocks)} lines from word blocks")

        # Parse verses from line blocks
        self._parse_verses_from_blocks(line_blocks)

    def _extract_page_blocks(self, page, page_num: int) -> List[LayoutAwareBlock]:
        """Extract layout-aware blocks from a single page"""
        from base_extractor import classify_zone

        blocks = []
        page_width = page.width
        page_height = page.height

        try:
            words = page.extract_words(
                use_text_flow=True,
                keep_blank_chars=False,
                extra_attrs=['fontname', 'size']
            )
        except Exception as e:
            self.warnings.append(f"Page {page_num}: Failed to extract words - {e}")
            return blocks

        for word in words:
            zone = classify_zone(word, page_width, page_height)

            blocks.append(LayoutAwareBlock(
                text=word.get('text', ''),
                x0=word.get('x0', 0),
                top=word.get('top', 0),
                bottom=word.get('bottom', 0),
                font_size=word.get('height', 0),
                font_name=word.get('fontname', ''),
                zone=zone,
                page=page_num
            ))

        return blocks

    def _assemble_lines(self, word_blocks: List[LayoutAwareBlock]) -> List[LayoutAwareBlock]:
        """
        Assemble word-level blocks into line-level blocks

        Groups consecutive words that share the same vertical position (line)
        into a single block with combined text.

        Args:
            word_blocks: List of word-level LayoutAwareBlock objects

        Returns:
            List of line-level LayoutAwareBlock objects
        """
        if not word_blocks:
            return []

        lines: List[LayoutAwareBlock] = []
        current_line_words = []
        current_line_y = None

        # Tolerance for Y-coordinate matching (points)
        Y_TOLERANCE = 2.0

        for block in word_blocks:
            # Start a new line if:
            # 1. This is the first word, OR
            # 2. Y coordinate differs significantly (new line), OR
            # 3. Page changed
            if (current_line_y is None or
                abs(block.top - current_line_y) > Y_TOLERANCE or
                (current_line_words and block.page != current_line_words[0].page)):

                # Save previous line
                if current_line_words:
                    lines.append(self._merge_words_into_line(current_line_words))

                # Start new line
                current_line_words = [block]
                current_line_y = block.top
            else:
                # Continue current line
                current_line_words.append(block)

        # Save final line
        if current_line_words:
            lines.append(self._merge_words_into_line(current_line_words))

        return lines

    def _merge_words_into_line(self, words: List[LayoutAwareBlock]) -> LayoutAwareBlock:
        """
        Merge multiple word blocks into a single line block

        Args:
            words: List of word blocks on the same line

        Returns:
            Single LayoutAwareBlock representing the complete line
        """
        if not words:
            raise ValueError("Cannot merge empty word list")

        # Combine text with spaces
        line_text = ' '.join(w.text for w in words)

        # Use first word's metadata as representative
        first = words[0]

        return LayoutAwareBlock(
            text=line_text,
            x0=first.x0,
            top=first.top,
            bottom=first.bottom,
            font_size=first.font_size,
            font_name=first.font_name,
            zone=first.zone,
            page=first.page
        )

    def _parse_verses_from_blocks(self, blocks: List[LayoutAwareBlock]):
        """
        Parse verses from BODY-zone blocks using deterministic grammar

        Grammar rules:
        1. Chapter markers: "CHAPTER 1" or standalone number with larger font
        2. Verse markers: "1 In the beginning..." (number + space + text)
        3. Sequential validation: verses must be in order (1, 2, 3, ...)
        """

        i = 0
        while i < len(blocks):
            block = blocks[i]
            text = block.text.strip()

            # Check for chapter marker
            chapter_num = self._detect_chapter_start(block, blocks[max(0, i-5):i+5])
            if chapter_num is not None:
                self.current_chapter = chapter_num
                print(f"      Chapter {chapter_num}")
                i += 1
                continue

            # Check for standalone verse/chapter number (on its own line)
            if re.match(r'^\d{1,3}$', text):
                num = int(text)

                # Large numbers (>20pt) are BOTH chapter heading AND verse 1
                # (e.g., "2" at 28pt starts Chapter 2 and is also Genesis 2:1)
                is_large_number = block.font_size >= 20.0

                if is_large_number:
                    # This is a chapter heading (also verse 1)
                    expected_chapter = self.current_chapter + 1
                    if num == expected_chapter or (self.current_chapter == 0 and 1 <= num <= 3):
                        self.current_chapter = num
                        print(f"      Chapter {self.current_chapter}")
                        verse_num = 1  # Large number represents verse 1
                    else:
                        # Unexpected large number, skip
                        i += 1
                        continue
                else:
                    # Small number is a regular verse marker
                    verse_num = num

                # Collect verse text from following lines
                verse_text_parts = []
                j = i + 1
                while j < len(blocks):
                    next_block = blocks[j]
                    next_text = next_block.text.strip()

                    # Stop if we hit another verse number
                    if re.match(r'^\d{1,3}$', next_text):
                        break

                    verse_text_parts.append(next_text)
                    j += 1

                # Save verse if we collected text
                if verse_text_parts:
                    verse_text = ' '.join(verse_text_parts)
                    self._add_verse(verse_num, verse_text)

                i = j
                continue

            # Also check for inline verse marker (number + text on same line)
            verse_match = re.match(r'^(\d{1,3})\s+(.+)$', text)
            if verse_match:
                verse_num = int(verse_match.group(1))
                verse_text_start = verse_match.group(2)

                # Collect continuation lines
                verse_text_parts = [verse_text_start]
                j = i + 1
                while j < len(blocks):
                    next_block = blocks[j]
                    next_text = next_block.text.strip()

                    # Stop if we hit another verse marker or chapter marker
                    if re.match(r'^\d{1,3}', next_text):
                        break
                    if self._detect_chapter_start(next_block, blocks[max(0, j-5):j+5]) is not None:
                        break

                    verse_text_parts.append(next_text)
                    j += 1

                # Save verse
                verse_text = ' '.join(verse_text_parts)
                self._add_verse(verse_num, verse_text)

                i = j
                continue

            i += 1

    def _detect_chapter_start(self, block: LayoutAwareBlock, context: List[LayoutAwareBlock]) -> Optional[int]:
        """
        Detect chapter markers using typography + position + sequence

        Patterns:
        1. "CHAPTER 1" heading (explicit)
        2. Standalone number with larger font
        3. Book name + number (e.g., "BERESHITH 1")
        """
        text = block.text.strip()

        # Pattern 1: Explicit chapter heading
        match = re.match(r'^CHAPTER\s+(\d{1,3})$', text, re.I)
        if match:
            ch_num = int(match.group(1))
            if self._is_sequential_chapter(ch_num):
                return ch_num

        # Pattern 2: Standalone number (with font size check)
        # DISABLED for scripture - verse 1 often looks like a chapter marker
        # Rely on explicit "CHAPTER 1" or book name patterns instead
        # if re.match(r'^\d{1,3}$', text):
        #     ch_num = int(text)
        #     avg_font_size = self._get_average_font_size(context)
        #     if block.font_size > avg_font_size * 1.15:
        #         if self._is_sequential_chapter(ch_num):
        #             return ch_num

        # Pattern 3: Book name + number
        match = re.match(r'^[A-Z\u0590-\u05FF]+\s+(\d{1,3})$', text)
        if match:
            ch_num = int(match.group(1))
            if self._is_sequential_chapter(ch_num):
                return ch_num

        return None

    def _is_sequential_chapter(self, ch_num: int) -> bool:
        """Validate chapter number is sequential"""
        if self.current_chapter == 0:
            # First chapter, allow 1-3
            return 1 <= ch_num <= 3
        else:
            # Must be next chapter
            return ch_num == self.current_chapter + 1

    def _get_average_font_size(self, blocks: List[LayoutAwareBlock]) -> float:
        """Calculate average font size from block context"""
        if not blocks:
            return 12.0  # Default

        font_sizes = [b.font_size for b in blocks if b.font_size > 0]
        if not font_sizes:
            return 12.0

        return sum(font_sizes) / len(font_sizes)

    def _register_work(self, book_name: str):
        """Register a new work/book"""
        if book_name not in self.BOOK_MAPPING:
            self.warnings.append(f"Unknown book: {book_name}")
            return

        meta = self.BOOK_MAPPING[book_name]
        work_id = f"yah-{meta['shortCode'].lower()}"

        self.works[book_name] = ScriptureWork(
            work_id=work_id,
            canonical_name=book_name,
            translated_title=book_name,
            short_code=meta["shortCode"],
            testament=meta["testament"],
            canonical_order=meta["order"],
            genre=meta["genre"],
            total_chapters=0,
            total_verses=0,
            verses=[],
        )

    def _add_verse(self, verse_num: int, text: str):
        """Add a verse to the current book/chapter"""
        if not self.current_book or self.current_book not in self.works:
            return

        if self.current_chapter == 0:
            self.warnings.append(f"Verse {verse_num} found before chapter marker")
            return

        work = self.works[self.current_book]
        verse_id = f"{work.work_id}-{self.current_chapter:03d}-{verse_num:03d}"

        verse = ScriptureVerse(
            verse_id=verse_id,
            work_id=work.work_id,
            chapter=self.current_chapter,
            verse=verse_num,
            text=text,
            paleo_hebrew_divine_names=True,
            has_footnotes=False,
            footnotes=None,
        )

        self.verses.append(verse)
        work.verses.append(verse_id)
        work.total_verses += 1

        # Update chapter count
        if self.current_chapter > work.total_chapters:
            work.total_chapters = self.current_chapter

    def parse_structure(self, blocks: List) -> Dict:
        """
        NOT USED - Extraction happens in extract_from_pdf()
        Kept for abstract method compliance
        """
        return {"works": [], "verses": []}

    def validate(self, structured_data: Dict) -> Tuple[bool, List[str], List[str]]:
        """
        Basic validation - detailed validation done by canonical-validator.py
        """
        errors = []
        warnings = []

        works = structured_data.get("works", [])
        verses = structured_data.get("verses", [])

        if not works:
            errors.append("No books extracted")

        if not verses:
            errors.append("No verses extracted")

        # Check for chapter/verse 0 (invalid)
        for v in verses:
            if v.chapter == 0:
                errors.append(f"Invalid chapter 0 found in {v.verse_id}")
            if v.verse == 0:
                errors.append(f"Invalid verse 0 found in {v.verse_id}")

        return (len(errors) == 0, errors, warnings)

    def save_json(self, output_dir: str, result: ExtractionResult):
        """Save scripture extraction to JSON files"""
        super().save_json(output_dir, result)

        output_path = Path(output_dir)

        # Save works
        works_file = output_path / "works.json"
        works_data = [asdict(w) for w in result.items["works"]]
        with open(works_file, "w") as f:
            json.dump(works_data, f, indent=2)
        print(f"   - {works_file.name}")

        # Save verses (chunked for large datasets)
        verses = result.items["verses"]
        chunk_size = 5000
        for i in range(0, len(verses), chunk_size):
            chunk_num = (i // chunk_size) + 1
            chunk = verses[i : i + chunk_size]
            verses_file = output_path / f"verses_chunk_{chunk_num:02d}.json"
            verses_data = [asdict(v) for v in chunk]
            with open(verses_file, "w") as f:
                json.dump(verses_data, f, indent=2)
            print(f"   - {verses_file.name} ({len(chunk)} verses)")


# CLI usage
if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Extract scripture from PDF (v3.0 - Layout-First)")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("output_dir", help="Output directory for JSON files")
    parser.add_argument("--book", dest="book_filter", help="Extract only this book (e.g., 'Genesis')")
    parser.add_argument("--verbose", action="store_true", help="Verbose logging")

    args = parser.parse_args()

    extractor = ScriptureExtractor(args.pdf_path, book_filter=args.book_filter)

    # Extract from PDF
    try:
        structured_data = extractor.extract_from_pdf(args.pdf_path)
    except Exception as e:
        print(f"\n❌ Extraction failed: {e}")
        sys.exit(1)

    # Validate
    is_valid, errors, warnings = extractor.validate(structured_data)

    # Create extraction result
    from base_extractor import ExtractionMetadata, ExtractionResult
    from datetime import datetime

    metadata = ExtractionMetadata(
        extractor_version="3.0.0",
        content_type="scripture",
        source_file=str(args.pdf_path),
        source_sha256=extractor.source_sha256,
        extraction_timestamp=datetime.utcnow().isoformat() + "Z",
        total_pages=None,
        total_items=len(structured_data["works"]),
        validation_status="valid" if is_valid else "invalid",
    )

    result = ExtractionResult(
        metadata=metadata,
        items=structured_data,
        errors=errors,
        warnings=warnings,
    )

    # Save output
    extractor.save_json(args.output_dir, result)

    # Print summary
    print(f"\n{'✅' if is_valid else '❌'} Extraction {'PASSED' if is_valid else 'FAILED'}")
    print(f"   Works: {len(structured_data['works'])}")
    print(f"   Verses: {len(structured_data['verses'])}")
    print(f"   Errors: {len(errors)}")
    print(f"   Warnings: {len(warnings)}")

    if errors:
        print("\n❌ ERRORS:")
        for error in errors:
            print(f"   - {error}")

    sys.exit(0 if is_valid else 1)
