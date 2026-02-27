#!/usr/bin/env bash
# Phase 6 Golden Run Verifier
# Compares deterministic operation outputs against pinned expected hashes
# Exit 0 = all golden runs match, non-zero = drift detected
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

FIXTURES_DIR="tests/fixtures"
GOLDEN_DIR="golden-runs"
DIFF_DIR="/tmp/golden-diffs"

mkdir -p "$DIFF_DIR"

PASS=0
FAIL=0
SKIP=0

echo "==> Phase 6 Golden Run Verification"
echo ""

# --- Helper ---
check_golden() {
  local name="$1" expected_file="$2" actual_command="$3"

  echo "--- Golden Run: $name ---"

  if [[ ! -f "$expected_file" ]]; then
    echo "  SKIP: Expected file not found: $expected_file"
    echo "  (Create this file when the golden run is first captured)"
    SKIP=$((SKIP + 1))
    echo ""
    return
  fi

  # Generate actual output
  local actual_file="$DIFF_DIR/${name}-actual.json"
  if ! eval "$actual_command" > "$actual_file" 2>/dev/null; then
    echo "  FAIL: Command failed: $actual_command"
    FAIL=$((FAIL + 1))
    echo ""
    return
  fi

  # Compare
  if diff -u "$expected_file" "$actual_file" > "$DIFF_DIR/${name}.diff" 2>&1; then
    echo "  PASS: Output matches expected"
    rm -f "$DIFF_DIR/${name}.diff"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: Output differs from expected"
    echo "  Diff saved to: $DIFF_DIR/${name}.diff"
    echo "  Expected: $expected_file"
    echo "  Actual:   $actual_file"
    echo ""
    echo "  If this change is intentional, update the expected file:"
    echo "    cp $actual_file $expected_file"
    FAIL=$((FAIL + 1))
  fi
  echo ""
}

# --- Golden Render Run ---
# Verifies: known EDL input → known output metadata hash
# Uses pnpm script if available, otherwise skips
if [[ -f "$FIXTURES_DIR/golden-render-expected.json" ]]; then
  check_golden "render" \
    "$FIXTURES_DIR/golden-render-expected.json" \
    "pnpm --silent -w run golden:render 2>/dev/null || echo '{\"status\": \"script-not-configured\"}'"
else
  echo "--- Golden Run: render ---"
  echo "  SKIP: $FIXTURES_DIR/golden-render-expected.json not yet created"
  echo "  Create this after Stage 1 Render Foundation is complete."
  SKIP=$((SKIP + 1))
  echo ""
fi

# --- Golden Assembly Run ---
# Verifies: known sync offsets → deterministic EDL cut list
if [[ -f "$FIXTURES_DIR/golden-assembly-expected.json" ]]; then
  check_golden "assembly" \
    "$FIXTURES_DIR/golden-assembly-expected.json" \
    "pnpm --silent -w run golden:assembly 2>/dev/null || echo '{\"status\": \"script-not-configured\"}'"
else
  echo "--- Golden Run: assembly ---"
  echo "  SKIP: $FIXTURES_DIR/golden-assembly-expected.json not yet created"
  echo "  Create this after Stage 2 Intelligent Assembly is complete."
  SKIP=$((SKIP + 1))
  echo ""
fi

# --- Golden Formation Run ---
# Verifies: known event log → deterministic FormationState rebuild
if [[ -f "$FIXTURES_DIR/golden-formation-expected.json" ]]; then
  check_golden "formation" \
    "$FIXTURES_DIR/golden-formation-expected.json" \
    "pnpm --silent -w run golden:formation 2>/dev/null || echo '{\"status\": \"script-not-configured\"}'"
else
  echo "--- Golden Run: formation ---"
  echo "  SKIP: $FIXTURES_DIR/golden-formation-expected.json not yet created"
  echo "  Create this after Stage 3 Formation Intelligence is complete."
  SKIP=$((SKIP + 1))
  echo ""
fi

# --- Document Structure Verification ---
# Lightweight: verify key anchors exist in docs (prevents accidental section deletion)
echo "--- Document Structure: key sections ---"
DOC_CHECKS_PASS=true

check_anchor() {
  local file="$1" anchor="$2"
  if [[ -f "$file" ]] && grep -q "$anchor" "$file"; then
    echo "  OK: $file contains '$anchor'"
  elif [[ -f "$file" ]]; then
    echo "  WARN: $file missing section '$anchor'"
    DOC_CHECKS_PASS=false
  fi
}

check_anchor "docs/phase-6-architecture.md" "Failure Isolation"
check_anchor "docs/phase-6-architecture.md" "Idempotency Guarantees"
check_anchor "docs/phase-6-architecture.md" "Canonical ID Registry"
check_anchor "docs/phase-6-architecture.md" "DLQ Triage Playbook"
check_anchor "docs/phase-6-architecture.md" "Operator Recovery Commands"
check_anchor "docs/phase-6-architecture.md" "DecisionResult"
check_anchor "docs/launch-readiness-checklist.md" "Chaos Scenarios"
check_anchor "docs/launch-readiness-checklist.md" "Brownout Drill"
check_anchor "docs/launch-readiness-checklist.md" "Golden Proof Runs"
check_anchor "docs/launch-readiness-checklist.md" "Go / No-Go"
check_anchor "docs/phase-6-non-negotiables.md" "CI Enforcement"
check_anchor "docs/studio-automation-roadmap.md" "Formation Versioning"

if [[ "$DOC_CHECKS_PASS" == true ]]; then
  echo "  All document anchors present."
else
  echo "  Some document sections missing — review docs for accidental deletion."
fi
echo ""

# --- Summary ---
echo "========================================"
echo "  Phase 6 Golden Run Verification"
echo "========================================"
echo "  Pass: $PASS"
echo "  Fail: $FAIL"
echo "  Skip: $SKIP (fixture files not yet created)"
echo "========================================"

# Collect diffs for CI artifact upload
if ls "$DIFF_DIR"/*.diff 1>/dev/null 2>&1; then
  echo ""
  echo "Diff files saved to $DIFF_DIR/ for inspection."
fi

if [[ $FAIL -gt 0 ]]; then
  echo ""
  echo "Golden verify: FAIL ($FAIL mismatch(es))"
  echo "If changes are intentional, update the expected fixtures."
  exit 1
fi

echo ""
if [[ $SKIP -gt 0 ]]; then
  echo "Golden verify: PASS ($SKIP skipped — fixtures not yet captured)"
else
  echo "Golden verify: PASS"
fi
exit 0
