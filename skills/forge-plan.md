# Forge Plan Skill
**Analyze repository and plan minimal change**

---

## Context Loading
Before starting, load these files:
1. `/docs/claude/core-principles.md` (decision framework)
2. `/docs/claude/tech-stack.md` (framework rules)

---

## Your Task
Analyze the repository for the requested feature/fix and create a minimal change plan.

---

## Process

### 1. Understand Current State
- Read relevant files
- Identify existing patterns
- Note current architecture
- Map dependencies

### 2. Analyze Requirements
- What is the user asking for?
- What problem does it solve?
- What are the constraints?
- What are the assumptions?

### 3. Plan Minimal Change
- List files to modify
- List files to create (avoid if possible)
- Identify reusable utilities
- Note potential side effects

### 4. Draft Pseudocode
- High-level approach
- Key functions/components
- Data flow
- Error handling strategy

### 5. Check Alignment
Review against rules:
- ✅ Composition over inheritance?
- ✅ Using existing utilities?
- ✅ Functions ≤ 50 lines?
- ✅ Files ≤ 250 lines?
- ✅ TypeScript strict?
- ✅ No premature optimization?

### 6. Present Plan
Format:
```md
## Summary
[1-2 sentence summary]

## Affected Files
- file1.ts (modify)
- file2.tsx (create - unavoidable because...)
- file3.test.ts (create)

## Assumptions
- [List explicit assumptions]

## Approach
1. [Step by step]
2. [...]

## Pseudocode
[Key logic sketched out]

## Testing Strategy
[How to verify it works]

## Risks/Concerns
[Any potential issues]
```

---

## Model Preference
**Use Opus** — Deep analysis and pattern detection required.

---

## Example Usage
```
User: "Add OAuth login to the auth system"

You:
1. Read docs/claude/core-principles.md
2. Read docs/claude/tech-stack.md
3. Search for existing auth code
4. Analyze patterns
5. Draft plan
6. Present for approval
```

---

**Do NOT implement until plan is approved.**
