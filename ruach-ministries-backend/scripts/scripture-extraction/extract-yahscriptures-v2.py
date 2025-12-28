#!/usr/bin/env python3
"""
YahScriptures PDF Extraction Script v2
Optimized for YahScriptures PDF format where verse numbers appear mid-text
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from collections import defaultdict

try:
    import pdfplumber
except ImportError:
    print("ERROR: pdfplumber not installed. Run: pip install pdfplumber")
    sys.exit(1)


class YahScripturesExtractor:
    """
    Extracts and parses YahScriptures PDF content.
    Handles verse numbers that appear inline within text.
    """

    # Same BOOK_MAPPING as before (truncated for brevity - use existing from original script)
    BOOK_MAPPING = {
        # Tanakh - Torah
        "Genesis": {"shortCode": "GEN", "testament": "tanakh", "order": 1, "genre": "law"},
        "Exodus": {"shortCode": "EXO", "testament": "tanakh", "order": 2, "genre": "law"},
        "Leviticus": {"shortCode": "LEV", "testament": "tanakh", "order": 3, "genre": "law"},
        "Numbers": {"shortCode": "NUM", "testament": "tanakh", "order": 4, "genre": "law"},
        "Deuteronomy": {"shortCode": "DEU", "testament": "tanakh", "order": 5, "genre": "law"},
        # ... (include all 103 books from original script)
    }

    def __init__(self, pdf_path: str):
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        self.verses: List[Dict] = []
        self.works: Dict[str, Dict] = {}
        self.current_book: Optional[str] = None
        self.current_chapter: int = 0

        # Buffer for accumulating text between verse numbers
        self.text_buffer = []
        self.pending_verse = None

    def extract(self) -> Tuple[List[Dict], Dict[str, Dict]]:
        """Main extraction method."""
        print(f"📖 Opening PDF: {self.pdf_path}")

        with pdfplumber.open(self.pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"📄 Total pages: {total_pages}")

            full_text = ""
            for page_num, page in enumerate(pdf.pages, 1):
                if page_num % 100 == 0:
                    print(f"   Processing page {page_num}/{total_pages}...")

                text = page.extract_text()
                if text:
                    full_text += text + "\n"

            print(f"   Parsing extracted text...")
            self._parse_full_text(full_text)

            # Flush any remaining buffered verse
            self._flush_verse()

        print(f"\n✅ Extraction complete!")
        print(f"   Books found: {len(self.works)}")
        print(f"   Verses extracted: {len(self.verses)}")

        return self.verses, self.works

    def _parse_full_text(self, text: str):
        """Parse the complete text looking for book headers and verses."""
        lines = text.split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check for book headers
            book_match = self._detect_book_header(line)
            if book_match:
                # Flush previous verse before switching books
                self._flush_verse()

                self.current_book = book_match
                self.current_chapter = 1  # Start at chapter 1

                if book_match not in self.works:
                    self._register_work(book_match)

                print(f"   Found book: {book_match}")
                continue

            # Skip if no current book
            if not self.current_book:
                continue

            # Check for chapter number on its own line (like "37" for chapter 37)
            if re.match(r'^\d{1,3}$', line):
                potential_chapter = int(line)
                if potential_chapter > self.current_chapter and potential_chapter < 200:
                    # Likely a new chapter marker
                    self._flush_verse()
                    self.current_chapter = potential_chapter
                    continue

            # Extract verse numbers from the line
            self._extract_verses_from_line(line)

    def _extract_verses_from_line(self, line: str):
        """Extract verse numbers and text from a line.

        YahScriptures format: verse numbers appear inline, like:
        "And Elohim said, Let the earth bring forth 24 the living creature..."
        """
        # Pattern: isolated number (not part of a word) that could be a verse
        verse_pattern = r'\b(\d{1,3})\b'

        parts = re.split(verse_pattern, line)

        for i, part in enumerate(parts):
            if not part.strip():
                continue

            # Check if this part is a number (potential verse number)
            if re.match(r'^\d{1,3}$', part.strip()):
                verse_num = int(part.strip())

                # If we have a pending verse, save it
                if self.pending_verse is not None:
                    self._flush_verse()

                # Start new verse
                self.pending_verse = verse_num
                self.text_buffer = []
            else:
                # This is text content
                self.text_buffer.append(part.strip())

    def _flush_verse(self):
        """Save the buffered verse."""
        if self.pending_verse is not None and self.text_buffer and self.current_book:
            verse_text = " ".join(self.text_buffer).strip()

            if verse_text:  # Only save if there's actual text
                self._add_verse(self.pending_verse, verse_text)

            self.pending_verse = None
            self.text_buffer = []

    def _detect_book_header(self, line: str) -> Optional[str]:
        """Detect if line is a book header."""
        line_upper = line.upper()

        # Exact match for book names
        for book_name in self.BOOK_MAPPING.keys():
            if book_name.upper() == line_upper:
                return book_name

        return None

    def _register_work(self, book_name: str):
        """Register a new work/book."""
        if book_name not in self.BOOK_MAPPING:
            print(f"⚠️  Unknown book: {book_name}")
            return

        meta = self.BOOK_MAPPING[book_name]
        work_id = f"yah-{meta['shortCode'].lower()}"

        self.works[book_name] = {
            "workId": work_id,
            "canonicalName": book_name,
            "translatedTitle": book_name,
            "shortCode": meta["shortCode"],
            "testament": meta["testament"],
            "canonicalOrder": meta["order"],
            "genre": meta["genre"],
            "totalChapters": 0,
            "totalVerses": 0,
            "verses": []
        }

    def _add_verse(self, verse_num: int, text: str):
        """Add a verse to the collection."""
        if not self.current_book or self.current_book not in self.works:
            return

        work = self.works[self.current_book]
        verse_id = f"{work['workId']}-{self.current_chapter:03d}-{verse_num:03d}"

        verse_data = {
            "verseId": verse_id,
            "work": work["workId"],
            "chapter": self.current_chapter,
            "verse": verse_num,
            "text": text,
            "paleoHebrewDivineNames": True,
            "hasFootnotes": False,
            "footnotes": None
        }

        self.verses.append(verse_data)
        work["verses"].append(verse_id)
        work["totalVerses"] += 1

        # Update chapter count
        if self.current_chapter > work["totalChapters"]:
            work["totalChapters"] = self.current_chapter

    def save_json(self, output_path: str):
        """Save extracted data to JSON files."""
        output_dir = Path(output_path)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Save works
        works_file = output_dir / "works.json"
        with open(works_file, 'w', encoding='utf-8') as f:
            json.dump(list(self.works.values()), f, ensure_ascii=False, indent=2)
        print(f"💾 Saved works to: {works_file}")

        # Save verses (split into chunks)
        chunk_size = 5000
        for i in range(0, len(self.verses), chunk_size):
            chunk = self.verses[i:i + chunk_size]
            chunk_num = (i // chunk_size) + 1
            verses_file = output_dir / f"verses_chunk_{chunk_num:02d}.json"

            with open(verses_file, 'w', encoding='utf-8') as f:
                json.dump(chunk, f, ensure_ascii=False, indent=2)
            print(f"💾 Saved verses chunk {chunk_num} to: {verses_file}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract-yahscriptures-v2.py <path-to-yahscriptures.pdf> [output-dir]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./extracted_scripture"

    try:
        extractor = YahScripturesExtractor(pdf_path)
        verses, works = extractor.extract()
        extractor.save_json(output_dir)

        print(f"\n🎉 Extraction successful!")
        print(f"📁 Output saved to: {output_dir}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
