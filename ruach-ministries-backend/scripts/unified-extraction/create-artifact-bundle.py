#!/usr/bin/env python3
"""
Create Run Artifact Bundle

Produces a single bundle JSON that contains all extraction artifacts
for easy review in the UI. This becomes the "single source of truth"
for an extraction run.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime


def create_artifact_bundle(output_dir: str) -> Dict:
    """
    Create a comprehensive artifact bundle for an extraction run
    
    Returns bundle JSON with:
    - extraction-log.json (decision log)
    - validation-report.json (errors/warnings, counts, score)
    - dedup-report.json (what merged, what kept as alternate)
    - overrides/patches_applied.json (empty unless used)
    - canonical-diff.json (missing/extra verses vs canonical)
    """
    output_path = Path(output_dir)
    
    bundle = {
        "bundle_version": "1.0.0",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "output_directory": str(output_path),
    }

    # 1. Extraction log
    log_file = output_path / "extraction-log.json"
    if log_file.exists():
        with open(log_file, 'r') as f:
            bundle["extraction_log"] = json.load(f)
            bundle["extraction_log_count"] = len(bundle["extraction_log"])
    else:
        bundle["extraction_log"] = []
        bundle["extraction_log_count"] = 0

    # 2. Validation report
    validation_file = output_path / "validation-gate-report.json"
    if validation_file.exists():
        with open(validation_file, 'r') as f:
            bundle["validation_report"] = json.load(f)
    else:
        bundle["validation_report"] = {
            "passed": False,
            "errors": ["Validation report not found"],
            "warnings": [],
            "stats": {},
        }

    # Enhanced validation if available
    enhanced_validation_file = output_path / "validation-gate-enhanced-report.json"
    if enhanced_validation_file.exists():
        with open(enhanced_validation_file, 'r') as f:
            bundle["enhanced_validation_report"] = json.load(f)

    # 3. Dedup report (from extraction log)
    dedup_events = [
        log for log in bundle.get("extraction_log", [])
        if log.get("action") in ["duplicate_rejected", "duplicate_replaced"]
    ]
    bundle["dedup_report"] = {
        "total_deduplication_events": len(dedup_events),
        "rejected": len([e for e in dedup_events if e.get("action") == "duplicate_rejected"]),
        "replaced": len([e for e in dedup_events if e.get("action") == "duplicate_replaced"]),
        "events": dedup_events[:50],  # Limit to first 50 for bundle size
    }

    # 4. Patches applied
    patches_dir = output_path / "patches"
    patches_file = patches_dir / "patches_applied.json"
    if patches_file.exists():
        with open(patches_file, 'r') as f:
            bundle["patches_applied"] = json.load(f)
        bundle["patches_count"] = len(bundle["patches_applied"].get("patches", []))
    else:
        bundle["patches_applied"] = None
        bundle["patches_count"] = 0

    # 5. Canonical diff (requires canonical structure file)
    works_file = output_path / "works.json"
    if works_file.exists():
        with open(works_file, 'r') as f:
            works = json.load(f)

        # Load verses
        verses = []
        for verse_file in sorted(output_path.glob('verses_chunk_*.json')):
            with open(verse_file, 'r') as f:
                verses.extend(json.load(f))

        # Generate diff for Genesis (can be expanded)
        genesis_work = next((w for w in works if w.get('workId') == 'yah-gen'), None)
        if genesis_work:
            genesis_verses = [v for v in verses if v.get('work') == 'yah-gen']
            verses_by_key = {(v.get('chapter'), v.get('verse')): v for v in genesis_verses}
            
            # Expected canonical structure for Genesis
            expected_verses = 1533
            expected_chapters = 50
            found_verses = len(verses_by_key)
            found_chapters = len(set(v.get('chapter') for v in genesis_verses))

            # Find missing verses (simplified - would need full canonical structure)
            bundle["canonical_diff"] = {
                "genesis": {
                    "chapters": {
                        "expected": expected_chapters,
                        "found": found_chapters,
                        "missing": max(0, expected_chapters - found_chapters),
                    },
                    "verses": {
                        "expected": expected_verses,
                        "found": found_verses,
                        "missing": max(0, expected_verses - found_verses),
                        "missing_percentage": round((expected_verses - found_verses) / expected_verses * 100, 2) if expected_verses > 0 else 0,
                    },
                    "first_verse_present": (1, 1) in verses_by_key,
                    "last_verse_present": (50, 26) in verses_by_key,
                }
            }

    # 6. Works summary
    if works_file.exists():
        with open(works_file, 'r') as f:
            works = json.load(f)
        bundle["works_summary"] = {
            "total_works": len(works),
            "works": [
                {
                    "workId": w.get("workId"),
                    "canonicalName": w.get("canonicalName"),
                    "chapters": w.get("totalChapters", 0),
                    "verses": w.get("totalVerses", 0),
                }
                for w in works
            ]
        }

    # 7. Overall quality score
    validation = bundle.get("validation_report", {})
    errors = len(validation.get("errors", []))
    warnings = len(validation.get("warnings", []))
    
    # Score: 100 - (errors * 10) - (warnings * 2)
    quality_score = max(0, 100 - (errors * 10) - (warnings * 2))
    bundle["quality_score"] = quality_score
    bundle["quality_grade"] = (
        "A" if quality_score >= 90 else
        "B" if quality_score >= 80 else
        "C" if quality_score >= 70 else
        "D" if quality_score >= 60 else
        "F"
    )

    return bundle


def main():
    if len(sys.argv) < 2:
        print("Usage: create-artifact-bundle.py <output_dir>")
        sys.exit(1)

    output_dir = sys.argv[1]
    bundle = create_artifact_bundle(output_dir)

    # Save bundle
    output_path = Path(output_dir)
    bundle_file = output_path / "artifact-bundle.json"
    with open(bundle_file, 'w') as f:
        json.dump(bundle, f, indent=2, ensure_ascii=False)

    print(f"📦 Artifact bundle created: {bundle_file}")
    print(f"   Quality Score: {bundle['quality_score']}/100 ({bundle['quality_grade']})")
    print(f"   Works: {bundle.get('works_summary', {}).get('total_works', 0)}")
    print(f"   Extraction decisions: {bundle.get('extraction_log_count', 0)}")
    print(f"   Dedup events: {bundle.get('dedup_report', {}).get('total_deduplication_events', 0)}")
    print(f"   Patches applied: {bundle.get('patches_count', 0)}")

    # Exit code based on validation
    validation = bundle.get("validation_report", {})
    if not validation.get("passed", False):
        sys.exit(1)
    elif validation.get("warnings"):
        sys.exit(2)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
