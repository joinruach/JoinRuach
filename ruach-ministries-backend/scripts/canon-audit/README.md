# Canon Audit System

**Truth in doctrine, precision in code.**

## Overview

The Canon Audit System validates doctrinal content against axiom hierarchy rules to prevent theological drift before it enters the codebase.

## What It Does

### 🔍 Detects Four Classes of Misalignment

1. **Grace vs Cost** - Ensures cost/sacrifice is established before grace is emphasized
2. **Identity vs Warfare** - Ensures identity in Christ is secure before warfare assignments
3. **Favor vs Obedience** - Ensures obedience is foundation before favor is promised
4. **Phase Progression** - Ensures advanced concepts don't appear in early formation phases

### 🎯 Severity Levels

- 🟢 **Safe** - No conflicts detected, canon-aligned
- 🟡 **Warning** - Potential issues, requires review
- 🔴 **Error** - Critical misalignment, must be corrected before publishing

## Setup

### 1. Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name it "Canon Audit" (or similar)
4. Copy the **Internal Integration Token**

### 2. Share Database with Integration

1. Open your Notion database in Notion
2. Click "Share" in the top right
3. Invite your integration by name
4. Ensure it has "Read content" permission

### 3. Get Database ID

The database ID is in your Notion database URL:

```
https://www.notion.so/{workspace}/{database_id}?v={view_id}
                                 ^^^^^^^^^^^^^^^^
```

### 4. Configure Environment Variables

Add to `ruach-ministries-backend/.env`:

```bash
NOTION_TOKEN=<YOUR_NOTION_TOKEN>
# (legacy fallback)
# NOTION_API_KEY=<YOUR_NOTION_TOKEN>
NOTION_DATABASE_ID=<YOUR_NOTION_DATABASE_ID>
```

### 5. Required Database Properties

Your Notion database should have these properties:

- **Title** or **Name** (title type) - Node title
- **Phase** (select type) - Formation phase: `awakening`, `separation`, `discernment`, `commission`, `stewardship`
- **Order** (number type, optional) - Display order
- **Axioms** (multi-select or relation, optional) - Related axioms

## Usage

### Run Full Audit (Export + Validate)

```bash
cd ruach-ministries-backend
tsx scripts/canon-audit/index.ts
```

### Run Audit with Cached Export

```bash
tsx scripts/canon-audit/index.ts --skip-export
```

### View Help

```bash
tsx scripts/canon-audit/index.ts --help
```

## Output

### Console Output

Real-time feedback as nodes are audited:

```
🔍 Starting audit of 47 nodes...

🟢 Who You Are in Christ [awakening]
🟡 The Cost of Following [awakening]
   🟡 grace-vs-cost: Grace introduced before cost is established
🔴 Spiritual Warfare Basics [awakening]
   🔴 phase-progression: Prohibited theme "spiritual warfare" found in awakening phase
   🔴 identity-vs-warfare: Warfare teaching without identity foundation
```

### Reports Generated

#### Markdown Report
`scripts/canon-audit/reports/canon-audit-YYYY-MM-DD.md`

Human-readable report with:
- Summary statistics
- Grouped results by severity
- Detailed conflict descriptions
- Actionable remediation guidance

#### JSON Report
`scripts/canon-audit/reports/canon-audit-YYYY-MM-DD.json`

Programmatic data for:
- CI/CD integration
- Dashboard visualization
- Historical tracking
- Pattern analysis

### Exported Data
`scripts/canon-audit/data/notion-export.json`

Cached Notion data for faster re-runs.

## Axiom Hierarchy Rules

### Primary Axiom Always Governs

1. **Cost → Grace**
   - Cost/obedience must be established before grace is offered
   - Prevents presumption and cheap grace

2. **Identity → Warfare**
   - Identity in Christ must be secure before warfare assignments
   - Prevents striving in the flesh

3. **Obedience → Favor**
   - Obedience must be foundation before favor is emphasized
   - Prevents entitlement mentality

## Phase Constraints

### Awakening
✅ Allowed: identity, calling, holiness, separation from world, truth vs comfort
❌ Prohibited: advanced spiritual warfare, leadership commissioning, stewarding inheritance

### Separation
✅ Allowed: consecration, pruning, wilderness, testing, death to self, learning obedience
❌ Prohibited: public ministry, stewarding others, releasing inheritance

### Discernment
✅ Allowed: spiritual sight, testing spirits, wisdom, discerning truth, recognizing deception
❌ Prohibited: premature commissioning, stewarding inheritance before testing

### Commission
✅ Allowed: authority, assignment, spiritual warfare, building, leading others
❌ Prohibited: none (most themes available after proper formation)

### Stewardship
✅ Allowed: inheritance, legacy, multiplication, releasing others, wisdom transfer
❌ Prohibited: none (all themes available at this maturity)

## Integration

### Pre-Publish CI Check

Add to your deployment pipeline:

```bash
# Fail build if canon errors detected
tsx scripts/canon-audit/index.ts || exit 1
```

### Pre-Commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
if [ -f ruach-ministries-backend/.env ]; then
  cd ruach-ministries-backend
  tsx scripts/canon-audit/index.ts --skip-export || exit 1
fi
```

## Extending the System

### Add New Conflict Detectors

Edit `axiom-validators.ts`:

```typescript
export function detectMyCustomConflict(node: NotionNode): AxiomConflict[] {
  // Your validation logic
  return conflicts;
}

// Add to validateNode() function
export function validateNode(node: NotionNode, phaseConstraints: typeof PHASE_CONSTRAINTS): AxiomConflict[] {
  return [
    ...detectGraceVsCost(node),
    ...detectMyCustomConflict(node), // Add here
    // ...
  ];
}
```

### Customize Phase Constraints

Edit `types.ts`:

```typescript
export const PHASE_CONSTRAINTS: PhaseConstraints[] = [
  {
    phase: 'awakening',
    allowedThemes: ['identity', 'calling', /* add more */],
    prohibitedThemes: ['advanced warfare', /* add more */],
    ceilingAxioms: ['You are chosen', /* add more */]
  }
  // ...
];
```

### Customize Keyword Patterns

Edit `axiom-validators.ts`:

```typescript
const AXIOM_PATTERNS = {
  grace: [
    /\bgrace\b/gi,
    /\byour custom pattern\b/gi, // Add patterns
  ],
  // ...
};
```

## Philosophy

### Why This Matters

> "You never automate doctrine you haven't audited."

This system ensures:
- **Baseline truth** - Current state is known before enforcement begins
- **Ordered axioms** - Truth stays ordered under pressure
- **Faithful automation** - Guards encode righteousness, not rigidity
- **Continuous alignment** - Drift is detected before it becomes doctrine

### Design Principles

1. **Truth Over Comfort** - Precision matters more than validation
2. **Clarity Over Cleverness** - Simple detection beats complex AI
3. **Reflection Over Reaction** - Audit first, enforce second
4. **Evolution Over Perfection** - Refine rules based on real patterns

## Roadmap

### Phase 1: Audit ✅
- Export Notion canon
- Detect known conflicts
- Generate severity-coded reports

### Phase 2: Hierarchy (Next)
- Formalize axiom precedence rules
- Build conflict resolution system
- Document governance process

### Phase 3: Detection Library
- Expand pattern library
- Add scripture cross-reference validation
- Build context-aware detection

### Phase 4: Strapi Integration
- API-level guards
- Real-time validation
- Admin UI warnings

## Support

For issues or questions:
- Check existing patterns in `axiom-validators.ts`
- Review phase constraints in `types.ts`
- Examine sample reports in `reports/`
- Open issue with `[CANON-AUDIT]` prefix

---

**"Truth in Code, Clarity in Creation."**
