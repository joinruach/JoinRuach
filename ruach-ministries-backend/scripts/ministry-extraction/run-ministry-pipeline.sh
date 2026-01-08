#!/bin/bash
#
# Ministry Text Extraction Pipeline Orchestrator
#
# Usage:
#   ./scripts/ministry-extraction/run-ministry-pipeline.sh \
#     /path/to/book.pdf \
#     BOOK_CODE \
#     ministry-pipeline/egw/book-name
#
# Example:
#   ./scripts/ministry-extraction/run-ministry-pipeline.sh \
#     ministry-pipeline/sources/egw/ministry-of-healing/the_ministry_of_healing.pdf \
#     MOH \
#     ministry-pipeline/egw/ministry-of-healing
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ "$#" -ne 3 ]; then
    echo -e "${RED}ERROR: Invalid arguments${NC}"
    echo "Usage: $0 <pdf_path> <book_code> <output_base_dir>"
    echo ""
    echo "Example:"
    echo "  $0 ministry-pipeline/sources/egw/ministry-of-healing/the_ministry_of_healing.pdf MOH ministry-pipeline/egw/ministry-of-healing"
    exit 1
fi

PDF_PATH="$1"
BOOK_CODE="$2"
OUTPUT_BASE="$3"

# Validate inputs
if [ ! -f "$PDF_PATH" ]; then
    echo -e "${RED}ERROR: PDF file not found: $PDF_PATH${NC}"
    exit 1
fi

# Setup directories
SOURCES_DIR="$OUTPUT_BASE/sources"
EXPORTS_DIR="$OUTPUT_BASE/exports/v1"
PATCHES_DIR="$OUTPUT_BASE/patches/v1"
INGEST_DIR="$OUTPUT_BASE/ingest/v1"

mkdir -p "$SOURCES_DIR" "$EXPORTS_DIR" "$PATCHES_DIR" "$INGEST_DIR/texts"

# Output files
PARAGRAPHS_JSONL="$EXPORTS_DIR/paragraphs.jsonl"
EXTRACTION_META="$EXPORTS_DIR/extraction-metadata.json"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Ministry Text Extraction Pipeline${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "PDF:         ${GREEN}$PDF_PATH${NC}"
echo -e "Book Code:   ${GREEN}$BOOK_CODE${NC}"
echo -e "Output:      ${GREEN}$OUTPUT_BASE${NC}"
echo ""

# Step 1: SHA256 Verification
echo -e "${YELLOW}[1/4] SHA256 Verification${NC}"
if [ -f "$SOURCES_DIR/SHA256SUMS.txt" ]; then
    echo "   → Verifying existing checksum..."
    cd "$(dirname "$PDF_PATH")"
    if shasum -a 256 -c "$SOURCES_DIR/SHA256SUMS.txt" 2>/dev/null; then
        echo -e "   → ${GREEN}✓ Checksum verified${NC}"
    else
        echo -e "   → ${YELLOW}⚠ Checksum mismatch, regenerating...${NC}"
        shasum -a 256 "$(basename "$PDF_PATH")" > "$SOURCES_DIR/SHA256SUMS.txt"
    fi
    cd - > /dev/null
else
    echo "   → Generating checksum..."
    cd "$(dirname "$PDF_PATH")"
    shasum -a 256 "$(basename "$PDF_PATH")" > "$SOURCES_DIR/SHA256SUMS.txt"
    cd - > /dev/null
    echo -e "   → ${GREEN}✓ Checksum saved${NC}"
fi

# Step 2: PDF Extraction
echo ""
echo -e "${YELLOW}[2/4] PDF Extraction${NC}"
echo "   → Running pdf-extractor.py..."

if ! python3 scripts/ministry-extraction/pdf-extractor.py \
    --pdf "$PDF_PATH" \
    --out "$PARAGRAPHS_JSONL" \
    --book-code "$BOOK_CODE"; then
    echo -e "${RED}ERROR: PDF extraction failed${NC}"
    exit 1
fi

echo -e "   → ${GREEN}✓ Extraction complete${NC}"

# Check if JSONL was created
if [ ! -f "$PARAGRAPHS_JSONL" ]; then
    echo -e "${RED}ERROR: JSONL output not found: $PARAGRAPHS_JSONL${NC}"
    exit 1
fi

# Count extracted paragraphs
PARA_COUNT=$(wc -l < "$PARAGRAPHS_JSONL" | tr -d ' ')
echo "   → Extracted $PARA_COUNT paragraphs"

# Step 3: Convert to Strapi Format
echo ""
echo -e "${YELLOW}[3/4] Convert to Strapi Format${NC}"
echo "   → Running jsonl-to-strapi.py..."

if ! python3 scripts/ministry-extraction/jsonl-to-strapi.py \
    --in "$PARAGRAPHS_JSONL" \
    --out "$INGEST_DIR" \
    --chunk 500; then
    echo -e "${RED}ERROR: Conversion to Strapi format failed${NC}"
    exit 1
fi

echo -e "   → ${GREEN}✓ Conversion complete${NC}"

# Step 4: Validation
echo ""
echo -e "${YELLOW}[4/4] Validation${NC}"
echo "   → Running validate-ministry-dump.py..."

if ! python3 scripts/ministry-extraction/validate-ministry-dump.py \
    --dir "$INGEST_DIR"; then
    echo -e "${RED}ERROR: Validation failed${NC}"
    exit 1
fi

echo -e "   → ${GREEN}✓ Validation passed${NC}"

# Success summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Pipeline Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Output files:"
echo "  📄 JSONL:      $PARAGRAPHS_JSONL"
echo "  📚 Work:       $INGEST_DIR/work.json"
echo "  📝 Texts:      $INGEST_DIR/texts/texts.*.json"
echo "  ✅ Validation: $INGEST_DIR/validation-report.json"
echo ""
echo "Next steps:"
echo "  1. Review validation report: cat $INGEST_DIR/validation-report.json | jq"
echo "  2. Import to Strapi: npx tsx scripts/ministry-extraction/import-to-strapi.ts $INGEST_DIR"
echo ""
