#!/bin/bash
###############################################################################
# Unified Content Extraction Pipeline
# Handles Scripture, Canon (EGW), and Library book extraction with validation
###############################################################################

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTENT_TYPE="${1:-scripture}"  # scripture | canon | library
INPUT_FILE="${2}"
OUTPUT_DIR="${3:-./output/${CONTENT_TYPE}-$(date +%Y%m%d-%H%M%S)}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Unified Content Extraction Pipeline v2.0          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Validate inputs
if [ -z "$INPUT_FILE" ]; then
    echo -e "${RED}Error: INPUT_FILE required${NC}"
    echo ""
    echo "Usage: $0 <content-type> <input-file> [output-dir]"
    echo ""
    echo "Content Types:"
    echo "  scripture - Biblical texts (66 canonical + 37 Apocrypha)"
    echo "  canon     - Ellen G. White books"
    echo "  library   - General books/PDFs"
    echo ""
    echo "Example:"
    echo "  $0 scripture /path/to/yahscriptures.pdf ./output/scripture"
    echo ""
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}Error: Input file not found: $INPUT_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}Content Type:${NC} $CONTENT_TYPE"
echo -e "${GREEN}Input File:${NC} $INPUT_FILE"
echo -e "${GREEN}Output Dir:${NC} $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

###############################################################################
# STEP 1: EXTRACTION
###############################################################################

echo -e "${BLUE}[1/5]${NC} ${YELLOW}Extracting content...${NC}"

case "$CONTENT_TYPE" in
    scripture)
        python3 unified-extraction/scripture-extractor.py \
            "$INPUT_FILE" \
            "$OUTPUT_DIR" \
            --verbose
        ;;

    canon)
        python3 canon-parser/ruach_canon_parser.py \
            --input "$INPUT_FILE" \
            --output "$OUTPUT_DIR" \
            --format auto
        ;;

    library)
        python3 library-parser/ruach_library_parser.py \
            "$INPUT_FILE" \
            "$OUTPUT_DIR"
        ;;

    *)
        echo -e "${RED}Error: Unknown content type: $CONTENT_TYPE${NC}"
        exit 1
        ;;
esac

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Extraction failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Extraction complete${NC}"
echo ""

###############################################################################
# STEP 2: VALIDATION
###############################################################################

echo -e "${BLUE}[2/5]${NC} ${YELLOW}Validating extraction...${NC}"

case "$CONTENT_TYPE" in
    scripture)
        # Validate against canonical structure
        pnpm tsx scripture-extraction/scripture-validator.ts \
            "$OUTPUT_DIR/works.json" \
            "$OUTPUT_DIR/" \
            > "$OUTPUT_DIR/validation-report.txt"

        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ Validation failed${NC}"
            echo ""
            echo -e "${YELLOW}Review errors:${NC}"
            cat "$OUTPUT_DIR/validation-report.txt"
            echo ""
            echo -e "${YELLOW}Fix extraction issues before proceeding${NC}"
            exit 1
        fi
        ;;

    canon)
        # Validate canon structure (axiom hierarchy, etc.)
        if [ -f "canon-audit/audit-report.ts" ]; then
            pnpm tsx canon-audit/audit-report.ts \
                "$OUTPUT_DIR" \
                > "$OUTPUT_DIR/validation-report.txt"
        fi
        ;;

    library)
        # Basic validation (file exists, not empty)
        if [ ! -s "$OUTPUT_DIR/chunks.json" ]; then
            echo -e "${RED}✗ Validation failed: No chunks generated${NC}"
            exit 1
        fi
        ;;
esac

echo -e "${GREEN}✓ Validation passed${NC}"
echo ""

###############################################################################
# STEP 3: NORMALIZATION
###############################################################################

echo -e "${BLUE}[3/5]${NC} ${YELLOW}Normalizing text...${NC}"

if [ "$CONTENT_TYPE" == "scripture" ] || [ "$CONTENT_TYPE" == "canon" ]; then
    # Use shared text normalization
    pnpm tsx canon-parser/canon-text-normalize.ts \
        "$OUTPUT_DIR" \
        --preserve-formatting \
        --fix-hyphenation \
        --remove-ocr-artifacts

    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠ Normalization encountered issues (non-fatal)${NC}"
    else
        echo -e "${GREEN}✓ Normalization complete${NC}"
    fi
else
    echo -e "${YELLOW}→ Skipped (not applicable for $CONTENT_TYPE)${NC}"
fi
echo ""

###############################################################################
# STEP 4: REVIEW GENERATION
###############################################################################

echo -e "${BLUE}[4/5]${NC} ${YELLOW}Generating review interface...${NC}"

# Start review server in background
if ! pgrep -f "review-server.ts" > /dev/null; then
    pnpm tsx unified-extraction/review-server.ts &
    REVIEW_SERVER_PID=$!
    echo -e "${GREEN}✓ Review server started (PID: $REVIEW_SERVER_PID)${NC}"

    # Wait for server to start
    sleep 2
else
    echo -e "${YELLOW}→ Review server already running${NC}"
fi

# Create symlink for latest extraction
LATEST_LINK="./extractions/latest"
rm -f "$LATEST_LINK"
ln -s "$(realpath $OUTPUT_DIR)" "$LATEST_LINK"

echo -e "${GREEN}✓ Review interface ready${NC}"
echo ""

###############################################################################
# STEP 5: MANUAL REVIEW
###############################################################################

echo -e "${BLUE}[5/5]${NC} ${YELLOW}Manual Review Required${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🌐 Open Review Interface:${NC}"
echo -e "   ${BLUE}http://localhost:4000${NC}"
echo -e ""
echo -e "${YELLOW}📋 Review Instructions:${NC}"
echo -e "   1. Open the review interface in your browser"
echo -e "   2. Review each book for accuracy (word-for-word)"
echo -e "   3. Check formatting, verse counts, and special characters"
echo -e "   4. Approve or reject each book"
echo -e ""
echo -e "${YELLOW}📊 Review Progress:${NC}"
echo -e "   ${BLUE}http://localhost:4000/api/review-summary${NC}"
echo -e ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check review status
APPROVED_COUNT=0
TOTAL_COUNT=0

if [ "$CONTENT_TYPE" == "scripture" ] && [ -f "$OUTPUT_DIR/works.json" ]; then
    TOTAL_COUNT=$(jq 'length' "$OUTPUT_DIR/works.json")
    echo -e "${YELLOW}Books to review:${NC} $TOTAL_COUNT"
fi

echo ""
echo -e "${YELLOW}After reviewing all content, run:${NC}"
echo -e "   ${GREEN}./import-reviewed.sh $OUTPUT_DIR${NC}"
echo ""

###############################################################################
# SUMMARY
###############################################################################

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Pipeline Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Output Directory:${NC}"
echo -e "   $OUTPUT_DIR"
echo ""
echo -e "${YELLOW}Files Generated:${NC}"
ls -lh "$OUTPUT_DIR"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "   1. Review content at http://localhost:4000"
echo -e "   2. Approve all books"
echo -e "   3. Run: ./import-reviewed.sh $OUTPUT_DIR"
echo ""
