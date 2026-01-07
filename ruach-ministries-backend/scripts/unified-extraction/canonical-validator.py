#!/usr/bin/env python3
"""
Canonical Validator - Hard Validation Gates

Validates extracted scripture against canonical-structure.json.
FAILS LOUDLY if counts don't match - no false "valid" status.

Key Validations:
1. Signature verses (first + last verse of each book)
2. Chapter/verse counts match canonical structure exactly
3. No chapter 0 or verse 0 (invalid)
4. No gaps in sequences
5. Per-chapter verse counts match

Purpose: BLOCK the pipeline if extraction is broken.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple


@dataclass
class ValidationResult:
    """Result of canonical validation"""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    book_name: str
    expected_chapters: int
    actual_chapters: int
    expected_verses: int
    actual_verses: int


def load_canonical_structure(canonical_path: str) -> Dict:
    """Load canonical-structure.json"""
    with open(canonical_path, 'r') as f:
        return json.load(f)


def validate_book(
    extracted_verses: List[Dict],
    book_short_code: str,
    canonical_structure: Dict
) -> ValidationResult:
    """
    Validate a single book against canonical structure

    Args:
        extracted_verses: List of verse dicts with chapter, verse, text
        book_short_code: Short code like "GEN", "EXO", etc.
        canonical_structure: Full canonical structure dict

    Returns:
        ValidationResult with errors/warnings
    """
    errors = []
    warnings = []

    # Get canonical data for this book
    if book_short_code not in canonical_structure:
        return ValidationResult(
            is_valid=False,
            errors=[f"Book {book_short_code} not found in canonical structure"],
            warnings=[],
            book_name=book_short_code,
            expected_chapters=0,
            actual_chapters=0,
            expected_verses=0,
            actual_verses=0,
        )

    canon = canonical_structure[book_short_code]
    book_name = canon['name']
    expected_chapters = canon['chapters']
    expected_total_verses = canon['totalVerses']
    canonical_verses_per_chapter = canon['verses']

    # Count actual chapters and verses
    actual_chapters = 0
    actual_verses = len(extracted_verses)

    if extracted_verses:
        actual_chapters = max(v.get('chapter', 0) for v in extracted_verses)

    print(f"\n📊 Validating {book_name} ({book_short_code})...")
    print(f"   Expected: {expected_chapters} chapters, {expected_total_verses} verses")
    print(f"   Actual:   {actual_chapters} chapters, {actual_verses} verses")

    # HARD VALIDATION 1: Chapter count
    if actual_chapters != expected_chapters:
        errors.append(
            f"Chapter count mismatch: expected {expected_chapters}, got {actual_chapters}"
        )

    # HARD VALIDATION 2: Total verse count
    if actual_verses != expected_total_verses:
        errors.append(
            f"Verse count mismatch: expected {expected_total_verses}, got {actual_verses}"
        )

    # HARD VALIDATION 3: No chapter 0 or verse 0
    for v in extracted_verses:
        ch = v.get('chapter', 0)
        vs = v.get('verse', 0)

        if ch == 0:
            errors.append(f"Invalid chapter 0 found: {v.get('verse_id', 'unknown')}")
        if vs == 0:
            errors.append(f"Invalid verse 0 found: {v.get('verse_id', 'unknown')}")

    # HARD VALIDATION 4: Signature verses (first and last)
    if extracted_verses:
        # First verse check
        expected_first_ch = 1
        expected_first_vs = 1

        first_verses = [v for v in extracted_verses if v.get('chapter') == expected_first_ch and v.get('verse') == expected_first_vs]
        if not first_verses:
            errors.append(f"CRITICAL: Missing signature verse {book_name} {expected_first_ch}:{expected_first_vs}")
        elif len(first_verses) > 1:
            warnings.append(f"Duplicate first verse found: {len(first_verses)} copies of {expected_first_ch}:{expected_first_vs}")

        # Last verse check
        expected_last_ch = expected_chapters
        expected_last_vs = int(canonical_verses_per_chapter[str(expected_last_ch)])

        last_verses = [v for v in extracted_verses if v.get('chapter') == expected_last_ch and v.get('verse') == expected_last_vs]
        if not last_verses:
            errors.append(f"CRITICAL: Missing signature verse {book_name} {expected_last_ch}:{expected_last_vs}")
        elif len(last_verses) > 1:
            warnings.append(f"Duplicate last verse found: {len(last_verses)} copies of {expected_last_ch}:{expected_last_vs}")

    # HARD VALIDATION 5: Per-chapter verse counts
    for ch_num in range(1, expected_chapters + 1):
        expected_vs_count = int(canonical_verses_per_chapter[str(ch_num)])
        actual_vs_count = sum(1 for v in extracted_verses if v.get('chapter') == ch_num)

        if actual_vs_count != expected_vs_count:
            errors.append(
                f"Chapter {ch_num}: expected {expected_vs_count} verses, got {actual_vs_count}"
            )

    # HARD VALIDATION 6: Check for gaps in verse sequences
    for ch_num in range(1, expected_chapters + 1):
        ch_verses = sorted(
            [v.get('verse') for v in extracted_verses if v.get('chapter') == ch_num]
        )

        expected_vs_count = int(canonical_verses_per_chapter[str(ch_num)])
        expected_sequence = list(range(1, expected_vs_count + 1))

        if ch_verses != expected_sequence:
            missing = set(expected_sequence) - set(ch_verses)
            extra = set(ch_verses) - set(expected_sequence)

            if missing:
                errors.append(f"Chapter {ch_num}: missing verses {sorted(missing)}")
            if extra:
                warnings.append(f"Chapter {ch_num}: unexpected verses {sorted(extra)}")

    # HARD VALIDATION 7: Check for duplicates
    verse_ids = [f"{v.get('chapter')}:{v.get('verse')}" for v in extracted_verses]
    if len(verse_ids) != len(set(verse_ids)):
        duplicates = [vid for vid in set(verse_ids) if verse_ids.count(vid) > 1]
        errors.append(f"Duplicate verses found: {duplicates[:10]}" + (" ..." if len(duplicates) > 10 else ""))

    # Determine validation status
    is_valid = len(errors) == 0

    return ValidationResult(
        is_valid=is_valid,
        errors=errors,
        warnings=warnings,
        book_name=book_name,
        expected_chapters=expected_chapters,
        actual_chapters=actual_chapters,
        expected_verses=expected_total_verses,
        actual_verses=actual_verses,
    )


def validate_genesis(extracted_verses: List[Dict], canonical_structure: Dict) -> ValidationResult:
    """Convenience function for validating Genesis specifically"""
    return validate_book(extracted_verses, 'GEN', canonical_structure)


def print_validation_report(result: ValidationResult):
    """Print formatted validation report"""
    print("\n" + "="*70)
    print(f"  VALIDATION REPORT: {result.book_name}")
    print("="*70)

    print(f"\nChapters: {result.actual_chapters} / {result.expected_chapters} {'✅' if result.actual_chapters == result.expected_chapters else '❌'}")
    print(f"Verses:   {result.actual_verses} / {result.expected_verses} {'✅' if result.actual_verses == result.expected_verses else '❌'}")

    if result.errors:
        print(f"\n❌ ERRORS ({len(result.errors)}):")
        for error in result.errors:
            print(f"   - {error}")

    if result.warnings:
        print(f"\n⚠️  WARNINGS ({len(result.warnings)}):")
        for warning in result.warnings:
            print(f"   - {warning}")

    print("\n" + "="*70)
    if result.is_valid:
        print("✅ VALIDATION PASSED")
    else:
        print("❌ VALIDATION FAILED")
    print("="*70 + "\n")


def validate_extraction_output(
    works_json_path: str,
    verses_json_path: str,
    canonical_structure_path: str
) -> Tuple[bool, List[ValidationResult]]:
    """
    Validate complete extraction output against canonical structure

    Args:
        works_json_path: Path to works.json
        verses_json_path: Path to verses_chunk_*.json
        canonical_structure_path: Path to canonical-structure.json

    Returns:
        (all_valid, list of ValidationResult)
    """
    # Load data
    with open(works_json_path, 'r') as f:
        works = json.load(f)

    # Load verses (handle chunked files)
    verses = []
    if Path(verses_json_path).is_file():
        with open(verses_json_path, 'r') as f:
            verses = json.load(f)
    else:
        # Load all chunks
        verse_dir = Path(verses_json_path).parent
        for chunk_file in sorted(verse_dir.glob('verses_chunk_*.json')):
            with open(chunk_file, 'r') as f:
                verses.extend(json.load(f))

    canonical_structure = load_canonical_structure(canonical_structure_path)

    # Validate each work
    results = []
    for work in works:
        short_code = work.get('short_code')
        work_id = work.get('work_id')

        # Filter verses for this work
        work_verses = [v for v in verses if v.get('work_id') == work_id]

        result = validate_book(work_verses, short_code, canonical_structure)
        results.append(result)

        print_validation_report(result)

    # Overall status
    all_valid = all(r.is_valid for r in results)

    return (all_valid, results)


# CLI usage
if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Validate extracted scripture against canonical structure")
    parser.add_argument("works_json", help="Path to works.json")
    parser.add_argument("verses_json", help="Path to verses_chunk_01.json (or directory)")
    parser.add_argument("canonical_json", help="Path to canonical-structure.json")

    args = parser.parse_args()

    print("🔍 Canonical Validation\n")

    all_valid, results = validate_extraction_output(
        args.works_json,
        args.verses_json,
        args.canonical_json
    )

    # Summary
    total_books = len(results)
    passed_books = sum(1 for r in results if r.is_valid)
    failed_books = total_books - passed_books

    print("\n" + "="*70)
    print("  SUMMARY")
    print("="*70)
    print(f"Total Books: {total_books}")
    print(f"Passed:      {passed_books} ✅")
    print(f"Failed:      {failed_books} ❌")
    print("="*70 + "\n")

    sys.exit(0 if all_valid else 1)
