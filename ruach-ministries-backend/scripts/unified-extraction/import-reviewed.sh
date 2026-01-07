#!/bin/bash
###############################################################################
# Import Reviewed Content to Strapi
# Only imports content that has been manually reviewed and approved
###############################################################################

set -e  # Exit on first error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
OUTPUT_DIR="${1}"
REVIEW_STATUS_FILE="./unified-extraction/review-status.json"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Import Reviewed Content to Strapi            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Validate inputs
if [ -z "$OUTPUT_DIR" ]; then
    echo -e "${RED}Error: OUTPUT_DIR required${NC}"
    echo ""
    echo "Usage: $0 <output-dir>"
    echo ""
    echo "Example:"
    echo "  $0 ./output/scripture-20260106-123456"
    echo ""
    exit 1
fi

if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${RED}Error: Output directory not found: $OUTPUT_DIR${NC}"
    exit 1
fi

if [ ! -f "$REVIEW_STATUS_FILE" ]; then
    echo -e "${RED}Error: Review status file not found: $REVIEW_STATUS_FILE${NC}"
    echo ""
    echo "Have you completed the manual review?"
    echo "Review interface: http://localhost:4000"
    echo ""
    exit 1
fi

echo -e "${GREEN}Output Dir:${NC} $OUTPUT_DIR"
echo -e "${GREEN}Review Status:${NC} $REVIEW_STATUS_FILE"
echo ""

###############################################################################
# CHECK REVIEW STATUS
###############################################################################

echo -e "${BLUE}[1/4]${NC} ${YELLOW}Checking review status...${NC}"

# Count approved books
APPROVED_COUNT=$(jq '[.[] | select(.status == "approved")] | length' "$REVIEW_STATUS_FILE")
REJECTED_COUNT=$(jq '[.[] | select(.status == "rejected")] | length' "$REVIEW_STATUS_FILE")
PENDING_COUNT=$(jq '[.[] | select(.status == "pending")] | length' "$REVIEW_STATUS_FILE")
TOTAL_COUNT=$(jq 'length' "$REVIEW_STATUS_FILE")

echo -e "${GREEN}✓ Review status loaded${NC}"
echo ""
echo -e "${YELLOW}Review Summary:${NC}"
echo -e "   Total Books:    $TOTAL_COUNT"
echo -e "   ${GREEN}Approved:${NC}       $APPROVED_COUNT"
echo -e "   ${RED}Rejected:${NC}       $REJECTED_COUNT"
echo -e "   ${YELLOW}Pending:${NC}        $PENDING_COUNT"
echo ""

# Check if any books are approved
if [ "$APPROVED_COUNT" -eq 0 ]; then
    echo -e "${RED}✗ No books approved for import${NC}"
    echo ""
    echo "Please review and approve books before importing:"
    echo "  http://localhost:4000"
    echo ""
    exit 1
fi

# Warn if there are pending/rejected books
if [ "$PENDING_COUNT" -gt 0 ] || [ "$REJECTED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Warning: $((PENDING_COUNT + REJECTED_COUNT)) books will be skipped${NC}"
    echo ""
    read -p "Continue with import? (yes/no) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Import cancelled${NC}"
        exit 0
    fi
fi

###############################################################################
# PREPARE FOR IMPORT
###############################################################################

echo -e "${BLUE}[2/4]${NC} ${YELLOW}Preparing import...${NC}"

# Check Strapi environment
if [ -z "$STRAPI_URL" ]; then
    echo -e "${YELLOW}⚠ STRAPI_URL not set, using default: http://localhost:1337${NC}"
    export STRAPI_URL="http://localhost:1337"
fi

if [ -z "$STRAPI_API_TOKEN" ]; then
    echo -e "${RED}✗ STRAPI_API_TOKEN not set${NC}"
    echo ""
    echo "Set your Strapi API token:"
    echo "  export STRAPI_API_TOKEN=your_token_here"
    echo ""
    echo "Create a token at:"
    echo "  $STRAPI_URL/admin/settings/api-tokens"
    echo ""
    exit 1
fi

# Test Strapi connection
echo -n "Testing Strapi connection... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $STRAPI_API_TOKEN" \
    "$STRAPI_URL/api/users/me")

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo "Check your STRAPI_URL and STRAPI_API_TOKEN"
    exit 1
fi

echo -e "${GREEN}✓ Connected${NC}"
echo ""

###############################################################################
# DETECT CONTENT TYPE
###############################################################################

echo -e "${BLUE}[3/4]${NC} ${YELLOW}Detecting content type...${NC}"

CONTENT_TYPE="unknown"

if [ -f "$OUTPUT_DIR/works.json" ]; then
    CONTENT_TYPE="scripture"
elif [ -f "$OUTPUT_DIR/canon-bundle.json" ]; then
    CONTENT_TYPE="canon"
elif [ -f "$OUTPUT_DIR/chunks.json" ]; then
    CONTENT_TYPE="library"
fi

echo -e "${GREEN}✓ Detected content type:${NC} $CONTENT_TYPE"
echo ""

###############################################################################
# IMPORT TO STRAPI
###############################################################################

echo -e "${BLUE}[4/4]${NC} ${YELLOW}Importing to Strapi...${NC}"
echo ""

case "$CONTENT_TYPE" in
    scripture)
        echo -e "${YELLOW}→ Importing Scripture (approved books only)...${NC}"
        pnpm tsx scripture-extraction/import-to-strapi-reviewed.ts \
            "$OUTPUT_DIR" \
            "$REVIEW_STATUS_FILE"

        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ Scripture import failed${NC}"
            exit 1
        fi
        ;;

    canon)
        echo -e "${YELLOW}→ Importing Canon (EGW)...${NC}"
        pnpm tsx canon-parser/canon-strapi-import.ts \
            "$OUTPUT_DIR/canon-bundle.json"

        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ Canon import failed${NC}"
            exit 1
        fi
        ;;

    library)
        echo -e "${YELLOW}→ Importing Library content...${NC}"
        # Library import via BullMQ queue
        node -e "
        const { enqueueIngestion } = require('./services/unified-ingestion-queue');
        enqueueIngestion({
            contentType: 'library',
            sourceId: 'import-$(date +%s)',
            versionId: '$(basename $OUTPUT_DIR)',
            fileUrl: '$OUTPUT_DIR',
            fileType: 'processed',
            libraryParams: {
                maxChars: 800,
                maxTokens: 200,
                includeToc: true,
                enableEmbeddings: true
            }
        }).then(() => console.log('✓ Enqueued for import'))
          .catch(err => { console.error('✗ Failed:', err); process.exit(1); });
        "

        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ Library import failed${NC}"
            exit 1
        fi
        ;;

    *)
        echo -e "${RED}✗ Unknown content type${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✓ Import complete${NC}"
echo ""

###############################################################################
# VERIFICATION
###############################################################################

echo -e "${BLUE}Verifying import...${NC}"
echo ""

case "$CONTENT_TYPE" in
    scripture)
        # Count imported works
        IMPORTED_COUNT=$(curl -s \
            -H "Authorization: Bearer $STRAPI_API_TOKEN" \
            "$STRAPI_URL/api/scripture-works?pagination[pageSize]=1" \
            | jq '.meta.pagination.total')

        echo -e "${YELLOW}Total scripture works in database:${NC} $IMPORTED_COUNT"

        # Count verses
        VERSE_COUNT=$(curl -s \
            -H "Authorization: Bearer $STRAPI_API_TOKEN" \
            "$STRAPI_URL/api/scripture-verses?pagination[pageSize]=1" \
            | jq '.meta.pagination.total')

        echo -e "${YELLOW}Total verses in database:${NC} $VERSE_COUNT"
        ;;

    canon)
        # Count guidebook nodes
        NODE_COUNT=$(curl -s \
            -H "Authorization: Bearer $STRAPI_API_TOKEN" \
            "$STRAPI_URL/api/guidebook-nodes?pagination[pageSize]=1" \
            | jq '.meta.pagination.total')

        echo -e "${YELLOW}Total guidebook nodes in database:${NC} $NODE_COUNT"
        ;;

    library)
        echo -e "${YELLOW}→ Library content queued for async processing${NC}"
        echo -e "${YELLOW}→ Check queue status in Strapi admin${NC}"
        ;;
esac

echo ""

###############################################################################
# SUMMARY
###############################################################################

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Import Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo -e "   Content Type:   $CONTENT_TYPE"
echo -e "   Approved:       $APPROVED_COUNT books"
echo -e "   Imported:       ✓"
echo ""
echo -e "${YELLOW}Strapi Admin:${NC}"
echo -e "   $STRAPI_URL/admin"
echo ""
echo -e "${YELLOW}Cleanup:${NC}"
echo -e "   • Keep extraction: $OUTPUT_DIR"
echo -e "   • Review status:   $REVIEW_STATUS_FILE"
echo ""
echo -e "${GREEN}🎉 Content successfully imported to Strapi!${NC}"
echo ""
