# Core Principles
**Author:** Jonathan Seals
**Version:** 1.0.0 | **Last Updated:** 2025-11-02

---

## Context
**Forge Monorepo** includes:
- **TrueShield OS** – Next.js 14+ (App Router) + Strapi v5 + Redis + TypeScript (strict)
- **Ruach Studios** – Next.js 14 site + Strapi v5 CMS + media pipelines
- **Forge Dev Intelligence** – Unified AI dev assistant + Mirror reflection system
- **Discernment Dashboard** – Next.js app for AI/spiritual analysis
- **Shared Infrastructure** – Docker Compose (Postgres, Redis, Strapi), pnpm monorepo

---

## Decision Framework
When designing or refactoring:

1. **Preserve existing architecture** — Avoid unnecessary rewrites
2. **Composition over inheritance**
3. **Use existing utilities** (`@kie-core`, `@ai-dev-panel`) before adding new code
4. **Optimize for clarity > cleverness**
5. **Justify any convention break** in commit body or ADR

---

## General Principles

### Code Quality
- **TypeScript strict mode only** — No `any`, no implicit `unknown`
- **Functions ≤ 50 lines** — Split early if growing
- **Files ≤ 250 lines** — Split by feature/concern
- **Comments explain *why*, not *what***
- **Pure functions where possible** — Easier to test + reason about
- **Consistent naming** — See `quick-ref.md`

### Architecture
- **Group by feature** → `src/features/auth/...`
- **Collocate tests** beside code
- **Barrel exports** only for public APIs
- **No deep nesting** — Prefer flat structures
- **Single Responsibility** — Each module does one thing well

---

## Mirror System Principles
The Mirror system is embedded in Forge Dev Intelligence for continuous wisdom accumulation.

### Core Tenets (from `mirror-data/CREED.md`)
- **Truth Over Comfort** — Precision matters more than validation
- **Clarity Over Cleverness** — Simple, direct solutions win
- **Reflection Over Reaction** — Pause, synthesize, then act
- **Evolution Over Perfection** — Continuous refinement beats static ideals
- **Wisdom Over Knowledge** — Applied understanding trumps mere information

### 12 Non-Negotiable Doctrines (Summary)
1. No autonomous identity changes (core files humans-only)
2. No compromise on Bride Over Beast principles (decentralized, witness-focused)
3. No unreasonable autonomy (human always has final say)
4. No silent failures (all errors logged)
5. No PII in logs/archives
6. No secrets in version control
7. No mutable archives (immutable incident history)
8. No unvalidated pattern elevation
9. No framework lock-in (portable across tools)
10. No idolatry of metrics (faithfulness > reach)
11. No replacement of human communion (tool, not companion)
12. No work on Sabbath (optional automation pause)

### Cognitive Loop
```
Error Detection → Incident Capture → Daily Synthesis →
Pattern Elevation → Wisdom Application
```

### Governance
- **Identity files** (`mirror-data/core/`) are human-edit only
- **Pattern elevation** requires:
  - ≥3 instances
  - ≥7 days observation
  - ≥80% confidence
  - Human approval
- **All patches** validated against discernment filters before execution
- **Autonomous actions** logged to audit trail

---

## Review & Updates
- **Review quarterly** or on major version change
- **Store version** in repo (`/docs/claude/`)
- **Track history** in `docs/adr/claude-rules-history.md`

---

**"Truth in Code, Clarity in Creation."**
