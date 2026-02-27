# Phase 6 Non-Negotiables

> **Status:** Active
> **Author:** Forge Dev Intelligence
> **Date:** 2026-02-26
> **Purpose:** Plumb line for every Phase 6 decision. When pressure hits, this is what holds.

---

## The Standard

Phase 6 ships as **deterministic, auditable, traceable, predictable** infrastructure. Not AI. Not adaptive. Not predictive. Foundation.

---

## Non-Negotiable Principles

### 1. No Silent Failures

Every error must produce:
- A log entry with correlation ID, timestamp, user context (no PII), and error classification
- A state transition (to `failed`, `errored`, or `degraded`) visible to operators
- A path to recovery (retry, manual intervention, or dead-letter)

**Test:** If you `grep` for any error in logs and find nothing, this principle is violated.

### 2. Every Render Job Must Be Traceable

From enqueue to completion (or failure), every render job must have:
- A unique job ID logged at every step
- Correlation ID linking it to the originating user action
- State transitions recorded with timestamps
- Final artifact URL or failure reason

**Test:** Given a job ID, you can reconstruct the full lifecycle from logs alone.

### 3. No Hardcoded Environment Logic

Zero `if (process.env.NODE_ENV === 'production')` branches that change business logic. Environment variables configure infrastructure (URLs, credentials, feature flags). They do not alter how assembly, rendering, or formation scoring works.

**Test:** The same code path executes in dev and production. Only configuration differs.

### 4. Every Automation Must Be Replayable

- Auto-EDL generation: re-run with same sync offsets → same EDL
- Render pipeline: re-enqueue failed job → picks up from last checkpoint
- Formation scoring: `computeFormationScore(events)` → same score for same events
- Event sourcing: `replayFormationEvents(userId)` → reconstructs identical state

**Test:** Run any operation twice with the same input. Output is identical.

### 5. Every Intelligence Rule Must Be Explainable

No black boxes in Phase 6. For every automated decision:
- Angle selection: "Camera B selected because 8.2dB lead over Camera A at t=14:32, confidence 0.87"
- Formation gating: "Access denied: score 0.62, threshold 0.75, deficit in checkpoint passages (2/5)"
- Content sequencing: "Node X ranked #1: prerequisites met, 3 days since last similar content, high diversity score"

**Minimum explainability payload** (every decision function returns this):
- `decision` — enum value of what was decided
- `reasons[]` — human-readable strings with specific numbers
- `inputsHash` — SHA-256 of the evaluated inputs (proves determinism on replay)
- `rulesVersion` — version of the rules or graph used
- `confidence?` — if present, must be 0–1 with documented threshold

See the `DecisionResult<T>` interface in the [Architecture Spec](./phase-6-architecture.md#explainability-contract) for the full TypeScript contract.

**Test:** Every automated decision can be explained in one sentence with specific numbers. Every decision is persisted and queryable by `correlationId`.

### 6. No Scope Creep Into Prediction

Phase 6 is rules-based. If a feature requires:
- A trained model → Phase 7+
- User behavior prediction → Phase 8+
- A/B testing → Phase 9+
- Real-time adaptation → Phase 9+

**Test:** "Is this deterministic given the same input?" If no, it is not Phase 6.

### 7. Operator Always Has Final Say

Every automation produces a **draft** for human review:
- Auto-EDL → draft, operator locks
- Render → operator initiates "Render All"
- Formation gating → rules are operator-configured, not self-modifying

No automation executes without an explicit human trigger or a human-approved rule.

**Test:** Remove the operator from the loop. Does the system still act? If yes, this principle is violated.

### 8. Failures Are Isolated

Render pipeline failure does not block assembly. Assembly failure does not block formation. Formation failure does not block content access. Each pillar degrades independently.

**Test:** Kill one pillar's queue. The other two continue operating.

### 9. Every State Transition Is Logged

No status changes without a timestamped audit entry:
- Render: `queued → processing → completed` (or `→ failed → retrying → dead-letter`)
- EDL: `draft → review → locked`
- Formation: `gated → unlocked` with score delta

**Test:** Query the audit log for any entity. Full state history is visible.

### 10. Data Integrity Over Speed

- Transactions for multi-step writes (render job + artifact record + session update)
- Idempotency keys on all create operations
- No eventual consistency for user-facing state (read-after-write guaranteed)

**Test:** Crash the server mid-operation. No partial state exists on restart.

---

## CI Enforcement

These principles are enforced automatically via lightweight regex/AST checks in CI. Not perfect — but they catch the most common regressions before review.

### Lint Rules (PR Gate)

| Principle | Check | Pattern | Severity |
|-----------|-------|---------|----------|
| No silent failures | Empty catch blocks | `catch\s*\([^)]*\)\s*\{\s*\}` | **Error** — block merge |
| No silent failures | Catch without logging | `catch` block without `logger\.\|console\.` within 3 lines | **Warning** — require justification |
| Traceable render jobs | correlationId in services | `render-.*service` files must contain `correlationId` | **Error** — block merge |
| No hardcoded env logic | NODE_ENV in domain code | `process\.env\.NODE_ENV\s*===\s*['"]production['"]` in `src/features/`, `src/lib/studio/` | **Error** — block merge |
| State transitions logged | Audit log on status change | `status:` assignment without `logger\.\|auditLog\(` within 5 lines in service files | **Warning** — require justification |
| Explainable decisions | Confidence annotation | `angleSelection\|formationScore\|gating` functions must return/log `confidence\|reason\|explanation` | **Warning** — flag for review |

### Script Location

```
scripts/
  ci/
    lint-non-negotiables.sh    # Runs regex checks, exits non-zero on Error violations
    golden-run-verify.sh       # Compares golden run outputs against pinned hashes
```

### How to Add a Check

1. Add a row to this table (principle, pattern, severity)
2. Add the regex to `lint-non-negotiables.sh`
3. Severity `Error` = block merge. Severity `Warning` = comment on PR, don't block.

### What This Does NOT Catch

- Logical idempotency violations (requires integration tests)
- Cross-pillar coupling via indirect imports (requires architecture review)
- Replay correctness (requires golden runs)

Those are covered by golden proof runs and code review — not lint.

---

## How to Use This Document

1. **Before starting a feature:** Read the relevant principle. Design for it.
2. **During code review:** Check each principle against the diff. CI catches syntax-level violations; you catch design-level ones.
3. **When scope pressure hits:** Point to the specific principle. "That's Phase 7."
4. **When debugging production:** These principles tell you what invariants should hold.
5. **When CI blocks your PR:** Read the flagged principle. Fix the violation. If it's a false positive, add a `// non-negotiable: [principle] — [justification]` comment and the check will skip that line.

---

## Related Documents

- [Phase 6 Architecture Spec](./phase-6-architecture.md) — Technical design
- [Launch Readiness Checklist](./launch-readiness-checklist.md) — Verification
- [Studio Automation Roadmap](./studio-automation-roadmap.md) — Timeline
