#!/usr/bin/env python3
"""
Base Extractor - Abstract Interface for Unified Content Extraction
Supports: Scripture, Canon (EGW), Library (General Books)

Design Principles (from canon-parser):
1. Deterministic IDs (no randomness)
2. Idempotent (safe to re-run)
3. Structured output (JSON)
4. Page tracking
5. Text normalization
"""

from __future__ import annotations

import hashlib
import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple

# Content types
ContentType = Literal["scripture", "canon", "library"]
ParserFormat = Literal["auto", "pdf", "md", "markdown", "docx", "epub"]


@dataclass(frozen=True)
class RawBlock:
    """Raw text block extracted from source document"""
    text: str
    page: Optional[int] = None
    style: Optional[Dict[str, Any]] = None
    line_number: Optional[int] = None


@dataclass(frozen=True)
class LayoutAwareBlock:
    """
    Text block with spatial and typography metadata
    Enables zone-based filtering (HEADER/FOOTER/MARGIN/BODY)
    """
    text: str
    x0: float  # Left coordinate
    top: float  # Top coordinate
    bottom: float  # Bottom coordinate
    font_size: float  # Font height
    font_name: str  # Font family
    zone: str  # HEADER | FOOTER | MARGIN | BODY
    page: int  # Page number


@dataclass(frozen=True)
class FormattedSegment:
    """Text segment with formatting metadata"""
    text: str
    type: Literal["normal", "poetry", "line_break", "paragraph", "heading"]
    indent_level: int = 0
    preserve_line_breaks: bool = False


@dataclass
class ExtractionMetadata:
    """Metadata about the extraction process"""
    extractor_version: str
    content_type: ContentType
    source_file: str
    source_sha256: str
    extraction_timestamp: str
    total_pages: Optional[int] = None
    total_items: int = 0
    validation_status: Optional[str] = None


@dataclass
class ExtractionResult:
    """Complete extraction result"""
    metadata: ExtractionMetadata
    items: List[Any]  # Type varies by content type
    errors: List[str] = None
    warnings: List[str] = None

    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []


class BaseExtractor(ABC):
    """
    Abstract base class for all content extractors
    Implements shared functionality for PDF/EPUB/DOCX extraction
    """

    EXTRACTOR_VERSION = "2.0.0"

    def __init__(self, source_path: str, content_type: ContentType):
        self.source_path = Path(source_path)
        self.content_type = content_type

        if not self.source_path.exists():
            raise FileNotFoundError(f"Source file not found: {source_path}")

        self.source_sha256 = self._compute_sha256()
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def _compute_sha256(self) -> str:
        """Compute SHA256 hash of source file for versioning"""
        sha256 = hashlib.sha256()
        with open(self.source_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    @abstractmethod
    def extract_blocks(self) -> List[RawBlock]:
        """
        Extract raw text blocks from source document
        Must be implemented by subclasses for each format (PDF/EPUB/etc)
        """
        pass

    def extract_blocks_with_layout(self, pdf) -> List[LayoutAwareBlock]:
        """
        Extract text blocks with full spatial and typography metadata

        Uses pdfplumber to get:
        - Word coordinates (x0, top, bottom)
        - Font information (size, name)
        - Zone classification (HEADER/FOOTER/MARGIN/BODY)

        This enables spatial filtering to eliminate false positives from
        headers, footers, and margins.

        Args:
            pdf: pdfplumber.PDF object

        Returns:
            List of LayoutAwareBlock objects with zone metadata
        """
        blocks: List[LayoutAwareBlock] = []

        total_pages = len(pdf.pages)
        print(f"   → Extracting layout-aware blocks from {total_pages} pages")

        for page_num, page in enumerate(pdf.pages, 1):
            if page_num % 100 == 0:
                print(f"      Page {page_num}/{total_pages}...")

            page_width = page.width
            page_height = page.height

            # Extract words with full metadata
            try:
                words = page.extract_words(
                    use_text_flow=True,
                    keep_blank_chars=False,
                    extra_attrs=['fontname', 'size']
                )
            except Exception as e:
                self.warnings.append(f"Page {page_num}: Failed to extract words - {e}")
                continue

            for word in words:
                # Classify zone based on position
                zone = classify_zone(word, page_width, page_height)

                blocks.append(LayoutAwareBlock(
                    text=word.get('text', ''),
                    x0=word.get('x0', 0),
                    top=word.get('top', 0),
                    bottom=word.get('bottom', 0),
                    font_size=word.get('height', 0),  # height = font size
                    font_name=word.get('fontname', ''),
                    zone=zone,
                    page=page_num
                ))

        print(f"   → Extracted {len(blocks)} layout-aware blocks")

        # Count blocks by zone for debugging
        zone_counts = {'HEADER': 0, 'FOOTER': 0, 'MARGIN': 0, 'BODY': 0}
        for block in blocks:
            zone_counts[block.zone] += 1

        print(f"   → Zone distribution: {zone_counts}")

        return blocks

    @abstractmethod
    def parse_structure(self, blocks: List[RawBlock]) -> Any:
        """
        Parse blocks into content-type specific structure
        Must be implemented by subclasses (scripture vs canon vs library)
        """
        pass

    @abstractmethod
    def validate(self, structured_data: Any) -> Tuple[bool, List[str], List[str]]:
        """
        Validate extracted data
        Returns: (is_valid, errors, warnings)
        """
        pass

    def normalize_text(self, text: str, preserve_formatting: bool = False) -> str:
        """
        Normalize text from PDF extraction
        - Remove page markers like "[296]"
        - Fix hyphenation artifacts
        - Optionally preserve line breaks
        """
        # Remove bracketed page numbers
        text = re.sub(r"\[\d{1,4}\]", " ", text)

        if not preserve_formatting:
            # Collapse whitespace
            text = re.sub(r"\s+", " ", text).strip()

            # Fix hyphenation: "under- stands" → "understands"
            text = re.sub(r"\b([A-Za-z]{2,})-\s+([a-z]{2,})\b", r"\1\2", text)

            text = re.sub(r"\s+", " ", text).strip()

        return text

    def slugify(self, text: str) -> str:
        """Convert text to URL-safe slug"""
        text = text.strip().lower()
        text = re.sub(r"[^a-z0-9]+", "-", text)
        text = re.sub(r"(^-|-$)", "", text)
        return text or "untitled"

    def extract(self) -> ExtractionResult:
        """
        Main extraction pipeline:
        1. Extract raw blocks
        2. Parse structure
        3. Validate
        4. Return result
        """
        print(f"📖 Extracting {self.content_type} from: {self.source_path.name}")

        # Step 1: Extract blocks
        print("   [1/3] Extracting raw blocks...")
        blocks = self.extract_blocks()
        print(f"   → Found {len(blocks)} text blocks")

        # Step 2: Parse structure
        print("   [2/3] Parsing structure...")
        structured_data = self.parse_structure(blocks)

        # Step 3: Validate
        print("   [3/3] Validating...")
        is_valid, errors, warnings = self.validate(structured_data)

        validation_status = "valid" if is_valid else "invalid"
        if warnings and is_valid:
            validation_status = "valid_with_warnings"

        # Create metadata
        metadata = ExtractionMetadata(
            extractor_version=self.EXTRACTOR_VERSION,
            content_type=self.content_type,
            source_file=str(self.source_path),
            source_sha256=self.source_sha256,
            extraction_timestamp=datetime.utcnow().isoformat() + "Z",
            total_pages=None,  # Set by subclass if available
            total_items=len(structured_data) if isinstance(structured_data, list) else 0,
            validation_status=validation_status,
        )

        result = ExtractionResult(
            metadata=metadata,
            items=structured_data,
            errors=errors,
            warnings=warnings,
        )

        print(f"\n✅ Extraction complete!")
        print(f"   Items: {metadata.total_items}")
        print(f"   Errors: {len(errors)}")
        print(f"   Warnings: {len(warnings)}")
        print(f"   Status: {validation_status}")

        return result

    def save_json(self, output_dir: str, result: ExtractionResult):
        """Save extraction result to JSON files"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Save metadata
        metadata_file = output_path / "extraction-metadata.json"
        with open(metadata_file, "w") as f:
            json.dump(asdict(result.metadata), f, indent=2)

        # Save errors/warnings if any
        if result.errors or result.warnings:
            issues_file = output_path / "extraction-issues.json"
            with open(issues_file, "w") as f:
                json.dump(
                    {"errors": result.errors, "warnings": result.warnings}, f, indent=2
                )

        print(f"\n💾 Saved to: {output_path}")
        print(f"   - {metadata_file.name}")
        if result.errors or result.warnings:
            print(f"   - extraction-issues.json")


# Utility functions (shared across extractors)


def sha256_hex(data: bytes) -> str:
    """Compute SHA256 hash"""
    return hashlib.sha256(data).hexdigest()


def approx_token_count(text: str) -> int:
    """Approximate token count (conservative English heuristic)"""
    return max(1, (len(text) + 3) // 4)


def split_sentences(text: str) -> List[str]:
    """
    Split text into sentences at sentence boundaries
    Deterministic and dependency-free
    """
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []

    # Split on sentence boundaries: period/exclamation/question followed by space and capital
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"\'(])', text)
    return [p.strip() for p in parts if p.strip()]


def chunk_text(text: str, max_chars: int) -> List[str]:
    """
    Chunk text into segments respecting sentence boundaries
    Deterministic chunking for idempotent re-runs
    """
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    # Prefer sentence boundaries
    sentences = split_sentences(text)
    if not sentences:
        # No sentence boundaries, hard split
        return [text[:max_chars].strip(), text[max_chars:].strip()]

    chunks: List[str] = []
    buf: List[str] = []
    buf_len = 0

    for sentence in sentences:
        if buf_len and buf_len + 1 + len(sentence) > max_chars:
            # Buffer full, flush it
            chunks.append(" ".join(buf).strip())
            buf = []
            buf_len = 0

        buf.append(sentence)
        buf_len += len(sentence) + (1 if buf_len else 0)

    if buf:
        chunks.append(" ".join(buf).strip())

    # If any single sentence is too large, hard split
    final_chunks: List[str] = []
    for chunk in chunks:
        if len(chunk) <= max_chars:
            final_chunks.append(chunk)
            continue

        # Hard split oversized sentence
        for i in range(0, len(chunk), max_chars):
            final_chunks.append(chunk[i : i + max_chars].strip())

    return [c for c in final_chunks if c]


def classify_zone(word: Dict[str, Any], page_width: float, page_height: float) -> str:
    """
    Classify word location into page zones for filtering

    Args:
        word: Word dict with x0, top keys (from pdfplumber extract_words)
        page_width: Page width in points
        page_height: Page height in points

    Returns:
        Zone classification: 'HEADER' | 'FOOTER' | 'MARGIN' | 'BODY'
    """
    x0 = word.get('x0', 0)
    top = word.get('top', 0)

    # Zone thresholds (adjustable per PDF layout)
    HEADER_THRESHOLD = page_height * 0.08  # Top 8%
    FOOTER_THRESHOLD = page_height * 0.92  # Bottom 8%
    MARGIN_LEFT = page_width * 0.08  # Left 8%
    MARGIN_RIGHT = page_width * 0.92  # Right 8%

    if top < HEADER_THRESHOLD:
        return 'HEADER'
    elif top > FOOTER_THRESHOLD:
        return 'FOOTER'
    elif x0 < MARGIN_LEFT or x0 > MARGIN_RIGHT:
        return 'MARGIN'
    else:
        return 'BODY'


def looks_like_toc_line(text: str) -> bool:
    """
    Detect table-of-contents navigation lines
    Example: "Preface . . . . . iii The True Medical Missionary . . . 11"
    """
    t = text.strip()
    if not t:
        return False

    # Chapter entries without dotted leaders: "Chapter 39—... 322"
    if re.match(r"^chapter\s+\d+\b", t, re.IGNORECASE) and re.search(r"\s\d{1,4}$", t):
        if not re.match(r"^\[\d{1,4}\]\s*", t):
            return True

    # Spaced dotted leaders (". . . . .")
    if not re.search(r"(?:\.\s){10,}", t):
        return False

    # TOC lines end with page marker
    if not re.search(r"(\b\d{1,4}\b|\b[ivxlcdm]{1,8}\b)\s*$", t.lower()):
        return False

    return True
