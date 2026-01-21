# Telegram Webhook - Paranoid Mode Runbook

**Target Audience:** Operators, DevOps, On-Call Engineers
**Last Updated:** 2026-01-21
**Related:** TELEGRAM_PRODUCTION_HARDENING.md, TELEGRAM_FINAL_VERIFICATION.md

---

## 🎯 Quick Reference

### Configuration Modes

| Mode | REQUIRE_REDIS | Behavior | Use Case |
|------|---------------|----------|----------|
| **Staging** | `false` | Fail-open (works without Redis) | Pre-prod testing |
| **Production** | `false` | Fail-open (graceful degradation) | High availability priority |
| **Paranoid** | `true` | Fail-closed (rejects if Redis down) | Security priority |

---

## 🚨 Incident Response

### Scenario 1: Redis is Down (Fail-Closed Mode)

**Symptoms:**
```bash
# Logs show:
[tg.blocked.redis_fail_closed] Redis required but not configured
counter: tg.blocked.redis_fail_closed
```

**What's happening:**
- `TELEGRAM_REQUIRE_REDIS=true` is set
- Redis is unreachable (Upstash outage, network issue, credentials rotated)
- ALL webhook requests are being silently blocked (return 200, no processing)

**Impact:**
- ❌ No messages are being captured (zero throughput)
- ✅ No duplicate processing
- ✅ No security bypass
- ⚠️ Users see no error (silent block), but bot appears dead

**Immediate Action (Temporary Fix):**

```bash
# Option A: Switch to fail-open mode (5 second change)
# In production environment variables:
TELEGRAM_REQUIRE_REDIS=false

# Redeploy or restart service
vercel env rm TELEGRAM_REQUIRE_REDIS production
vercel env add TELEGRAM_REQUIRE_REDIS production
# Enter: false

# Trigger deployment
git commit --allow-empty -m "chore: switch to Redis fail-open"
git push
```

**Expected behavior after fix:**
- ✅ Messages resume processing
- ⚠️ Deduplication disabled (Telegram retries may create duplicates)
- ⚠️ Rate limiting disabled (flood attacks possible)

**Root Cause Investigation:**

```bash
# 1. Check Upstash Redis status
curl https://status.upstash.com/

# 2. Test Redis connectivity
curl https://$UPSTASH_REDIS_REST_URL/ping \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
# Expected: {"result":"PONG"}

# 3. Check credentials
echo $UPSTASH_REDIS_REST_URL    # Should be: https://xxx.upstash.io
echo $UPSTASH_REDIS_REST_TOKEN  # Should be: long base64 string

# 4. Check Redis dashboard
# Login to: https://console.upstash.com/redis
# Verify: Database status = "Active"
```

**Permanent Fix:**

1. **If Redis is healthy but credentials expired:**
   ```bash
   # Rotate credentials in Upstash dashboard
   # Update environment variables
   vercel env add UPSTASH_REDIS_REST_URL production
   vercel env add UPSTASH_REDIS_REST_TOKEN production

   # Redeploy
   ```

2. **If Redis is down (Upstash outage):**
   - Monitor: https://status.upstash.com/
   - Keep `TELEGRAM_REQUIRE_REDIS=false` until resolved
   - Set calendar reminder to re-enable after 24h stability

3. **If Redis is unreachable (network/firewall):**
   - Check Vercel function egress rules
   - Verify Upstash allows traffic from deployment region
   - Test with `curl` from deployment environment

**Recovery Verification:**

```bash
# 1. Re-enable fail-closed mode
TELEGRAM_REQUIRE_REDIS=true

# 2. Send test message to bot
# (from whitelisted user)
/whoami

# 3. Check logs for successful capture
grep "tg.forwarded.capture_ok" logs
# Should see: [tg.forwarded.capture_ok] Message captured successfully

# 4. Monitor counters for 5 minutes
grep "tg.blocked.redis_fail_closed" logs
# Should see: zero occurrences
```

---

### Scenario 2: Capture API is Down

**Symptoms:**
```bash
# Logs show:
[tg.forwarded.capture_fail] Capture API error
status: 500
counter: tg.forwarded.capture_fail
```

**What's happening:**
- Telegram webhook is healthy
- Messages pass all security layers
- `/api/capture` endpoint is failing (Strapi down, AI API timeout, etc.)

**Impact:**
- ✅ Webhook still responds 200 to Telegram (no retry storm)
- ❌ Messages are NOT captured to Strapi
- ⚠️ User sees error message in Telegram: "❌ Capture failed: ..."

**Acceptable Loss Behavior:**

**Current:** Messages are lost (no retry queue)

**Why this is acceptable (for now):**
- Users get immediate feedback (error message in chat)
- Can resend message when bot recovers
- Telegram update_id is idempotent (resend won't duplicate)

**Immediate Action:**

```bash
# 1. Check capture API health
curl https://yourdomain.com/api/capture \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-capture-secret: $CAPTURE_SECRET" \
  -d '{"text":"health check","source":"manual"}'

# Expected: 200 OK
# If 500: Continue investigation

# 2. Check Strapi health
curl https://yourdomain.com:1337/_health
# Expected: {"status":"ok"}

# 3. Check AI API (Anthropic)
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model":"claude-3-haiku-20240307",
    "max_tokens":10,
    "messages":[{"role":"user","content":"test"}]
  }'
# Expected: 200 OK with response
```

**Common Causes:**

1. **Strapi is down:**
   - Check: `docker ps` or `systemctl status strapi`
   - Fix: Restart Strapi service

2. **Anthropic API timeout:**
   - Check: https://status.anthropic.com/
   - Fix: Wait for recovery or implement timeout increase

3. **Capture secret mismatch:**
   - Check: `echo $CAPTURE_SECRET` matches in both webhook and capture API
   - Fix: Update environment variable

4. **Database connection exhausted:**
   - Check: Postgres connection count
   - Fix: Restart Postgres or increase max_connections

**Future Enhancement (Retry Queue):**

If this becomes a frequent issue, implement async retry:

```typescript
// Pseudocode - NOT implemented yet
if (!captureRes.ok) {
  // Instead of immediate failure, enqueue for retry
  await redis.lpush('tg:retry-queue', JSON.stringify({
    text: parsed.body,
    userId: actor.userId,
    timestamp: Date.now(),
    attempts: 0
  }));

  // Tell user we'll retry
  await sendReply(chatId, "⏳ Capture queued. Will retry automatically.");
}

// Separate worker process drains queue
```

**Decision Point:** Implement retry queue if:
- Capture API downtime > 5 minutes per month
- User complaints about lost messages
- Message volume > 100/day

---

### Scenario 3: High Rate Limit Hits (Potential Attack)

**Symptoms:**
```bash
# Logs show high frequency of:
[tg.blocked.ratelimit] Rate limit exceeded
counter: tg.blocked.ratelimit
userId: 123456
```

**What's happening:**
- Single user sending > 30 messages per minute
- Or single chat receiving > 60 messages per minute

**Impact:**
- ✅ Attack is mitigated (blocked silently)
- ✅ Telegram doesn't retry (200 OK response)
- ⚠️ Legitimate user might be affected if they're the attacker

**Investigation:**

```bash
# 1. Check if legitimate user or attacker
grep "tg.blocked.ratelimit" logs | grep "userId: 123456" | wc -l
# High count = likely attacker

# 2. Check Redis directly
curl https://$UPSTASH_REDIS_REST_URL/keys/tg:rl:user:123456:* \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
# Shows active rate limit keys

# 3. Get current count
curl https://$UPSTASH_REDIS_REST_URL/get/tg:rl:user:123456:$(date +%s | awk '{print int($1/60)}') \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
# Shows current minute's message count
```

**Action:**

**If legitimate user hitting limit:**
```bash
# Option A: Temporarily increase limit (not recommended)
# Edit route.ts constants (requires redeploy):
const RATE_LIMIT_USER = 60; // Increased from 30

# Option B: Remove user from whitelist temporarily
# They can use bot when rate limit window expires (1 minute)
```

**If attacker:**
```bash
# Option A: Remove from whitelist (permanent block)
# Edit .env:
TELEGRAM_ALLOWED_USER_IDS=999999  # Remove 123456

# Option B: Do nothing (rate limit already working)
# Rate limit will expire in 1 minute, they'll be re-limited
```

**Monitoring:**

```bash
# Set up alert if rate limit hits > 100/hour
grep -c "tg.blocked.ratelimit" logs
# Alert threshold: > 100
```

---

## 📊 Health Checks

### Daily Checks (Automated)

```bash
#!/bin/bash
# Save as: scripts/telegram-health-check.sh

# Check counters for last 24 hours
echo "=== Telegram Webhook Health (Last 24h) ==="

echo "✅ Successful captures:"
grep -c "tg.forwarded.capture_ok" logs

echo "❌ Failed captures:"
grep -c "tg.forwarded.capture_fail" logs

echo "🚫 Blocked (whitelist):"
grep -c "tg.blocked.whitelist" logs

echo "⏱️ Blocked (rate limit):"
grep -c "tg.blocked.ratelimit" logs

echo "🔁 Blocked (duplicate):"
grep -c "tg.blocked.duplicate" logs

echo "❗ Blocked (Redis fail-closed):"
grep -c "tg.blocked.redis_fail_closed" logs

# Alert if Redis fail-closed > 0
if grep -q "tg.blocked.redis_fail_closed" logs; then
  echo "⚠️ ALERT: Redis fail-closed mode active!"
fi

# Alert if capture fail rate > 10%
success=$(grep -c "tg.forwarded.capture_ok" logs)
fail=$(grep -c "tg.forwarded.capture_fail" logs)
total=$((success + fail))
if [ $total -gt 0 ]; then
  fail_rate=$((fail * 100 / total))
  if [ $fail_rate -gt 10 ]; then
    echo "⚠️ ALERT: Capture failure rate: ${fail_rate}%"
  fi
fi
```

### Pre-Deploy Checks

```bash
# Before deploying to production:

# 1. Verify environment parity
diff <(vercel env ls staging) <(vercel env ls production)
# Only differences should be:
# - TELEGRAM_REQUIRE_REDIS (staging=false, prod=true)
# - LOG_STACKS (staging=true, prod=false)

# 2. Verify secrets are set
vercel env get TELEGRAM_WEBHOOK_SECRET production
vercel env get CAPTURE_SECRET production
vercel env get UPSTASH_REDIS_REST_URL production
vercel env get UPSTASH_REDIS_REST_TOKEN production

# 3. Run security tests
pnpm test security-invariants

# 4. Test webhook in staging
curl https://staging.yourdomain.com/api/telegram/webhook \
  -X POST \
  -H "x-telegram-bot-api-secret-token: $TELEGRAM_WEBHOOK_SECRET" \
  -H "content-type: application/json" \
  -d '{"update_id":1,"message":{"message_id":1,"date":1234567890,"chat":{"id":123,"type":"private"},"from":{"id":999999},"text":"test"}}'
# Expected: 200 OK
```

---

## 🔧 Environment Variable Reference

### Required (Production)

```bash
TELEGRAM_BOT_TOKEN=1234567890:AAH_xxxxx
TELEGRAM_WEBHOOK_SECRET=<openssl rand -base64 32>
TELEGRAM_ALLOWED_USER_IDS=123456,789012
TELEGRAM_REQUIRE_WHITELIST=true
TELEGRAM_SILENT_BLOCK=true
CAPTURE_SECRET=<openssl rand -base64 32>
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=<from Upstash dashboard>
STRAPI_URL=https://cms.yourdomain.com
STRAPI_API_TOKEN=<from Strapi admin>
ANTHROPIC_API_KEY=sk-ant-xxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Optional (Tuning)

```bash
TELEGRAM_REQUIRE_REDIS=true  # Fail-closed mode (paranoid)
LOG_STACKS=false             # No stack traces in logs
```

### Staging Overrides

```bash
# Staging should match production except:
TELEGRAM_REQUIRE_REDIS=false  # Fail-open for testing
LOG_STACKS=true               # Stack traces for debugging
```

---

## 📈 Success Metrics

**Healthy state:**
- `tg.forwarded.capture_ok` > 0
- `tg.forwarded.capture_fail` < 5% of total
- `tg.blocked.redis_fail_closed` = 0
- `tg.blocked.ratelimit` < 10/hour (unless under attack)
- `tg.blocked.whitelist` < 5/hour (unless under attack)

**Alert thresholds:**
- Capture fail rate > 10%
- Redis fail-closed > 0
- Rate limit hits > 100/hour
- Whitelist blocks > 50/hour

---

## 🚀 Deployment Checklist

- [ ] Run `pnpm test security-invariants` (all pass)
- [ ] Verify env parity (staging vs prod)
- [ ] Rotate secrets if exposed in logs/screenshots
- [ ] Test webhook in staging
- [ ] Deploy to production
- [ ] Send test message (`/whoami`)
- [ ] Check logs for `tg.forwarded.capture_ok`
- [ ] Monitor for 5 minutes (no `redis_fail_closed`)
- [ ] Set calendar reminder: Review logs in 7 days

---

## 📞 Escalation

**If this runbook doesn't resolve the issue:**

1. Check related docs:
   - TELEGRAM_PRODUCTION_HARDENING.md
   - TELEGRAM_FINAL_VERIFICATION.md
   - TELEGRAM_INTEGRATION.md

2. Review code:
   - `apps/ruach-next/src/app/api/telegram/webhook/route.ts`
   - Look for recent changes in git history

3. Enable debug logging (temporarily):
   ```bash
   LOG_STACKS=true
   # Redeploy
   # Send test message
   # Review logs
   # IMPORTANT: Disable after debugging
   LOG_STACKS=false
   ```

4. Contact: (your team contact info)

---

**Last Updated:** 2026-01-21
**Maintained By:** DevOps Team
**Review Frequency:** Quarterly or after major incidents
