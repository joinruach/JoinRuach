# Clear Scripture Data - Instructions

## 1. Create Admin API Token

Navigate to your Strapi admin panel:
```
https://api.joinruach.org/admin
```

1. Settings → API Tokens → Create new API Token
2. Name: `Scripture Data Management`
3. Token type: `Full access`
4. Token duration: `Unlimited` or `90 days`
5. Copy the token (you'll only see it once)

## 2. Run Dry Run First

Check what would be deleted:

```bash
cd ruach-ministries-backend/scripts

STRAPI_URL=https://api.joinruach.org \
STRAPI_TOKEN=your_token_here \
npx tsx clear-scripture-data.ts --dry-run
```

Expected output:
```
📊 Counting entries (no deletion)...

  scripture-verses: 1,533 entries
  scripture-books: 1 entries
  scripture-tokens: 15,420 entries
  scripture-lemmas: 8,200 entries
  scripture-alignments: 12,100 entries
  scripture-themes: 245 entries
  scripture-works: 1 entries

📊 Total: 37,499 entries would be deleted

⚠️  Run without --dry-run to actually delete
```

## 3. Clear Data (if needed)

Remove `--dry-run` to actually delete:

```bash
STRAPI_URL=https://api.joinruach.org \
STRAPI_TOKEN=your_token_here \
npx tsx clear-scripture-data.ts
```

It will wait 5 seconds before deletion (Ctrl+C to cancel).

## 4. Verify Clean State

Run dry-run again to confirm:
```bash
STRAPI_URL=https://api.joinruach.org \
STRAPI_TOKEN=your_token_here \
npx tsx clear-scripture-data.ts --dry-run
```

Should show:
```
📊 Total: 0 entries would be deleted
```

---

## Why Clear?

Starting fresh ensures:
- No duplicate verses from broken v2 extraction
- Clean validation (no mixed old/new data)
- Idempotency testing (re-import produces same result)
- Accurate counts (matches canonical structure)
