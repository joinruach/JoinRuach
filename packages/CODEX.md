# CODEX — Packages Layer

## Authority
- Governs: All reusable packages in `/packages/*`
- Subordinate to: /CODEX.md (root), /CLAUDE.md (project instructions)
- Conflicts resolved in favor of root governance
- Scope: Package internals, exports, dependencies, build/typecheck

## Purpose
Packages define truth, logic, and capability — not orchestration. Enforces deterministic behavior, stable APIs, and business rule contracts for consumers.

## Allowed
- Depend on other packages (same or lower layer)
- Depend on contract types only (no runtime imports from apps/services)
- Export stable public APIs
- Enforce business rules and validation
- Fix broken exports matching existing patterns
- Correct type mismatches against known schemas
- Add missing tests to verify fixes
- Harden validation logic
- Use `pnpm build`, `pnpm typecheck` for validation

## Forbidden
- MUST NOT import from `apps/*` packages
- MUST NOT import from `services/*` packages
- MUST NOT import from any `ui-*` packages unless this is a UI package
- MUST NOT ship unbuilt TypeScript
- MUST NOT change public APIs without intent
- MUST NOT add fallbacks to hide errors
- MUST NOT modify contracts to fix runtime issues
- MUST NOT expand APIs "for convenience"
- MUST NOT change semantics silently
- MUST NOT perform cross-package refactors
- MUST NOT introduce behavior not requested
- MUST NOT touch runtime configuration
- MUST NOT touch environment variables (unless infra package)
- MUST NOT perform orchestration

## Required Patterns

### Package Operator Mode (MANDATORY WHEN TRIGGERED)

**Activation Conditions (ANY triggers Package Operator Mode):**
- `pnpm build` fails
- `pnpm typecheck` fails
- Consumer reports deterministic error
- Contract mismatch detected
- Export/import failure

**Execution Sequence (MUST FOLLOW):**
1. Read error verbatim
2. Inspect package source
3. Identify single blocking defect
4. Apply minimum legal fix
5. Re-run failing command
6. If consumer-reported: verify consumer no longer fails

**Violations:**
- Refactoring beyond blocker = violation
- Touching unrelated files = violation
- Skipping re-run = violation

### Dependency Law (STRICT)
- Packages MAY depend on:
  - Other packages (lower or same layer)
  - Contracts (types only, no runtime)
- Packages MAY NOT depend on:
  - Services
  - Apps
  - Runtime configuration
  - Environment variables (exception: infra packages)

### Public API Stability
- Existing exports MUST NOT be removed without explicit approval
- Existing function signatures MUST NOT change without explicit approval
- New exports MAY be added if required to unblock
- Breaking changes MUST be flagged before applying

## Execution Checklist

### When Package Build/Typecheck Fails
1. READ error verbatim from `pnpm build` or `pnpm typecheck`
2. IDENTIFY failing file and line number
3. INSPECT source file at error location
4. IDENTIFY single blocking issue (missing export, type error, etc.)
5. APPLY minimum fix:
   - Add missing export if referenced by consumer
   - Fix type mismatch if schema is known
   - Add required field if schema demands it
6. RE-RUN build/typecheck
7. VERIFY success before proceeding

### When Consumer Reports Package Error
1. READ consumer error verbatim
2. IDENTIFY what package export consumer is using
3. INSPECT package source for that export
4. IDENTIFY mismatch (missing export, wrong type, broken import)
5. APPLY minimum fix in package
6. RE-RUN package build/typecheck
7. RE-RUN consumer operation
8. VERIFY consumer error resolved

### Before Changing Public API
1. CONFIRM change is explicitly requested
2. IDENTIFY all consumers of API
3. ASSESS impact (breaking vs non-breaking)
4. If breaking → STOP and request approval
5. If non-breaking → proceed with minimum addition
6. DOCUMENT change in commit message

## Change Rules

### Human Approval Required
- Removing public exports
- Changing function signatures
- Modifying contract interfaces
- Adding new dependencies
- Changing build configuration
- Cross-package refactors
- Behavior changes to existing functions

### AI Auto-Modification Allowed
- Adding missing exports if consumer references them
- Fixing type errors against known schemas
- Adding missing required fields per schema
- Correcting import paths within package
- Adding fail-loud error handling
- Adding tests to verify fixes (only if required)

### Rollback Requirements
- If fix breaks other consumers → revert immediately
- If build/typecheck fails after fix → revert immediately
- If behavior changes → revert and request approval

## Failure Modes

### Common Mistakes
1. **Circular Dependencies**: Package A imports package B which imports package A
   - **Detection**: Build fails with "Cycle detected" or import errors
   - **Recovery**: Identify cycle, extract shared code to lower-layer package

2. **App/Service Import**: Package imports from apps/* or services/*
   - **Detection**: Typecheck fails, architecture violation
   - **Recovery**: Remove import, invert dependency (app imports package)

3. **Breaking API Change**: Removed export or changed signature
   - **Detection**: Consumer builds fail with "Cannot find" or type errors
   - **Recovery**: Restore original export, add new export alongside if needed

4. **Unbuilt TypeScript**: Package exports raw .ts files
   - **Detection**: Consumer fails with "Unexpected token" or module errors
   - **Recovery**: Add build step, ensure package.json points to built output

5. **Hidden Errors**: Package catches errors and returns fallback
   - **Detection**: Silent failures in consumers, unexpected behavior
   - **Recovery**: Remove fallback, throw error, let consumer handle

6. **Contract Modification**: Changed contract types to fix package
   - **Detection**: Contract changes when package should change
   - **Recovery**: Revert contract, fix package to match contract

### Universal Recovery Pattern
1. STOP current action
2. REVERT to last known good state
3. READ error completely
4. IDENTIFY whether issue is:
   - Package source (fix here)
   - Consumer usage (do not fix package)
   - Contract drift (escalate to user)
5. APPLY minimum fix to package source only
6. RE-RUN package build + typecheck
7. RE-RUN affected consumer if applicable
8. VERIFY both package and consumer succeed

## Validation Commands

All changes MUST pass:
```bash
pnpm build        # Must succeed
pnpm typecheck    # Must succeed
```

If consumer reported issue:
```bash
# Re-run consumer operation that originally failed
# Must verify consumer error is resolved
```

## Done Definition

A package task is COMPLETE only when ALL conditions met:
- [ ] Package failure resolved
- [ ] Public API behavior preserved (unless instructed otherwise)
- [ ] `pnpm build` passes in package
- [ ] `pnpm typecheck` passes in package
- [ ] Consumer failure no longer reproduces (if applicable)
- [ ] No unrelated files changed
- [ ] No dependency law violations
- [ ] No new exports unless required for unblock

Partial success MUST be declared as partial with specific blockers identified.

## Operating Principle

**Packages are precision instruments.**
**Fix what is broken.**
**Do not decorate the scalpel.**
