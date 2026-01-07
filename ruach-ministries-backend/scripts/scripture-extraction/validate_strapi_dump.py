#!/usr/bin/env python3
"""
Validates the Strapi dump created by jsonl_to_strapi.py.

Checks:
- Duplicate verses by (workSlug, chapter, verse)
- Missing Genesis 2:25 (known source anomaly)
- Optional: Compare counts against canonical-structure.json
- Optional: Check for empty verse text

Usage:
  python scripts/scripture-extraction/validate_strapi_dump.py \
    --dir scripture-pipeline/ingest/yah/v1 \
    --canonical scripts/scripture-extraction/canonical-structure.json

Exit codes:
  0 = All validation passed
  1 = Critical issues found (duplicates, Genesis 2:25 missing, etc.)
"""

from __future__ import annotations
import argparse
import json
import os
import glob
import re
from collections import defaultdict
from typing import Dict, List, Tuple, Set


def load_json(path: str):
    """Load JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def norm(s: str) -> str:
    """Normalize string for comparison."""
    return re.sub(r"\s+", " ", s.strip().lower())


def main():
    ap = argparse.ArgumentParser(description="Validate Strapi dump")
    ap.add_argument("--dir", required=True, help="Output dir from jsonl_to_strapi.py")
    ap.add_argument(
        "--canonical",
        required=False,
        help="canonical-structure.json (optional)",
    )
    ap.add_argument(
        "--strict",
        action="store_true",
        help="Fail on warnings (empty verses, etc.)",
    )
    args = ap.parse_args()

    print("🔍 Validating Strapi dump...")

    # Load works
    works_path = os.path.join(args.dir, "works.json")
    if not os.path.exists(works_path):
        print(f"❌ Missing works.json at {works_path}")
        raise SystemExit(1)

    works = load_json(works_path)
    print(f"✅ Loaded {len(works)} works")

    # Load verse chunks
    verse_files = sorted(glob.glob(os.path.join(args.dir, "verses", "verses.*.json")))
    if not verse_files:
        print(f"❌ No verse chunk files found in {args.dir}/verses/")
        raise SystemExit(1)

    print(f"✅ Found {len(verse_files)} verse chunk files")

    # Build work lookup
    title_by_slug = {w["slug"]: w["title"] for w in works}
    testament_by_slug = {w["slug"]: w.get("testament", "unknown") for w in works}

    # Validation tracking
    seen_refs: Set[Tuple[str, int, int]] = set()
    duplicates: List[str] = []
    verse_counts = defaultdict(int)
    empty_verses: List[str] = []

    # Critical check: Genesis 2:25
    genesis_225_found = False
    genesis_slugs = [
        w["slug"]
        for w in works
        if "genesis" in w["slug"] or norm(w["title"]) in ("genesis", "bereshith", "berĕshith")
    ]

    # Testament totals
    testament_totals = defaultdict(int)

    print("\n📖 Processing verses...")

    total_verses = 0
    for vf in verse_files:
        arr = load_json(vf)
        for v in arr:
            work_slug = v.get("workSlug", "")
            chapter = int(v.get("chapter", 0))
            verse = int(v.get("verse", 0))
            text = str(v.get("text", "")).strip()
            reference = v.get("reference", f"{work_slug} {chapter}:{verse}")

            # Check for duplicates
            ref_key = (work_slug, chapter, verse)
            if ref_key in seen_refs:
                duplicates.append(reference)
            else:
                seen_refs.add(ref_key)

            # Count verses per work
            verse_counts[work_slug] += 1

            # Track testament totals
            testament = testament_by_slug.get(work_slug, "unknown")
            testament_totals[testament] += 1

            # Check for empty verse text
            if not text:
                empty_verses.append(reference)

            # Critical check: Genesis 2:25
            if work_slug in genesis_slugs and chapter == 2 and verse == 25:
                if text:
                    genesis_225_found = True

            total_verses += 1

    print(f"✅ Processed {total_verses} total verses")
    print(f"✅ Found {len(seen_refs)} unique verses")

    # Report issues
    issues: List[str] = []
    warnings: List[str] = []

    # Critical: Duplicates
    if duplicates:
        issues.append(f"Duplicates detected: {len(duplicates)}")
        print(f"\n❌ CRITICAL: {len(duplicates)} duplicate verses found:")
        for dup in duplicates[:10]:  # Show first 10
            print(f"   - {dup}")
        if len(duplicates) > 10:
            print(f"   ... and {len(duplicates) - 10} more")

    # Critical: Genesis 2:25
    if not genesis_225_found:
        issues.append("Missing Genesis 2:25 (critical)")
        print("\n❌ CRITICAL: Genesis 2:25 not found or empty")
        print("   This is a known source anomaly that must be patched")

    # Warning: Empty verses
    if empty_verses:
        warnings.append(f"Empty verse text: {len(empty_verses)}")
        print(f"\n⚠️  WARNING: {len(empty_verses)} verses with empty text:")
        for ref in empty_verses[:10]:
            print(f"   - {ref}")
        if len(empty_verses) > 10:
            print(f"   ... and {len(empty_verses) - 10} more")

    # Optional: Canonical structure validation
    canonical_mismatches: List[Tuple[str, int, int]] = []
    if args.canonical and os.path.exists(args.canonical):
        print(f"\n📋 Validating against {args.canonical}...")

        try:
            canon = load_json(args.canonical)
            canon_books = canon.get("books", [])

            for book in canon_books:
                slug = book.get("slug", "")
                chapters = book.get("chapters", {})

                # Calculate expected verse count
                expected = sum(int(v) for v in chapters.values())
                actual = verse_counts.get(slug, 0)

                if actual != expected:
                    canonical_mismatches.append((slug, expected, actual))

            if canonical_mismatches:
                warnings.append(
                    f"Canonical structure mismatches: {len(canonical_mismatches)}"
                )
                print(f"\n⚠️  WARNING: {len(canonical_mismatches)} books differ from canonical structure:")
                for slug, exp, act in canonical_mismatches[:10]:
                    title = title_by_slug.get(slug, slug)
                    diff = act - exp
                    sign = "+" if diff > 0 else ""
                    print(f"   - {title:30} expected {exp:>5}, got {act:>5} ({sign}{diff})")
                if len(canonical_mismatches) > 10:
                    print(f"   ... and {len(canonical_mismatches) - 10} more")

        except Exception as e:
            print(f"⚠️  Could not validate canonical structure: {e}")

    # Print summary
    print("\n" + "="*60)
    print("VALIDATION SUMMARY")
    print("="*60)
    print(f"Works:              {len(works)}")
    print(f"Verses (total):     {total_verses}")
    print(f"Verses (unique):    {len(seen_refs)}")
    print(f"Duplicates:         {len(duplicates)}")
    print(f"Empty verses:       {len(empty_verses)}")
    print(f"Genesis 2:25:       {'✅ FOUND' if genesis_225_found else '❌ MISSING'}")

    print(f"\nTestament breakdown:")
    for testament, count in sorted(testament_totals.items()):
        print(f"  {testament:12} {count:>6} verses")

    if canonical_mismatches:
        print(f"\nCanonical mismatches: {len(canonical_mismatches)}")

    print("="*60)

    # Build report
    report = {
        "works": len(works),
        "verses_total": total_verses,
        "verses_unique": len(seen_refs),
        "duplicates": len(duplicates),
        "empty_verses": len(empty_verses),
        "genesis_2_25_present": genesis_225_found,
        "canonical_mismatches": len(canonical_mismatches),
        "testament_totals": dict(testament_totals),
        "issues": issues,
        "warnings": warnings,
    }

    # Write validation report
    report_path = os.path.join(args.dir, "validation-report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n📊 Validation report written to {report_path}")

    # Exit with appropriate code
    if issues:
        print(f"\n❌ VALIDATION FAILED: {len(issues)} critical issue(s)")
        for issue in issues:
            print(f"   - {issue}")
        raise SystemExit(1)

    if warnings and args.strict:
        print(f"\n⚠️  VALIDATION FAILED (strict mode): {len(warnings)} warning(s)")
        for warning in warnings:
            print(f"   - {warning}")
        raise SystemExit(1)

    if warnings:
        print(f"\n⚠️  {len(warnings)} warning(s) found, but validation passed")
        print("   Use --strict to fail on warnings")

    print("\n✅ VALIDATION PASSED")
    raise SystemExit(0)


if __name__ == "__main__":
    main()
