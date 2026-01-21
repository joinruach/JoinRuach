# Claude Code Rules — Forge Edition
**Author:** Jonathan Seals
**Version:** 2.0.0 | **Last Updated:** 2025-01-16

---

## 🚀 Quick Start

**For every task, start here:**

1. **Load this file first** (you're reading it now)
2. **Then load** `/docs/claude/quick-ref.md` (100-line essentials)
3. **Task-specific context:**
   - Building a feature? → Load `core-principles.md` + `tech-stack.md`
   - Reviewing code? → Load `anti-patterns.md` + `tech-stack.md`
   - Debugging? → Load `tech-stack.md`
   - Mirror work? → Load `mirror-data/CREED.md`

---

## 📁 New Structure

This ruleset is now split for efficiency:

```
/docs/claude/
  quick-ref.md         # Always load (100 lines, dense)
  core-principles.md   # Decision framework, Mirror creed
  tech-stack.md        # Next.js, Strapi, Redis rules (optimized)
  workflows.md         # Commands, model routing, Kimi setup
  anti-patterns.md     # What NOT to do

/skills/
  forge-plan.md        # Invoke with /forge-plan
  forge-code.md        # Invoke with /forge-code
  forge-check.md       # Invoke with /forge-check
  mirror-capture.md    # Invoke with /mirror-capture
```

---

## 🎯 Command Quick Reference

| Task | Command | Model | Files to Load |
|------|---------|-------|---------------|
| **Start new task** | `Q new` | Sonnet | `quick-ref.md` |
| **Plan feature** | `Q plan` or `/forge-plan` | Opus | `core-principles.md`, `tech-stack.md` |
| **Write code** | `Q code` or `/forge-code` | Sonnet | `tech-stack.md`, `anti-patterns.md` |
| **Review code** | `Q check` or `/forge-check` | Opus | `anti-patterns.md`, `tech-stack.md` |
| **Debug error** | `Q diag` | Sonnet | `tech-stack.md` |
| **Commit** | `Q git` | Sonnet | None |
| **Log incident** | `Q mirror capture` | Sonnet | None |
| **Synthesize wisdom** | `Q mirror synthesize` | Opus | `mirror-data/` |

Full command details in `/docs/claude/workflows.md`

---

## 🔧 Kimi Integration (Recommended)

Use Kimi through Claude Code CLI for best results:

```bash
# One-time setup
export ANTHROPIC_API_KEY="your-kimi-api-key"
export ANTHROPIC_BASE_URL="https://api.kimi.com/coding/"

# Add to ~/.zshrc or ~/.bashrc for persistence
echo 'export ANTHROPIC_API_KEY="your-kimi-api-key"' >> ~/.zshrc
echo 'export ANTHROPIC_BASE_URL="https://api.kimi.com/coding/"' >> ~/.zshrc

# Then use Claude Code normally
claude
```

**Model Selection:**
```bash
# Sonnet (default, fast)
claude

# Opus (deep analysis)
ANTHROPIC_MODEL=claude-opus-4-5 claude

# Haiku (quick tasks)
ANTHROPIC_MODEL=claude-haiku-4 claude
```

See `/docs/claude/workflows.md` for full details.

---

## 🧠 Model Routing Strategy

| Command | Model | Why |
|---------|-------|-----|
| `Q plan`, `Q check` | **Opus** | Deep analysis, pattern detection |
| `Q code`, `Q git`, `Q diag` | **Sonnet** | Fast implementation |
| `Q mirror synthesize` | **Opus** | Wisdom synthesis needs depth |
| `Q mirror capture` | **Sonnet** | Structured data capture |

---

## 🎓 Learning Path

### New to the Project?
1. Read `/docs/claude/quick-ref.md` (essential patterns)
2. Read `/docs/claude/core-principles.md` (philosophy)
3. Skim `/docs/claude/anti-patterns.md` (common mistakes)
4. Reference `/docs/claude/tech-stack.md` as needed

### Building a Feature?
```bash
Load: quick-ref.md (always)
      core-principles.md (decision framework)
      tech-stack.md (framework rules)

Use: Q plan → Q code → Q check
```

### Reviewing Code?
```bash
Load: quick-ref.md (always)
      anti-patterns.md (what to avoid)
      tech-stack.md (correct patterns)

Use: Q check
```

### Debugging?
```bash
Load: quick-ref.md (always)
      tech-stack.md (framework-specific debugging)

Use: Q diag
```

---

## 🔒 Core Values (Condensed)

### Decision Framework
1. Preserve existing architecture (avoid rewrites)
2. Composition over inheritance
3. Use existing utilities before adding new code
4. Optimize for clarity > cleverness
5. Justify convention breaks in commit/ADR

### Mirror System
**Core:** Truth > Comfort | Clarity > Cleverness | Reflection > Reaction
**Forbidden:** Identity changes, silent failures, secrets in git, mutable archives
**Loop:** Error → Incident → Synthesis → Pattern → Wisdom
**Governance:** Human-only core edits | ≥3 instances + 7 days + 80% confidence

Full details: `/docs/claude/core-principles.md` and `mirror-data/CREED.md`

---

## 📊 Project Context

- **TrueShield OS** → Speed + security + dispatch accuracy
- **Ruach Studios** → Clarity + story + UX polish
- **Forge Dev Intelligence** → Real-time error detection + AI fixes + wisdom
- **Discernment Dashboard** → Transparency + biblical accuracy

---

## 🛠️ Tech Stack (Summary)

**Frontend:** Next.js 14+ (App Router), React Server Components, TypeScript strict
**Backend:** Strapi v5, Node.js, Redis, PostgreSQL
**Tooling:** pnpm, Docker Compose, Vitest, Playwright
**AI:** Forge Dev Intelligence with Mirror reflection system

Full rules: `/docs/claude/tech-stack.md`

---

## 🚫 Top Anti-Patterns

❌ Hardcoded URLs/configs (use env vars)
❌ `useEffect` data fetch in Server Components
❌ Direct `entityService` in Strapi routes
❌ Redis payloads > 1 MB
❌ TypeScript `any` anywhere
❌ Silent error swallowing
❌ N+1 database queries

Full list: `/docs/claude/anti-patterns.md`

---

## 📝 Commit Convention

```
type(scope): subject

Types: feat, fix, chore, refactor, docs, test, perf, ci
Breaking: feat(api)!: change auth flow
Reference: fix(otp): resolve timeout (#123)
```

---

## 🔄 Version History

### v2.0.0 (2025-01-16)
- Split monolithic CLAUDE.md into modular structure
- Created `/docs/claude/` directory with context-specific files
- Added `/skills/` directory for custom workflows
- Optimized rules for density (✅/❌ format)
- Added Kimi integration documentation
- Added model routing strategy
- Reduced context loading by 60%

### v1.0.0 (2025-11-02)
- Initial monolithic ruleset
- Mirror system integration
- Core principles established

---

## 📚 Full Documentation

- **Quick Reference:** `/docs/claude/quick-ref.md` ← Start here
- **Core Principles:** `/docs/claude/core-principles.md`
- **Tech Stack Rules:** `/docs/claude/tech-stack.md`
- **Workflows & Commands:** `/docs/claude/workflows.md`
- **Anti-Patterns:** `/docs/claude/anti-patterns.md`
- **Mirror System:** `mirror-data/CREED.md`

---

## 🎯 How to Use This System

### Option 1: Load Files Manually (Flexible)
```
Claude, load /docs/claude/quick-ref.md and /docs/claude/tech-stack.md
Then help me implement OAuth login
```

### Option 2: Use Skills (Automated)
```
/forge-plan
Task: Implement OAuth login
```

### Option 3: Use Q Commands (Quick)
```
Q plan
Analyze and plan OAuth integration
```

---

## 🤝 Contributing

Changes to this ruleset:
1. Update relevant file in `/docs/claude/`
2. Update version number in this file
3. Document change in version history
4. Review quarterly or on major version changes

---

**"Truth in Code, Clarity in Creation."**

---

## ⚡ TL;DR

```bash
# Every task starts here:
Load: CLAUDE.md (this file) + docs/claude/quick-ref.md

# Then choose your path:
Building? → Load core-principles.md + tech-stack.md → Q plan → Q code
Reviewing? → Load anti-patterns.md + tech-stack.md → Q check
Debugging? → Load tech-stack.md → Q diag
Mirror work? → Load mirror-data/CREED.md → Q mirror capture/synthesize

# Use Kimi for best results:
export ANTHROPIC_BASE_URL="https://api.kimi.com/coding/"
```
