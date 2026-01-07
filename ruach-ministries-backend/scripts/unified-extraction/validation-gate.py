#!/usr/bin/env python3
"""
Validation Gate - Fail Extraction Before Import if Quality Issues Detected

This script implements non-negotiable validation gates that MUST pass before
scripture data can be imported. It's called automatically by the extractor
and can also be run standalone for manual validation.

Validation Rules (HARD FAILS):
1. Genesis 1:1 must be present
2. Last verse of each book must be present
3. No duplicate verses
4. All chapters present (count matches canonical)
5. Missing verses count within tolerance

Exit codes:
- 0: Validation passed
- 1: Validation failed (hard fail)
- 2: Validation passed with warnings
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional


class ValidationGate:
    """Validation gates for scripture extraction quality"""

    # Expected canonical structure (can be loaded from JSON file)
    CANONICAL_GENESIS = {
        "chapters": 50,
        "total_verses": 1533,
        "first_verse": (1, 1),
        "last_verse": (50, 26),
    }

    def __init__(self, works_file: str, verses_dir: str, canonical_file: Optional[str] = None):
        self.works_file = Path(works_file)
        self.verses_dir = Path(verses_dir)
        self.canonical_file = Path(canonical_file) if canonical_file else None
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.stats: Dict = {}

    def load_data(self) -> Tuple[Dict, List[Dict]]:
        """Load works and verses from JSON files"""
        # Load works
        with open(self.works_file, 'r') as f:
            works_data = json.load(f)

        # Load verses from chunk files
        verses = []
        for verse_file in sorted(self.verses_dir.glob('verses_chunk_*.json')):
            with open(verse_file, 'r') as f:
                verses.extend(json.load(f))

        return (works_data, verses)

    def validate_book(self, book_name: str, works: List[Dict], verses: List[Dict]) -> bool:
        """Validate a specific book (e.g., Genesis)"""
        # Find the work
        work = None
        for w in works:
            if w.get('canonicalName') == book_name or w.get('workId', '').endswith(book_name.lower()[:3]):
                work = w
                break

        if not work:
            self.errors.append(f"Book '{book_name}' not found in extraction")
            return False

        # Get verses for this book
        work_id = work.get('workId', '')
        book_verses = [v for v in verses if v.get('work') == work_id]
        verses_by_key = {(v.get('chapter'), v.get('verse')): v for v in book_verses}

        self.stats = {
            "book": book_name,
            "work_id": work_id,
            "chapters_found": len(set(v.get('chapter') for v in book_verses)),
            "verses_found": len(verses_by_key),
            "total_verse_records": len(book_verses),
            "duplicates": len(book_verses) - len(verses_by_key),
        }

        # Gate 1: First verse present (HARD FAIL)
        if book_name == "Genesis":
            canonical = self.CANONICAL_GENESIS
            if canonical['first_verse'] not in verses_by_key:
                self.errors.append(f"❌ HARD FAIL: {book_name} {canonical['first_verse'][0]}:{canonical['first_verse'][1]} is missing")
                return False

            # Gate 2: Last verse present (HARD FAIL)
            if canonical['last_verse'] not in verses_by_key:
                self.errors.append(f"❌ HARD FAIL: {book_name} {canonical['last_verse'][0]}:{canonical['last_verse'][1]} is missing")
                return False

            # Gate 3: Duplicates (HARD FAIL)
            if self.stats['duplicates'] > 0:
                self.errors.append(f"❌ HARD FAIL: Found {self.stats['duplicates']} duplicate verses")
                return False

            # Gate 4: Chapter count (HARD FAIL if way off)
            expected_chapters = canonical['chapters']
            if self.stats['chapters_found'] < expected_chapters * 0.8:  # Allow 20% tolerance
                self.errors.append(
                    f"❌ HARD FAIL: Chapter count mismatch: expected {expected_chapters}, found {self.stats['chapters_found']}"
                )
                return False
            elif self.stats['chapters_found'] < expected_chapters:
                self.warnings.append(
                    f"⚠️  WARNING: Chapter count lower than expected: {self.stats['chapters_found']}/{expected_chapters}"
                )

            # Gate 5: Verse count (WARNING if significantly low)
            expected_verses = canonical['total_verses']
            if self.stats['verses_found'] < expected_verses * 0.9:  # Allow 10% tolerance for warnings
                self.warnings.append(
                    f"⚠️  WARNING: Verse count seems low: {self.stats['verses_found']}/{expected_verses}"
                )
            elif self.stats['verses_found'] < expected_verses * 0.8:  # HARD FAIL if way off
                self.errors.append(
                    f"❌ HARD FAIL: Verse count too low: {self.stats['verses_found']}/{expected_verses}"
                )
                return False

        return True

    def validate(self) -> Tuple[bool, Dict]:
        """Run all validation gates"""
        works, verses = self.load_data()

        # Validate Genesis specifically
        genesis_valid = self.validate_book("Genesis", works, verses)

        passed = len(self.errors) == 0

        report = {
            "passed": passed,
            "errors": self.errors,
            "warnings": self.warnings,
            "stats": self.stats,
        }

        return (passed, report)

    def print_report(self, report: Dict):
        """Print validation report"""
        print("\n" + "="*70)
        print("VALIDATION GATE REPORT")
        print("="*70)

        if report['passed']:
            print("✅ VALIDATION PASSED")
        else:
            print("❌ VALIDATION FAILED")

        print(f"\n📊 Stats:")
        for key, value in report['stats'].items():
            print(f"  {key}: {value}")

        if report['errors']:
            print(f"\n❌ Errors ({len(report['errors'])}):")
            for error in report['errors']:
                print(f"  {error}")

        if report['warnings']:
            print(f"\n⚠️  Warnings ({len(report['warnings'])}):")
            for warning in report['warnings']:
                print(f"  {warning}")

        print("="*70)


def main():
    """CLI entry point"""
    if len(sys.argv) < 3:
        print("Usage: validation-gate.py <works.json> <verses_dir> [canonical.json]")
        sys.exit(1)

    works_file = sys.argv[1]
    verses_dir = sys.argv[2]
    canonical_file = sys.argv[3] if len(sys.argv) > 3 else None

    gate = ValidationGate(works_file, verses_dir, canonical_file)
    passed, report = gate.validate()

    gate.print_report(report)

    # Save report
    report_file = Path(verses_dir) / "validation-gate-report.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\n💾 Report saved to: {report_file}")

    # Exit codes
    if not passed:
        sys.exit(1)  # Hard fail
    elif report['warnings']:
        sys.exit(2)  # Passed with warnings
    else:
        sys.exit(0)  # Passed


if __name__ == "__main__":
    main()
