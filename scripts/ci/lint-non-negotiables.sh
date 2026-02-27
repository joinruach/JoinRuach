#!/usr/bin/env bash
# Phase 6 Non-Negotiables CI Linter
# Enforces: docs/phase-6-non-negotiables.md principles via regex checks
# Exit 0 = pass, non-zero = fail
# Severity: ERROR = block merge, WARNING = report only
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

# Domain code paths (where non-negotiable rules apply)
DOMAIN_PATHS=(
  "apps/ruach-next/src/features"
  "apps/ruach-next/src/lib/studio"
  "ruach-ministries-backend/src/api"
  "ruach-ministries-backend/src/services"
  "packages/ruach-formation/src"
)

# Build grep path args (only include paths that exist)
SEARCH_PATHS=()
for p in "${DOMAIN_PATHS[@]}"; do
  if [[ -d "$p" ]]; then
    SEARCH_PATHS+=("$p")
  fi
done

if [[ ${#SEARCH_PATHS[@]} -eq 0 ]]; then
  echo "No domain paths found. Skipping lint."
  echo "Non-Negotiables lint: PASS (no domain code)"
  exit 0
fi

ERRORS=0
WARNINGS=0

# --- Helper ---
report() {
  local severity="$1" principle="$2" file="$3" line="$4" detail="$5"
  if [[ "$severity" == "ERROR" ]]; then
    echo "::error file=$file,line=$line::[$principle] $detail"
    ERRORS=$((ERRORS + 1))
  else
    echo "::warning file=$file,line=$line::[$principle] $detail"
    WARNINGS=$((WARNINGS + 1))
  fi
}

echo "==> Phase 6 Non-Negotiables Lint"
echo "    Scanning: ${SEARCH_PATHS[*]}"
echo ""

# --- Required docs exist ---
echo "--- Checking required documents ---"
REQUIRED_DOCS=(
  "docs/phase-6-non-negotiables.md"
  "docs/phase-6-architecture.md"
  "docs/launch-readiness-checklist.md"
  "docs/studio-automation-roadmap.md"
)
for doc in "${REQUIRED_DOCS[@]}"; do
  if [[ ! -f "$doc" ]]; then
    echo "::error::Missing required document: $doc"
    ERRORS=$((ERRORS + 1))
  else
    echo "  OK: $doc"
  fi
done
echo ""

# --- Principle 1: No Silent Failures (empty catch blocks) ---
echo "--- [P1] No Silent Failures: empty catch blocks ---"
# Match: catch (...) { } with nothing meaningful inside
# Skip lines with non-negotiable override comments
while IFS=: read -r file line_num content; do
  # Check if there's an override comment nearby
  if ! grep -q "non-negotiable:" <<< "$content"; then
    report "ERROR" "P1-no-silent-failures" "$file" "$line_num" \
      "Empty catch block. Every error must produce a log entry + state transition + recovery path."
  fi
done < <(grep -rn --include="*.ts" --include="*.tsx" \
  -P 'catch\s*\([^)]*\)\s*\{\s*\}' "${SEARCH_PATHS[@]}" 2>/dev/null || true)
echo ""

# --- Principle 2: Render job traceability (correlationId in render services) ---
echo "--- [P2] Render Traceability: correlationId in render services ---"
for f in $(find "${SEARCH_PATHS[@]}" -name "*render*service*" -o -name "*render*worker*" 2>/dev/null | grep -E '\.ts$'); do
  if ! grep -q "correlationId" "$f"; then
    report "ERROR" "P2-render-traceability" "$f" "1" \
      "Render service/worker missing correlationId. Every render job must be traceable from enqueue to completion."
  fi
done
echo ""

# --- Principle 3: No hardcoded environment logic ---
echo "--- [P3] No Hardcoded Env Logic: NODE_ENV branching in domain code ---"
while IFS=: read -r file line_num content; do
  if ! grep -q "non-negotiable:" <<< "$content"; then
    report "ERROR" "P3-no-env-branching" "$file" "$line_num" \
      "NODE_ENV branching in domain code. Environment configures infrastructure, not business logic."
  fi
done < <(grep -rn --include="*.ts" --include="*.tsx" \
  -P "process\.env\.NODE_ENV\s*===\s*['\"]production['\"]" "${SEARCH_PATHS[@]}" 2>/dev/null || true)
echo ""

# --- Principle 6: No scope creep (ML/prediction imports) ---
echo "--- [P6] No Scope Creep: ML/prediction imports ---"
SCOPE_PATTERNS=(
  "@tensorflow"
  "brain\.js"
  "ml-regression"
  "synaptic"
  "onnxruntime"
)
for pattern in "${SCOPE_PATTERNS[@]}"; do
  while IFS=: read -r file line_num content; do
    report "ERROR" "P6-no-scope-creep" "$file" "$line_num" \
      "ML/prediction library import detected ($pattern). Phase 6 is deterministic only."
  done < <(grep -rn --include="*.ts" --include="*.tsx" "$pattern" "${SEARCH_PATHS[@]}" 2>/dev/null || true)
done
echo ""

# --- Principle 8: No cross-pillar imports ---
echo "--- [P8] Failure Isolation: cross-pillar imports ---"
# Render must not import from formation
for f in $(find "${SEARCH_PATHS[@]}" -path "*/render/*" -name "*.ts" 2>/dev/null); do
  while IFS=: read -r file line_num content; do
    if ! grep -q "non-negotiable:" <<< "$content"; then
      report "WARNING" "P8-cross-pillar" "$file" "$line_num" \
        "Render code imports from formation. Pillars must interact via events only."
    fi
  done < <(grep -n "from.*formation" "$f" 2>/dev/null | grep -v "types\|shared\|events" || true)
done
# Formation must not import from render
for f in $(find "${SEARCH_PATHS[@]}" -path "*/formation/*" -name "*.ts" 2>/dev/null); do
  while IFS=: read -r file line_num content; do
    if ! grep -q "non-negotiable:" <<< "$content"; then
      report "WARNING" "P8-cross-pillar" "$file" "$line_num" \
        "Formation code imports from render. Pillars must interact via events only."
    fi
  done < <(grep -n "from.*render" "$f" 2>/dev/null | grep -v "types\|shared\|events" || true)
done
echo ""

# --- Summary ---
echo "========================================"
echo "  Phase 6 Non-Negotiables Lint Results"
echo "========================================"
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"
echo "========================================"

if [[ $ERRORS -gt 0 ]]; then
  echo ""
  echo "Non-Negotiables lint: FAIL ($ERRORS error(s))"
  echo "Fix all ERROR violations before merging."
  echo "Override with: // non-negotiable: [principle] — [justification]"
  exit 1
fi

echo ""
echo "Non-Negotiables lint: PASS"
if [[ $WARNINGS -gt 0 ]]; then
  echo "($WARNINGS warning(s) — review recommended)"
fi
exit 0
