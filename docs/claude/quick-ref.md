# Claude Quick Reference
**Load this file for every task** — Fast context without the full ruleset.

---

## Tech Stack Rules
✅ **Next.js:** Server Components default | ❌ 'use client' unless interactive
✅ `error.tsx`/`loading.tsx` for boundaries | ❌ `useEffect` data fetch in Server Components
✅ `next/dynamic` for heavy components | ❌ Fetch in useEffect when Server can do it
✅ `next/image` for optimization

✅ **Strapi v5:** Access via `strapi.plugin('kie-core').service('entity')` | ❌ Direct `entityService`
✅ `ctx.state.user` for auth | ❌ `ctx.request.body.user`
✅ Populate relations explicitly | ❌ Mutate `ctx.request.body`
✅ `afterCreate` hooks for side effects | ❌ Multi-step writes without transactions

✅ **Redis:** Keys = `env:module:id` | ❌ Payloads > 1 MB
✅ Expire transient keys ≤ 5 min | ❌ Storing secrets
✅ Pipelines for multi-ops

---

## Code Rules
- **TypeScript:** Strict mode, no `any`, no implicit `unknown`
- **Size:** Functions ≤ 50 lines | Files ≤ 250 lines
- **Naming:** Components = PascalCase | functions = camelCase | constants = UPPER_SNAKE_CASE
- **Comments:** Explain *why*, not *what*
- **Errors:** Never swallow silently | Return `{ error, code, details? }`
- **Testing:** Coverage ≥ 80% on business logic
- **Composition > Inheritance**

---

## Data Layer
✅ Transactions for multi-step writes | ❌ Exposing raw DB errors
✅ Index frequently queried fields | ❌ N+1 queries
✅ Limit results ≤ 100, paginate beyond

---

## Security Checklist
✅ No sensitive data in logs | ❌ Secrets in version control
✅ Validate inputs (Zod preferred) | ❌ Trusting client data
✅ Sanitize HTML (DOMPurify) | ❌ JWT expiry > 24h
✅ Rate-limit public endpoints | ❌ HTTP in production
✅ `crypto.randomUUID()` for IDs

---

## Commit Convention
```
type(scope): subject

Types: feat, fix, chore, refactor, docs, test, perf, ci
Breaking: feat(api)!: change auth flow
Reference: fix(otp): resolve timeout (#123)
```

---

## Commands & Model Routing

| Command | Model | Purpose |
|---------|-------|---------|
| `Q plan` | **Opus** | Analyze repo + plan minimal change |
| `Q code` | **Sonnet** | Implement + test + lint |
| `Q check` | **Opus** | Deep review against rules |
| `Q git` | **Sonnet** | Generate conventional commit |
| `Q diag` | **Sonnet** (→ Opus if complex) | Read error buffer + analyze |
| `Q mirror capture` | **Sonnet** | Log incident to Mirror |
| `Q mirror synthesize` | **Opus** | Generate daily wisdom synthesis |
| `Q mirror elevate` | **Opus** | Promote patterns to permanent wisdom |

---

## Mirror System (Condensed)
**Core Values:** Truth > Comfort | Clarity > Cleverness | Reflection > Reaction
**Forbidden:** Identity changes, silent failures, secrets in git, mutable archives
**Cognitive Loop:** Error → Incident → Synthesis → Pattern → Wisdom
**Governance:** Human-only core edits | ≥3 instances + 7 days + 80% confidence for pattern elevation
**Full Details:** See `mirror-data/CREED.md`

---

## Project Context
- **TrueShield OS:** Speed + security + dispatch accuracy
- **Ruach Studios:** Clarity + story + UX polish
- **Forge Dev Intelligence:** Real-time error detection + AI fixes + wisdom accumulation
- **Discernment Dashboard:** Transparency + biblical accuracy

---

**"Truth in Code, Clarity in Creation."**
