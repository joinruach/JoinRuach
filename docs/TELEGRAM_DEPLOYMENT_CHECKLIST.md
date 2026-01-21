# Telegram Webhook - Deployment Sanity Checks

**Date:** 2026-01-21
**Purpose:** Pre-deployment verification to ensure "boringly unbreakable" stays that way
**Time to Complete:** ~10 minutes

---

## 🎯 Critical Checks (DO NOT SKIP)

### ✅ 1. Webhook Secret Header Validation

**Why:** Prevents random internet traffic from pretending to be Telegram

**Check:**
```bash
# Verify secret is set in environment
echo $TELEGRAM_WEBHOOK_SECRET
# Should output: 32+ character random string

# Verify Telegram webhook is configured with same secret
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
# Look for: "has_custom_certificate": false
# Look for: "url": "https://yourdomain.com/api/telegram/webhook"

# Note: Secret token is NOT shown in response (security by design)
```

**Verify in code:**
```typescript
// apps/ruach-next/src/app/api/telegram/webhook/route.ts:160-166
const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!secretHeader || !expectedSecret || !constantTimeCompare(secretHeader, expectedSecret)) {
  safeLog("warn", "Invalid or missing webhook secret");
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
```

**Test:**
```bash
# Send request without secret (should fail)
curl https://yourdomain.com/api/telegram/webhook \
  -X POST \
  -H "content-type: application/json" \
  -d '{"update_id":1,"message":{"message_id":1,"date":1234567890,"chat":{"id":123,"type":"private"},"from":{"id":999999},"text":"test"}}'

# Expected: {"ok":false,"error":"Unauthorized"} with 401 status

# Send request with wrong secret (should fail)
curl https://yourdomain.com/api/telegram/webhook \
  -X POST \
  -H "content-type: application/json" \
  -H "x-telegram-bot-api-secret-token: wrong-secret" \
  -d '{"update_id":1,"message":{"message_id":1,"date":1234567890,"chat":{"id":123,"type":"private"},"from":{"id":999999},"text":"test"}}'

# Expected: {"ok":false,"error":"Unauthorized"} with 401 status
```

**Status:** ✅ Webhook secret validation is implemented

---

### ✅ 2. Upstream Body Size Limit

**Why:** Header-based check in code can be bypassed if Content-Length is missing/incorrect

**Platform-Specific Configuration:**

#### **Vercel (Most Likely)**

**Check:**
```bash
# Vercel has automatic limits
# Edge Functions: 1 MB request body (default)
# Serverless Functions: 4.5 MB request body (default)

# Verify deployment type
cat vercel.json
# Look for: "functions" config

# Our limit: 256 KB (more restrictive than Vercel default)
# Vercel's 1MB/4.5MB upstream limit is sufficient
```

**Action Required:** ✅ No action (Vercel enforces upstream)

**Documentation:**
- https://vercel.com/docs/functions/serverless-functions/runtimes#request-body-size
- Our 256KB header check is defense-in-depth

---

#### **Cloudflare Workers/Pages**

**Check:**
```bash
# Cloudflare Workers have 100 MB limit (default)
# Our 256 KB limit is much more restrictive

# Verify wrangler.toml (if using Cloudflare)
cat wrangler.toml
# Look for: limits section
```

**Recommended Configuration:**
```toml
# wrangler.toml
[limits]
max_request_body_size = 262144  # 256 KB in bytes
```

**Action Required:**
- If deploying to Cloudflare, add to `wrangler.toml`
- If using Cloudflare as proxy (not Workers), configure in dashboard:
  - Go to: Website → Rules → Transform Rules
  - Add rule: If request body size > 256 KB, block

---

#### **Nginx (Bare VPS/Self-Hosted)**

**Check:**
```bash
# Check current limit
nginx -T | grep client_max_body_size
# Default: 1m (1 MB)

# Check if config is set
cat /etc/nginx/sites-available/your-site.conf | grep client_max_body_size
```

**Required Configuration:**
```nginx
# /etc/nginx/sites-available/your-site.conf

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # Enforce 256 KB body limit
    client_max_body_size 256k;

    # Return 413 on oversized payloads
    error_page 413 = @request_too_large;

    location @request_too_large {
        return 413 '{"ok":false,"error":"Payload too large"}';
        add_header Content-Type application/json;
    }

    location /api/telegram/webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Action Required:**
```bash
# Apply configuration
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Apply changes

# Verify
curl -I https://yourdomain.com/api/telegram/webhook \
  -X POST \
  -H "content-length: 300000" \
  -H "content-type: application/json"
# Expected: 413 Payload Too Large
```

---

#### **Railway/Render/Heroku**

**Check:**
```bash
# These platforms typically use nginx or similar reverse proxy
# Body limits vary by platform:
# - Railway: 10 MB default
# - Render: 10 MB default
# - Heroku: 30 MB default (router limit)

# Our 256 KB header check provides additional protection
```

**Action Required:** ✅ No action (platform limits are adequate)

**Note:** Header-based check in code will reject oversized payloads when Content-Length is present.

---

### ✅ 3. Environment Parity (Staging vs Production)

**Why:** Prevents "works in staging, fails in prod" issues

**Check:**
```bash
# Compare environment variables
# Staging and production should differ ONLY in these 2 variables:

# 1. TELEGRAM_REQUIRE_REDIS
#    - Staging: false (fail-open for testing)
#    - Production: true (fail-closed for security)

# 2. LOG_STACKS
#    - Staging: true (debug mode)
#    - Production: false (no info leaks)

# All other variables MUST match
```

**Verification Script:**
```bash
#!/bin/bash
# Save as: scripts/verify-env-parity.sh

echo "=== Environment Parity Check ==="

# List of variables that MUST match
MUST_MATCH=(
  "TELEGRAM_BOT_TOKEN"
  "TELEGRAM_WEBHOOK_SECRET"
  "TELEGRAM_ALLOWED_USER_IDS"
  "TELEGRAM_REQUIRE_WHITELIST"
  "TELEGRAM_SILENT_BLOCK"
  "CAPTURE_SECRET"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
  "STRAPI_URL"
  "STRAPI_API_TOKEN"
  "ANTHROPIC_API_KEY"
  "NEXT_PUBLIC_APP_URL"
)

# Variables that SHOULD differ
SHOULD_DIFFER=(
  "TELEGRAM_REQUIRE_REDIS"  # staging=false, prod=true
  "LOG_STACKS"              # staging=true, prod=false
)

echo "✅ Variables that MUST match:"
for var in "${MUST_MATCH[@]}"; do
  staging_val=$(vercel env get "$var" staging 2>/dev/null)
  prod_val=$(vercel env get "$var" production 2>/dev/null)

  if [ "$staging_val" != "$prod_val" ]; then
    echo "❌ MISMATCH: $var"
    echo "   Staging:    $staging_val"
    echo "   Production: $prod_val"
  else
    echo "✅ $var: matches"
  fi
done

echo ""
echo "⚠️ Variables that SHOULD differ:"
for var in "${SHOULD_DIFFER[@]}"; do
  staging_val=$(vercel env get "$var" staging 2>/dev/null)
  prod_val=$(vercel env get "$var" production 2>/dev/null)

  if [ "$staging_val" = "$prod_val" ]; then
    echo "⚠️ WARNING: $var is identical in staging and production"
    echo "   Value: $staging_val"
  else
    echo "✅ $var: differs (expected)"
    echo "   Staging:    $staging_val"
    echo "   Production: $prod_val"
  fi
done
```

**Run:**
```bash
chmod +x scripts/verify-env-parity.sh
./scripts/verify-env-parity.sh
```

**Expected Output:**
```
✅ Variables that MUST match:
✅ TELEGRAM_BOT_TOKEN: matches
✅ TELEGRAM_WEBHOOK_SECRET: matches
✅ TELEGRAM_ALLOWED_USER_IDS: matches
✅ TELEGRAM_REQUIRE_WHITELIST: matches
✅ TELEGRAM_SILENT_BLOCK: matches
✅ CAPTURE_SECRET: matches
✅ UPSTASH_REDIS_REST_URL: matches
✅ UPSTASH_REDIS_REST_TOKEN: matches
✅ STRAPI_URL: matches
✅ STRAPI_API_TOKEN: matches
✅ ANTHROPIC_API_KEY: matches

⚠️ Variables that SHOULD differ:
✅ TELEGRAM_REQUIRE_REDIS: differs (expected)
   Staging:    false
   Production: true
✅ LOG_STACKS: differs (expected)
   Staging:    true
   Production: false
```

---

## 🧪 Regression Test Suite

**Why:** Prevents "clever" refactors from breaking security

**Run:**
```bash
cd apps/ruach-next
pnpm test security-invariants

# Expected: All 6 tests pass
# ✓ returns 200 on whitelist block when SILENT_BLOCK=true
# ✓ rate limit returns 200 and does not call fetch(/api/capture)
# ✓ duplicate update returns 200 without processing
# ✓ oversized payload triggers header-based reject path
# ✓ safeLog redacts nested authorization/cookie/jwt/session/bearer
# ✓ unknown update type does not throw and results in { ok: true }
```

**If any test fails:**
1. ❌ DO NOT deploy
2. ❌ DO NOT "fix" the test to pass
3. ✅ Review TELEGRAM_PRODUCTION_HARDENING.md
4. ✅ Fix the code to match security requirements
5. ✅ Update documentation if behavior intentionally changed

---

## 🔒 Security Polish

### Secret Rotation Check

**Check if secrets have been exposed:**
```bash
# Search git history for leaked secrets
git log --all --full-history --source --remotes -- '.env*'

# Search codebase for hardcoded secrets
grep -r "TELEGRAM_WEBHOOK_SECRET" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "CAPTURE_SECRET" . --exclude-dir=node_modules --exclude-dir=.git

# Search screenshots/logs for secrets
# (Manual check in Slack, Discord, etc.)
```

**If secrets were exposed:**
```bash
# Rotate immediately
export NEW_TELEGRAM_SECRET=$(openssl rand -base64 32)
export NEW_CAPTURE_SECRET=$(openssl rand -base64 32)

# Update environment
vercel env add TELEGRAM_WEBHOOK_SECRET production
# Paste: $NEW_TELEGRAM_SECRET

vercel env add CAPTURE_SECRET production
# Paste: $NEW_CAPTURE_SECRET

# Update Telegram webhook with new secret
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$NEXT_PUBLIC_APP_URL/api/telegram/webhook\",
    \"secret_token\": \"$NEW_TELEGRAM_SECRET\"
  }"

# Redeploy
git commit --allow-empty -m "chore: rotate webhook secrets"
git push
```

### Stack Trace Check

**Verify no stack traces in responses:**
```bash
# Check LOG_STACKS is false in production
vercel env get LOG_STACKS production
# Expected: false

# Check code doesn't return stacks in responses
grep -n "error.stack" apps/ruach-next/src/app/api/telegram/webhook/route.ts
# Should only appear in LOG_STACKS conditional blocks
```

**Test:**
```bash
# Force an error and check response
curl https://yourdomain.com/api/telegram/webhook \
  -X POST \
  -H "x-telegram-bot-api-secret-token: $TELEGRAM_WEBHOOK_SECRET" \
  -H "content-type: application/json" \
  -d 'invalid json'

# Response should NOT contain stack traces
# Expected: {"ok":false,"error":"..."}  (no stack property)
```

---

## ✅ Final Checklist

**Before deploying to production:**

- [ ] Webhook secret validation is active
- [ ] Upstream body limit is configured (platform-specific)
- [ ] Environment parity verified (staging vs prod)
- [ ] Regression tests pass (6/6)
- [ ] Secrets have NOT been exposed (or rotated if exposed)
- [ ] LOG_STACKS=false in production
- [ ] No stack traces in error responses

**After deployment:**

- [ ] Send test message to bot (`/whoami`)
- [ ] Verify log counter: `tg.forwarded.capture_ok`
- [ ] Check Strapi admin for captured message
- [ ] Monitor logs for 5 minutes (no `redis_fail_closed`)
- [ ] Verify rate limit (send 31 messages, 31st should be blocked)
- [ ] Set calendar reminder: Review logs in 7 days

---

## 📋 Platform-Specific Quick Reference

### Vercel (Recommended)

```bash
# Body limit: ✅ Automatic (1 MB edge, 4.5 MB serverless)
# No action required

# Environment parity check:
./scripts/verify-env-parity.sh

# Deploy:
git push  # Automatic deployment
```

### Nginx (Self-Hosted)

```bash
# Body limit: ⚠️ Manual configuration required
# Add to nginx.conf:
client_max_body_size 256k;

# Reload:
sudo nginx -t && sudo systemctl reload nginx

# Deploy:
npm run build && pm2 restart nextjs
```

### Cloudflare Workers

```bash
# Body limit: ⚠️ Manual configuration required
# Add to wrangler.toml:
[limits]
max_request_body_size = 262144

# Deploy:
wrangler deploy
```

---

## 🚀 Deployment Commands

### Vercel

```bash
# Preview deployment (test first)
vercel --prod=false

# Test preview URL
curl https://preview-url.vercel.app/api/telegram/webhook/health

# Production deployment
vercel --prod

# Verify
curl https://yourdomain.com/api/telegram/webhook/health
```

### Manual/VPS

```bash
# Build
cd apps/ruach-next
pnpm build

# Test build locally
pnpm start

# Deploy (example with PM2)
pm2 stop nextjs
pm2 start npm --name "nextjs" -- start
pm2 save

# Verify
curl http://localhost:3000/api/telegram/webhook/health
```

---

**Last Updated:** 2026-01-21
**Review Before Each Deployment:** Yes
**Estimated Time:** 10 minutes
