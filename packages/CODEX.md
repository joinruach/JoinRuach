# CODEX — Packages Layer

This CODEX governs all reusable packages in the monorepo.

Packages define **truth, logic, and capability** — not orchestration.

---

## 🎯 ROLE & AUTHORITY

Packages:
- Define deterministic behavior
- Expose stable APIs
- Enforce business rules and contracts

Packages do NOT:
- Perform orchestration
- Own runtime configuration
- Touch the outside world (unless infra)

---

## ⚡ EXECUTION CONTRACT (PACKAGES)

Packages are not advisory libraries.
Broken packages must be repaired.

When ALL conditions below are true:
1. A package test, build, or consumer fails
2. The failure is deterministic and reproducible
3. The failure is localized to the package
4. A legal fix exists within package scope

The agent is REQUIRED to act.

Analysis without action is a CODEX violation.

---

## 🛠 PACKAGE OPERATOR MODE

Package Operator Mode is engaged when:
- `pnpm build` fails
- `pnpm typecheck` fails
- A consumer reports a deterministic error
- A contract mismatch is detected

In Package Operator Mode, the agent MUST:
1. Read the error verbatim
2. Inspect the package source
3. Identify the single blocking defect
4. Apply the minimum legal fix
5. Re-run the failing command

Refactoring beyond the blocker is forbidden.

---

## ⛏ MINIMUM UNBLOCK RULE

When blocked, the agent must:
- Fix ONLY the failing export, type, or behavior
- Avoid touching unrelated files
- Re-run validation immediately

“Noisy improvements” are forbidden until green.

---

## 🔁 READ → ACT → VERIFY LOOP

All package remediation must follow:

1. READ the error
2. ACT with the smallest permitted change
3. VERIFY by re-running:
   - build
   - typecheck
   - affected consumer (if applicable)

Unverified fixes are invalid.

---

## 🧱 DEPENDENCY LAW

Packages MAY depend on:
- Other packages (lower or same layer)
- Contracts (types only)

Packages MAY NOT depend on:
- Services
- Apps
- Runtime configuration
- Environment variables (unless infra)

---

## 🚫 FORBIDDEN PRACTICES

- Importing from `apps/*` or `services/*`
- Shipping unbuilt TypeScript
- Changing public APIs without intent
- Adding fallbacks to hide errors
- Modifying contracts to fix runtime issues

---

## 🤖 AI AGENT GUARDRAILS

AI agents may:
- Fix broken exports
- Correct type mismatches
- Harden validation
- Add missing tests (only if required to verify)

AI agents may NOT:
- Expand APIs “for convenience”
- Change semantics silently
- Perform cross-package refactors
- Introduce behavior not requested

---

## 🧪 DONE DEFINITION

A package task is complete only when:
- The failure is resolved
- Public API behavior is preserved (unless instructed)
- `pnpm build` passes
- `pnpm typecheck` passes
- The consuming failure no longer reproduces

---

## FINAL PRINCIPLE

> Packages are precision instruments.  
> Fix what is broken.  
> Do not decorate the scalpel.