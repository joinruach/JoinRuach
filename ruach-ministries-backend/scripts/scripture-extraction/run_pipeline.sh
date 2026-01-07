#!/usr/bin/env bash
##
## YAH Scriptures Complete Extraction Pipeline
##
## This script orchestrates the full 4-layer pipeline:
##   1. SOURCE   (.bbli)           → immutable truth
##   2. EXTRACT  (JSONL)           → reproducible export
##   3. PATCH    (patched JSONL)   → surgical fixes with audit trail
##   4. INGEST   (Strapi JSON)     → production-ready payloads
##
## Usage:
##   ./scripts/scripture-extraction/run_pipeline.sh [--dry-run] [--skip-validation]
##

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_DIR="${ROOT_DIR}/scripts/scripture-extraction"
PIPELINE_DIR="${ROOT_DIR}/scripture-pipeline"

SOURCE_DIR="${PIPELINE_DIR}/sources/yah"
EXPORT_DIR="${PIPELINE_DIR}/exports/yah/v1"
INGEST_DIR="${PIPELINE_DIR}/ingest/yah/v1"
PATCH_DIR="${PIPELINE_DIR}/patches/yah/v1"

# Source file (adjust path to your .bbli location)
BBLI_SOURCE="${SCRIPT_DIR}/input/YSpc1.04.bbli"

# Output files
EXPORT_JSONL="${EXPORT_DIR}/yahscriptures-full.jsonl"
PATCHED_JSONL="${EXPORT_DIR}/yahscriptures-patched.jsonl"
PATCHES_JSON="${PATCH_DIR}/patches.json"
PATCH_LOG="${PATCH_DIR}/patch-log.jsonl"

# Flags
DRY_RUN=0
SKIP_VALIDATION=0

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --skip-validation)
      SKIP_VALIDATION=1
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--dry-run] [--skip-validation]"
      exit 1
      ;;
  esac
done

# Helper functions
log_step() {
  echo -e "${BLUE}==>${NC} $1"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  YAH Scriptures Complete Extraction Pipeline                  ║"
echo "║  4-Layer Architecture: SOURCE → EXPORT → PATCH → INGEST       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [[ $DRY_RUN -eq 1 ]]; then
  log_warning "DRY RUN MODE - No files will be modified"
  echo ""
fi

# Step 1: Verify source .bbli exists
log_step "STEP 1: Verify source .bbli file"

if [[ ! -f "${BBLI_SOURCE}" ]]; then
  log_error "Source .bbli not found: ${BBLI_SOURCE}"
  log_error "Please place YSpc1.04.bbli in ${SCRIPT_DIR}/input/"
  exit 1
fi

log_success "Found source: ${BBLI_SOURCE}"

# Create checksum
CHECKSUM=$(shasum -a 256 "${BBLI_SOURCE}" | awk '{print $1}')
log_success "SHA256: ${CHECKSUM}"

# Copy to sources/ (if not already there)
if [[ ! -f "${SOURCE_DIR}/YSpc1.04.bbli" ]]; then
  log_step "Copying source to ${SOURCE_DIR}/"
  mkdir -p "${SOURCE_DIR}"
  if [[ $DRY_RUN -eq 0 ]]; then
    cp "${BBLI_SOURCE}" "${SOURCE_DIR}/"
    echo "${CHECKSUM}  YSpc1.04.bbli" > "${SOURCE_DIR}/SHA256SUMS.txt"
    log_success "Source archived"
  fi
else
  log_success "Source already archived"
fi

echo ""

# Step 2: Export .bbli → JSONL
log_step "STEP 2: Export .bbli to JSONL"

mkdir -p "${EXPORT_DIR}"

if [[ $DRY_RUN -eq 0 ]]; then
  python3 "${SCRIPT_DIR}/export-bbli.py" \
    --db "${BBLI_SOURCE}" \
    --out "${EXPORT_JSONL}"

  if [[ ! -f "${EXPORT_JSONL}" ]]; then
    log_error "Export failed - JSONL not created"
    exit 1
  fi

  log_success "Exported to ${EXPORT_JSONL}"
else
  log_warning "Skipping export (dry run)"
fi

echo ""

# Step 3: Apply patches
log_step "STEP 3: Apply surgical patches"

if [[ ! -f "${PATCHES_JSON}" ]]; then
  log_warning "No patches.json found - creating empty patch set"
  mkdir -p "${PATCH_DIR}"
  echo '{"version":"1.0.0","patches":[]}' > "${PATCHES_JSON}"
fi

if [[ $DRY_RUN -eq 0 ]]; then
  python3 "${SCRIPT_DIR}/apply_patches.py" \
    --in "${EXPORT_JSONL}" \
    --patches "${PATCHES_JSON}" \
    --out "${PATCHED_JSONL}" \
    --log "${PATCH_LOG}"

  if [[ ! -f "${PATCHED_JSONL}" ]]; then
    log_error "Patch application failed"
    exit 1
  fi

  log_success "Patched JSONL created: ${PATCHED_JSONL}"
else
  python3 "${SCRIPT_DIR}/apply_patches.py" \
    --in "${EXPORT_JSONL}" \
    --patches "${PATCHES_JSON}" \
    --out "${PATCHED_JSONL}" \
    --log "${PATCH_LOG}" \
    --dry-run
fi

echo ""

# Step 4: Convert to Strapi format
log_step "STEP 4: Convert to Strapi-ready JSON"

mkdir -p "${INGEST_DIR}/verses"

if [[ $DRY_RUN -eq 0 ]]; then
  python3 "${SCRIPT_DIR}/jsonl_to_strapi.py" \
    --in "${PATCHED_JSONL}" \
    --out "${INGEST_DIR}" \
    --chunk 2000

  if [[ ! -f "${INGEST_DIR}/works.json" ]]; then
    log_error "Conversion failed - works.json not created"
    exit 1
  fi

  log_success "Strapi payloads created in ${INGEST_DIR}/"
else
  log_warning "Skipping conversion (dry run)"
fi

echo ""

# Step 5: Validation
if [[ $SKIP_VALIDATION -eq 0 ]]; then
  log_step "STEP 5: Run full validation"

  if [[ $DRY_RUN -eq 0 ]]; then
    # Check if canonical-structure.json exists
    CANONICAL_STRUCTURE="${SCRIPT_DIR}/canonical-structure.json"

    if [[ -f "${CANONICAL_STRUCTURE}" ]]; then
      python3 "${SCRIPT_DIR}/validate_strapi_dump.py" \
        --dir "${INGEST_DIR}" \
        --canonical "${CANONICAL_STRUCTURE}"
    else
      log_warning "canonical-structure.json not found, skipping canonical validation"
      python3 "${SCRIPT_DIR}/validate_strapi_dump.py" \
        --dir "${INGEST_DIR}"
    fi

    log_success "Validation passed!"
  else
    log_warning "Skipping validation (dry run)"
  fi
else
  log_warning "Skipping validation (--skip-validation flag)"
fi

echo ""

# Final summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  PIPELINE COMPLETE                                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
log_success "Layer 1 (SOURCE):  ${SOURCE_DIR}/YSpc1.04.bbli"
log_success "Layer 2 (EXPORT):  ${EXPORT_JSONL}"
log_success "Layer 3 (PATCHED): ${PATCHED_JSONL}"
log_success "Layer 4 (INGEST):  ${INGEST_DIR}/"
echo ""
echo "Next steps:"
echo "  1. Review validation report: ${INGEST_DIR}/validation-report.json"
echo "  2. Import to Strapi using unified-ingestion-queue"
echo "  3. Verify in Strapi admin panel"
echo ""

if [[ $DRY_RUN -eq 1 ]]; then
  log_warning "This was a DRY RUN - no files were modified"
  echo "Run without --dry-run to execute for real"
fi

log_success "Pipeline execution complete! 🎉"
