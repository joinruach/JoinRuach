#!/bin/bash
#
# Surgical Test: Extract & Validate Genesis Only
#
# This script proves the extraction system works end-to-end on ONE book.
# One proven book > 103 unproven books.
#

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        Genesis Extraction - Surgical Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INPUT_PDF="$PROJECT_ROOT/scripts/scripture-extraction/input/yahscriptures.pdf"
OUTPUT_DIR="$SCRIPT_DIR/test-output/genesis-$(date +%Y%m%d-%H%M%S)"
CANONICAL_STRUCTURE="$SCRIPT_DIR/scripture-extraction/canonical-structure.json"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}📂 Setup${NC}"
echo "  Input PDF: $INPUT_PDF"
echo "  Output: $OUTPUT_DIR"
echo "  Canonical: $CANONICAL_STRUCTURE"
echo ""

# Check dependencies
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ python3 not found${NC}"
    exit 1
fi

if ! python3 -c "import pdfplumber" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  pdfplumber not installed. Installing...${NC}"
    pip3 install pdfplumber
fi

echo -e "${GREEN}✅ Dependencies OK${NC}\n"

# Step 1: Extract Genesis
echo -e "${YELLOW}📖 Step 1: Extract Genesis from PDF${NC}"
echo "  This may take 2-5 minutes for a 13MB PDF..."
echo ""

# Use v3 extractor directly
EXTRACTOR_SCRIPT="$SCRIPT_DIR/unified-extraction/scripture-extractor-v3.py"

# Check if extractor exists
if [ ! -f "$EXTRACTOR_SCRIPT" ]; then
    echo -e "${RED}❌ Extractor script not found: $EXTRACTOR_SCRIPT${NC}"
    exit 1
fi

# Run extraction with v3 extractor
echo "   Using v3 extractor (2-pass with validation gates)..."
if python3 "$EXTRACTOR_SCRIPT" "$INPUT_PDF" "$OUTPUT_DIR"; then
    echo -e "${GREEN}✅ Extraction completed${NC}\n"
    
    # Check validation gate report
    if [ -f "$OUTPUT_DIR/validation-gate-report.json" ]; then
        VALIDATION_PASSED=$(jq -r '.passed' "$OUTPUT_DIR/validation-gate-report.json" 2>/dev/null || echo "false")
        if [ "$VALIDATION_PASSED" != "true" ]; then
            echo -e "${RED}❌ Validation gate failed!${NC}"
            echo "   Review: $OUTPUT_DIR/validation-gate-report.json"
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ Extraction failed${NC}"
    exit 1
fi

# Step 2: Validate with validation gate
echo -e "${YELLOW}🔍 Step 2: Validate extracted Genesis (Validation Gate)${NC}"

VALIDATION_GATE="$SCRIPT_DIR/unified-extraction/validation-gate.py"
if [ -f "$VALIDATION_GATE" ]; then
    if python3 "$VALIDATION_GATE" "$OUTPUT_DIR/works.json" "$OUTPUT_DIR" "$CANONICAL_STRUCTURE"; then
        VALIDATION_EXIT=$?
        if [ $VALIDATION_EXIT -eq 0 ]; then
            echo -e "${GREEN}✅ Validation Gate PASSED${NC}\n"
        elif [ $VALIDATION_EXIT -eq 2 ]; then
            echo -e "${YELLOW}⚠️  Validation Gate PASSED with warnings${NC}\n"
        else
            echo -e "${RED}❌ Validation Gate FAILED${NC}\n"
            exit 1
        fi
    else
        echo -e "${RED}❌ Validation Gate execution failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Validation gate script not found, skipping${NC}"
fi

# Also run TypeScript validator if available
if command -v npx &> /dev/null && command -v tsx &> /dev/null && [ -f "$OUTPUT_DIR/genesis-extracted.json" ]; then
    echo -e "${YELLOW}🔍 Running TypeScript validator...${NC}"
    npx tsx "$SCRIPT_DIR/scripture-extraction/scripture-validator.ts" "$OUTPUT_DIR/genesis-extracted.json" > "$OUTPUT_DIR/validation-report.txt" 2>&1 || true
fi

echo ""

# Step 3: Generate Report
echo -e "${YELLOW}📊 Step 3: Generate Summary Report${NC}"

# Count verses from works.json and verse chunks
if [ -f "$OUTPUT_DIR/works.json" ]; then
    GENESIS_WORK=$(jq '.[] | select(.workId == "yah-gen")' "$OUTPUT_DIR/works.json")
    VERSE_COUNT=$(echo "$GENESIS_WORK" | jq '.totalVerses // 0' 2>/dev/null || echo "0")
    CHAPTER_COUNT=$(echo "$GENESIS_WORK" | jq '.totalChapters // 0' 2>/dev/null || echo "0")
    
    # Also count from actual verse files
    VERSE_COUNT_FILES=$(jq -s 'flatten | [.[] | select(.work == "yah-gen")] | length' "$OUTPUT_DIR"/verses_chunk_*.json 2>/dev/null || echo "0")

    cat > "$OUTPUT_DIR/SUMMARY.md" << EOF
# Genesis Extraction Test - Summary

**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**Input:** $INPUT_PDF
**Output:** $OUTPUT_DIR

---

## Results

### Extraction
- ✅ Extraction completed
- **Chapters found:** $CHAPTER_COUNT (expected: 50)
- **Verses found:** $VERSE_COUNT (expected: 1,533)

### Validation
$(if [ -f "$OUTPUT_DIR/validation-gate-report.json" ]; then
    jq -r '.errors[]?, .warnings[]?' "$OUTPUT_DIR/validation-gate-report.json" 2>/dev/null | sed 's/^/- /' || echo "No validation gate report"
else
    cat "$OUTPUT_DIR/validation-report.txt" 2>/dev/null || echo "Validation not run"
fi)

---

## Next Steps

1. **Manual Review:** Open $OUTPUT_DIR/genesis-extracted.json
2. **Word-for-word check:** Compare first 10 verses against source PDF
3. **Check formatting:** Verify poetry/line breaks preserved
4. **Check edge cases:**
   - Headers/footers excluded?
   - Footnotes handled correctly?
   - Chapter transitions clean?

5. **If validation passes:** Run import script
6. **If validation fails:** Review extraction-log.json for debugging

---

## Files Generated

\`\`\`
$OUTPUT_DIR/
├── genesis-extracted.json       # Extracted verses
├── extraction-log.json          # Decision log (why each verse was included)
├── validation-report.txt        # Canonical structure validation
├── extract-genesis.py           # Extraction script (generated)
└── SUMMARY.md                   # This file
\`\`\`

---

## Expected Canonical Structure (Genesis)

- **Chapters:** 50
- **Total Verses:** 1,533
- **Chapter 1:** 31 verses
- **Chapter 50:** 26 verses

### Verse Count Per Chapter
\`\`\`json
$(jq '.GEN.verses' "$CANONICAL_STRUCTURE" 2>/dev/null)
\`\`\`

---

## Proof Checklist

- [ ] Verse count matches (1,533)
- [ ] Chapter count matches (50)
- [ ] No duplicates
- [ ] No gaps in sequence
- [ ] Chapter 1, verse 1 starts correctly
- [ ] Chapter 50, verse 26 ends correctly
- [ ] Headers/footers excluded
- [ ] Formatting preserved
- [ ] Validation passes all tests

Once this checklist is ✅, Genesis is **proven**.

EOF

    cat "$OUTPUT_DIR/SUMMARY.md"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}        Test Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📁 Output directory:${NC} $OUTPUT_DIR"
echo -e "${BLUE}📄 Summary:${NC} $OUTPUT_DIR/SUMMARY.md"
echo ""

if [ "$VERSE_COUNT" == "1533" ] && [ "$CHAPTER_COUNT" == "50" ]; then
    echo -e "${GREEN}🎉 SUCCESS! Counts match canonical structure!${NC}"
else
    echo -e "${YELLOW}⚠️  Counts don't match. Expected: 50 chapters, 1533 verses. Got: $CHAPTER_COUNT chapters, $VERSE_COUNT verses.${NC}"
    echo -e "${YELLOW}   Review extraction log and validator output.${NC}"
fi

echo ""
