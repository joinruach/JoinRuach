#!/usr/bin/env python3
"""
Ministry Text Validation Script

Validates Strapi-ready ministry text JSON dumps with quality gates.

Hard Fail Rules (Exit code 1):
- First paragraph (Ch1:P1) must exist
- No duplicate (chapter, paragraph) tuples
- No empty text fields
- JSON integrity (all files parse correctly)

Warning Rules (Exit code 0 but logged):
- Missing headings (>50% paragraphs)
- Very short paragraphs (<10 chars)
- Missing page numbers in sourceMetadata

Usage:
  python scripts/ministry-extraction/validate-ministry-dump.py \
    --dir ministry-pipeline/ingest/egw/ministry-of-healing/v1
"""

from __future__ import annotations
import argparse
import json
import sys
from glob import glob
from pathlib import Path
from typing import Dict, List, Any, Tuple


def load_work(work_path: str) -> Dict[str, Any]:
    """Load work.json"""
    try:
        with open(work_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ ERROR: work.json not found at {work_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ ERROR: work.json is not valid JSON: {e}")
        sys.exit(1)


def load_all_texts(texts_dir: str) -> List[Dict[str, Any]]:
    """Load all text chunks"""
    all_texts = []
    text_files = sorted(glob(f"{texts_dir}/texts.*.json"))

    if not text_files:
        print(f"❌ ERROR: No text files found in {texts_dir}")
        sys.exit(1)

    for text_file in text_files:
        try:
            with open(text_file, "r", encoding="utf-8") as f:
                texts = json.load(f)
                if not isinstance(texts, list):
                    print(f"❌ ERROR: {text_file} does not contain a list")
                    sys.exit(1)
                all_texts.extend(texts)
        except json.JSONDecodeError as e:
            print(f"❌ ERROR: {text_file} is not valid JSON: {e}")
            sys.exit(1)

    return all_texts


def validate_hard_fail(work: Dict[str, Any], texts: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Critical validation rules (MUST pass)

    Returns: (passed, errors)
    """
    errors = []

    # 1. First paragraph (Ch1:P1) must exist
    has_first = any(
        t.get("chapterNumber") == 1 and t.get("paragraphNumber") == 1 for t in texts
    )
    if not has_first:
        errors.append("CRITICAL: First paragraph (Chapter 1, Paragraph 1) not found")

    # 2. No duplicate (chapter, paragraph) tuples
    seen_refs = set()
    for text in texts:
        chapter = text.get("chapterNumber")
        paragraph = text.get("paragraphNumber")

        if chapter is None or paragraph is None:
            errors.append(
                f"CRITICAL: Text missing chapter/paragraph: textId={text.get('textId')}"
            )
            continue

        ref = (chapter, paragraph)
        if ref in seen_refs:
            errors.append(f"CRITICAL: Duplicate paragraph found: Chapter {chapter}, Paragraph {paragraph}")
        seen_refs.add(ref)

    # 3. No empty text fields
    for text in texts:
        text_content = text.get("text", "").strip()
        if not text_content:
            errors.append(
                f"CRITICAL: Empty text field: Chapter {text.get('chapterNumber')}, "
                f"Paragraph {text.get('paragraphNumber')}"
            )

    # 4. JSON integrity (already validated during load, but check text_id uniqueness)
    text_ids = [t.get("textId") for t in texts]
    if len(text_ids) != len(set(text_ids)):
        duplicates = [tid for tid in text_ids if text_ids.count(tid) > 1]
        errors.append(f"CRITICAL: Duplicate textId values found: {set(duplicates)}")

    return len(errors) == 0, errors


def validate_warnings(work: Dict[str, Any], texts: List[Dict[str, Any]]) -> List[str]:
    """
    Soft validation rules (log but don't fail)

    Returns: warnings
    """
    warnings = []

    # 1. Missing headings (>50% paragraphs)
    no_heading = sum(1 for t in texts if not t.get("heading"))
    if no_heading > len(texts) * 0.5:
        warnings.append(f"WARNING: {no_heading}/{len(texts)} paragraphs missing headings (>{50}%)")

    # 2. Very short paragraphs (<10 chars)
    short_texts = [
        t for t in texts if t.get("text") and len(t.get("text", "").strip()) < 10
    ]
    if short_texts:
        warnings.append(
            f"WARNING: {len(short_texts)} very short paragraphs (<10 chars)"
        )

    # 3. Missing page numbers in sourceMetadata
    missing_pages = sum(
        1
        for t in texts
        if not t.get("sourceMetadata", {}).get("pdfPage")
    )
    if missing_pages > 0:
        warnings.append(
            f"WARNING: {missing_pages}/{len(texts)} paragraphs missing pdfPage in sourceMetadata"
        )

    # 4. Check chapter sequence (gaps)
    chapters = sorted(set(t.get("chapterNumber") for t in texts if t.get("chapterNumber")))
    if chapters:
        expected = list(range(1, max(chapters) + 1))
        missing_chapters = set(expected) - set(chapters)
        if missing_chapters:
            warnings.append(f"WARNING: Missing chapters: {sorted(missing_chapters)}")

    # 5. Work metadata consistency
    work_total_chapters = work.get("totalChapters", 0)
    work_total_paragraphs = work.get("totalParagraphs", 0)

    if len(chapters) != work_total_chapters:
        warnings.append(
            f"WARNING: Work claims {work_total_chapters} chapters, but found {len(chapters)}"
        )

    if len(texts) != work_total_paragraphs:
        warnings.append(
            f"WARNING: Work claims {work_total_paragraphs} paragraphs, but found {len(texts)}"
        )

    return warnings


def generate_validation_report(
    work: Dict[str, Any],
    texts: List[Dict[str, Any]],
    passed: bool,
    errors: List[str],
    warnings: List[str],
) -> Dict[str, Any]:
    """Generate comprehensive validation report"""
    chapters = sorted(set(t.get("chapterNumber") for t in texts if t.get("chapterNumber")))

    # Calculate average paragraph length
    text_lengths = [len(t.get("text", "")) for t in texts]
    avg_length = sum(text_lengths) / len(text_lengths) if text_lengths else 0

    # Count duplicates
    seen_refs = set()
    duplicates = 0
    for text in texts:
        ref = (text.get("chapterNumber"), text.get("paragraphNumber"))
        if ref in seen_refs:
            duplicates += 1
        seen_refs.add(ref)

    # Count empty texts
    empty_texts = sum(1 for t in texts if not t.get("text", "").strip())

    report = {
        "passed": passed,
        "timestamp": None,  # Will be set when saved
        "errors": errors,
        "warnings": warnings,
        "stats": {
            "chapters": len(chapters),
            "paragraphs": len(texts),
            "avgParagraphLength": round(avg_length, 1),
            "duplicates": duplicates,
            "emptyTexts": empty_texts,
        },
        "contentChecks": {
            "firstParagraphPresent": any(
                t.get("chapterNumber") == 1 and t.get("paragraphNumber") == 1
                for t in texts
            ),
            "firstChapter": min(chapters) if chapters else 0,
            "lastChapter": max(chapters) if chapters else 0,
            "expectedChapters": work.get("totalChapters", 0),
            "chapterGaps": sorted(
                set(range(1, max(chapters) + 1)) - set(chapters) if chapters else []
            ),
        },
    }

    return report


def main():
    parser = argparse.ArgumentParser(description="Validate ministry text Strapi dump")
    parser.add_argument("--dir", required=True, help="Ingest directory (contains work.json and texts/)")
    args = parser.parse_args()

    ingest_dir = Path(args.dir)

    if not ingest_dir.exists():
        print(f"❌ ERROR: Directory not found: {ingest_dir}")
        sys.exit(1)

    print("🔍 Validating ministry text dump...")
    print(f"   Directory: {ingest_dir}")

    # Load work and texts
    work_path = ingest_dir / "work.json"
    texts_dir = ingest_dir / "texts"

    work = load_work(str(work_path))
    texts = load_all_texts(str(texts_dir))

    print(f"   Loaded: {work.get('title', 'Unknown')} ({len(texts)} paragraphs)")

    # Run hard fail validation
    passed, errors = validate_hard_fail(work, texts)

    # Run warning validation
    warnings_list = validate_warnings(work, texts)

    # Generate report
    report = generate_validation_report(work, texts, passed, errors, warnings_list)

    # Save report
    report_path = ingest_dir / "validation-report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"   Report saved: {report_path}")

    # Print summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    print(f"Status:      {'✅ PASSED' if passed else '❌ FAILED'}")
    print(f"Chapters:    {report['stats']['chapters']}")
    print(f"Paragraphs:  {report['stats']['paragraphs']}")
    print(f"Duplicates:  {report['stats']['duplicates']}")
    print(f"Empty texts: {report['stats']['emptyTexts']}")
    print(f"Avg length:  {report['stats']['avgParagraphLength']} chars")
    print("=" * 60)

    # Print errors
    if errors:
        print("\n❌ ERRORS:")
        for error in errors:
            print(f"   {error}")

    # Print warnings
    if warnings_list:
        print("\n⚠️  WARNINGS:")
        for warning in warnings_list:
            print(f"   {warning}")

    print()

    # Exit with appropriate code
    if passed:
        print("✅ Validation passed!")
        sys.exit(0)
    else:
        print("❌ Validation failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
