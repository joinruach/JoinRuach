#!/usr/bin/env python3
"""
JSONL (bbli export) -> Strapi-ready JSON

Input JSONL format (from export-bbli.py):
  {
    "book_num": 1,
    "book": "Genesis",
    "testament": "old",
    "chapter": 1,
    "verse": 1,
    "text": "..."
  }

Outputs:
  - out/works.json                      (unique books with metadata)
  - out/verses/verses.0001.json ...     (chunked verse batches)
  - out/meta.json                       (counts + validation stats)

Usage:
  python scripts/scripture-extraction/jsonl_to_strapi.py \
    --in scripture-pipeline/exports/yah/v1/yahscriptures-full.jsonl \
    --out scripture-pipeline/ingest/yah/v1 \
    --chunk 2000
"""

from __future__ import annotations
import argparse
import json
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Any
from collections import defaultdict


def slugify(s: str) -> str:
    """Convert book name to URL-safe slug."""
    s = s.strip().lower()
    s = re.sub(r"[''`]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "untitled"


def read_jsonl(path: str):
    """Read JSONL file, yielding (line_num, row) tuples."""
    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                # Skip metadata lines (first line has _meta key)
                if "_meta" in obj:
                    continue
                yield i, obj
            except Exception as e:
                raise RuntimeError(f"Invalid JSON on line {i}: {e}")


@dataclass
class Work:
    """Represents a scripture work (book)."""
    key: str            # stable unique key (slug)
    title: str          # display name
    order: int          # canonical order (based on book_num)
    canon: str          # "canonical" | "apocrypha"
    testament: str      # "old" | "new" | "apocrypha"
    book_num: int       # original book number from source


def infer_canon(testament: str, book_title: str) -> str:
    """Determine if book is canonical or apocrypha."""
    if testament == "apocrypha":
        return "apocrypha"

    # Double-check against known apocrypha names
    apoc_names = {
        "tobit", "judith", "wisdom", "sirach", "baruch",
        "1 maccabees", "2 maccabees", "1 esdras", "2 esdras",
        "prayer of manasseh", "prayer of manasses", "manasseh"
    }
    normalized = re.sub(r"\s+", " ", book_title.strip().lower())

    if normalized in apoc_names:
        return "apocrypha"

    return "canonical"


def main():
    ap = argparse.ArgumentParser(description="Convert JSONL to Strapi-ready JSON")
    ap.add_argument("--in", dest="inp", required=True, help="Input JSONL file")
    ap.add_argument("--out", dest="out", required=True, help="Output directory")
    ap.add_argument("--chunk", dest="chunk", type=int, default=2000,
                    help="Verses per chunk file (default: 2000)")
    args = ap.parse_args()

    # Create output directories
    os.makedirs(args.out, exist_ok=True)
    verses_dir = os.path.join(args.out, "verses")
    os.makedirs(verses_dir, exist_ok=True)

    works_by_slug: Dict[str, Work] = {}
    verse_rows: List[Dict[str, Any]] = []

    # Track stats
    total_verses = 0
    first_ref = None
    last_ref = None

    # Track duplicates and missing verses
    seen_refs = set()
    duplicate_count = 0

    # Testament counts
    testament_counts = defaultdict(int)

    print("📖 Processing JSONL...")

    for line_no, row in read_jsonl(args.inp):
        # Extract fields from JSONL
        book_num = int(row.get("book_num", 0))
        book = str(row.get("book", "")).strip()
        testament = str(row.get("testament", "")).strip().lower()
        chapter = int(row.get("chapter", 0))
        verse = int(row.get("verse", 0))
        text = str(row.get("text", "")).strip()

        if not book:
            raise RuntimeError(f"Missing 'book' on line {line_no}")

        if chapter == 0 or verse == 0:
            raise RuntimeError(
                f"Invalid chapter/verse on line {line_no}: {chapter}:{verse}"
            )

        # Create work slug
        wslug = slugify(book)

        # Register work if first time seeing it
        if wslug not in works_by_slug:
            works_by_slug[wslug] = Work(
                key=wslug,
                title=book,
                order=book_num,
                canon=infer_canon(testament, book),
                testament=testament,
                book_num=book_num,
            )

        # Check for duplicates
        ref_key = (wslug, chapter, verse)
        if ref_key in seen_refs:
            duplicate_count += 1
            print(f"⚠️  Duplicate found: {book} {chapter}:{verse}")
        else:
            seen_refs.add(ref_key)

        # Track testament counts
        testament_counts[testament] += 1

        # Create Strapi-ready verse payload
        reference = f"{book} {chapter}:{verse}"
        verse_rows.append({
            "workSlug": wslug,
            "book": book,
            "chapter": chapter,
            "verse": verse,
            "reference": reference,
            "text": text,
            "testament": testament,
            "sourceVersion": "YAH_Scriptures",
        })

        total_verses += 1

        if first_ref is None:
            first_ref = reference
        last_ref = reference

    print(f"✅ Processed {total_verses} verses from {len(works_by_slug)} books")

    # Write works.json (sorted by book_num/order)
    works_out = [
        {
            "slug": w.key,
            "title": w.title,
            "order": w.order,
            "canon": w.canon,
            "testament": w.testament,
            "sourceVersion": "YAH_Scriptures",
        }
        for w in sorted(works_by_slug.values(), key=lambda x: x.order)
    ]

    works_path = os.path.join(args.out, "works.json")
    with open(works_path, "w", encoding="utf-8") as f:
        json.dump(works_out, f, ensure_ascii=False, indent=2)

    print(f"📚 Wrote {len(works_out)} works to {works_path}")

    # Chunk verses into separate files
    chunk_size = max(1, args.chunk)
    chunk_count = 0

    for i in range(0, len(verse_rows), chunk_size):
        chunk_count += 1
        chunk_data = verse_rows[i : i + chunk_size]
        chunk_file = os.path.join(verses_dir, f"verses.{chunk_count:04d}.json")

        with open(chunk_file, "w", encoding="utf-8") as f:
            json.dump(chunk_data, f, ensure_ascii=False)

    print(f"📝 Wrote {chunk_count} verse chunk files ({chunk_size} verses/chunk)")

    # Write metadata
    meta = {
        "input": args.inp,
        "output": args.out,
        "works_total": len(works_out),
        "verses_total": total_verses,
        "verses_unique": len(seen_refs),
        "duplicates_detected": duplicate_count,
        "chunks_created": chunk_count,
        "chunk_size": chunk_size,
        "testament_counts": dict(testament_counts),
        "first_reference": first_ref,
        "last_reference": last_ref,
    }

    meta_path = os.path.join(args.out, "meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"📊 Wrote metadata to {meta_path}")

    # Print summary
    print("\n" + "="*60)
    print("CONVERSION SUMMARY")
    print("="*60)
    print(f"Works:           {len(works_out)}")
    print(f"Verses (total):  {total_verses}")
    print(f"Verses (unique): {len(seen_refs)}")
    print(f"Duplicates:      {duplicate_count}")
    print(f"Chunks:          {chunk_count}")
    print(f"\nTestament breakdown:")
    for testament, count in sorted(testament_counts.items()):
        print(f"  {testament:12} {count:>6} verses")
    print("="*60)

    if duplicate_count > 0:
        print(f"\n⚠️  WARNING: {duplicate_count} duplicate verses detected")
        print("   These will be filtered during validation.")


if __name__ == "__main__":
    main()
