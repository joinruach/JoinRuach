# Secure Cookie Fix - Implementation Summary

## Problem
Production authentication failing with error:
```
"Cannot send secure cookie over unencrypted connection"
```

## Root Cause
- Strapi sets `secure: true` on cookies in production (correct behavior)
- Backend receives HTTP requests from reverse proxy (proxy terminates SSL)
- Koa was NOT configured to trust `X-Forwarded-Proto` headers from proxy
- Result: Koa thinks connection is HTTP → refuses to set secure cookies

## Solution
Enable Koa proxy trust + ensure reverse proxy sends required headers

---

## Files Modified

### 1. `config/server.js`
**Lines:** 3-14, 20

**Changes:**
- Added production validation for HTTPS configuration
- Added `proxy: true` to trust proxy headers in production
- Warnings for misconfigured environments

**Why:** Tells Koa to trust `X-Forwarded-*` headers and set `ctx.request.secure = true`

### 2. `src/middlewares/https-enforce.js`
**Lines:** 13-90

**Changes:**
- Added first-request diagnostic logging
- Enhanced proxy header validation
- Protocol mismatch detection
- Better error messages

**Why:** Helps diagnose proxy configuration issues in production

---

## Files Created

### 1. `docs/PROXY_CONFIGURATION.md`
Complete guide for configuring:
- Nginx
- Cloudflare
- AWS ALB
- Caddy
- Traefik
- Docker Compose

### 2. `docker/nginx/nginx.conf`
Production-ready nginx config with:
- Proper `X-Forwarded-*` headers
- SSL termination
- Rate limiting
- Security headers
- Large file upload support

### 3. `DEPLOYMENT_CHECKLIST.md`
Step-by-step deployment and verification guide

---

## How It Works Now

### Before (Broken)
```
Client (HTTPS) → Proxy → Strapi (HTTP)
                          ↓
                   Koa sees HTTP connection
                          ↓
                   secure: false
                          ↓
                   ERROR: Can't set secure cookie!
```

### After (Fixed)
```
Client (HTTPS) → Proxy (sends X-Forwarded-Proto: https)
                          ↓
                   Strapi (proxy: true enabled)
                          ↓
                   Koa trusts proxy header
                          ↓
                   ctx.request.secure = true
                          ↓
                   ✅ Sets secure cookie successfully
```

---

## Deployment Instructions

### Quick Start
1. **Review changes:** Check modified files above
2. **Configure proxy:** Follow `docs/PROXY_CONFIGURATION.md` for your platform
3. **Deploy:** Push changes to production
4. **Verify:** Check logs for diagnostic output

### Detailed Steps
See `DEPLOYMENT_CHECKLIST.md` for complete checklist

---

## Verification

After deployment, check logs for:

✅ **Startup validation:**
```
Proxy configuration: true
```

✅ **First request diagnostic:**
```json
{
  "proxyConfig": {
    "koa_proxy_enabled": true
  },
  "headers": {
    "x-forwarded-proto": "https",
    "x-forwarded-host": "api.joinruach.org"
  },
  "request": {
    "protocol": "https",
    "secure": true
  }
}
```

✅ **Login success:**
```
POST /api/auth/login (108 ms) 200
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

---

## Troubleshooting

### Still failing?

**Check proxy headers:**
- View logs for `"x-forwarded-proto": "MISSING"`
- If missing → proxy not configured correctly
- Follow platform guide in `docs/PROXY_CONFIGURATION.md`

**Temporary workaround:**
```bash
# .env (production)
COOKIE_SECURE=false
```
⚠️ **Not recommended** - only use while fixing proxy configuration

---

## Technical Details

### Cookie Configuration
**File:** `src/api/auth/controllers/custom-auth.js`
**Lines:** 39-43, 201-206

```javascript
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production";

ctx.cookies.set("refreshToken", refreshToken, {
  httpOnly: true,
  secure: COOKIE_SECURE,  // ← Requires ctx.request.secure = true
  sameSite: "Strict",
  maxAge: REFRESH_TOKEN_EXPIRY * 1000,
});
```

### Koa Proxy Behavior
When `proxy: true` is set:
- Koa reads `X-Forwarded-Proto` header
- Sets `ctx.request.protocol` based on header value
- Sets `ctx.request.secure = true` if proto is "https"
- Allows secure cookies to be set

**Reference:** https://github.com/koajs/koa/blob/master/docs/api/request.md#requestip

---

## Security Notes

✅ **This fix is secure because:**
- Cookies still require HTTPS (via `X-Forwarded-Proto`)
- `httpOnly: true` prevents JavaScript access
- `sameSite: "Strict"` prevents CSRF
- Only trusts proxy headers in production
- Validates proxy configuration on startup

❌ **Do NOT:**
- Set `COOKIE_SECURE=false` in production (unless behind trusted proxy)
- Allow HTTP in production without reverse proxy
- Skip proxy header configuration

---

## Testing

### Local Testing (without SSL)
```bash
# .env.development
NODE_ENV=development
COOKIE_SECURE=false
```

### Production Testing (with proxy)
```bash
# .env.production
NODE_ENV=production
PUBLIC_URL=https://api.joinruach.org
# COOKIE_SECURE defaults to true (from NODE_ENV)
```

---

## Rollback

If deployment fails:
```bash
git revert HEAD
git push origin main
```

Then temporarily set:
```bash
COOKIE_SECURE=false
```

Until proxy configuration is fixed.

---

## Related Issues

- Custom auth controller: `src/api/auth/controllers/custom-auth.js:201-206`
- HTTPS enforcement: `src/middlewares/https-enforce.js`
- Server config: `config/server.js:20`

---

**Created:** 2025-12-29
**Status:** Ready for deployment
**Tested:** ⚠️ Requires production testing after deployment
