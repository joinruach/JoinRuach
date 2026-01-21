# Workflows & Commands
**Task-specific commands with model routing + Kimi integration**

---

## Quick Setup

### Using Kimi Through Claude Code CLI
**Best for repo-level tasks** — Claude Code can read files, run commands, and apply changes.

```bash
# Set up Kimi API (one-time)
export ANTHROPIC_API_KEY="your-kimi-api-key"
export ANTHROPIC_BASE_URL="https://api.kimi.com/coding/"

# Add to your shell profile (~/.zshrc or ~/.bashrc) for persistence
echo 'export ANTHROPIC_API_KEY="your-kimi-api-key"' >> ~/.zshrc
echo 'export ANTHROPIC_BASE_URL="https://api.kimi.com/coding/"' >> ~/.zshrc

# Then run Claude Code normally
claude
```

### Quick Model Switch
```bash
# Use Sonnet (default, fast)
claude

# Use Opus (deep analysis)
ANTHROPIC_MODEL=claude-opus-4-5 claude

# Use Haiku (quick tasks)
ANTHROPIC_MODEL=claude-haiku-4 claude
```

---

## Command Map

### Core Development Commands

#### `Q new` — Initialize Context
**Model:** Sonnet
**Files to Load:** `quick-ref.md` (always)
**Purpose:** Start new task with fresh context

**Usage:**
```
Q new
Load quick-ref.md and core-principles.md
```

---

#### `Q plan` — Analyze & Plan
**Model:** Opus (deep pattern analysis)
**Files to Load:** `core-principles.md` + `tech-stack.md`
**Purpose:** Analyze repo, identify patterns, plan minimal change

**Usage:**
```
Q plan
Analyze current auth flow and plan OAuth integration
Load: core-principles.md, tech-stack.md
```

**Steps:**
1. Understand existing architecture
2. Identify affected files
3. List assumptions
4. Draft pseudocode
5. Check alignment with rules
6. Present plan for approval

---

#### `Q code` — Implement
**Model:** Sonnet (fast implementation)
**Files to Load:** `tech-stack.md` + `anti-patterns.md`
**Purpose:** Implement per plan with tests/lint/typecheck

**Usage:**
```
Q code
Implement OAuth integration per approved plan
Load: tech-stack.md, anti-patterns.md
```

**Steps:**
1. Create/modify files per plan
2. Write tests
3. Run linter
4. Run type checker
5. Fix any issues
6. Verify against anti-patterns

---

#### `Q check` — Review Code
**Model:** Opus (deep analysis)
**Files to Load:** `anti-patterns.md` + `tech-stack.md`
**Purpose:** Review functions/tests against rules

**Usage:**
```
Q check
Review src/features/auth/oauth.ts against rules

Q check f/t
Review both functions and tests in this file
```

**Checks:**
- TypeScript strict compliance
- Function size ≤ 50 lines
- Security vulnerabilities
- Performance issues
- Anti-patterns
- Test coverage

---

#### `Q git` — Commit Message
**Model:** Sonnet
**Files to Load:** None
**Purpose:** Generate Conventional Commit message

**Usage:**
```
Q git
Generate commit message for recent changes
```

**Format:**
```
type(scope): subject

type: feat|fix|chore|refactor|docs|test|perf|ci
Breaking: type(scope)!: subject
Reference: (#issue-number)
```

---

### Debugging Commands

#### `Q diag` — Analyze Error
**Model:** Sonnet (→ escalate to Opus if complex)
**Files to Load:** `tech-stack.md`
**Purpose:** Read error buffer and analyze

**Usage:**
```
Q diag
Analyze the TypeError in console
Load: tech-stack.md
```

**Escalate to Opus if:**
- Multiple interconnected errors
- Architectural issues
- Performance degradation
- Security concerns

---

### Mirror System Commands

#### `Q mirror capture` — Log Incident
**Model:** Sonnet (structured data capture)
**Files to Load:** None (writes to `mirror-data/working/`)
**Purpose:** Capture incident to Mirror working memory

**Usage:**
```
Q mirror capture
Log: TypeError in auth service, JWT validation failed
Context: User login flow, production environment
```

**Captured Data:**
- Timestamp
- Error type
- Context
- Stack trace
- User impact
- Resolution steps

---

#### `Q mirror synthesize` — Daily Synthesis
**Model:** Opus (wisdom synthesis)
**Files to Load:** `mirror-data/working/*.json` + `mirror-data/core/CREED.md`
**Purpose:** Generate daily synthesis from incidents

**Usage:**
```
Q mirror synthesize
Analyze today's incidents and identify patterns
```

**Output:**
- Common themes
- Emerging patterns
- Recommended fixes
- Prevention strategies
- Confidence scores

---

#### `Q mirror elevate` — Promote Pattern
**Model:** Opus (deep validation)
**Files to Load:** `mirror-data/wisdom/*.md` + `mirror-data/core/CREED.md`
**Purpose:** Promote validated patterns to permanent wisdom

**Usage:**
```
Q mirror elevate
Promote JWT validation pattern to permanent wisdom
```

**Requirements:**
- ≥3 instances
- ≥7 days observation
- ≥80% confidence
- Human approval

---

## Model Routing Strategy

| Command | Model | Why | Context Files |
|---------|-------|-----|---------------|
| `Q new` | Sonnet | Quick context load | `quick-ref.md` |
| `Q plan` | **Opus** | Deep analysis, pattern detection | `core-principles.md`, `tech-stack.md` |
| `Q code` | Sonnet | Fast implementation | `tech-stack.md`, `anti-patterns.md` |
| `Q check` | **Opus** | Thorough review | `anti-patterns.md`, `tech-stack.md` |
| `Q git` | Sonnet | Structured output | None |
| `Q diag` | Sonnet → **Opus** | Triage first, escalate if complex | `tech-stack.md` |
| `Q mirror capture` | Sonnet | Structured data capture | None |
| `Q mirror synthesize` | **Opus** | Wisdom synthesis needs depth | `mirror-data/working/`, `CREED.md` |
| `Q mirror elevate` | **Opus** | Deep validation required | `mirror-data/wisdom/`, `CREED.md` |

---

## UX Testing Command

#### `Q ux` — Generate Test Scenarios
**Model:** Sonnet
**Files to Load:** Relevant component files
**Purpose:** Generate UX testing scenarios

**Usage:**
```
Q ux
Generate test scenarios for user onboarding flow
```

**Output:**
- User personas
- Happy path scenarios
- Edge cases
- Accessibility checks
- Performance expectations

---

## Custom Skills Integration

### Using `/skills/` Directory
Instead of remembering `Q plan`, you can create custom skills:

```bash
# Invoke with slash commands
/forge-plan     # Auto-loads rules + analyzes minimal change
/forge-code     # Implements with tests/lint
/forge-check    # Reviews against rules
/mirror-capture # Incident capture workflow
```

See `/skills/` directory for implementations.

---

## Context Loading Strategy

### For Building Features
```
Load: quick-ref.md (always)
      core-principles.md (decision framework)
      tech-stack.md (framework rules)
```

### For Code Review
```
Load: quick-ref.md (always)
      anti-patterns.md (what to avoid)
      tech-stack.md (correct patterns)
```

### For Debugging
```
Load: quick-ref.md (always)
      tech-stack.md (framework-specific debugging)
```

### For Mirror Work
```
Load: quick-ref.md (always)
      mirror-data/CREED.md (core values)
      mirror-data/working/ (recent incidents)
```

---

## Thinking Rules
When reasoning through a task:

1. **Summarize** context and goal before coding
2. **List assumptions** (explicitly note paths/envs)
3. **Draft pseudocode** → refine to final output
4. **Check alignment** with this ruleset before finalizing
5. **Never change** envs or Docker configs without explicit approval

---

## Project Context Mapping

### TrueShield OS
**Focus:** Speed + security + dispatch accuracy
**Commands:** `Q plan`, `Q code`, `Q check`
**Extra Context:** Load security section from `tech-stack.md`

### Ruach Studios
**Focus:** Clarity + story + UX polish
**Commands:** `Q plan`, `Q ux`, `Q code`
**Extra Context:** Media pipeline docs

### Forge Dev Intelligence
**Focus:** Real-time error detection + AI fixes + wisdom accumulation
**Commands:** `Q mirror capture`, `Q mirror synthesize`, `Q diag`
**Extra Context:** `mirror-data/CREED.md`

### Discernment Dashboard
**Focus:** Transparency + readability + biblical accuracy
**Commands:** `Q plan`, `Q code`, `Q check`
**Extra Context:** Biblical content validation rules

---

## Quick Reference Table

```
┌──────────────┬─────────┬──────────────────────────────┐
│ Task         │ Model   │ Command                      │
├──────────────┼─────────┼──────────────────────────────┤
│ Plan feature │ Opus    │ Q plan                       │
│ Write code   │ Sonnet  │ Q code                       │
│ Review code  │ Opus    │ Q check                      │
│ Debug error  │ Sonnet  │ Q diag                       │
│ Commit       │ Sonnet  │ Q git                        │
│ Log incident │ Sonnet  │ Q mirror capture             │
│ Synthesize   │ Opus    │ Q mirror synthesize          │
│ Elevate      │ Opus    │ Q mirror elevate             │
└──────────────┴─────────┴──────────────────────────────┘
```

---

**"Truth in Code, Clarity in Creation."**
