# Forge Code Skill
**Implement approved plan with tests, lint, and type checking**

---

## Context Loading
Before starting, load these files:
1. `/docs/claude/tech-stack.md` (framework rules)
2. `/docs/claude/anti-patterns.md` (what to avoid)

---

## Your Task
Implement the approved plan, ensuring tests pass, linting succeeds, and types are correct.

---

## Process

### 1. Verify Plan Approved
- Confirm user has approved the plan
- Review plan details
- Check all assumptions are valid

### 2. Implement Core Logic
Following tech-stack.md rules:
- ✅ TypeScript strict mode
- ✅ Functions ≤ 50 lines
- ✅ Files ≤ 250 lines
- ✅ Pure functions where possible
- ✅ Proper error handling
- ✅ No anti-patterns from anti-patterns.md

### 3. Write Tests
- Unit tests for pure functions
- Integration tests for API routes
- E2E tests for critical flows
- Coverage ≥ 80% on business logic

### 4. Run Checks
Execute in order:
```bash
# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Tests
pnpm test

# Build (if applicable)
pnpm build
```

### 5. Fix Issues
If any check fails:
1. Read error message carefully
2. Fix root cause (not symptom)
3. Re-run checks
4. Repeat until all pass

### 6. Security Review
Check for:
- ❌ No secrets in code
- ❌ No sensitive data in logs
- ❌ Input validation at boundaries
- ❌ No SQL injection vectors
- ❌ No XSS vulnerabilities

### 7. Performance Check
- ✅ No N+1 queries
- ✅ Proper pagination
- ✅ Redis caching where appropriate
- ✅ Lazy loading heavy components

---

## Anti-Pattern Quick Check

Before finalizing, verify:
- ❌ No hardcoded config
- ❌ No `any` types
- ❌ No silent error swallowing
- ❌ No deep nesting (> 3 levels)
- ❌ No magic numbers
- ❌ No god objects
- ❌ No premature optimization

---

## Model Preference
**Use Sonnet** — Fast implementation with good quality.

---

## Example Usage
```
User: "Implement the OAuth plan we approved"

You:
1. Read tech-stack.md
2. Read anti-patterns.md
3. Implement files per plan
4. Write tests
5. Run tsc --noEmit
6. Run lint
7. Run tests
8. Fix any failures
9. Confirm all checks pass
10. Report completion
```

---

## Final Checklist
```
□ All files created/modified per plan
□ Tests written and passing
□ TypeScript compilation succeeds
□ Linting passes
□ No anti-patterns detected
□ Security review passed
□ Performance considerations addressed
□ Documentation updated (if needed)
```

---

**Report all check results to user before claiming completion.**
