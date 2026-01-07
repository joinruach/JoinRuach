#!/usr/bin/env python3
"""
Scripture Extractor v3 - Robust 2-Pass Extraction with Validation Gates

Fixes from v2:
1. 2-pass parse (tokenize → assemble) prevents "one bad detection breaks everything"
2. "Verse marker wins" rule - lines with verse markers never get filtered
3. Chapter inference fallback - detects chapters when verse resets to 1
4. Deduplication with reconciliation - keeps best version, logs alternatives
5. Validation gates - fails before import if quality issues detected

Root cause fixes:
- Genesis 1:1 missing → Verse marker detection happens BEFORE book header requirement
- 149 duplicates → Dedup reconciliation keeps best version
- Missing chapters → Chapter inference when verse resets to 1
- Missing verses → 2-pass prevents single detection failure from losing data
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
    RawBlock,
    FormattedSegment,
    ExtractionResult,
    ContentType,
)


@dataclass
class TokenType:
    """Types of tokens in pass 1"""
    BOOK_HEADER = "book_header"
    CHAPTER_MARKER = "chapter_marker"
    VERSE_MARKER = "verse_marker"
    TEXT = "text"
    UNKNOWN = "unknown"


@dataclass
class Token:
    """Token from pass 1 parsing"""
    type: str
    text: str
    value: any  # book_name, chapter_num, verse_num, or None
    confidence: float
    position: int  # Line number
    page: int
    line_num: int


@dataclass
class VerseCandidate:
    """Candidate verse from pass 1"""
    chapter: int
    verse: int
    text: str
    confidence: float
    position: int
    alternative_texts: List[str] = None  # For dedup reconciliation

    def __post_init__(self):
        if self.alternative_texts is None:
            self.alternative_texts = []


@dataclass
class ScriptureVerse:
    """Structured scripture verse"""
    verse_id: str
    work_id: str
    chapter: int
    verse: int
    text: str
    formatting: Optional[Dict] = None
    segments: Optional[List[FormattedSegment]] = None
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
    verses: List[str]


class ScriptureExtractor(BaseExtractor):
    """Robust scripture extractor with 2-pass parsing and validation gates"""

    BOOK_MAPPING = {
        "Genesis": {"shortCode": "GEN", "testament": "tanakh", "order": 1, "genre": "law"},
        "Exodus": {"shortCode": "EXO", "testament": "tanakh", "order": 2, "genre": "law"},
        "Leviticus": {"shortCode": "LEV", "testament": "tanakh", "order": 3, "genre": "law"},
        "Numbers": {"shortCode": "NUM", "testament": "tanakh", "order": 4, "genre": "law"},
        "Deuteronomy": {"shortCode": "DEU", "testament": "tanakh", "order": 5, "genre": "law"},
        "Joshua": {"shortCode": "JOS", "testament": "tanakh", "order": 6, "genre": "history"},
        "Judges": {"shortCode": "JDG", "testament": "tanakh", "order": 7, "genre": "history"},
        "Ruth": {"shortCode": "RUT", "testament": "tanakh", "order": 8, "genre": "history"},
        "1 Samuel": {"shortCode": "1SA", "testament": "tanakh", "order": 9, "genre": "history"},
        "2 Samuel": {"shortCode": "2SA", "testament": "tanakh", "order": 10, "genre": "history"},
        "1 Kings": {"shortCode": "1KG", "testament": "tanakh", "order": 11, "genre": "history"},
        "2 Kings": {"shortCode": "2KG", "testament": "tanakh", "order": 12, "genre": "history"},
        "Isaiah": {"shortCode": "ISA", "testament": "tanakh", "order": 23, "genre": "prophecy"},
        "Jeremiah": {"shortCode": "JER", "testament": "tanakh", "order": 24, "genre": "prophecy"},
        "Ezekiel": {"shortCode": "EZE", "testament": "tanakh", "order": 26, "genre": "prophecy"},
        "Psalms": {"shortCode": "PSA", "testament": "tanakh", "order": 19, "genre": "poetry"},
        "Proverbs": {"shortCode": "PRO", "testament": "tanakh", "order": 20, "genre": "poetry"},
        "Matthew": {"shortCode": "MAT", "testament": "renewed_covenant", "order": 40, "genre": "gospel"},
        "Mark": {"shortCode": "MAR", "testament": "renewed_covenant", "order": 41, "genre": "gospel"},
        "Luke": {"shortCode": "LUK", "testament": "renewed_covenant", "order": 42, "genre": "gospel"},
        "John": {"shortCode": "JOH", "testament": "renewed_covenant", "order": 43, "genre": "gospel"},
        "Romans": {"shortCode": "ROM", "testament": "renewed_covenant", "order": 45, "genre": "epistle"},
        "Revelation": {"shortCode": "REV", "testament": "renewed_covenant", "order": 66, "genre": "apocalyptic"},
        "Tobit": {"shortCode": "TOB", "testament": "apocrypha", "order": 67, "genre": "narrative"},
        "Judith": {"shortCode": "JDT", "testament": "apocrypha", "order": 68, "genre": "narrative"},
        # NOTE: Add remaining books as needed
    }

    def __init__(self, source_path: str):
        super().__init__(source_path, content_type="scripture")

        # Pass 1 state
        self.tokens: List[Token] = []
        self.verse_candidates: Dict[str, VerseCandidate] = {}  # key: "chapter:verse"

        # Pass 2 state
        self.current_book: Optional[str] = None
        self.current_chapter: int = 0
        self.works: Dict[str, ScriptureWork] = {}
        self.verses: List[ScriptureVerse] = []
        self.decision_log: List[Dict] = []

        # Validation tracking
        self.missing_verses: List[Tuple[int, int]] = []  # (chapter, verse)
        self.duplicate_keys: List[str] = []

    def extract_blocks(self) -> List[RawBlock]:
        """Extract text blocks from PDF"""
        blocks: List[RawBlock] = []
        with pdfplumber.open(self.source_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"   → {total_pages} pages")

            for page_num, page in enumerate(pdf.pages, 1):
                if page_num % 100 == 0:
                    print(f"      Page {page_num}/{total_pages}...")

                text = page.extract_text()
                if text:
                    for line_num, line in enumerate(text.split("\n"), 1):
                        if line.strip():
                            blocks.append(
                                RawBlock(
                                    text=line.strip(),
                                    page=page_num,
                                    line_number=line_num,
                                )
                            )
        return blocks

    def has_verse_marker(self, text: str, require_book_context: bool = True) -> Optional[Tuple[int, str]]:
        """
        CRITICAL: Verse marker detection - returns (verse_num, remaining_text) if found
        This runs BEFORE any filtering to implement "verse marker wins" rule
        
        Requirements for safety:
        - Only matches if we have book context (unless explicitly allowed)
        - Anchored patterns (start-of-line only)
        - Strict spacing rules
        - Reasonable verse number range
        """
        if require_book_context and not self.current_book:
            return None  # Don't detect verses before book context
        
        text = text.strip()
        if not text:
            return None

        # Pattern 1: ^(\d{1,3})\s+ (e.g., "1 In the beginning...")
        # Must have at least one space, and text after
        match = re.match(r'^(\d{1,3})\s+([A-Za-z].*)', text)
        if match:
            verse_num = int(match.group(1))
            if 1 <= verse_num <= 200:  # Reasonable range
                return (verse_num, match.group(2).strip())

        # Pattern 2: ^(\d{1,3})[:.]\s+ (e.g., "1: In the beginning..." or "1. In...")
        match = re.match(r'^(\d{1,3})[:.]\s+([A-Za-z].*)', text)
        if match:
            verse_num = int(match.group(1))
            if 1 <= verse_num <= 200:
                return (verse_num, match.group(2).strip())

        # Pattern 3: ^\(?(\d{1,3})\)?\s+ (e.g., "(1) In..." or "1) In...")
        # More strict - require text starts with letter (not number/page reference)
        match = re.match(r'^\(?(\d{1,3})\)?\s+([A-Za-z].*)', text)
        if match:
            verse_num = int(match.group(1))
            if 1 <= verse_num <= 200:
                return (verse_num, match.group(2).strip())

        return None

    def detect_book_header(self, text: str) -> Optional[str]:
        """Detect book header"""
        text_upper = text.upper().strip()

        # If this line has a verse marker, it's NOT a book header (verse marker wins)
        # Allow detection even without book context for initial book detection
        if self.has_verse_marker(text, require_book_context=False):
            return None

        for book_name in self.BOOK_MAPPING.keys():
            if book_name.upper() == text_upper:
                return book_name

        for book_name in self.BOOK_MAPPING.keys():
            if book_name.upper() in text_upper:
                if not re.search(r"\d+:\d+", text):
                    return book_name

        return None

    def detect_chapter_marker(self, text: str) -> Optional[int]:
        """Detect chapter markers"""
        text = text.strip()

        # If this line has a verse marker, it's NOT a chapter marker (verse marker wins)
        # Require book context - chapters only exist within books
        if self.current_book and self.has_verse_marker(text, require_book_context=True):
            return None

        # Strategy 1: "Chapter X"
        match = re.match(r"^chapter\s+(\d{1,3})\b", text, re.IGNORECASE)
        if match:
            return int(match.group(1))

        # Strategy 2: Standalone number
        if re.match(r"^\d{1,3}$", text):
            ch_num = int(text)
            if 1 <= ch_num <= 200:
                return ch_num

        return None

    def pass1_tokenize(self, blocks: List[RawBlock]):
        """
        PASS 1: Tokenize lines → detect anchors
        Collects all candidates without committing to output
        """
        print("   → Pass 1: Tokenizing and detecting structure...")

        for pos, block in enumerate(blocks):
            text = block.text.strip()
            if not text:
                continue

            # CRITICAL: Check for verse marker FIRST (verse marker wins rule)
            # For pass 1 tokenization, we allow detection even without book context
            # (book context will be established in pass 2)
            verse_match = self.has_verse_marker(text, require_book_context=False)
            if verse_match:
                verse_num, verse_text = verse_match
                self.tokens.append(Token(
                    type=TokenType.VERSE_MARKER,
                    text=text,
                    value=verse_num,
                    confidence=0.9,
                    position=pos,
                    page=block.page or 0,
                    line_num=block.line_number or 0,
                ))
                continue  # Don't check for book/chapter if verse marker found

            # Check for book header
            book_match = self.detect_book_header(text)
            if book_match:
                self.tokens.append(Token(
                    type=TokenType.BOOK_HEADER,
                    text=text,
                    value=book_match,
                    confidence=1.0,
                    position=pos,
                    page=block.page or 0,
                    line_num=block.line_number or 0,
                ))
                continue

            # Check for chapter marker
            ch_match = self.detect_chapter_marker(text)
            if ch_match is not None:
                self.tokens.append(Token(
                    type=TokenType.CHAPTER_MARKER,
                    text=text,
                    value=ch_match,
                    confidence=0.9,
                    position=pos,
                    page=block.page or 0,
                    line_num=block.line_number or 0,
                ))
                continue

            # Regular text (may contain verse markers inline)
            self.tokens.append(Token(
                type=TokenType.TEXT,
                text=text,
                value=None,
                confidence=0.5,
                position=pos,
                page=block.page or 0,
                line_num=block.line_number or 0,
            ))

        print(f"   → Tokenized {len(self.tokens)} tokens")

    def pass2_assemble(self):
        """
        PASS 2: Assemble verses with state machine
        Walks tokens in order, maintains current chapter/verse state
        """
        print("   → Pass 2: Assembling verses...")

        text_buffer: List[str] = []
        last_verse_num = 0
        lines_since_chapter = 0

        for token in self.tokens:
            if token.type == TokenType.BOOK_HEADER:
                # Flush any pending verse
                if text_buffer and self.current_chapter > 0 and last_verse_num > 0:
                    self._flush_verse(text_buffer, last_verse_num)

                # Start new book
                book_name = token.value
                self._register_work(book_name)
                self.current_book = book_name
                self.current_chapter = 0
                last_verse_num = 0
                text_buffer = []
                lines_since_chapter = 0
                print(f"   → Found book: {book_name}")
                continue

            if not self.current_book:
                continue  # Skip until we find a book

            if token.type == TokenType.CHAPTER_MARKER:
                # Flush pending verse
                if text_buffer and last_verse_num > 0:
                    self._flush_verse(text_buffer, last_verse_num)

                # Update chapter
                self.current_chapter = token.value
                last_verse_num = 0
                text_buffer = []
                lines_since_chapter = 0
                print(f"      Chapter {self.current_chapter}")
                continue

            if token.type == TokenType.VERSE_MARKER:
                # Flush previous verse
                if text_buffer and last_verse_num > 0:
                    self._flush_verse(text_buffer, last_verse_num)

                # Start new verse - extract text after verse number
                verse_num = token.value
                verse_match = self.has_verse_marker(token.text)
                if verse_match:
                    _, verse_text = verse_match  # Get text after verse marker
                else:
                    verse_text = token.text  # Fallback

                # CRITICAL FIX: If chapter is 0 and we see verse 1, set chapter to 1
                # Only if we have book context (conservative)
                if self.current_book and self.current_chapter == 0 and verse_num == 1:
                    self.current_chapter = 1
                    print(f"      Chapter 1 (inferred from first verse)")

                # CHAPTER INFERENCE FALLBACK (conservative)
                # Only infer if:
                # 1. We're in scripture mode (have a book)
                # 2. Verse resets to 1
                # 3. Previous verse was substantial (>= 20)
                # 4. We're far from last chapter marker (> 50 lines)
                # 5. Inference is consistent (would be next sequential chapter)
                elif (self.current_book and 
                      verse_num == 1 and 
                      last_verse_num >= 20 and 
                      lines_since_chapter > 50):
                    expected_next_chapter = self.current_chapter + 1
                    if expected_next_chapter <= 200:  # Reasonable upper bound
                        self.current_chapter = expected_next_chapter
                        print(f"      Chapter {self.current_chapter} (inferred from verse reset)")
                    lines_since_chapter = 0  # Reset counter

                # Update state
                last_verse_num = verse_num
                text_buffer = [verse_text] if verse_text else []
                lines_since_chapter = 0
                continue

            if token.type == TokenType.TEXT:
                # Check for inline verse markers in text
                verse_match = self.has_verse_marker(token.text)
                if verse_match:
                    # Flush previous
                    if text_buffer and last_verse_num > 0:
                        self._flush_verse(text_buffer, last_verse_num)

                    # Start new verse
                    verse_num, verse_text = verse_match

                    # CRITICAL FIX: If chapter is 0 and we see verse 1, set chapter to 1
                    # Only if we have book context
                    if self.current_book and self.current_chapter == 0 and verse_num == 1:
                        self.current_chapter = 1
                        print(f"      Chapter 1 (inferred from first verse)")

                    # Chapter inference (same conservative logic)
                    elif (self.current_book and 
                          verse_num == 1 and 
                          last_verse_num >= 20 and 
                          lines_since_chapter > 50):
                        expected_next_chapter = self.current_chapter + 1
                        if expected_next_chapter <= 200:
                            self.current_chapter = expected_next_chapter
                            print(f"      Chapter {self.current_chapter} (inferred)")
                        lines_since_chapter = 0

                    last_verse_num = verse_num
                    text_buffer = [verse_text]
                    lines_since_chapter = 0
                else:
                    # Continue current verse
                    if last_verse_num > 0:
                        text_buffer.append(token.text)
                        lines_since_chapter += 1

        # Flush final verse
        if text_buffer and last_verse_num > 0:
            self._flush_verse(text_buffer, last_verse_num)

    def _flush_verse(self, text_buffer: List[str], verse_num: int):
        """Flush verse buffer to output with deduplication"""
        if not self.current_book or self.current_chapter == 0:
            return

        verse_text = " ".join(text_buffer).strip()
        if not verse_text:
            return

        # Dedup key
        key = f"{self.current_chapter}:{verse_num}"

        # Check for duplicates and reconcile
        if key in self.verse_candidates:
            existing = self.verse_candidates[key]

            # Reconciliation: keep best version
            header_tokens = ["CHAPTER", "GENESIS", "EXODUS"]
            existing_header_like = sum(1 for tok in header_tokens if tok in existing.text.upper())
            new_header_like = sum(1 for tok in header_tokens if tok in verse_text.upper())

            # DETERMINISTIC RECONCILIATION (same inputs → same result)
            # Use a stable comparison that doesn't depend on order
            # Criteria (in priority order):
            # 1. Text length (longer is better, but with 50% threshold)
            # 2. Fewer header-like tokens (fewer is better)
            # 3. Lexicographic comparison of text (deterministic tiebreaker)
            
            existing_len = len(existing.text)
            new_len = len(verse_text)
            
            # Rule 1: Significant length difference (> 50%)
            if existing_len > new_len * 1.5:
                keep_existing = True
            elif new_len > existing_len * 1.5:
                keep_existing = False
            # Rule 2: Header-like token count (fewer is better)
            elif new_header_like < existing_header_like:
                keep_existing = False
            elif existing_header_like < new_header_like:
                keep_existing = True
            # Rule 3: Lexicographic tiebreaker (deterministic)
            elif verse_text < existing.text:
                keep_existing = False
            else:
                keep_existing = True

            if keep_existing:
                existing.alternative_texts.append(verse_text)
                # Only count as duplicate if we're keeping the existing one (alternatives don't count as duplicates)
                self._log_decision("duplicate_rejected", verse_text[:50], verse_num, 0.5, f"Duplicate of {key}, kept existing")
                return
            else:
                existing.alternative_texts.append(existing.text)
                existing.text = verse_text
                existing.confidence = max(existing.confidence, 0.9)
                self._log_decision("duplicate_replaced", verse_text[:50], verse_num, 0.9, f"Replaced duplicate {key} with better version")
                # Update the actual verse in the list
                for i, v in enumerate(self.verses):
                    if v.work_id == self.works[self.current_book].work_id and v.chapter == self.current_chapter and v.verse == verse_num:
                        self.verses[i].text = verse_text
                        break
                return

        # New verse - check for existing in verses list (just in case)
        for v in self.verses:
            if v.work_id == self.works[self.current_book].work_id and v.chapter == self.current_chapter and v.verse == verse_num:
                # Already exists, treat as duplicate
                if len(v.text) < len(verse_text) * 0.8:  # New version is significantly longer
                    v.text = verse_text  # Update
                self.duplicate_keys.append(key)
                return

        # New verse
        self.verse_candidates[key] = VerseCandidate(
            chapter=self.current_chapter,
            verse=verse_num,
            text=verse_text,
            confidence=0.9,
            position=len(self.verses),
        )

        # Add to verses list
        work = self.works[self.current_book]
        verse_id = f"{work.work_id}-{self.current_chapter:03d}-{verse_num:03d}"

        verse = ScriptureVerse(
            verse_id=verse_id,
            work_id=work.work_id,
            chapter=self.current_chapter,
            verse=verse_num,
            text=verse_text,
            paleo_hebrew_divine_names=True,
        )

        self.verses.append(verse)
        work.verses.append(verse_id)
        work.total_verses += 1

        if self.current_chapter > work.total_chapters:
            work.total_chapters = self.current_chapter

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

    def _log_decision(self, action: str, text: str, value: any, confidence: float, reason: str):
        """Log extraction decision for debugging"""
        self.decision_log.append({
            "action": action,
            "text": text[:100],
            "value": value,
            "confidence": confidence,
            "reason": reason,
            "book": self.current_book,
            "chapter": self.current_chapter,
        })

    def parse_structure(self, blocks: List[RawBlock]) -> Dict[str, any]:
        """Parse using 2-pass approach"""
        # Pass 1: Tokenize
        self.pass1_tokenize(blocks)

        # Pass 2: Assemble
        self.pass2_assemble()

        return {"works": list(self.works.values()), "verses": self.verses}

    def validate_extraction_quality(self, book_name: str = "Genesis") -> Tuple[bool, Dict]:
        """
        VALIDATION GATE: Check extraction quality before import
        Returns: (is_valid, validation_report)
        """
        report = {
            "passed": True,
            "errors": [],
            "warnings": [],
            "stats": {},
        }

        # Find the book
        work = None
        for w in self.works.values():
            if w.canonical_name == book_name:
                work = w
                break

        if not work:
            report["passed"] = False
            report["errors"].append(f"Book '{book_name}' not found in extraction")
            return (False, report)

        # Get verses for this book
        book_verses = [v for v in self.verses if v.work_id == work.work_id]
        verses_by_key = {(v.chapter, v.verse): v for v in book_verses}

        # Check 1: Genesis 1:1 present (HARD FAIL)
        if (1, 1) not in verses_by_key:
            report["passed"] = False
            report["errors"].append("CRITICAL: Genesis 1:1 is missing (hard fail)")

        # Check 2: Last verse present (check expected last verse from canonical)
        # For Genesis, expected last is 50:26
        if (50, 26) not in verses_by_key:
            report["passed"] = False
            report["errors"].append("CRITICAL: Last verse (50:26) is missing (hard fail)")

        # Check 3: Duplicates (after reconciliation)
        # Check for actual duplicates in final verses list, not just reconciliation events
        # Reconciliation events are expected behavior (merging duplicates)
        verse_ids_seen = set()
        actual_duplicates = []
        for v in book_verses:
            verse_key = (v.chapter, v.verse)
            if verse_key in verse_ids_seen:
                actual_duplicates.append(f"{v.chapter}:{v.verse}")
            else:
                verse_ids_seen.add(verse_key)
        
        if len(actual_duplicates) > 0:
            report["passed"] = False
            report["errors"].append(f"Found {len(actual_duplicates)} duplicate verses after reconciliation: {actual_duplicates[:10]}")
        
        # Reconciliation events are informational (warnings), not errors
        if len(self.duplicate_keys) > 0:
            report["warnings"].append(f"Reconciliation processed {len(self.duplicate_keys)} duplicate candidates (expected behavior)")

        # Check 4: Missing verses count
        # (Full check would require canonical structure - simplified here)
        unique_verses = len(verses_by_key)
        if unique_verses < 1500:  # Genesis should have 1533
            report["warnings"].append(f"Verse count ({unique_verses}) seems low for {book_name}")

        # Stats
        report["stats"] = {
            "chapters_found": work.total_chapters,
            "verses_found": unique_verses,
            "duplicates_after_reconciliation": len(actual_duplicates),
            "reconciliation_events": len(self.duplicate_keys),  # Informational
        }

        return (report["passed"], report)

    def validate(self, structured_data: Dict) -> Tuple[bool, List[str], List[str]]:
        """Basic validation"""
        errors = []
        warnings = []

        works = structured_data.get("works", [])
        verses = structured_data.get("verses", [])

        if not works:
            errors.append("No books extracted")
        if not verses:
            errors.append("No verses extracted")

        # Run quality validation for Genesis
        if any(w.canonical_name == "Genesis" for w in works):
            is_valid, quality_report = self.validate_extraction_quality("Genesis")
            if not is_valid:
                errors.extend(quality_report["errors"])
                warnings.extend(quality_report["warnings"])

        return (len(errors) == 0, errors, warnings)

    def save_json(self, output_dir: str, result: ExtractionResult):
        """Save extraction results"""
        super().save_json(output_dir, result)

        output_path = Path(output_dir)
        works_file = output_path / "works.json"
        works_data = [asdict(w) for w in result.items["works"]]
        with open(works_file, "w") as f:
            json.dump(works_data, f, indent=2)

        verses = result.items["verses"]
        chunk_size = 5000
        for i in range(0, len(verses), chunk_size):
            chunk_num = (i // chunk_size) + 1
            chunk = verses[i : i + chunk_size]
            verses_file = output_path / f"verses_chunk_{chunk_num:02d}.json"
            verses_data = [asdict(v) for v in chunk]
            with open(verses_file, "w") as f:
                json.dump(verses_data, f, indent=2)

        # Save validation report and decision log
        if any(w.canonical_name == "Genesis" for w in result.items["works"]):
            is_valid, quality_report = self.validate_extraction_quality("Genesis")
            report_file = output_path / "validation-gate-report.json"
            with open(report_file, "w") as f:
                json.dump(quality_report, f, indent=2)
            print(f"   - validation-gate-report.json")

        if self.decision_log:
            log_file = output_path / "extraction-log.json"
            with open(log_file, "w") as f:
                json.dump(self.decision_log, f, indent=2)
            print(f"   - extraction-log.json ({len(self.decision_log)} decisions)")

        # Create artifact bundle (optional - requires create-artifact-bundle.py in path)
        try:
            import sys
            from pathlib import Path
            bundle_script = Path(__file__).parent / "create-artifact-bundle.py"
            if bundle_script.exists():
                # Import inline to avoid path issues
                import importlib.util
                spec = importlib.util.spec_from_file_location("create_artifact_bundle", bundle_script)
                bundle_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(bundle_module)
                bundle = bundle_module.create_artifact_bundle(str(output_path))
                bundle_file = output_path / "artifact-bundle.json"
                with open(bundle_file, "w") as f:
                    json.dump(bundle, f, indent=2, ensure_ascii=False)
                print(f"   - artifact-bundle.json (quality score: {bundle.get('quality_score', 0)}/100)")
        except Exception as e:
            # Bundle creation optional - don't fail extraction if bundle fails
            print(f"   - artifact-bundle.json (skipped: {str(e)[:50]})")


if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Extract scripture from PDF (v3)")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("output_dir", help="Output directory")
    args = parser.parse_args()

    extractor = ScriptureExtractor(args.pdf_path)
    result = extractor.extract()

    extractor.save_json(args.output_dir, result)

    # Exit with error if validation failed
    if result.metadata.validation_status == "invalid":
        print("\n❌ VALIDATION FAILED - Extraction quality issues detected")
        sys.exit(1)
