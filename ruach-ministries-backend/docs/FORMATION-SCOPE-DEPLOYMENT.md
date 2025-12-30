# Formation Scope Deployment Guide

**Authority:** Formation Scope Assignment (2025-12-30)
**Status:** Production Ready
**Version:** 1.0.0

---

## Overview

Formation Scope defines who a guidebook node is meant to govern:

- **Individual** - Personal conscience, repentance, discernment, obedience
- **Household** - Family alignment, shared rhythms, domestic order
- **Ecclesia** - Remnant recognition, mutual accountability, shared identity
- **Network** - Structure, authority distribution, multiplication

This deployment adds Formation Scope as a **required field** with validation rules that prevent misuse.

---

## What Changed

### Schema Changes

**File:** `src/api/guidebook-node/content-types/guidebook-node/schema.json`

Added `formationScope` field:
```json
{
  "formationScope": {
    "type": "enumeration",
    "enum": ["Individual", "Household", "Ecclesia", "Network"],
    "required": true,
    "default": "Individual"
  }
}
```

### New Validators

**File:** `src/validators/formation-scope.js`

- Validates scope is recognized
- Enforces node type → scope compatibility
- Checks phase → scope constraints
- Placeholder for future gating logic

**Rules enforced:**
- `Reflection` and `Assessment` → `Individual` only
- `Confrontation` → `Individual` only
- `Teaching` → All scopes
- `Exercise` → Not `Network`

### Lifecycle Hooks Updated

**File:** `src/api/guidebook-node/content-types/guidebook-node/lifecycles.js`

- Added Formation Scope validation to `beforeCreate`
- Added Formation Scope validation to `beforeUpdate`
- Runs alongside axiom hierarchy validation

### Import Script Enhanced

**File:** `scripts/import-from-notion.ts`

- Added Formation Scope mapping table
- Auto-assigns scope based on node title
- Falls back to phase-based defaults

### Migration Script

**File:** `scripts/migrate-formation-scope.ts`

- Sets Formation Scope for existing records
- Supports dry-run mode
- Uses authoritative scope assignments

---

## Deployment Steps

### Phase 1: Development Testing (30 minutes)

#### 1. Restart Strapi

```bash
cd ruach-ministries-backend

# Strapi will detect schema changes and create database migration
pnpm develop
```

**Expected:**
- Strapi starts successfully
- New `formationScope` column added to `guidebook_nodes` table
- Admin UI shows new "Formation Scope" field

#### 2. Test Manual Creation

1. Open Strapi Admin: http://localhost:1337/admin
2. Navigate to: **Content Manager → Guidebook Nodes**
3. Click **"Create new entry"**
4. Fill required fields:
   - Title: "Test Individual Node"
   - Content: "Test content"
   - Node Type: "Teaching"
   - **Formation Scope: "Individual"**
   - Check sum: "test123"
   - Order in Phase: 1
5. Click **"Save"**

**Expected:** ✅ Node created successfully

#### 3. Test Validation Rules

**Test 1: Invalid Scope + Node Type**

1. Create new node with:
   - Node Type: "Reflection"
   - Formation Scope: "Network"
2. Try to save

**Expected:** ❌ Validation error:
```
Formation scope validation failed
Node Type "Reflection" cannot use Formation Scope "Network"
Allowed scopes for Reflection: Individual
```

**Test 2: Valid Combinations**

Try these valid combinations:
- Teaching + Individual ✅
- Teaching + Household ✅
- Teaching + Ecclesia ✅
- Teaching + Network ✅
- Confrontation + Individual ✅
- Exercise + Individual ✅
- Exercise + Ecclesia ✅

#### 4. Run Migration (Dry Run)

```bash
npx tsx scripts/migrate-formation-scope.ts --dry-run
```

**Expected output:**
```
🔄 Formation Scope Migration
📍 Strapi URL: http://localhost:1337
⚠️  DRY RUN MODE - No changes will be made

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: Fetching Guidebook Nodes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Found X nodes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 2: Analyzing Formation Scopes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Formation Scope Distribution:
  Individual: 42 nodes
  Household: 0 nodes
  Ecclesia: 3 nodes
  Network: 1 node

X nodes need updating

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 3: Updating Nodes (DRY RUN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [DRY RUN] Would update "The Narrow Gate" → Individual
  [DRY RUN] Would update "The Remnant Pattern" → Ecclesia
  ...

💡 This was a dry run. Run without --dry-run to apply changes.
```

#### 5. Review Dry Run Results

Check the scope assignments match your expectations:
- Most Awakening/Discernment → Individual ✅
- Remnant/Community nodes → Ecclesia ✅
- "Distributed Kingdom Order" → Network ✅

#### 6. Run Actual Migration

```bash
npx tsx scripts/migrate-formation-scope.ts
```

**Expected:**
```
✅ Updated "The Narrow Gate" → Individual
✅ Updated "The Remnant Pattern" → Ecclesia
✅ Updated "Distributed Kingdom Order" → Network
...

✅ Migration complete!
```

#### 7. Verify in Strapi Admin

1. Open Content Manager → Guidebook Nodes
2. Check a few nodes have correct Formation Scope
3. Try editing a node and changing scope to invalid combination
4. Verify validation blocks the save

---

### Phase 2: Import from Notion (Optional)

If you're using Notion as source of truth:

#### 1. Test Notion Import (Dry Run)

```bash
npx tsx scripts/import-from-notion.ts --dry-run
```

**Check output includes Formation Scope:**
```
📖 Importing Guidebook Nodes...
  [DRY RUN] Would upsert guidebook-nodes: {
    title: "The Narrow Gate",
    formationScope: "Individual",  ← Should be present
    ...
  }
```

#### 2. Import from Notion

```bash
npx tsx scripts/import-from-notion.ts
```

**Expected:**
- Nodes created/updated with correct Formation Scope
- Validation passes for all nodes

---

### Phase 3: Production Deployment

⚠️ **Prerequisites:**
- All development testing passed
- Database backup created
- Deployment window scheduled

#### 1. Backup Production Database

Follow your hosting provider's backup procedure.

#### 2. Deploy Code

```bash
# Commit changes
git add .
git commit -m "feat(formation): Add Formation Scope field with validation"
git push

# Deploy to production (your deployment process)
```

#### 3. Restart Strapi (Production)

Strapi will automatically run database migration on startup.

**Monitor logs for:**
```
[DATABASE] Migration successful
```

#### 4. Run Migration (Production Dry Run)

```bash
STRAPI_URL=https://api.joinruach.org \
STRAPI_API_TOKEN=<prod-token> \
npx tsx scripts/migrate-formation-scope.ts --dry-run
```

**Review output carefully.**

#### 5. Run Migration (Production)

```bash
STRAPI_URL=https://api.joinruach.org \
STRAPI_API_TOKEN=<prod-token> \
npx tsx scripts/migrate-formation-scope.ts
```

#### 6. Verify Production

1. Open production Strapi admin
2. Check Content Manager → Guidebook Nodes
3. Verify Formation Scope is set correctly
4. Test creating a new node
5. Test editing an existing node

#### 7. Verify Frontend

1. Open production site
2. Navigate to formation pages
3. Verify content still loads correctly
4. Check browser console for errors

---

## Validation Rules Reference

### Node Type → Formation Scope Matrix

| Node Type      | Individual | Household | Ecclesia | Network |
|----------------|------------|-----------|----------|---------|
| Teaching       | ✅         | ✅        | ✅       | ✅      |
| Confrontation  | ✅         | ❌        | ❌       | ❌      |
| Exercise       | ✅         | ✅        | ✅       | ❌      |
| Reflection     | ✅         | ❌        | ❌       | ❌      |
| Assessment     | ✅         | ❌        | ❌       | ❌      |

### Phase → Formation Scope Constraints

| Phase         | Allowed Scopes                           |
|---------------|------------------------------------------|
| Awakening     | Individual, Ecclesia                     |
| Separation    | Individual, Household, Ecclesia          |
| Discernment   | Individual, Household, Ecclesia          |
| Warfare       | Individual, Ecclesia                     |
| Commissioning | Individual, Ecclesia, Network            |
| Stewardship   | Individual, Household, Ecclesia, Network |

---

## Troubleshooting

### "Formation scope validation failed"

**Problem:**
```
Formation scope validation failed
Node Type "Reflection" cannot use Formation Scope "Ecclesia"
```

**Solution:**
- Change Formation Scope to "Individual"
- OR change Node Type to "Teaching" or "Exercise"

### "Invalid formation scope"

**Problem:**
```
Invalid formation scope: "Community"
Must be one of: Individual, Household, Ecclesia, Network
```

**Solution:**
Use exact values:
- `Individual` (not "Personal" or "Self")
- `Household` (not "Family" or "Home")
- `Ecclesia` (not "Community" or "Church")
- `Network` (not "Distributed" or "System")

### Migration shows unexpected scope assignments

**Problem:**
Node "Spiritual Warfare 101" → Individual, but should be Ecclesia

**Solution:**
1. Check `FORMATION_SCOPE_MAP` in `scripts/migrate-formation-scope.ts`
2. Add explicit mapping:
   ```typescript
   'spiritual warfare 101': 'Ecclesia',
   ```
3. Re-run migration

### Existing nodes fail validation after migration

**Problem:**
Node created before migration now fails validation rules

**Likely cause:**
- Node has nodeType + formationScope combination that's now invalid
- Example: Reflection + Ecclesia

**Solution:**
1. Query for problematic nodes:
   ```bash
   # In Strapi admin, filter by:
   # - Node Type: Reflection
   # - Formation Scope: Not Individual
   ```
2. Update to valid combinations
3. OR adjust validation rules if business logic requires it

---

## Rollback Procedure

If you need to rollback:

### 1. Remove Required Constraint

Edit `schema.json`:
```json
"formationScope": {
  "type": "enumeration",
  "enum": ["Individual", "Household", "Ecclesia", "Network"],
  "required": false,  ← Change to false
  "default": "Individual"
}
```

### 2. Disable Validation

Comment out Formation Scope validation in `lifecycles.js`:
```javascript
// const scopeResult = await validateFormationScope(data);
// if (!scopeResult.valid) { ... }
```

### 3. Restart Strapi

```bash
pnpm develop
```

**This makes Formation Scope optional while preserving existing data.**

---

## Next Steps (Future Enhancements)

### 1. Formation Engine Gating

Implement `checkScopePrerequisites()` in `src/validators/formation-scope.js`:

```javascript
async function checkScopePrerequisites(userId, targetScope) {
  switch (targetScope) {
    case 'Individual':
      return true; // Always accessible

    case 'Household':
      // Check user completed core Individual nodes
      const individualProgress = await getUserProgress(userId, 'Individual');
      return individualProgress >= 80;

    case 'Ecclesia':
      // Check Individual + Household prerequisites
      return await hasCompletedFormationLevel(userId, 2);

    case 'Network':
      // Check full formation completion
      return await hasCompletedFormationLevel(userId, 4);
  }
}
```

### 2. Analytics Tracking

Add Formation Scope to analytics events:

```typescript
trackEvent('node_completed', {
  nodeId: node.id,
  formationScope: node.formationScope,
  userId: user.id
});
```

**Insights you can gain:**
- Individual vs Ecclesia completion rates
- Where users get stuck in scope progression
- Network nodes accessed prematurely (red flag)

### 3. Notion Database Enhancement

Add "Formation Scope" select property to Notion:

**Options:**
- Individual
- Household
- Ecclesia
- Network

**Benefits:**
- Visual clarity in Notion
- Import script can use explicit values
- Reduces auto-detection errors

### 4. Frontend Scope Indicators

Display Formation Scope in UI:

```tsx
<NodeCard>
  <ScopeBadge scope={node.formationScope} />
  <h3>{node.title}</h3>
  <p>{node.description}</p>
</NodeCard>
```

**Styling suggestions:**
- Individual: Blue (personal)
- Household: Green (intimate circle)
- Ecclesia: Purple (remnant community)
- Network: Gold (distributed authority)

---

## Related Documentation

- **Formation Scope Validator:** `src/validators/formation-scope.js`
- **Axiom Hierarchy Validator:** `src/validators/axiom-hierarchy.js`
- **Guidebook Node Schema:** `src/api/guidebook-node/content-types/guidebook-node/schema.json`
- **Lifecycle Hooks:** `src/api/guidebook-node/content-types/guidebook-node/lifecycles.js`
- **Notion Import Guide:** `docs/NOTION-SYNC-GUIDE.md`

---

**Formation Scope is now locked. Truth in code, clarity in creation.** 🔒
