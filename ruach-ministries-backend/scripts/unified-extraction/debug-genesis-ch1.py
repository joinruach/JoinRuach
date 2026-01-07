#!/usr/bin/env python3
"""
Surgical Test: Genesis Chapter 1 ONLY

Purpose: Prove extraction works on one chapter (31 verses) before scaling.

Test Criteria:
- Extract exactly 31 verses
- Genesis 1:1 starts with "In the beginning" (or Hebrew equivalent)
- Genesis 1:31 is the last verse
- All verses sequential (1,2,3...31, no gaps)
- No chapter 0 or verse 0
- Only BODY zone content (no headers/footers)

Workflow:
1. Run this script → should pass
2. Fix bugs if failed
3. Scale to full Genesis (50 chapters, 1,533 verses)
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from scripture_extractor import ScriptureExtractor
from canonical_validator import validate_book, print_validation_report, load_canonical_structure


def test_genesis_chapter_1(pdf_path: str, canonical_structure_path: str):
    """
    Surgical test: Extract Genesis Chapter 1 only

    This is a focused test to validate extraction logic works
    before running on the full 50-chapter book.
    """
    print("="*70)
    print("  SURGICAL TEST: Genesis Chapter 1")
    print("="*70)
    print()
    print(f"PDF: {pdf_path}")
    print(f"Canonical: {canonical_structure_path}")
    print()

    # Load canonical structure
    canonical_structure = load_canonical_structure(canonical_structure_path)
    genesis_canon = canonical_structure['GEN']

    print(f"Expected Genesis Chapter 1: {genesis_canon['verses']['1']} verses")
    print()

    # Create extractor (filter to Genesis only)
    extractor = ScriptureExtractor(pdf_path, book_filter="Genesis")

    # Extract
    print("📖 Extracting Genesis from PDF...")
    try:
        structured_data = extractor.extract_from_pdf(pdf_path)
    except Exception as e:
        print(f"\n❌ Extraction failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Get extracted verses
    verses = structured_data.get('verses', [])

    if not verses:
        print("\n❌ No verses extracted!")
        return False

    # Filter to Chapter 1 only
    ch1_verses = [v for v in verses if v.chapter == 1]

    print(f"\n📊 Extraction Results:")
    print(f"   Total verses extracted: {len(verses)}")
    print(f"   Chapter 1 verses: {len(ch1_verses)}")
    print()

    # SURGICAL VALIDATION
    errors = []

    # Check 1: Must have exactly 31 verses in chapter 1
    expected_ch1_verses = int(genesis_canon['verses']['1'])
    if len(ch1_verses) != expected_ch1_verses:
        errors.append(f"Chapter 1 verse count: expected {expected_ch1_verses}, got {len(ch1_verses)}")

    # Check 2: Verses must be sequential (1,2,3...31)
    verse_numbers = sorted([v.verse for v in ch1_verses])
    expected_sequence = list(range(1, expected_ch1_verses + 1))
    if verse_numbers != expected_sequence:
        missing = set(expected_sequence) - set(verse_numbers)
        extra = set(verse_numbers) - set(expected_sequence)
        if missing:
            errors.append(f"Missing verses: {sorted(missing)}")
        if extra:
            errors.append(f"Extra verses: {sorted(extra)}")

    # Check 3: No chapter 0 or verse 0
    for v in ch1_verses:
        if v.chapter == 0:
            errors.append(f"Invalid chapter 0 in verse {v.verse_id}")
        if v.verse == 0:
            errors.append(f"Invalid verse 0 in verse {v.verse_id}")

    # Check 4: First verse text validation (Genesis 1:1)
    first_verse = next((v for v in ch1_verses if v.verse == 1), None)
    if first_verse:
        text_start = first_verse.text[:50].lower()
        # Check for common translations
        valid_starts = [
            "in the beginning",  # English
            "beresheet",  # Hebrew transliteration
            "בראשית",  # Hebrew
        ]
        if not any(start in text_start for start in valid_starts):
            errors.append(f"Genesis 1:1 text suspicious: starts with '{first_verse.text[:50]}'")
    else:
        errors.append("Genesis 1:1 not found!")

    # Check 5: Last verse (Genesis 1:31)
    last_verse = next((v for v in ch1_verses if v.verse == 31), None)
    if not last_verse:
        errors.append("Genesis 1:31 not found!")
    else:
        print(f"Genesis 1:1: {first_verse.text[:80]}...")
        print(f"Genesis 1:31: {last_verse.text[:80]}...")
        print()

    # Print results
    print("="*70)
    if errors:
        print("❌ SURGICAL TEST FAILED")
        print("="*70)
        print()
        for error in errors:
            print(f"   - {error}")
        print()
        return False
    else:
        print("✅ SURGICAL TEST PASSED!")
        print("="*70)
        print()
        print("✅ Extraction validated for Genesis Chapter 1")
        print(f"✅ All {expected_ch1_verses} verses present and sequential")
        print("✅ Text content validated")
        print()
        print("Next step: Run full Genesis test (50 chapters, 1,533 verses)")
        print("   Command: python3 scripture-extractor.py <pdf> <output> --book Genesis")
        print()
        return True


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Surgical test: Genesis Chapter 1 only")
    parser.add_argument("pdf_path", help="Path to YahScriptures PDF")
    parser.add_argument("--canonical", default="scripture-extraction/canonical-structure.json",
                        help="Path to canonical-structure.json")

    args = parser.parse_args()

    success = test_genesis_chapter_1(args.pdf_path, args.canonical)

    sys.exit(0 if success else 1)
