# 🧪 Testing Guide - Security Fixes Verification

**Purpose:** Verify all high-priority security fixes from the launch readiness audit are working correctly.

**Duration:** ~30 minutes
**Environment:** Can be run in development or staging before production deployment

---

## Quick Start

### Automated Testing (Recommended)

```bash
# Make script executable
chmod +x scripts/verify-security-fixes.sh

# Run against development
./scripts/verify-security-fixes.sh http://localhost:3000 http://localhost:1337

# Run against staging
./scripts/verify-security-fixes.sh https://staging.joinruach.org https://api-staging.joinruach.org

# Run against production
./scripts/verify-security-fixes.sh https://joinruach.org https://api.joinruach.org
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════════╗
║                  ✓ ALL CRITICAL TESTS PASSED                  ║
╚════════════════════════════════════════════════════════════════╝
```

---

## Manual Testing

If the automated script fails or you want to manually verify, follow these steps:

### Test 1: CSP Headers (H2 Fix)

**What:** Verify Content Security Policy no longer uses wildcard for `connect-src`.

**Steps:**
1. Open your site: https://joinruach.org (or localhost:3000)
2. Open Browser DevTools (F12) → Console tab
3. Check for CSP violations (should be **none**)
4. Navigate to Network tab
5. Refresh page
6. Click any request → Headers tab
7. Find `Content-Security-Policy` header
8. Verify `connect-src` line contains:
   - ✅ `'self'`
   - ✅ `https://cdn.joinruach.org`
   - ✅ `https://api.convertkit.com`
   - ✅ `https://plausible.io`
   - ✅ `https://*.upstash.io`
   - ❌ **NOT** `*` (wildcard)

**Alternative: Test with curl**
```bash
curl -I https://joinruach.org | grep -i content-security-policy
```

**Expected Result:**
```
content-security-policy: default-src 'self'; ... connect-src 'self' https://cdn.joinruach.org ...
```

**✅ Pass Criteria:** CSP header present, `connect-src` has explicit domains (no wildcard)

---

### Test 2: HTTPS Enforcement (H4 Fix)

**What:** Verify HTTP requests redirect to HTTPS in production.

**Steps:**
1. Open terminal
2. Test HTTP request:
   ```bash
   curl -I http://joinruach.org
   ```
3. Check response:
   - Status: `301 Moved Permanently` or `302 Found`
   - Location header: `https://joinruach.org...`

**Expected Output:**
```
HTTP/1.1 301 Moved Permanently
Location: https://joinruach.org/
```

**Development Note:** This only works when `NODE_ENV=production`. In development, you'll see the page load normally over HTTP.

**✅ Pass Criteria:** HTTP redirects to HTTPS with 301/302 status code

---

### Test 3: Cookie Security (H3 Fix)

**What:** Verify refresh token cookies have `Secure`, `HttpOnly`, and `SameSite` flags.

**Steps:**
1. Navigate to: https://joinruach.org/login
2. Enter valid credentials and login
3. Open Browser DevTools (F12) → Application tab
4. Click "Cookies" in left sidebar
5. Select your domain (https://joinruach.org)
6. Find `refreshToken` cookie
7. Verify flags:
   - ✅ **Secure** checkbox is checked
   - ✅ **HttpOnly** checkbox is checked
   - ✅ **SameSite** = `Strict`

**Expected Configuration:**
| Flag | Value |
|------|-------|
| Secure | ✓ |
| HttpOnly | ✓ |
| SameSite | Strict |

**Backend Verification:**

Check Strapi logs on startup. If `NODE_ENV=production` but `COOKIE_SECURE=false`, you should see:
```
⚠️  WARNING: Refresh tokens will be sent over HTTP in production!
```

**✅ Pass Criteria:** All three flags present on `refreshToken` cookie

---

### Test 4: Login Loading State (M1 Fix)

**What:** Verify login page shows loading feedback and prevents double-submit.

**Steps:**
1. Navigate to: https://joinruach.org/login
2. Enter credentials (can be test/invalid)
3. Click "Login" button
4. **Observe immediately:**
   - Button text changes to "Signing in..."
   - Button becomes disabled (cursor changes to "not-allowed")
   - Email and password inputs become disabled
   - Cannot click button again

**Before Fix:**
- Button stays "Login"
- Can click multiple times
- No visual feedback

**After Fix:**
- Button shows "Signing in..."
- Button disabled
- Inputs disabled
- Single submission only

**✅ Pass Criteria:**
- Loading state visible during submission
- Form inputs disabled
- Button shows "Signing in..." text

---

### Test 5: Environment Variables

**What:** Verify production environment is configured correctly.

**Steps:**

1. **Check .env.production file exists:**
   ```bash
   ls -la .env.production
   ```

2. **Verify critical variables are set:**
   ```bash
   # In Next.js directory
   grep -E "NEXTAUTH_SECRET|COOKIE_SECURE|UPSTASH_REDIS" .env.production
   ```

3. **Expected values:**
   - `NEXTAUTH_SECRET` = 48+ random characters
   - `COOKIE_SECURE=true` (in Strapi backend)
   - `UPSTASH_REDIS_REST_URL` = valid Upstash URL
   - `NODE_ENV=production` (on production servers)

4. **Check for insecure placeholders:**
   ```bash
   grep -i "REPLACE_WITH\|change_me\|example\|test123" .env.production
   ```
   Should return **nothing** (all placeholders replaced).

**✅ Pass Criteria:** All production secrets set, no placeholders

---

### Test 6: Rate Limiting

**What:** Verify rate limiting prevents brute force attacks.

**Steps:**

1. **Test Login Rate Limit:**
   - Navigate to /login
   - Enter wrong password
   - Submit 6 times quickly
   - On 6th attempt, should see: "Too many login attempts. Please try again later."
   - Response status: `429 Too Many Requests`

2. **Test Contact Form Rate Limit:**
   - Navigate to /contact
   - Submit form 7 times quickly (limit: 6 per 10 minutes)
   - 7th attempt should be blocked

3. **Check Rate Limit Headers:**
   ```bash
   curl -I https://joinruach.org/api/auth/login
   ```
   Look for:
   - `X-RateLimit-Limit: 5`
   - `X-RateLimit-Remaining: 4` (decreases with each attempt)

**✅ Pass Criteria:** Rate limits active, 429 responses after threshold

---

## Integration Testing Scenarios

### Scenario 1: Full Authentication Flow

**Duration:** 5 minutes

1. **Signup:**
   - Navigate to /signup
   - Enter new email + password
   - Submit → verify redirect to /check-email
   - Check email inbox
   - Click confirmation link
   - Verify redirect to /confirmed?status=success

2. **Login:**
   - Click "Sign In Now"
   - Enter credentials
   - Verify loading state shows
   - Verify redirect to dashboard

3. **Session Persistence:**
   - Refresh page → still logged in
   - Open new tab → still logged in
   - Close all tabs, reopen → still logged in (until token expires)

4. **Logout:**
   - Click logout
   - Verify redirect to homepage
   - Try accessing /members/account → redirected to /login

**✅ Pass Criteria:** Complete flow works end-to-end

---

### Scenario 2: Cross-Tab Session Management

**Duration:** 2 minutes

1. Login in Tab A
2. Open Tab B (same browser)
3. Navigate to /members/account in Tab B
4. Verify session shared (no login prompt)
5. Logout in Tab A
6. Refresh Tab B
7. Verify Tab B now redirected to /login

**✅ Pass Criteria:** Session shared across tabs, logout affects all tabs

---

### Scenario 3: Token Refresh

**Duration:** 61 minutes (or mock time)**

1. Login and note timestamp
2. Wait 61 minutes (access token expires after 60 min)
3. Navigate to any protected page
4. Verify page loads without re-login
5. Check Network tab → should see refresh token request
6. Verify no UX interruption

**Alternative (Quick Test):**
- Mock time forward in browser DevTools
- Or modify JWT_MAX_AGE in auth.ts temporarily to 10 seconds

**✅ Pass Criteria:** Token refreshes silently, user not logged out

---

## Production Smoke Tests

**Run these immediately after deploying to production:**

### 1. Basic Connectivity
```bash
# Homepage responds
curl -I https://joinruach.org
# Expected: HTTP/1.1 200 OK

# API health check
curl https://api.joinruach.org/api/health
# Expected: {"status":"ok"}
```

### 2. HTTPS Working
```bash
# Check SSL certificate
openssl s_client -connect joinruach.org:443 -servername joinruach.org </dev/null 2>/dev/null | openssl x509 -noout -dates

# Expected: Valid dates
```

### 3. CSP Headers
```bash
curl -I https://joinruach.org | grep -i content-security-policy
# Expected: Header present, no wildcards
```

### 4. Authentication Works
- Login at https://joinruach.org/login
- Verify redirect to dashboard
- Verify membership page loads

### 5. Payment Flow
- Navigate to /give or membership page
- Click checkout button
- Verify Stripe Checkout opens
- Cancel and verify redirect back

---

## Regression Testing

**Ensure nothing broke after security fixes:**

### Features to Verify Still Work:

- [ ] Homepage loads
- [ ] Course pages load
- [ ] Video playback works
- [ ] Images load from CDN
- [ ] Contact form submits
- [ ] Newsletter signup works
- [ ] Testimonies page loads
- [ ] Member dashboard shows progress
- [ ] Stripe checkout works
- [ ] Comment posting works
- [ ] Moderation (if applicable)

---

## Troubleshooting

### Issue: CSP blocking resources

**Symptoms:** Console shows CSP violations, images/scripts not loading

**Solution:**
1. Note blocked domain in console error
2. Add to appropriate CSP directive in `next.config.mjs`:
   - Images: `img-src`
   - Scripts: `script-src`
   - API calls: `connect-src`
3. Redeploy

---

### Issue: HTTPS redirect not working

**Symptoms:** Site loads over HTTP

**Solution:**
1. Verify `NODE_ENV=production` is set
2. Check reverse proxy sends `x-forwarded-proto: https` header
3. Test middleware with logs:
   ```typescript
   console.log('Proto:', req.headers.get('x-forwarded-proto'));
   ```

---

### Issue: Cookies not setting

**Symptoms:** Login succeeds but session doesn't persist

**Solution:**
1. Check `COOKIE_SECURE=true` in backend
2. Verify site uses HTTPS (Secure cookies require HTTPS)
3. Check `SameSite` not too restrictive
4. Verify domain matches (not subdomain mismatch)

---

### Issue: Rate limiting too aggressive

**Symptoms:** Legitimate requests blocked with 429

**Solution:**
1. Check Redis connection (may be in-memory fallback)
2. Adjust thresholds in `src/lib/ratelimit.ts`
3. Whitelist IPs if needed
4. Check time windows reasonable

---

## Sign-Off

**Tested by:** ___________________________
**Date:** ___________________________
**Environment:** [ ] Development [ ] Staging [ ] Production
**All tests passed:** [ ] Yes [ ] No

**Failed tests (if any):**
_________________________________________________________________
_________________________________________________________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Next Steps After Testing

✅ **All tests passed?** → Proceed to deployment
❌ **Tests failed?** → Fix issues and re-test
⚠️ **Warnings?** → Review and document exceptions

**See Also:**
- `DEPLOYMENT_CHECKLIST.md` for full deployment procedure
- `LAUNCH_READINESS_AUDIT.md` for detailed audit findings
- `.env.production.example` for environment configuration

---

**Happy Testing! 🧪**
