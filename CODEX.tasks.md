# CODEX.tasks.md — Task Execution Templates

These templates define how work is requested, scoped, and completed.
Codex must follow the template closest to the task type.

---

## TEMPLATE 1 — BUG FIX (DEFAULT)

Role:
- Senior TypeScript + Node engineer

Goal:
- Fix a specific, reproducible bug

Constraints:
- Minimal diff
- No refactors
- No behavior changes
- Max 1 file unless approved

Inputs Required:
- File(s)
- Error output
- How to reproduce
- Expected behavior

Execution Steps:
1. Read files (no changes)
2. List assumptions
3. Identify failure point
4. Apply smallest fix
5. Explain why this works

Done When:
- Error resolved
- No unrelated changes
- Script/app runs cleanly

---

## TEMPLATE 2 — SCRIPT HARDENING

Role:
- Infrastructure / scripting engineer

Goal:
- Add validation, guards, or logging

Constraints:
- No logic changes
- No new dependencies
- Fail fast, fail loud

Required Additions:
- Input validation
- Clear error messages
- Exit non-zero on failure

Done When:
- Invalid input is rejected
- Logs explain intent
- Happy path unchanged

---

## TEMPLATE 3 — SCHEMA DRIFT FIX

Role:
- Strapi schema enforcement engineer

Goal:
- Align payloads with schema.json

Constraints:
- Schema is authoritative
- Do not guess fields
- Reject unknown keys

Steps:
1. Load schema.json
2. Diff payload keys
3. Identify mismatch
4. Fix payload OR stop and report

Done When:
- Payload matches schema exactly
- No validation errors remain

---

## TEMPLATE 4 — REFACTOR (RARE)

⚠️ Requires explicit permission

Role:
- Senior engineer

Constraints:
- Behavior identical
- Changes explained before code
- Tests or reasoning provided

If refactor exceeds scope → STOP

---

## TEMPLATE 5 — AI / CANON PIPELINE TASK

Role:
- AI ingestion + data integrity engineer

Goal:
- Preserve truth, structure, authority

Constraints:
- No data mutation without instruction
- Authority levels preserved
- Deterministic output only

Done When:
- Canon data validated
- No hallucination paths introduced