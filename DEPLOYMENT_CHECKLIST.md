# Deployment Checklist - Secure Cookie Fix

## Issue Summary

**Error:** `"Cannot send secure cookie over unencrypted connection"`

**Cause:** Strapi is behind a reverse proxy that terminates SSL, but the proxy headers weren't being trusted by Koa.

**Fix:** Enable proxy trust in Strapi + configure reverse proxy to send required headers.

---

## Changes Made

### 1. Server Configuration (`ruach-ministries-backend/config/server.js`)
- ✅ Added `proxy: true` in production to trust proxy headers
- ✅ Added startup validation warnings for misconfigured HTTPS

### 2. HTTPS Enforcement Middleware (`ruach-ministries-backend/src/middlewares/https-enforce.js`)
- ✅ Enhanced diagnostic logging for first production request
- ✅ Added proxy header validation and warnings
- ✅ Detects protocol mismatch between proxy headers and Koa state

### 3. Documentation
- ✅ Created `docs/PROXY_CONFIGURATION.md` with platform-specific guides
- ✅ Created nginx config with proper proxy headers (`docker/nginx/nginx.conf`)

---

## Pre-Deployment Checklist

### Code Changes
- [ ] Review changes in `config/server.js`
- [ ] Review changes in `src/middlewares/https-enforce.js`
- [ ] Run type check: `pnpm typecheck`
- [ ] Run build: `pnpm build`

### Environment Variables
- [ ] Verify `NODE_ENV=production` is set
- [ ] Verify `PUBLIC_URL=https://api.joinruach.org` is set
- [ ] **Optional:** Set `COOKIE_SECURE=false` if proxy can't be configured (NOT RECOMMENDED)

### Reverse Proxy Configuration

Choose your platform and follow the guide in `docs/PROXY_CONFIGURATION.md`:

#### Option A: Cloudflare (Recommended if using)
- [ ] SSL/TLS mode set to "Full" or "Full (Strict)"
- [ ] "Always Use HTTPS" enabled
- [ ] Verify Cloudflare sends `X-Forwarded-Proto: https`

#### Option B: Nginx
- [ ] SSL certificate installed
- [ ] Nginx config includes proper proxy headers
- [ ] Reload nginx: `sudo systemctl reload nginx`

#### Option C: AWS ALB
- [ ] HTTPS listener (port 443) with SSL certificate
- [ ] Target group points to Strapi (port 1337)
- [ ] Health check configured

---

## Post-Deployment Verification

### 1. Check Startup Logs

**Look for:**
- ✅ Proxy configuration: true
- 🔍 First production request - Proxy headers diagnostic

### 2. Verify Proxy Headers

Check the first request log shows:
- "x-forwarded-proto": "https"
- "secure": true

### 3. Test Login Flow

```bash
curl -X POST https://api.joinruach.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "test@example.com", "password": "test"}' \
  -c cookies.txt -v
```

**Success:** HTTP 200 with `Set-Cookie: refreshToken=...; Secure`

---

## Success Criteria

- [ ] No "Cannot send secure cookie" errors in logs
- [ ] Login returns 200 OK with `Set-Cookie` header
- [ ] Users can successfully log in from production

---

**Last Updated:** 2025-12-29
