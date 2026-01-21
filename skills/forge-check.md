# Forge Check Skill
**Review code against rules and best practices**

---

## Context Loading
Before starting, load these files:
1. `/docs/claude/anti-patterns.md` (what to avoid)
2. `/docs/claude/tech-stack.md` (correct patterns)

---

## Your Task
Thoroughly review the specified code against all rules and identify issues.

---

## Review Categories

### 1. Code Structure
Check for:
- ✅ Functions ≤ 50 lines
- ✅ Files ≤ 250 lines
- ✅ Single Responsibility Principle
- ✅ Proper separation of concerns
- ❌ God objects
- ❌ Deep nesting (> 3 levels)

### 2. TypeScript Compliance
Check for:
- ✅ Strict mode enabled
- ✅ No `any` types
- ✅ Explicit return types
- ✅ Proper type guards
- ❌ Type assertions without validation
- ❌ Optional properties everywhere

### 3. Framework Adherence
#### Next.js
- ✅ Server Components by default
- ✅ `'use client'` only when needed
- ✅ `next/image` for images
- ✅ `next/dynamic` for heavy components
- ❌ `useEffect` for data in Server Components

#### Strapi
- ✅ Services via `strapi.plugin('kie-core')`
- ✅ `ctx.state.user` for auth
- ✅ Explicit populate
- ❌ Direct `entityService` in routes
- ❌ Mutating `ctx.request.body`

#### Redis
- ✅ Keys: `env:module:id`
- ✅ Expiry ≤ 5 min for transient
- ✅ Payloads ≤ 1 MB
- ❌ Unstructured keys

### 4. Security
Check for:
- ❌ Secrets in code
- ❌ Sensitive data in logs
- ❌ SQL injection vectors
- ❌ XSS vulnerabilities
- ❌ Trusting client input
- ❌ Missing rate limiting
- ❌ JWT expiry > 24h

### 5. Performance
Check for:
- ❌ N+1 queries
- ❌ Missing pagination
- ❌ Large Redis payloads
- ❌ No caching for expensive ops
- ❌ Blocking operations in handlers
- ❌ Loading all data upfront

### 6. Error Handling
Check for:
- ❌ Silent error swallowing
- ❌ Empty catch blocks
- ❌ Missing error logging
- ✅ Consistent error shape: `{ error, code, details? }`
- ✅ User-friendly messages

### 7. Testing
Check for:
- ✅ Tests exist
- ✅ Coverage ≥ 80% on business logic
- ✅ Tests are isolated
- ❌ Testing implementation details
- ❌ No test isolation

### 8. Anti-Patterns
Reference anti-patterns.md and check for:
- Hardcoded configuration
- Magic numbers
- Deep ternary nesting
- Mixing `await` with `.then()`
- God objects
- Premature optimization

---

## Output Format

```md
## Review: [filename]

### ✅ Strengths
- [What's done well]

### ⚠️ Issues Found

#### 🔴 Critical (must fix)
1. **[Issue]** at line X
   - Problem: [Description]
   - Fix: [Specific solution]
   - Reference: [Rule from docs]

#### 🟡 Warnings (should fix)
1. **[Issue]** at line Y
   - Problem: [Description]
   - Suggestion: [Improvement]

#### 🔵 Suggestions (nice to have)
1. **[Improvement]** at line Z
   - Current: [What it is]
   - Better: [Why it could be better]

### 📊 Metrics
- Functions: X (Y over 50 lines)
- File size: X lines
- Test coverage: X%
- TypeScript strict: ✅/❌
```

---

## Model Preference
**Use Opus** — Deep analysis and thorough review required.

---

## Example Usage
```
User: "Q check src/features/auth/oauth.ts"

You:
1. Read anti-patterns.md
2. Read tech-stack.md
3. Read src/features/auth/oauth.ts
4. Analyze against all rules
5. Categorize findings
6. Present detailed review
```

---

## Review Severity Guide

### 🔴 Critical (must fix)
- Security vulnerabilities
- Data corruption risks
- Silent failures
- Type safety violations
- Anti-patterns with high impact

### 🟡 Warnings (should fix)
- Performance issues
- Code maintainability
- Testing gaps
- Minor security concerns
- Inconsistent patterns

### 🔵 Suggestions (nice to have)
- Code style improvements
- Optimization opportunities
- Better naming
- Documentation gaps

---

**Be thorough but constructive. Provide specific fixes, not just complaints.**
