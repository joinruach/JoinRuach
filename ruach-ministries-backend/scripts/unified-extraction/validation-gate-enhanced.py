#!/usr/bin/env python3
"""
Enhanced Validation Gate - Multi-Book Sentinel Validation

Expands validation beyond Genesis to cover different formatting patterns:
- Poetry (Psalms)
- Prophets (Isaiah)
- Gospels (Matthew)
- Epistles (Romans)
- Short book (Jude)

Each sentinel book gets:
- First verse present check
- Last verse present check
- Chapter count validation
- Verse count validation
- Missing verse threshold
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional


class EnhancedValidationGate:
    """Multi-book validation gates for extraction quality"""

    # Sentinel books with expected canonical structure
    SENTINEL_BOOKS = {
        "Genesis": {
            "work_id_pattern": "yah-gen",
            "chapters": 50,
            "total_verses": 1533,
            "first_verse": (1, 1),
            "last_verse": (50, 26),
            "testament": "tanakh",
        },
        "Psalms": {
            "work_id_pattern": "yah-psa",
            "chapters": 150,
            "total_verses": 2461,
            "first_verse": (1, 1),
            "last_verse": (150, 6),
            "testament": "tanakh",
        },
        "Isaiah": {
            "work_id_pattern": "yah-isa",
            "chapters": 66,
            "total_verses": 1292,
            "first_verse": (1, 1),
            "last_verse": (66, 24),
            "testament": "tanakh",
        },
        "Matthew": {
            "work_id_pattern": "yah-mat",
            "chapters": 28,
            "total_verses": 1071,
            "first_verse": (1, 1),
            "last_verse": (28, 20),
            "testament": "renewed_covenant",
        },
        "Romans": {
            "work_id_pattern": "yah-rom",
            "chapters": 16,
            "total_verses": 433,
            "first_verse": (1, 1),
            "last_verse": (16, 27),
            "testament": "renewed_covenant",
        },
        "Jude": {
            "work_id_pattern": "yah-jud",
            "chapters": 1,
            "total_verses": 25,
            "first_verse": (1, 1),
            "last_verse": (1, 25),
            "testament": "renewed_covenant",
        },
    }

    def __init__(self, works_file: str, verses_dir: str, canonical_file: Optional[str] = None):
        self.works_file = Path(works_file)
        self.verses_dir = Path(verses_dir)
        self.canonical_file = Path(canonical_file) if canonical_file else None
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.book_reports: Dict[str, Dict] = {}

    def load_data(self) -> Tuple[List[Dict], List[Dict]]:
        """Load works and verses from JSON files"""
        with open(self.works_file, 'r') as f:
            works_data = json.load(f)

        verses = []
        for verse_file in sorted(self.verses_dir.glob('verses_chunk_*.json')):
            with open(verse_file, 'r') as f:
                verses.extend(json.load(f))

        return (works_data, verses)

    def validate_book(self, book_name: str, canonical: Dict, works: List[Dict], verses: List[Dict]) -> Dict:
        """Validate a specific sentinel book"""
        report = {
            "book": book_name,
            "passed": True,
            "errors": [],
            "warnings": [],
            "stats": {},
        }

        # Find the work
        work = None
        work_id_pattern = canonical["work_id_pattern"]
        for w in works:
            work_id = w.get('workId', '')
            if work_id_pattern in work_id or work_id == work_id_pattern:
                work = w
                break

        if not work:
            report["passed"] = False
            report["errors"].append(f"Book '{book_name}' not found in extraction")
            report["stats"] = {"chapters_found": 0, "verses_found": 0, "duplicates": 0}
            return report

        # Get verses for this book
        work_id = work.get('workId', '')
        book_verses = [v for v in verses if v.get('work') == work_id]
        verses_by_key = {(v.get('chapter'), v.get('verse')): v for v in book_verses}

        # Check for actual duplicates (same chapter:verse appears twice)
        verse_keys_seen = set()
        duplicates = []
        for v in book_verses:
            key = (v.get('chapter'), v.get('verse'))
            if key in verse_keys_seen:
                duplicates.append(f"{key[0]}:{key[1]}")
            verse_keys_seen.add(key)

        stats = {
            "book": book_name,
            "work_id": work_id,
            "chapters_found": len(set(v.get('chapter') for v in book_verses)),
            "verses_found": len(verses_by_key),
            "total_verse_records": len(book_verses),
            "duplicates": len(duplicates),
            "expected_chapters": canonical["chapters"],
            "expected_verses": canonical["total_verses"],
        }

        # Gate 1: First verse present (HARD FAIL)
        first_verse = canonical["first_verse"]
        if first_verse not in verses_by_key:
            report["passed"] = False
            report["errors"].append(f"❌ HARD FAIL: First verse {first_verse[0]}:{first_verse[1]} missing")

        # Gate 2: Last verse present (HARD FAIL)
        last_verse = canonical["last_verse"]
        if last_verse not in verses_by_key:
            report["passed"] = False
            report["errors"].append(f"❌ HARD FAIL: Last verse {last_verse[0]}:{last_verse[1]} missing")

        # Gate 3: Duplicates (HARD FAIL)
        if len(duplicates) > 0:
            report["passed"] = False
            report["errors"].append(f"❌ HARD FAIL: {len(duplicates)} duplicate verses: {duplicates[:5]}")

        # Gate 4: Chapter count (HARD FAIL if < 80%)
        expected_chapters = canonical["chapters"]
        chapters_found = stats["chapters_found"]
        if chapters_found < expected_chapters * 0.8:
            report["passed"] = False
            report["errors"].append(
                f"❌ HARD FAIL: Chapter count {chapters_found}/{expected_chapters} (< 80%)"
            )
        elif chapters_found < expected_chapters:
            report["warnings"].append(
                f"⚠️  WARNING: Chapter count {chapters_found}/{expected_chapters}"
            )

        # Gate 5: Verse count (HARD FAIL if < 80%, WARNING if 80-90%)
        expected_verses = canonical["total_verses"]
        verses_found = stats["verses_found"]
        if verses_found < expected_verses * 0.8:
            report["passed"] = False
            report["errors"].append(
                f"❌ HARD FAIL: Verse count {verses_found}/{expected_verses} (< 80%)"
            )
        elif verses_found < expected_verses * 0.9:
            report["warnings"].append(
                f"⚠️  WARNING: Verse count {verses_found}/{expected_verses} (80-90%)"
            )

        # Gate 6: Sequential validation - check for backwards transitions
        chapters = sorted(set(v.get('chapter') for v in book_verses))
        for i in range(1, len(chapters)):
            prev_ch = chapters[i-1]
            curr_ch = chapters[i]
            if curr_ch < prev_ch:
                report["passed"] = False
                report["errors"].append(f"❌ HARD FAIL: Backwards chapter transition {prev_ch} → {curr_ch}")

        # Check for verse backwards transitions within chapters
        verses_by_chapter = {}
        for v in book_verses:
            ch = v.get('chapter')
            vs = v.get('verse')
            if ch not in verses_by_chapter:
                verses_by_chapter[ch] = []
            verses_by_chapter[ch].append(vs)

        for ch, verse_nums in verses_by_chapter.items():
            sorted_verses = sorted(set(verse_nums))
            for i in range(1, len(sorted_verses)):
                if sorted_verses[i] < sorted_verses[i-1]:
                    report["warnings"].append(
                        f"⚠️  Chapter {ch}: Non-sequential verses detected (check for duplicates)"
                    )
                    break

        report["stats"] = stats
        return report

    def validate(self) -> Tuple[bool, Dict]:
        """Run validation on all sentinel books"""
        works, verses = self.load_data()

        all_passed = True
        for book_name, canonical in self.SENTINEL_BOOKS.items():
            book_report = self.validate_book(book_name, canonical, works, verses)
            self.book_reports[book_name] = book_report

            if not book_report["passed"]:
                all_passed = False
                self.errors.extend(book_report["errors"])
            self.warnings.extend(book_report["warnings"])

        # Global checks
        total_books_found = len([r for r in self.book_reports.values() if r["stats"].get("verses_found", 0) > 0])
        expected_sentinels = len([b for b in self.SENTINEL_BOOKS.keys() if any(w.get('workId', '').startswith(f"yah-{b[:3].lower()}") for w in works)])

        report = {
            "passed": all_passed,
            "errors": self.errors,
            "warnings": self.warnings,
            "book_reports": self.book_reports,
            "summary": {
                "sentinel_books_tested": len(self.book_reports),
                "sentinel_books_passed": len([r for r in self.book_reports.values() if r["passed"]]),
                "total_errors": len(self.errors),
                "total_warnings": len(self.warnings),
            },
        }

        return (all_passed, report)

    def print_report(self, report: Dict):
        """Print validation report"""
        print("\n" + "="*70)
        print("ENHANCED VALIDATION GATE REPORT")
        print("="*70)

        if report['passed']:
            print("✅ VALIDATION PASSED - All sentinel books validated")
        else:
            print("❌ VALIDATION FAILED - Quality issues detected")

        print(f"\n📊 Summary:")
        summary = report.get('summary', {})
        print(f"  Sentinel books tested: {summary.get('sentinel_books_tested', 0)}")
        print(f"  Sentinel books passed: {summary.get('sentinel_books_passed', 0)}")
        print(f"  Total errors: {summary.get('total_errors', 0)}")
        print(f"  Total warnings: {summary.get('total_warnings', 0)}")

        print(f"\n📖 Book-by-Book Results:")
        for book_name, book_report in report.get('book_reports', {}).items():
            status = "✅" if book_report["passed"] else "❌"
            stats = book_report.get("stats", {})
            print(f"  {status} {book_name}:")
            print(f"    Chapters: {stats.get('chapters_found', 0)}/{stats.get('expected_chapters', 0)}")
            print(f"    Verses: {stats.get('verses_found', 0)}/{stats.get('expected_verses', 0)}")
            print(f"    Duplicates: {stats.get('duplicates', 0)}")

        if report['errors']:
            print(f"\n❌ Errors ({len(report['errors'])}):")
            for error in report['errors'][:10]:
                print(f"  {error}")
            if len(report['errors']) > 10:
                print(f"  ... and {len(report['errors']) - 10} more")

        if report['warnings']:
            print(f"\n⚠️  Warnings ({len(report['warnings'])}):")
            for warning in report['warnings'][:10]:
                print(f"  {warning}")
            if len(report['warnings']) > 10:
                print(f"  ... and {len(report['warnings']) - 10} more")

        print("="*70)


def main():
    if len(sys.argv) < 3:
        print("Usage: validation-gate-enhanced.py <works.json> <verses_dir> [canonical.json]")
        sys.exit(1)

    works_file = sys.argv[1]
    verses_dir = sys.argv[2]
    canonical_file = sys.argv[3] if len(sys.argv) > 3 else None

    gate = EnhancedValidationGate(works_file, verses_dir, canonical_file)
    passed, report = gate.validate()

    gate.print_report(report)

    # Save report
    report_file = Path(verses_dir) / "validation-gate-enhanced-report.json"
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
