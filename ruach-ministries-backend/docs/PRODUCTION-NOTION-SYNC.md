# Production Notion → Strapi Sync Guide

**Safe deployment of canon content from Notion to production Strapi.**

---

## 🔐 Prerequisites

Before syncing to production:

- ✅ Notion integration configured and tested locally
- ✅ Canon audit passes (or known violations documented)
- ✅ Strapi production instance accessible
- ✅ Production API token with write permissions
- ✅ Database backup completed
- ✅ Rollback plan in place

---

## 🚀 Production Sync Workflow

### Step 1: Test Locally First

Always test the sync locally before touching production:

```bash
# Run full audit
npx tsx scripts/canon-audit/index.ts

# Preview import locally
npx tsx scripts/import-from-notion.ts --dry-run

# Import to local Strapi
npx tsx scripts/import-from-notion.ts
```

**Verify locally:**
- Content imported correctly
- Formation Scope assigned properly
- No validation errors
- Frontend displays correctly

---

### Step 2: Get Production Strapi API Token

#### Option A: Use Existing Token

If you already have a production API token, skip to Step 3.

#### Option B: Create New Token

1. **Access production Strapi admin:**
   ```
   https://api.joinruach.org/admin
   ```

2. **Navigate to Settings → API Tokens → Create**

3. **Configure token:**
   - **Name:** `Notion Production Sync`
   - **Token type:** `Full access` or `Custom` with:
     - ✅ `guidebook-nodes` → create, update
     - ✅ `formation-phases` → read, create
     - ✅ `canon-axioms` → read, create
   - **Duration:** `90 days` or `Unlimited`

4. **Copy token immediately** (won't be shown again)

5. **Store securely** (password manager or env file)

---

### Step 3: Set Production Environment Variables

Create a production-specific env file or use inline variables:

#### Option A: Inline Variables (Recommended)

```bash
# Set variables for this session only
STRAPI_URL=https://api.joinruach.org
STRAPI_API_TOKEN=<YOUR_PRODUCTION_API_TOKEN>
NOTION_API_KEY=<YOUR_NOTION_API_KEY>
NOTION_DB_GUIDEBOOK_NODES=<YOUR_NOTION_DATABASE_ID>
```

#### Option B: Production .env File (Less Secure)

Create `.env.production`:
```bash
STRAPI_URL=https://api.joinruach.org
STRAPI_API_TOKEN=<YOUR_PRODUCTION_API_TOKEN>
NOTION_API_KEY=<YOUR_NOTION_API_KEY>
NOTION_DB_GUIDEBOOK_NODES=<YOUR_NOTION_DATABASE_ID>
```

**Load it:**
```bash
export $(cat .env.production | xargs)
```

---

### Step 4: Backup Production Database

⚠️ **CRITICAL: Always backup before production sync**

#### Supabase Backup (Current Setup)

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/afajhmpbslnfofahzpnk
   ```

2. **Navigate to Database → Backups**

3. **Create Manual Backup:**
   - Click "Create Backup"
   - Label: `Pre-notion-sync-2025-12-30`
   - Wait for completion

#### Alternative: pg_dump

```bash
# Backup entire database
PGPASSWORD="Jesussaves1!" pg_dump \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.afajhmpbslnfofahzpnk \
  -d postgres \
  -F c \
  -f backup-$(date +%Y%m%d-%H%M%S).dump

# Verify backup file exists
ls -lh backup-*.dump
```

---

### Step 5: Preview Production Sync (Dry Run)

**ALWAYS run dry-run first:**

```bash
STRAPI_URL=https://api.joinruach.org \
STRAPI_API_TOKEN=your_production_token \
npx tsx scripts/import-from-notion.ts --dry-run
```

> **Token scope reminder:** The script uses `POST`/`PUT` on `formation-phases` and `guidebook-nodes`, so the API token must include create/update/delete for those content types (or be Full Access). Strapi will return `Method Not Allowed` if the token is read-only, so create a new token under **Settings → API Tokens** if you see that error.

**Expected output:**
```
🔄 Notion → Strapi Import
📍 Strapi URL: https://api.joinruach.org
⚠️  DRY RUN MODE - No changes will be made

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: Exporting from Notion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Fetched 22 nodes from Notion database

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 2: Validating Canon Alignment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  7 errors found - fix in Notion before importing
OR run with --skip-validation (not recommended)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 3: Importing to Strapi (DRY RUN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [DRY RUN] Would create: "The Narrow Gate" (Individual)
  [DRY RUN] Would update: "The Gospel" (Individual)
  [DRY RUN] Would skip: "Identity: Beloved Before Useful" (unchanged)
  ...

💡 This was a dry run. Run without --dry-run to apply changes.
```

**Review carefully:**
- How many nodes will be created vs updated?
- Are Formation Scopes correct?
- Any validation errors?

---

### Step 6: Handle Validation Errors (If Any)

If the dry run shows validation errors:

#### Option A: Fix in Notion (Recommended)

1. Review audit report:
   ```bash
   cat scripts/canon-audit/reports/canon-audit-2025-12-30.md
   ```

2. Fix issues in Notion:
   - Add missing phase assignments
   - Reorder identity before warfare content
   - Add cost/sacrifice context before grace

3. Re-run dry run

#### Option B: Skip Validation (Production Only)

⚠️ **Only if you understand the risks:**

```bash
# Skip validation for production import
STRAPI_URL=https://api.joinruach.org \
STRAPI_API_TOKEN=your_production_token \
npx tsx scripts/import-from-notion.ts --skip-validation --dry-run
```

---

### Step 7: Run Actual Production Sync

**After dry run looks good:**

```bash
STRAPI_URL=https://api.joinruach.org \
STRAPI_API_TOKEN=your_production_token \
npx tsx scripts/import-from-notion.ts
```

**OR skip validation if approved:**

```bash
STRAPI_URL=https://api.joinruach.org \
STRAPI_API_TOKEN=your_production_token \
npx tsx scripts/import-from-notion.ts --skip-validation
```

**Monitor output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 3: Importing to Strapi
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 Importing Guidebook Nodes...
  ✅ Created: "The Narrow Gate"
  🔄 Updated: "The Gospel: Grace, Not Performance"
  ⏭️  Skipped (unchanged): "Identity: Beloved Before Useful"
  ...

════════════════════════════════════════════════════════════
IMPORT SUMMARY
════════════════════════════════════════════════════════════

📖 Guidebook Nodes:
  ✅ Created: 5
  🔄 Updated: 12
  ⏭️  Skipped: 5

✅ Import complete!
```

---

### Step 8: Verify Production Import

#### Check Strapi Admin

1. **Open production admin:**
   ```
   https://api.joinruach.org/admin
   ```

2. **Navigate to Content Manager → Guidebook Nodes**

3. **Verify:**
   - ✅ New nodes appear
   - ✅ Updated nodes have new content
   - ✅ Formation Scope is set correctly
   - ✅ Checksums are populated

#### Check Frontend

1. **Open production site:**
   ```
   https://joinruach.org/formation/awakening
   ```

2. **Verify:**
   - ✅ Content displays correctly
   - ✅ No errors in browser console
   - ✅ Images/media load properly
   - ✅ Navigation works

#### Check API Directly

```bash
# Fetch guidebook nodes
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  https://api.joinruach.org/api/guidebook-nodes?populate=*

# Check specific node
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  https://api.joinruach.org/api/guidebook-nodes/1?populate=*
```

---

## 🔄 Incremental Updates

For ongoing content updates:

### Daily/Weekly Sync Workflow

```bash
# 1. Export latest from Notion
npx tsx scripts/canon-audit/index.ts

# 2. Review changes
git diff scripts/canon-audit/data/notion-export.json

# 3. Sync to production (checksum-based, only updates changed nodes)
STRAPI_URL=https://api.joinruach.org \
STRAPI_API_TOKEN=$PROD_TOKEN \
npx tsx scripts/import-from-notion.ts
```

**Benefits of checksum-based sync:**
- ✅ Only changed nodes are updated
- ✅ Unchanged nodes are skipped (fast)
- ✅ No duplicate data
- ✅ Safe to run repeatedly

---

## 🚨 Rollback Procedure

If something goes wrong:

### Option 1: Restore Database Backup

#### Supabase Dashboard

1. Go to Database → Backups
2. Select pre-sync backup
3. Click "Restore"
4. Confirm restoration

#### pg_restore Command

```bash
# Restore from dump file
PGPASSWORD="Jesussaves1!" pg_restore \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.afajhmpbslnfofahzpnk \
  -d postgres \
  -c \
  backup-20251230-120000.dump
```

### Option 2: Manual Deletion (Partial Rollback)

If only specific nodes are problematic:

1. Open Strapi Admin → Guidebook Nodes
2. Filter by `syncedToStrapi: true`
3. Select problematic nodes
4. Delete or unpublish

---

## ⚙️ Automation (Optional)

### Scheduled Sync (Cron)

Add to server crontab:

```bash
# Daily sync at 3 AM UTC
0 3 * * * cd /path/to/ruach-monorepo/ruach-ministries-backend && \
  STRAPI_URL=https://api.joinruach.org \
  STRAPI_API_TOKEN=$PROD_TOKEN \
  npx tsx scripts/import-from-notion.ts --skip-validation >> /var/log/notion-sync.log 2>&1
```

### GitHub Actions (CI/CD)

Create `.github/workflows/notion-sync.yml`:

```yaml
name: Notion → Production Sync

on:
  workflow_dispatch: # Manual trigger
  schedule:
    - cron: '0 3 * * *' # Daily at 3 AM

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd ruach-ministries-backend
          npm install

      - name: Run Notion Sync
        env:
          STRAPI_URL: https://api.joinruach.org
          STRAPI_API_TOKEN: ${{ secrets.STRAPI_API_TOKEN }}
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_DB_GUIDEBOOK_NODES: ${{ secrets.NOTION_DB_GUIDEBOOK_NODES }}
        run: |
          cd ruach-ministries-backend
          npx tsx scripts/import-from-notion.ts --skip-validation

      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Notion sync failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🔐 Security Best Practices

### API Token Management

1. **Rotate tokens regularly** (every 90 days)
2. **Use environment variables** (never commit tokens)
3. **Limit token scope** (only necessary permissions)
4. **Monitor token usage** (check Strapi logs)

### Notion Integration

1. **Read-only access** (integration only needs read)
2. **Specific database access** (not entire workspace)
3. **Audit integration access** (review quarterly)

### Database Backups

1. **Automated daily backups** (Supabase handles this)
2. **Pre-sync manual backups** (always)
3. **Test restore procedure** (verify backups work)

---

## 📊 Monitoring

### Sync Metrics to Track

- **Nodes synced** (created/updated/skipped)
- **Sync duration** (time to complete)
- **Validation errors** (canon violations)
- **API errors** (Notion or Strapi failures)

### Logging

Add to sync command:

```bash
# Log to file with timestamp
npx tsx scripts/import-from-notion.ts 2>&1 | \
  tee -a logs/notion-sync-$(date +%Y%m%d-%H%M%S).log
```

---

## 🆘 Troubleshooting

### "API token is invalid"

**Solution:** Regenerate production API token in Strapi admin

### "Canon validation failed"

**Solution:** Either fix in Notion or use `--skip-validation` flag

### "Database connection timeout"

**Solution:** Check Supabase pooler status, retry after 5 minutes

### "Formation Scope validation failed"

**Solution:** Lifecycle hooks are enforcing rules - check node type compatibility

---

## 📝 Production Sync Checklist

Before every production sync:

- [ ] Tested locally first
- [ ] Database backup created
- [ ] Dry run completed and reviewed
- [ ] Validation errors addressed (or documented)
- [ ] Rollback plan ready
- [ ] Off-hours deployment (low traffic time)
- [ ] Monitoring ready (watch logs during sync)
- [ ] Frontend verification plan ready

After sync:

- [ ] Strapi admin checked
- [ ] Frontend verified
- [ ] API responses tested
- [ ] No errors in logs
- [ ] Team notified of changes

---

**Production sync ready. Deploy with confidence.** 🚀
