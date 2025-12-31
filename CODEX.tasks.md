# CODEX.tasks.md — Task Execution Templates

These templates define how work is requested, scoped, and completed.
Codex must follow the template closest to the task type.

## ⚡ GLOBAL EXECUTION RULES

These rules apply to ALL task templates.

- If a concrete error or failure is present, execution is mandatory.
- Analysis without action is forbidden when an allowed fix exists.
- Tasks must follow the READ → ACT → VERIFY loop.
- Only the minimum unblock is permitted unless explicit permission is granted.

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
1. READ the error output verbatim
2. Inspect the failing file(s)
3. Identify the single blocking defect
4. Apply the smallest legal fix
5. Re-run the failing command
6. Verify no new errors are introduced

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

Execution Rules:
- Do not alter happy-path behavior
- Add only guards, validation, or logging
- Re-run the script to verify unchanged success output

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
1. Load schema.json (authoritative)
2. Compare payload keys exactly
3. Identify unknown, missing, or mismatched fields
4. Fix the payload OR halt with explicit error
5. Re-run validation or import

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

Mandatory Operator Behavior:
- Missing required fields must stop execution
- Required relations must be supplied explicitly
- Guessing, defaulting, or inference is forbidden
- Canon authority always overrides convenience

Done When:
- Canon data validated
- No hallucination paths introduced