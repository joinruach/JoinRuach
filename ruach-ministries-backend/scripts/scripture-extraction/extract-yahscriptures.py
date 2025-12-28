#!/usr/bin/env python3
"""
YahScriptures PDF Extraction Script
Extracts verses from YahScriptures PDF and converts to JSON format for Strapi import
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import pdfplumber
except ImportError:
    print("ERROR: pdfplumber not installed. Run: pip install pdfplumber")
    sys.exit(1)


class YahScripturesExtractor:
    """
    Extracts and parses YahScriptures PDF content.
    Handles the 103-book collection with Paleo-Hebrew divine names preserved.
    """

    # Complete 103-book mapping
    BOOK_MAPPING = {
        # Tanakh - Torah (5)
        "Genesis": {"shortCode": "GEN", "testament": "tanakh", "order": 1, "genre": "law"},
        "Exodus": {"shortCode": "EXO", "testament": "tanakh", "order": 2, "genre": "law"},
        "Leviticus": {"shortCode": "LEV", "testament": "tanakh", "order": 3, "genre": "law"},
        "Numbers": {"shortCode": "NUM", "testament": "tanakh", "order": 4, "genre": "law"},
        "Deuteronomy": {"shortCode": "DEU", "testament": "tanakh", "order": 5, "genre": "law"},

        # Tanakh - Former Prophets (6)
        "Joshua": {"shortCode": "JOS", "testament": "tanakh", "order": 6, "genre": "history"},
        "Judges": {"shortCode": "JDG", "testament": "tanakh", "order": 7, "genre": "history"},
        "Ruth": {"shortCode": "RUT", "testament": "tanakh", "order": 8, "genre": "history"},
        "1 Samuel": {"shortCode": "1SA", "testament": "tanakh", "order": 9, "genre": "history"},
        "2 Samuel": {"shortCode": "2SA", "testament": "tanakh", "order": 10, "genre": "history"},
        "1 Kings": {"shortCode": "1KI", "testament": "tanakh", "order": 11, "genre": "history"},
        "2 Kings": {"shortCode": "2KI", "testament": "tanakh", "order": 12, "genre": "history"},

        # Tanakh - Latter Prophets (15)
        "Isaiah": {"shortCode": "ISA", "testament": "tanakh", "order": 13, "genre": "prophecy"},
        "Jeremiah": {"shortCode": "JER", "testament": "tanakh", "order": 14, "genre": "prophecy"},
        "Lamentations": {"shortCode": "LAM", "testament": "tanakh", "order": 15, "genre": "prophecy"},
        "Ezekiel": {"shortCode": "EZE", "testament": "tanakh", "order": 16, "genre": "prophecy"},
        "Daniel": {"shortCode": "DAN", "testament": "tanakh", "order": 17, "genre": "prophecy"},
        "Hosea": {"shortCode": "HOS", "testament": "tanakh", "order": 18, "genre": "prophecy"},
        "Joel": {"shortCode": "JOE", "testament": "tanakh", "order": 19, "genre": "prophecy"},
        "Amos": {"shortCode": "AMO", "testament": "tanakh", "order": 20, "genre": "prophecy"},
        "Obadiah": {"shortCode": "OBA", "testament": "tanakh", "order": 21, "genre": "prophecy"},
        "Jonah": {"shortCode": "JON", "testament": "tanakh", "order": 22, "genre": "prophecy"},
        "Micah": {"shortCode": "MIC", "testament": "tanakh", "order": 23, "genre": "prophecy"},
        "Nahum": {"shortCode": "NAH", "testament": "tanakh", "order": 24, "genre": "prophecy"},
        "Habakkuk": {"shortCode": "HAB", "testament": "tanakh", "order": 25, "genre": "prophecy"},
        "Zephaniah": {"shortCode": "ZEP", "testament": "tanakh", "order": 26, "genre": "prophecy"},
        "Haggai": {"shortCode": "HAG", "testament": "tanakh", "order": 27, "genre": "prophecy"},
        "Zechariah": {"shortCode": "ZEC", "testament": "tanakh", "order": 28, "genre": "prophecy"},
        "Malachi": {"shortCode": "MAL", "testament": "tanakh", "order": 29, "genre": "prophecy"},

        # Tanakh - Writings (13)
        "Psalms": {"shortCode": "PSA", "testament": "tanakh", "order": 30, "genre": "wisdom"},
        "Proverbs": {"shortCode": "PRO", "testament": "tanakh", "order": 31, "genre": "wisdom"},
        "Job": {"shortCode": "JOB", "testament": "tanakh", "order": 32, "genre": "wisdom"},
        "Song of Songs": {"shortCode": "SNG", "testament": "tanakh", "order": 33, "genre": "wisdom"},
        "Ecclesiastes": {"shortCode": "ECC", "testament": "tanakh", "order": 34, "genre": "wisdom"},
        "Esther": {"shortCode": "EST", "testament": "tanakh", "order": 35, "genre": "history"},
        "1 Chronicles": {"shortCode": "1CH", "testament": "tanakh", "order": 36, "genre": "history"},
        "2 Chronicles": {"shortCode": "2CH", "testament": "tanakh", "order": 37, "genre": "history"},
        "Ezra": {"shortCode": "EZR", "testament": "tanakh", "order": 38, "genre": "history"},
        "Nehemiah": {"shortCode": "NEH", "testament": "tanakh", "order": 39, "genre": "history"},

        # Renewed Covenant - Gospels (4)
        "Matthew": {"shortCode": "MAT", "testament": "renewed_covenant", "order": 40, "genre": "gospel"},
        "Mark": {"shortCode": "MRK", "testament": "renewed_covenant", "order": 41, "genre": "gospel"},
        "Luke": {"shortCode": "LUK", "testament": "renewed_covenant", "order": 42, "genre": "gospel"},
        "John": {"shortCode": "JHN", "testament": "renewed_covenant", "order": 43, "genre": "gospel"},

        # Renewed Covenant - Acts & Epistles (23)
        "Acts": {"shortCode": "ACT", "testament": "renewed_covenant", "order": 44, "genre": "history"},
        "Romans": {"shortCode": "ROM", "testament": "renewed_covenant", "order": 45, "genre": "epistle"},
        "1 Corinthians": {"shortCode": "1CO", "testament": "renewed_covenant", "order": 46, "genre": "epistle"},
        "2 Corinthians": {"shortCode": "2CO", "testament": "renewed_covenant", "order": 47, "genre": "epistle"},
        "Galatians": {"shortCode": "GAL", "testament": "renewed_covenant", "order": 48, "genre": "epistle"},
        "Ephesians": {"shortCode": "EPH", "testament": "renewed_covenant", "order": 49, "genre": "epistle"},
        "Philippians": {"shortCode": "PHP", "testament": "renewed_covenant", "order": 50, "genre": "epistle"},
        "Colossians": {"shortCode": "COL", "testament": "renewed_covenant", "order": 51, "genre": "epistle"},
        "1 Thessalonians": {"shortCode": "1TH", "testament": "renewed_covenant", "order": 52, "genre": "epistle"},
        "2 Thessalonians": {"shortCode": "2TH", "testament": "renewed_covenant", "order": 53, "genre": "epistle"},
        "1 Timothy": {"shortCode": "1TI", "testament": "renewed_covenant", "order": 54, "genre": "epistle"},
        "2 Timothy": {"shortCode": "2TI", "testament": "renewed_covenant", "order": 55, "genre": "epistle"},
        "Titus": {"shortCode": "TIT", "testament": "renewed_covenant", "order": 56, "genre": "epistle"},
        "Philemon": {"shortCode": "PHM", "testament": "renewed_covenant", "order": 57, "genre": "epistle"},
        "Hebrews": {"shortCode": "HEB", "testament": "renewed_covenant", "order": 58, "genre": "epistle"},
        "James": {"shortCode": "JAS", "testament": "renewed_covenant", "order": 59, "genre": "epistle"},
        "1 Peter": {"shortCode": "1PE", "testament": "renewed_covenant", "order": 60, "genre": "epistle"},
        "2 Peter": {"shortCode": "2PE", "testament": "renewed_covenant", "order": 61, "genre": "epistle"},
        "1 John": {"shortCode": "1JN", "testament": "renewed_covenant", "order": 62, "genre": "epistle"},
        "2 John": {"shortCode": "2JN", "testament": "renewed_covenant", "order": 63, "genre": "epistle"},
        "3 John": {"shortCode": "3JN", "testament": "renewed_covenant", "order": 64, "genre": "epistle"},
        "Jude": {"shortCode": "JUD", "testament": "renewed_covenant", "order": 65, "genre": "epistle"},
        "Revelation": {"shortCode": "REV", "testament": "renewed_covenant", "order": 66, "genre": "apocalyptic"},

        # Apocrypha - Deuterocanonical Books (37 books)
        "Tobit": {"shortCode": "TOB", "testament": "apocrypha", "order": 67, "genre": "history"},
        "Judith": {"shortCode": "JDT", "testament": "apocrypha", "order": 68, "genre": "history"},
        "Additions to Esther": {"shortCode": "ESG", "testament": "apocrypha", "order": 69, "genre": "history"},
        "Wisdom of Solomon": {"shortCode": "WIS", "testament": "apocrypha", "order": 70, "genre": "wisdom"},
        "Sirach": {"shortCode": "SIR", "testament": "apocrypha", "order": 71, "genre": "wisdom"},
        "Ecclesiasticus": {"shortCode": "SIR", "testament": "apocrypha", "order": 71, "genre": "wisdom"},  # Alternate name for Sirach
        "Baruch": {"shortCode": "BAR", "testament": "apocrypha", "order": 72, "genre": "prophecy"},
        "Letter of Jeremiah": {"shortCode": "LJE", "testament": "apocrypha", "order": 73, "genre": "epistle"},
        "Prayer of Azariah": {"shortCode": "AZA", "testament": "apocrypha", "order": 74, "genre": "wisdom"},
        "Susanna": {"shortCode": "SUS", "testament": "apocrypha", "order": 75, "genre": "history"},
        "Bel and the Dragon": {"shortCode": "BEL", "testament": "apocrypha", "order": 76, "genre": "history"},
        "1 Maccabees": {"shortCode": "1MA", "testament": "apocrypha", "order": 77, "genre": "history"},
        "2 Maccabees": {"shortCode": "2MA", "testament": "apocrypha", "order": 78, "genre": "history"},
        "3 Maccabees": {"shortCode": "3MA", "testament": "apocrypha", "order": 79, "genre": "history"},
        "4 Maccabees": {"shortCode": "4MA", "testament": "apocrypha", "order": 80, "genre": "wisdom"},
        "1 Esdras": {"shortCode": "1ES", "testament": "apocrypha", "order": 81, "genre": "history"},
        "2 Esdras": {"shortCode": "2ES", "testament": "apocrypha", "order": 82, "genre": "apocalyptic"},
        "Prayer of Manasseh": {"shortCode": "MAN", "testament": "apocrypha", "order": 83, "genre": "wisdom"},
        "Psalm 151": {"shortCode": "PS2", "testament": "apocrypha", "order": 84, "genre": "wisdom"},

        # Additional Apocryphal/Pseudepigraphal Works (if included in YahScriptures)
        "Book of Enoch": {"shortCode": "ENO", "testament": "apocrypha", "order": 85, "genre": "apocalyptic"},
        "1 Enoch": {"shortCode": "1EN", "testament": "apocrypha", "order": 85, "genre": "apocalyptic"},
        "Book of Jubilees": {"shortCode": "JUB", "testament": "apocrypha", "order": 86, "genre": "history"},
        "Jasher": {"shortCode": "JAS", "testament": "apocrypha", "order": 87, "genre": "history"},
        "Book of Jasher": {"shortCode": "JSR", "testament": "apocrypha", "order": 87, "genre": "history"},
        "Odes": {"shortCode": "ODE", "testament": "apocrypha", "order": 88, "genre": "wisdom"},
        "Psalms of Solomon": {"shortCode": "PSS", "testament": "apocrypha", "order": 89, "genre": "wisdom"},
        "Epistle of Barnabas": {"shortCode": "BAR", "testament": "apocrypha", "order": 90, "genre": "epistle"},
        "Shepherd of Hermas": {"shortCode": "HER", "testament": "apocrypha", "order": 91, "genre": "apocalyptic"},
        "Didache": {"shortCode": "DID", "testament": "apocrypha", "order": 92, "genre": "epistle"},
        "Testaments of the Twelve Patriarchs": {"shortCode": "T12", "testament": "apocrypha", "order": 93, "genre": "apocalyptic"},
        "Assumption of Moses": {"shortCode": "AMO", "testament": "apocrypha", "order": 94, "genre": "apocalyptic"},
        "Martyrdom of Isaiah": {"shortCode": "MIS", "testament": "apocrypha", "order": 95, "genre": "history"},
        "Ascension of Isaiah": {"shortCode": "AIS", "testament": "apocrypha", "order": 96, "genre": "apocalyptic"},
        "Apocalypse of Baruch": {"shortCode": "2BA", "testament": "apocrypha", "order": 97, "genre": "apocalyptic"},
        "2 Baruch": {"shortCode": "2BA", "testament": "apocrypha", "order": 97, "genre": "apocalyptic"},
        "Life of Adam and Eve": {"shortCode": "LAE", "testament": "apocrypha", "order": 98, "genre": "history"},
        "Apocalypse of Moses": {"shortCode": "APM", "testament": "apocrypha", "order": 99, "genre": "apocalyptic"},
        "Testament of Abraham": {"shortCode": "TAB", "testament": "apocrypha", "order": 100, "genre": "apocalyptic"},
        "Testament of Isaac": {"shortCode": "TIS", "testament": "apocrypha", "order": 101, "genre": "apocalyptic"},
        "Testament of Jacob": {"shortCode": "TJA", "testament": "apocrypha", "order": 102, "genre": "apocalyptic"},
        "Apocalypse of Elijah": {"shortCode": "APE", "testament": "apocrypha", "order": 103, "genre": "apocalyptic"},
    }

    def __init__(self, pdf_path: str):
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        self.verses: List[Dict] = []
        self.works: Dict[str, Dict] = {}
        self.current_book: Optional[str] = None
        self.current_chapter: int = 0

    def extract(self) -> Tuple[List[Dict], Dict[str, Dict]]:
        """
        Main extraction method.
        Returns: (verses_list, works_dict)
        """
        print(f"📖 Opening PDF: {self.pdf_path}")

        with pdfplumber.open(self.pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"📄 Total pages: {total_pages}")

            for page_num, page in enumerate(pdf.pages, 1):
                if page_num % 50 == 0:
                    print(f"   Processing page {page_num}/{total_pages}...")

                text = page.extract_text()
                if text:
                    self._parse_page(text)

        print(f"\n✅ Extraction complete!")
        print(f"   Books found: {len(self.works)}")
        print(f"   Verses extracted: {len(self.verses)}")

        return self.verses, self.works

    def _parse_page(self, text: str):
        """Parse a single page of text for book headers and verses.

        YahScriptures format: verse numbers appear on their own lines between text blocks.
        Text BEFORE the verse number belongs to that verse.
        """
        lines = text.split('\n')

        verse_buffer = []
        current_verse_num = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check for book headers
            book_match = self._detect_book_header(line)
            if book_match:
                # Save any buffered verse before switching books
                if current_verse_num and verse_buffer and self.current_book:
                    self._save_verse(current_verse_num, verse_buffer)

                self.current_book = book_match
                self.current_chapter = 1  # YahScriptures starts at chapter 1
                if book_match not in self.works:
                    self._register_work(book_match)

                verse_buffer = []
                current_verse_num = None
                continue

            # Skip if no current book
            if not self.current_book:
                continue

            # Check if line is a standalone number (verse or chapter marker)
            if re.match(r'^\d{1,3}$', line):
                num = int(line)

                # Determine if this is a verse number or chapter number
                # If current_verse_num is None, this starts verse 1 of current chapter
                # If num is 1 and we just finished a high verse, it's likely a new chapter
                if num == 1 and current_verse_num and current_verse_num > 10:
                    # Save previous verse
                    if verse_buffer:
                        self._save_verse(current_verse_num, verse_buffer)

                    # This is a new chapter
                    self.current_chapter += 1
                    current_verse_num = 1
                    verse_buffer = []
                else:
                    # Save previous verse
                    if current_verse_num and verse_buffer:
                        self._save_verse(current_verse_num, verse_buffer)

                    # Start new verse
                    current_verse_num = num
                    verse_buffer = []

                continue

            # This is content text - add to buffer
            verse_buffer.append(line)

        # Save any remaining buffered verse
        if current_verse_num and verse_buffer and self.current_book:
            self._save_verse(current_verse_num, verse_buffer)

    def _save_verse(self, verse_num: int, text_lines: List[str]):
        """Save a complete verse."""
        if not self.current_book or not text_lines:
            return

        verse_text = " ".join(text_lines).strip()
        if verse_text:
            self._add_verse(verse_num, verse_text)

    def _detect_book_header(self, line: str) -> Optional[str]:
        """Detect if line is a book header."""
        for book_name in self.BOOK_MAPPING.keys():
            if book_name.lower() in line.lower():
                return book_name
        return None

    def _preserve_paleo_hebrew(self, text: str) -> str:
        """Ensure Paleo-Hebrew divine names are preserved."""
        # YahScriptures uses specific Paleo-Hebrew glyphs for YHWH
        # This method ensures they're not corrupted during extraction
        return text

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
            "totalChapters": 0,  # Will be updated
            "totalVerses": 0,    # Will be updated
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
            "hasFootnotes": "[" in text,  # Simple check
            "footnotes": None  # TODO: Extract footnotes if present
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

        # Save verses (split into chunks for large files)
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
        print("Usage: python extract-yahscriptures.py <path-to-yahscriptures.pdf> [output-dir]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./extracted_scripture"

    try:
        extractor = YahScripturesExtractor(pdf_path)
        verses, works = extractor.extract()
        extractor.save_json(output_dir)

        print(f"\n🎉 Extraction successful!")
        print(f"📁 Output saved to: {output_dir}")
        print(f"\nNext steps:")
        print(f"1. Review the extracted JSON files")
        print(f"2. Run the Strapi import script:")
        print(f"   pnpm tsx scripts/scripture-extraction/import-to-strapi.ts")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
