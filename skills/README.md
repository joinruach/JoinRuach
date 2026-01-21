# Claude Code Skills

This directory contains task-specific skills for Claude Code workflows.

---

## 📁 Available Skills

```
skills/
├── README.md           ← You are here
├── forge-plan.md       ← Plan minimal change (Opus)
├── forge-code.md       ← Implement with tests (Sonnet)
├── forge-check.md      ← Review against rules (Opus)
└── mirror-capture.md   ← Log incident (Sonnet)
```

---

## 🎯 How to Use Skills

### Option 1: Invoke Directly (Preferred)
```
/forge-plan
Task: Add OAuth login to auth system
```

### Option 2: Use Q Commands
```
Q plan
Analyze and plan OAuth integration
```

Both methods work the same way — skills are just automated workflows.

---

## 📚 Skill Descriptions

### `forge-plan.md` (Opus)
**Purpose:** Analyze repository and plan minimal change
**Loads:** `core-principles.md`, `tech-stack.md`
**Output:** Detailed plan with affected files, assumptions, pseudocode
**Use when:** Starting a new feature or major change

**Process:**
1. Understand current state
2. Analyze requirements
3. Plan minimal change
4. Draft pseudocode
5. Check alignment with rules
6. Present plan for approval

---

### `forge-code.md` (Sonnet)
**Purpose:** Implement approved plan with tests, lint, and type checking
**Loads:** `tech-stack.md`, `anti-patterns.md`
**Output:** Implemented code + passing tests + lint/type checks
**Use when:** Implementing an approved plan

**Process:**
1. Verify plan approved
2. Implement core logic
3. Write tests
4. Run type check, lint, tests
5. Fix any issues
6. Security review
7. Performance check
8. Report completion

---

### `forge-check.md` (Opus)
**Purpose:** Review code against rules and best practices
**Loads:** `anti-patterns.md`, `tech-stack.md`
**Output:** Detailed review with categorized issues (critical, warnings, suggestions)
**Use when:** Reviewing code before merge or after implementation

**Review Categories:**
- Code structure
- TypeScript compliance
- Framework adherence
- Security
- Performance
- Error handling
- Testing
- Anti-patterns

---

### `mirror-capture.md` (Sonnet)
**Purpose:** Log incident to Mirror working memory
**Loads:** None (writes structured data)
**Output:** JSON incident file in `mirror-data/working/`
**Use when:** An error/bug/issue occurs that should be tracked

**Incident Data:**
- Timestamp, type, severity
- Source (file, line, function)
- Error details (type, message, stack)
- Environment (dev/staging/prod)
- Impact assessment
- Resolution status
- Tags for synthesis

---

## 🧠 Model Selection

| Skill | Model | Why |
|-------|-------|-----|
| `forge-plan` | **Opus** | Deep analysis, pattern detection required |
| `forge-code` | **Sonnet** | Fast implementation, good enough for most tasks |
| `forge-check` | **Opus** | Thorough review needs deep analysis |
| `mirror-capture` | **Sonnet** | Structured data capture, fast execution |

---

## 🔧 Model Override

If you need a different model for a skill:

```bash
# Use Opus for forge-code (slower but more thorough)
ANTHROPIC_MODEL=claude-opus-4-5 claude
/forge-code
```

---

## 📝 Creating New Skills

### Template Structure
```md
# [Skill Name] Skill
**[Brief description]**

---

## Context Loading
[What files to load before starting]

---

## Your Task
[Clear description of what this skill does]

---

## Process
[Step-by-step workflow]

---

## Model Preference
[Recommended model + reason]

---

## Example Usage
[Concrete example]

---

## Output Format
[Expected output structure]
```

### Guidelines
1. Keep skills focused on a single workflow
2. Specify model preference clearly
3. List required context files
4. Provide step-by-step process
5. Include example usage
6. Define expected output format

---

## 🚀 Quick Start

### New Feature Workflow
```bash
# 1. Plan (Opus)
/forge-plan
Task: Add OAuth login

# 2. Implement (Sonnet)
/forge-code
Implement the approved OAuth plan

# 3. Review (Opus)
/forge-check
Review src/features/auth/oauth.ts
```

### Debugging Workflow
```bash
# 1. Capture incident (Sonnet)
/mirror-capture
TypeError in auth service, JWT validation failed

# 2. Fix issue
/forge-code
Fix JWT validation edge case

# 3. Synthesize (run daily)
Q mirror synthesize
```

---

## 📊 Skill vs Q Command

| Method | When to Use |
|--------|-------------|
| **Skills** (`/forge-plan`) | Automated workflow, don't need to specify context files |
| **Q Commands** (`Q plan`) | More flexible, can add custom instructions |

Both invoke the same underlying workflows.

---

## 🤝 Contributing

To add a new skill:
1. Create `[skill-name].md` in this directory
2. Follow the template structure above
3. Add entry to this README
4. Test the skill with a sample task
5. Document in `/docs/claude/workflows.md`

---

**"Truth in Code, Clarity in Creation."**
