# Canon Audit Quick Start

**Get your first audit running in 5 minutes.**

## Prerequisites

- [ ] Notion account with a database containing your canonical content
- [ ] Node.js 18+ and pnpm installed
- [ ] Notion API key and database ID (see setup below)

## Step 1: Create Notion Integration (2 minutes)

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name: `Canon Audit` (or your preferred name)
4. Associated workspace: Select your workspace
5. Click **"Submit"**
6. Copy the **"Internal Integration Token"** (starts with `secret_`)

## Step 2: Share Database with Integration (1 minute)

1. Open your canon database in Notion
2. Click **"Share"** button (top right)
3. Click **"Invite"**
4. Search for your integration name (`Canon Audit`)
5. Grant **"Can view"** permission (minimum)
6. Click **"Invite"**

## Step 3: Get Database ID (30 seconds)

1. Open your database in Notion
2. Look at the URL in your browser:
   ```
   https://www.notion.so/workspace/32charsOfDatabaseID?v=viewID
                                   ^^^^^^^^^^^^^^^^^^^^
   ```
3. Copy the 32-character database ID (between workspace and `?v=`)

## Step 4: Configure Environment (1 minute)

1. Navigate to backend directory:
   ```bash
   cd ruach-ministries-backend
   ```

2. Create/edit `.env` file:
   ```bash
   # Add these lines (replace with your actual values)
   NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## Step 5: Run Your First Audit (1 minute)

```bash
# Make sure you're in ruach-ministries-backend directory
cd ruach-ministries-backend

# Run the audit
tsx scripts/canon-audit/index.ts
```

## Expected Output

```
🔍 Canon Audit System

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: Exporting Notion Canon
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Fetched 47 nodes from Notion database
✅ Exported 47 nodes to scripts/canon-audit/data/notion-export.json

Step 2: Running Axiom Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟢 Who You Are in Christ [awakening]
🟡 The Cost of Following [awakening]
   🟡 grace-vs-cost: Grace introduced before cost is established
🔴 Spiritual Warfare Basics [awakening]
   🔴 phase-progression: Prohibited theme found in awakening phase
...

Step 3: Generating Reports
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Markdown report saved: scripts/canon-audit/reports/canon-audit-2025-12-29.md
✅ JSON report saved: scripts/canon-audit/reports/canon-audit-2025-12-29.json

============================================================
CANON AUDIT SUMMARY
============================================================
Total Nodes: 47
🟢 Safe: 32 (68.1%)
🟡 Warnings: 10 (21.3%)
🔴 Errors: 5 (10.6%)
============================================================

⚠️  5 node(s) require immediate correction.
⚠️  10 node(s) should be reviewed.

✅ Canon audit complete!
```

## What Just Happened?

1. **Exported** - Downloaded all content from your Notion database
2. **Validated** - Checked each node against axiom hierarchy rules
3. **Reported** - Generated severity-coded audit results

## Next Steps

### Review the Report

Open the markdown report:
```bash
open scripts/canon-audit/reports/canon-audit-$(date +%Y-%m-%d).md
```

Or view JSON programmatically:
```bash
cat scripts/canon-audit/reports/canon-audit-$(date +%Y-%m-%d).json | jq
```

### Fix Critical Issues (🔴 Errors)

Focus on these first - they represent canon misalignment that must be corrected:
- Grace emphasized without cost/sacrifice
- Warfare teaching without identity foundation
- Favor without obedience foundation
- Advanced concepts in early formation phases

### Review Warnings (🟡)

These may be false positives or contextual:
- Grace/Cost ratio imbalance (may be intentional)
- Order of introduction (may span multiple nodes)
- Phase ceiling violations (may need phase reassignment)

### Re-run Audit

After making fixes in Notion:
```bash
# Run full audit (re-exports from Notion)
tsx scripts/canon-audit/index.ts

# Or use cached export if content unchanged
tsx scripts/canon-audit/index.ts --skip-export
```

## Troubleshooting

### "Missing required environment variables"

**Solution:** Ensure `NOTION_API_KEY` and `NOTION_DATABASE_ID` are in `.env` file

### "Could not find database"

**Solutions:**
- Verify database ID is correct (32 characters)
- Ensure integration has access (check Share settings)
- Confirm integration has "Can view" permission

### "API request failed"

**Solutions:**
- Check API key is valid (starts with `secret_`)
- Verify integration hasn't been revoked
- Check internet connection

### No errors but empty results

**Solution:** Database may be empty or use different property names. Check:
- Database has content
- Properties match expected names (Title, Phase, etc.)
- See [README.md](./README.md#required-database-properties) for property requirements

## Database Requirements

Your Notion database should have these properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| **Title** or **Name** | Title | ✅ | Node title |
| **Phase** | Select | ⚠️ Recommended | Formation phase |
| **Order** | Number | ❌ Optional | Display order |
| **Axioms** | Multi-select | ❌ Optional | Related axioms |

### Phase Select Options

If using Phase property, configure these options:
- `awakening`
- `separation`
- `discernment`
- `commission`
- `stewardship`

## Advanced Usage

### Schedule Regular Audits

Add to cron:
```bash
# Daily audit at 6am
0 6 * * * cd /path/to/ruach-ministries-backend && tsx scripts/canon-audit/index.ts
```

### CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Canon Audit
  run: |
    cd ruach-ministries-backend
    tsx scripts/canon-audit/index.ts
  env:
    NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
    NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
```

### Customize Detection Rules

See [README.md](./README.md#extending-the-system) for how to:
- Add custom conflict detectors
- Modify phase constraints
- Customize keyword patterns
- Adjust severity thresholds

## Support

- **Full Documentation:** [README.md](./README.md)
- **Type Definitions:** [types.ts](./types.ts)
- **Validators:** [axiom-validators.ts](./axiom-validators.ts)
- **Report Generator:** [audit-report.ts](./audit-report.ts)

---

**Ready to lock in your canon? Run the audit now!** 🔒
