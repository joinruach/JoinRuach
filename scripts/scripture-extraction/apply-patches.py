#!/usr/bin/env python3
"""
Scripture Patch Script - Apply Manual Verse Corrections

⚠️  USE ONLY AS LAST RESORT AFTER EXTRACTOR IS FIXED

This script applies manually verified verse patches to extraction output.
Patches are stored separately from extraction for traceability.

Patch File Format (patches/genesis-missing.json):
{
  "patches": [
    {
      "verseId": "yah-gen-001-001",
      "chapter": 1,
      "verse": 1,
      "text": "In the beginning Elohim created...",
      "source": "manual_verification",
      "reason": "Extractor missed due to header formatting",
      "timestamp": "2026-01-06T...",
      "verified_by": "Marc Seals"
    }
  ]
}
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List


def apply_patches(patches_file: str, verses_dir: str, work_id: str = "yah-gen", require_flag: bool = True):
    """
    Apply patches to verse extraction output
    
    Args:
        patches_file: Path to patches JSON file
        verses_dir: Directory containing verses_chunk_*.json files
        work_id: Work ID to patch (default: yah-gen for Genesis)
    """
    patches_path = Path(patches_file)
    verses_path = Path(verses_dir)

    if not patches_path.exists():
        print(f"❌ Patch file not found: {patches_file}")
        return False

    # Load patches
    with open(patches_path, 'r') as f:
        patch_data = json.load(f)

    patches = patch_data.get('patches', [])
    if not patches:
        print("⚠️  No patches found in file")
        return True

    print(f"📝 Applying {len(patches)} patches...")

    # Load all verse files
    verse_files = sorted(verses_path.glob('verses_chunk_*.json'))
    all_verses = []
    for vf in verse_files:
        with open(vf, 'r') as f:
            all_verses.extend(json.load(f))

    # Track which verses exist
    verses_by_key = {(v.get('chapter'), v.get('verse')): (i, vf_idx, v)
                     for vf_idx, vf in enumerate(verse_files)
                     for i, v in enumerate(json.load(open(vf, 'r')))
                     if v.get('work') == work_id}

    applied = 0
    skipped = 0

    for patch in patches:
        verse_id = patch.get('verseId', '')
        chapter = patch.get('chapter')
        verse = patch.get('verse')
        text = patch.get('text')

        if not all([verse_id, chapter, verse, text]):
            print(f"⚠️  Skipping invalid patch: {patch}")
            skipped += 1
            continue

        key = (chapter, verse)

        if key in verses_by_key:
            # Verse exists - check if patch is different/better
            idx, vf_idx, existing = verses_by_key[key]
            if existing.get('text') == text:
                print(f"   ✓ {verse_id} already correct")
                skipped += 1
                continue

            # Update existing verse
            vf = verse_files[vf_idx]
            verses = json.load(open(vf, 'r'))
            verses[idx]['text'] = text
            verses[idx]['paleoHebrewDivineNames'] = patch.get('paleoHebrewDivineNames', True)
            verses[idx]['_patch_applied'] = {
                'source': patch.get('source'),
                'reason': patch.get('reason'),
                'timestamp': patch.get('timestamp'),
            }

            with open(vf, 'w') as f:
                json.dump(verses, f, indent=2, ensure_ascii=False)

            print(f"   ✏️  Updated {verse_id}")
            applied += 1
        else:
            # Verse missing - add to first chunk file
            if not verse_files:
                print("❌ No verse chunk files found")
                return False

            vf = verse_files[0]
            verses = json.load(open(vf, 'r'))

            new_verse = {
                'verseId': verse_id,
                'work': work_id,
                'chapter': chapter,
                'verse': verse,
                'text': text,
                'paleoHebrewDivineNames': patch.get('paleoHebrewDivineNames', True),
                'hasFootnotes': False,
                'footnotes': None,
                '_patch_applied': {
                    'source': patch.get('source'),
                    'reason': patch.get('reason'),
                    'timestamp': patch.get('timestamp'),
                    'verified_by': patch.get('verified_by'),
                },
            }

            # Insert in correct position (sorted by chapter:verse)
            inserted = False
            for i, v in enumerate(verses):
                v_ch = v.get('chapter', 0)
                v_vs = v.get('verse', 0)
                if (v_ch > chapter) or (v_ch == chapter and v_vs > verse):
                    verses.insert(i, new_verse)
                    inserted = True
                    break

            if not inserted:
                verses.append(new_verse)

            with open(vf, 'w') as f:
                json.dump(verses, f, indent=2, ensure_ascii=False)

            print(f"   ➕ Added {verse_id}")
            applied += 1

    print(f"\n✅ Patch application complete:")
    print(f"   Applied: {applied}")
    print(f"   Skipped: {skipped}")

    # Update works.json verse count
    works_file = verses_path / 'works.json'
    if works_file.exists():
        with open(works_file, 'r') as f:
            works = json.load(f)

        for work in works:
            if work.get('workId') == work_id:
                # Recalculate verse count
                all_verses_after = []
                for vf in verse_files:
                    with open(vf, 'r') as f2:
                        all_verses_after.extend(json.load(f2))

                work_verses = [v for v in all_verses_after if v.get('work') == work_id]
                work['totalVerses'] = len(work_verses)
                work['verses'] = [v.get('verseId') for v in work_verses]

        with open(works_file, 'w') as f:
            json.dump(works, f, indent=2, ensure_ascii=False)

        print(f"   Updated works.json")

    return True


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: apply-patches.py <patches.json> <verses_dir> <work_id> --apply-patches")
        print("\n⚠️  PATCHING REQUIRES EXPLICIT FLAG: --apply-patches")
        print("\nExample:")
        print("  python3 apply-patches.py patches/genesis-missing.json output/main/ yah-gen --apply-patches")
        print("\nThis ensures patches are only applied intentionally, not accidentally.")
        sys.exit(1)

    patches_file = sys.argv[1]
    verses_dir = sys.argv[2]
    work_id = sys.argv[3]
    apply_flag = "--apply-patches" in sys.argv

    if not apply_flag:
        print("❌ ERROR: --apply-patches flag is required")
        print("   Patches must be applied explicitly to prevent accidental corruption.")
        sys.exit(1)

    print("⚠️  APPLYING PATCHES - This modifies extraction output")
    print(f"   Patches: {patches_file}")
    print(f"   Work ID: {work_id}")
    
    # Record patch application at run level
    verses_path = Path(verses_dir)
    patch_metadata = {
        "patched_at": datetime.now().isoformat(),
        "patches_file": patches_file,
        "work_id": work_id,
        "requires_reviewer_acknowledgment": True,
    }
    
    patches_meta_file = verses_path / "patches" / "patches_applied.json"
    patches_meta_file.parent.mkdir(exist_ok=True)
    with open(patches_meta_file, 'w') as f:
        json.dump(patch_metadata, f, indent=2)
    
    success = apply_patches(patches_file, verses_dir, work_id, require_flag=False)
    
    if success:
        print("\n✅ Patches applied successfully")
        print("⚠️  IMPORTANT: Reviewer must acknowledge patches before import/publish")
    
    sys.exit(0 if success else 1)
