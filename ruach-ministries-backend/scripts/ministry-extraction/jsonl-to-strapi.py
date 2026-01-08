#!/usr/bin/env python3
"""
Ministry JSONL → Strapi JSON Converter

Converts extracted ministry text JSONL to Strapi-ready JSON format.

Input JSONL format (from pdf-extractor.py):
  {
    "book": "MOH",
    "chapter": 1,
    "paragraph": 1,
    "text": "...",
    "pdfPage": 17,
    "heading": "Our Example",
    "confidence": 0.98
  }

Outputs:
  - out/work.json                      (single work metadata)
  - out/texts/texts.0001.json ...      (chunked paragraph batches)
  - out/meta.json                      (counts + validation stats)

Usage:
  python scripts/ministry-extraction/jsonl-to-strapi.py \
    --in ministry-pipeline/exports/egw/ministry-of-healing/v1/paragraphs.jsonl \
    --out ministry-pipeline/ingest/egw/ministry-of-healing/v1 \
    --chunk 500
"""

from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Any


def slugify(s: str) -> str:
    """Convert text to URL-safe slug."""
    s = s.strip().lower()
    s = re.sub(r"[''`]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "untitled"


def compute_text_hash(text: str) -> str:
    """Compute SHA256 hash of text for change detection."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def read_jsonl(path: str):
    """Read JSONL file, yielding (line_num, row) tuples."""
    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                yield i, obj
            except Exception as e:
                raise RuntimeError(f"Invalid JSON on line {i}: {e}")


@dataclass
class WorkMetadata:
    """Metadata for ministry work"""
    book_code: str
    title: str
    author: str
    total_chapters: int
    total_paragraphs: int
    first_page: int
    last_page: int


def infer_title_from_code(code: str) -> str:
    """Infer full title from book code"""
    titles = {
        "MOH": "The Ministry of Healing",
        "DA": "The Desire of Ages",
        "SC": "Steps to Christ",
        "GC": "The Great Controversy",
        "PP": "Patriarchs and Prophets",
        "PK": "Prophets and Kings",
        "AA": "The Acts of the Apostles",
        "COL": "Christ's Object Lessons",
        "MH": "The Ministry of Healing",
    }
    return titles.get(code.upper(), f"Ministry Book {code}")


def main():
    ap = argparse.ArgumentParser(description="Convert ministry JSONL to Strapi JSON")
    ap.add_argument("--in", dest="inp", required=True, help="Input JSONL file")
    ap.add_argument("--out", dest="out", required=True, help="Output directory")
    ap.add_argument(
        "--chunk",
        dest="chunk",
        type=int,
        default=500,
        help="Paragraphs per chunk file (default: 500)",
    )
    args = ap.parse_args()

    # Create output directories
    os.makedirs(args.out, exist_ok=True)
    texts_dir = os.path.join(args.out, "texts")
    os.makedirs(texts_dir, exist_ok=True)

    # Parse JSONL
    paragraphs: List[Dict[str, Any]] = []
    book_code = None
    chapters_seen = set()
    pages_seen = set()

    # Track stats
    duplicate_count = 0
    seen_refs = set()

    # Chapter/paragraph counts
    chapter_para_counts = defaultdict(int)

    print("📖 Processing ministry JSONL...")

    for line_no, row in read_jsonl(args.inp):
        # Extract fields
        book = str(row.get("book", "")).strip()
        chapter = int(row.get("chapter", 0))
        paragraph = int(row.get("paragraph", 0))
        text = str(row.get("text", "")).strip()
        pdf_page = row.get("pdfPage")
        heading = row.get("heading")
        confidence = row.get("confidence", 1.0)

        # AI enrichment fields (optional)
        detected_references = row.get("detectedReferences")
        embedding = row.get("embedding")
        ai_metadata = row.get("aiMetadata")
        semantic_summary = row.get("semanticSummary")

        if not book:
            raise RuntimeError(f"Missing 'book' on line {line_no}")

        if chapter == 0:
            # Skip chapter 0 (likely TOC or intro without chapter number)
            continue

        if paragraph == 0:
            raise RuntimeError(f"Invalid paragraph number on line {line_no}: {paragraph}")

        # Store book code
        if book_code is None:
            book_code = book
        elif book_code != book:
            raise RuntimeError(f"Multiple book codes found: {book_code} and {book}")

        # Track chapters and pages
        chapters_seen.add(chapter)
        if pdf_page:
            pages_seen.add(pdf_page)

        # Check for duplicates
        ref_key = (chapter, paragraph)
        if ref_key in seen_refs:
            duplicate_count += 1
            print(f"⚠️  Duplicate found: Chapter {chapter}, Paragraph {paragraph}")
        else:
            seen_refs.add(ref_key)

        # Track chapter paragraph counts
        chapter_para_counts[chapter] += 1

        # Create text ID
        text_id = f"{book}-{chapter}-{paragraph}"

        # Compute text hash
        text_hash = compute_text_hash(text)

        # Create Strapi-ready payload
        payload = {
            "textId": text_id,
            "chapterNumber": chapter,
            "paragraphNumber": paragraph,
            "text": text,
            "heading": heading,
            "textHash": text_hash,
            "sourceMetadata": {
                "pdfPage": pdf_page,
                "extractionMethod": "pdfplumber",
                "confidence": confidence,
                "zone": "BODY",
            },
            "reviewStatus": "pending",
            "qualityScore": confidence,
        }

        # Add AI enrichment fields if present
        if detected_references:
            payload["detectedReferences"] = detected_references
        if embedding:
            payload["embedding"] = embedding
        if ai_metadata:
            payload["aiMetadata"] = ai_metadata
        if semantic_summary:
            payload["semanticSummary"] = semantic_summary

        paragraphs.append(payload)

    if not book_code:
        raise RuntimeError("No paragraphs found in JSONL")

    print(f"✅ Processed {len(paragraphs)} paragraphs from book '{book_code}'")

    # Build work metadata
    title = infer_title_from_code(book_code)
    slug = slugify(title)

    work_metadata = WorkMetadata(
        book_code=book_code,
        title=title,
        author="Ellen G. White",
        total_chapters=len(chapters_seen),
        total_paragraphs=len(paragraphs),
        first_page=min(pages_seen) if pages_seen else 0,
        last_page=max(pages_seen) if pages_seen else 0,
    )

    # Create work payload
    work_payload = {
        "workId": f"{book_code}-EGW-1905",
        "title": work_metadata.title,
        "slug": slug,
        "shortCode": book_code,
        "author": work_metadata.author,
        "category": "health",  # Default category, can be overridden
        "totalChapters": work_metadata.total_chapters,
        "totalParagraphs": work_metadata.total_paragraphs,
        "extractionStatus": "completed",
        "extractionMetadata": {
            "extractor_version": "1.0.0",
            "extraction_method": "pdf-extractor.py",
            "source_pages": {
                "first": work_metadata.first_page,
                "last": work_metadata.last_page,
                "total": len(pages_seen),
            },
        },
        "sourceMetadata": {
            "format": "pdf",
            "publisher": "Pacific Press",
        },
    }

    # Write work.json
    work_path = os.path.join(args.out, "work.json")
    with open(work_path, "w", encoding="utf-8") as f:
        json.dump(work_payload, f, ensure_ascii=False, indent=2)

    print(f"📚 Wrote work metadata to {work_path}")

    # Chunk paragraphs into separate files
    chunk_size = max(1, args.chunk)
    chunk_count = 0

    for i in range(0, len(paragraphs), chunk_size):
        chunk_count += 1
        chunk_data = paragraphs[i : i + chunk_size]
        chunk_file = os.path.join(texts_dir, f"texts.{chunk_count:04d}.json")

        with open(chunk_file, "w", encoding="utf-8") as f:
            json.dump(chunk_data, f, ensure_ascii=False)

    print(f"📝 Wrote {chunk_count} text chunk files ({chunk_size} paragraphs/chunk)")

    # Write metadata
    meta = {
        "input": args.inp,
        "output": args.out,
        "book_code": book_code,
        "book_title": work_metadata.title,
        "author": work_metadata.author,
        "chapters_total": work_metadata.total_chapters,
        "paragraphs_total": len(paragraphs),
        "paragraphs_unique": len(seen_refs),
        "duplicates_detected": duplicate_count,
        "chunks_created": chunk_count,
        "chunk_size": chunk_size,
        "pages_covered": {
            "first": work_metadata.first_page,
            "last": work_metadata.last_page,
            "total": len(pages_seen),
        },
        "chapter_distribution": dict(chapter_para_counts),
    }

    meta_path = os.path.join(args.out, "meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"📊 Wrote metadata to {meta_path}")

    # Print summary
    print("\n" + "=" * 60)
    print("CONVERSION SUMMARY")
    print("=" * 60)
    print(f"Book:            {work_metadata.title}")
    print(f"Chapters:        {work_metadata.total_chapters}")
    print(f"Paragraphs:      {len(paragraphs)}")
    print(f"Duplicates:      {duplicate_count}")
    print(f"Chunks:          {chunk_count}")
    print(f"Pages covered:   {work_metadata.first_page}-{work_metadata.last_page}")
    print(f"\nChapter distribution:")
    for chapter in sorted(chapter_para_counts.keys()):
        count = chapter_para_counts[chapter]
        print(f"  Chapter {chapter:2d}: {count:3d} paragraphs")
    print("=" * 60)

    if duplicate_count > 0:
        print(f"\n⚠️  WARNING: {duplicate_count} duplicate paragraphs detected")
        print("   These will be filtered during validation.")


if __name__ == "__main__":
    main()
