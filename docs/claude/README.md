# Claude Code Rules Documentation

This directory contains the modular Claude Code ruleset for the Forge monorepo.

---

## 📁 Structure

```
docs/claude/
├── README.md           ← You are here
├── quick-ref.md        ← Load this for EVERY task (100 lines)
├── core-principles.md  ← Decision framework + Mirror system
├── tech-stack.md       ← Framework-specific rules (Next.js, Strapi, Redis)
├── workflows.md        ← Commands, model routing, Kimi setup
└── anti-patterns.md    ← What NOT to do
```

---

## 🎯 Usage Guide

### For Every Task
1. Load `/CLAUDE.md` (root file)
2. Load `quick-ref.md` (essential patterns)
3. Load task-specific files (see below)

### Task-Specific Loading

#### Building a Feature
```
Load:
- quick-ref.md (always)
- core-principles.md (decision framework)
- tech-stack.md (framework rules)

Use: Q plan → Q code → Q check
```

#### Reviewing Code
```
Load:
- quick-ref.md (always)
- anti-patterns.md (what to avoid)
- tech-stack.md (correct patterns)

Use: Q check
```

#### Debugging
```
Load:
- quick-ref.md (always)
- tech-stack.md (framework-specific debugging)

Use: Q diag
```

#### Mirror Work
```
Load:
- quick-ref.md (always)
- ../../../mirror-data/CREED.md (core values)

Use: Q mirror capture/synthesize/elevate
```

---

## 📚 File Descriptions

### `quick-ref.md`
**Size:** ~100 lines
**Load:** Always
**Contents:**
- Tech stack rules (dense format)
- Core code rules
- Security checklist
- Commit convention
- Command reference
- Mirror system summary

### `core-principles.md`
**Size:** ~150 lines
**Load:** When building features or making architectural decisions
**Contents:**
- Project context
- Decision framework
- General principles
- Mirror system principles (detailed)
- Governance rules

### `tech-stack.md`
**Size:** ~300 lines (but dense)
**Load:** When writing code or debugging
**Contents:**
- Next.js rules (components, data fetching, performance)
- Strapi v5 rules (services, auth, queries)
- Redis rules (keys, data handling, monitoring)
- TypeScript rules (strict mode, patterns)
- Database rules (queries, transactions, schema)
- Testing rules (unit, integration, e2e)
- Security rules (validation, auth, data protection)
- Performance rules (frontend, backend)
- Debugging commands

### `workflows.md`
**Size:** ~250 lines
**Load:** When learning commands or setting up Kimi
**Contents:**
- Kimi integration setup
- Command map (Q plan, Q code, Q check, etc.)
- Model routing strategy
- Context loading strategy
- Project context mapping

### `anti-patterns.md`
**Size:** ~250 lines
**Load:** When reviewing code
**Contents:**
- Code structure anti-patterns
- Framework-specific anti-patterns (Next.js, Strapi, Redis)
- TypeScript anti-patterns
- Database anti-patterns
- Security anti-patterns
- Performance anti-patterns
- Testing anti-patterns
- Commit anti-patterns

---

## 🧠 Model Routing

| Command | Model | Files to Load |
|---------|-------|---------------|
| `Q plan` | **Opus** | `core-principles.md`, `tech-stack.md` |
| `Q code` | **Sonnet** | `tech-stack.md`, `anti-patterns.md` |
| `Q check` | **Opus** | `anti-patterns.md`, `tech-stack.md` |
| `Q diag` | **Sonnet** | `tech-stack.md` |
| `Q git` | **Sonnet** | None |
| `Q mirror capture` | **Sonnet** | None |
| `Q mirror synthesize` | **Opus** | `mirror-data/` |

---

## 🔧 Kimi Setup

See `workflows.md` for full details.

Quick setup:
```bash
export ANTHROPIC_API_KEY="your-kimi-api-key"
export ANTHROPIC_BASE_URL="https://api.kimi.com/coding/"
```

---

## 📊 Context Reduction

**Before (v1.0.0):** 500 lines → Load entire file every time
**After (v2.0.0):** 100 lines (quick-ref) + task-specific files → ~60% reduction

---

## 🔄 Version History

### v2.0.0 (2025-01-16)
- Split monolithic CLAUDE.md into modular structure
- Created dense quick-ref.md (100 lines)
- Optimized rules with ✅/❌ format
- Added Kimi integration docs
- Added model routing strategy

### v1.0.0 (2025-11-02)
- Initial monolithic ruleset

---

## 🤝 Contributing

To update rules:
1. Edit the relevant file in this directory
2. Update version in `/CLAUDE.md`
3. Add entry to version history
4. Test with a sample task

---

**"Truth in Code, Clarity in Creation."**
