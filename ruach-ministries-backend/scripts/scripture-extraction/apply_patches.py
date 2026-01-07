#!/usr/bin/env python3
"""
Apply surgical patches to JSONL export before Strapi conversion.

This tool applies auditable, versioned patches to fix known source anomalies
(like Genesis 2:25) without editing the original source or export.

Patch format (patches.json):
{
  "version": "1.0.0",
  "patches": [
    {
      "id": "genesis-2-25-restore",
      "type": "add",
      "book": "Genesis",
      "chapter": 2,
      "verse": 25,
      "text": "And they were both naked, the man and his wife, and were not ashamed.",
      "reason": "Source merge anomaly - verse missing in bbli export",
      "source": "YAH Scriptures PDF, cross-referenced with KJV",
      "author": "Marc Seals",
      "date": "2026-01-07"
    }
  ]
}

Usage:
  python scripts/scripture-extraction/apply_patches.py \
    --in scripture-pipeline/exports/yah/v1/yahscriptures-full.jsonl \
    --patches scripture-pipeline/patches/yah/v1/patches.json \
    --out scripture-pipeline/exports/yah/v1/yahscriptures-patched.jsonl \
    --log scripture-pipeline/patches/yah/v1/patch-log.jsonl
"""

from __future__ import annotations
import argparse
import json
import os
import re
from datetime import datetime
from typing import Dict, List, Any, Set, Tuple


def slugify(s: str) -> str:
    """Convert book name to slug."""
    s = s.strip().lower()
    s = re.sub(r"[''`]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "untitled"


def load_json(path: str):
    """Load JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def read_jsonl(path: str):
    """Read JSONL file."""
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)


def write_jsonl(path: str, rows: List[Dict[str, Any]]):
    """Write JSONL file."""
    with open(path, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def append_jsonl(path: str, row: Dict[str, Any]):
    """Append single row to JSONL file."""
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def main():
    ap = argparse.ArgumentParser(description="Apply patches to JSONL export")
    ap.add_argument("--in", dest="inp", required=True, help="Input JSONL file")
    ap.add_argument(
        "--patches",
        required=True,
        help="Patches JSON file (patches.json)",
    )
    ap.add_argument(
        "--out",
        required=True,
        help="Output JSONL file (patched)",
    )
    ap.add_argument(
        "--log",
        required=True,
        help="Patch log file (append-only JSONL)",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be patched without writing output",
    )
    args = ap.parse_args()

    # Load patches
    if not os.path.exists(args.patches):
        print(f"❌ Patches file not found: {args.patches}")
        raise SystemExit(1)

    patches_data = load_json(args.patches)
    patches = patches_data.get("patches", [])

    if not patches:
        print("⚠️  No patches defined, copying input to output unchanged")
        if not args.dry_run:
            rows = list(read_jsonl(args.inp))
            write_jsonl(args.out, rows)
        print("✅ Done (no patches applied)")
        raise SystemExit(0)

    print(f"🔧 Loaded {len(patches)} patch(es) from {args.patches}")

    # Build patch lookup by (book, chapter, verse)
    patches_by_ref: Dict[Tuple[str, int, int], List[Dict]] = {}
    for patch in patches:
        book = patch.get("book", "")
        chapter = int(patch.get("chapter", 0))
        verse = int(patch.get("verse", 0))

        if not book or chapter == 0 or verse == 0:
            print(f"⚠️  Invalid patch (skipping): {patch.get('id', 'unknown')}")
            continue

        key = (book, chapter, verse)
        if key not in patches_by_ref:
            patches_by_ref[key] = []
        patches_by_ref[key].append(patch)

    # Track what we've seen and applied
    seen_verses: Set[Tuple[str, int, int]] = set()
    applied_patches: List[Dict] = []
    output_rows: List[Dict[str, Any]] = []

    # Read input JSONL
    print(f"📖 Reading {args.inp}...")

    meta_row = None
    verse_count = 0

    for row in read_jsonl(args.inp):
        # Preserve metadata row
        if "_meta" in row:
            meta_row = row
            output_rows.append(row)
            continue

        book = row.get("book", "")
        chapter = int(row.get("chapter", 0))
        verse = int(row.get("verse", 0))

        verse_key = (book, chapter, verse)
        seen_verses.add(verse_key)

        # Check if this verse has a patch
        if verse_key in patches_by_ref:
            for patch in patches_by_ref[verse_key]:
                patch_type = patch.get("type", "replace")

                if patch_type == "replace":
                    # Replace verse text
                    old_text = row.get("text", "")
                    new_text = patch.get("text", "")

                    print(f"🔧 REPLACE: {book} {chapter}:{verse}")
                    print(f"   OLD: {old_text[:60]}...")
                    print(f"   NEW: {new_text[:60]}...")

                    row["text"] = new_text
                    applied_patches.append(patch)

                elif patch_type == "delete":
                    # Skip this verse (don't add to output)
                    print(f"🗑️  DELETE: {book} {chapter}:{verse}")
                    applied_patches.append(patch)
                    continue  # Skip adding to output

                else:
                    print(f"⚠️  Unknown patch type '{patch_type}' for {book} {chapter}:{verse}")

        output_rows.append(row)
        verse_count += 1

    # Handle "add" patches (verses that don't exist in source)
    add_patches = []
    for ref_key, patch_list in patches_by_ref.items():
        for patch in patch_list:
            if patch.get("type") == "add" and ref_key not in seen_verses:
                add_patches.append((ref_key, patch))

    if add_patches:
        print(f"\n➕ Adding {len(add_patches)} missing verse(s)...")

        for ref_key, patch in add_patches:
            book, chapter, verse = ref_key

            # Find book_num from existing verses (or use 0)
            book_num = 0
            testament = "unknown"
            for row in output_rows:
                if "_meta" in row:
                    continue
                if row.get("book") == book:
                    book_num = row.get("book_num", 0)
                    testament = row.get("testament", "unknown")
                    break

            new_verse = {
                "book_num": book_num,
                "book": book,
                "testament": testament,
                "chapter": chapter,
                "verse": verse,
                "text": patch.get("text", ""),
            }

            print(f"➕ ADD: {book} {chapter}:{verse}")
            print(f"   TEXT: {new_verse['text'][:60]}...")

            output_rows.append(new_verse)
            applied_patches.append(patch)
            verse_count += 1

    # Summary
    print(f"\n✅ Processed {verse_count} verses")
    print(f"🔧 Applied {len(applied_patches)} patch(es)")

    # Write output
    if not args.dry_run:
        print(f"\n📝 Writing patched output to {args.out}...")
        write_jsonl(args.out, output_rows)
        print(f"✅ Wrote {len(output_rows)} rows")

        # Write patch log (append-only audit trail)
        print(f"\n📋 Logging patches to {args.log}...")
        os.makedirs(os.path.dirname(args.log), exist_ok=True)

        for patch in applied_patches:
            log_entry = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "patch_id": patch.get("id", "unknown"),
                "type": patch.get("type", "unknown"),
                "book": patch.get("book", ""),
                "chapter": patch.get("chapter", 0),
                "verse": patch.get("verse", 0),
                "reason": patch.get("reason", ""),
                "author": patch.get("author", ""),
                "source": patch.get("source", ""),
            }
            append_jsonl(args.log, log_entry)

        print(f"✅ Logged {len(applied_patches)} patch(es)")

    else:
        print("\n🔍 DRY RUN - No files written")

    print("\n" + "="*60)
    print("PATCH SUMMARY")
    print("="*60)
    print(f"Input verses:     {verse_count}")
    print(f"Patches applied:  {len(applied_patches)}")
    print(f"Output verses:    {len(output_rows) - (1 if meta_row else 0)}")
    print("="*60)

    if not args.dry_run:
        print(f"\n✅ Patched JSONL ready at {args.out}")


if __name__ == "__main__":
    main()
