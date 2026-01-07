#!/usr/bin/env python3
import sys
import json
from pathlib import Path

# Add parent directory to path to import scripture_extractor
sys.path.insert(0, str(Path(__file__).parent.parent / 'unified-extraction'))

try:
    from scripture_extractor import ScriptureExtractor
except ImportError as e:
    print(f"ERROR: Cannot import scripture_extractor: {e}")
    print(f"Tried path: {Path(__file__).parent.parent / 'unified-extraction'}")
    sys.exit(1)

def main():
    if len(sys.argv) < 4:
        print("Usage: extract-genesis.py <input_pdf> <output_dir> <canonical_json>")
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_dir = Path(sys.argv[2])
    canonical_json = sys.argv[3]

    print(f"Extracting Genesis from: {input_pdf}")
    print(f"Output directory: {output_dir}")

    # Initialize extractor
    extractor = ScriptureExtractor(
        content_type='scripture',
        work_title='Genesis',
        canonical_structure_path=canonical_json
    )

    # Extract from PDF
    result = extractor.extract_from_pdf(
        pdf_path=input_pdf,
        book_filter='Genesis'  # Only extract Genesis
    )

    # Save output
    output_file = output_dir / 'genesis-extracted.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"✅ Extraction complete: {output_file}")

    # Save decision log
    if hasattr(extractor, 'decision_log'):
        log_file = output_dir / 'extraction-log.json'
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(extractor.decision_log, f, indent=2)
        print(f"📋 Decision log: {log_file}")

if __name__ == '__main__':
    main()
