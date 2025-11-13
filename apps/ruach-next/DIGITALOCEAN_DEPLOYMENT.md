# DigitalOcean Deployment Guide for JoinRuach

## Current Status: Access Denied (403)

The site is returning "Access denied" which means the application is either not running or being blocked.

## Step-by-Step Deployment Fix

### 1. Verify the Fix is Deployed

**Check your DigitalOcean App Platform:**

1. Go to https://cloud.digitalocean.com/apps
2. Select your JoinRuach app
3. Click on the **"Activity"** tab
4. Check the latest deployment:
   - Is it using the latest commit? (Should be `6970210` or later)
   - Did it complete successfully?

**If the latest commit isn't deployed:**
- Click **"Settings" → "Force Rebuild and Deploy"**
- Wait for the build to complete

### 2. Check Build Logs

1. Go to **"Activity"** tab
2. Click on the latest deployment
3. Look for these in the build logs:

```bash
# Should see all packages building:
✓ @ruach/ai build completed
✓ @ruach/components build completed
✓ @ruach/addons build completed
✓ Next.js build completed

# Check for the locale routes:
Route (app)                                Size  First Load JS
├ ● /[locale]                             ...
├   ├ /en
├   ├ /es
├   ├ /fr
├   └ /pt
```

### 3. Check Runtime Logs

1. Go to **"Runtime Logs"** tab
2. Look for the startup message:

```bash
# ✅ SUCCESS - Should see:
▲ Next.js 15.5.2
- Local:        http://localhost:3000
✓ Starting...
✓ Ready in XXXms

# ❌ FAILURE - If you see:
Error: Cannot find module
# OR
"next start" does not work with "output: standalone"
# OR nothing at all
```

### 4. Verify Environment Variables

Go to **"Settings" → "Environment Variables"** and verify these are set:

**Required (App must have these):**
```
NEXTAUTH_URL=https://joinruach.org
NEXTAUTH_SECRET=<your-secret-32+-chars>
NEXT_PUBLIC_STRAPI_URL=<your-strapi-api-url>
STRAPI_REVALIDATE_SECRET=<your-secret-16+-chars>
```

**Important:** `NEXT_PUBLIC_STRAPI_URL` must be:
- ✅ A reachable Strapi API endpoint
- ❌ NOT a CDN URL like `cdn.joinruach.org`

### 5. Check App Configuration

Go to **"Settings" → "App Spec"** and verify:

**Component Type:** Should be "Web Service" or "Docker"

**HTTP Port:** Should be `3000` (or 8080 if configured)

**Run Command:** If you're using the Dockerfile, this should be automatic. If not:
```bash
# Should be:
node apps/ruach-next/server.js
```

**Health Check:** Optional but recommended:
```
Path: /api/health
```

### 6. Check Dockerfile Build Arguments

If using Docker in DigitalOcean, ensure build arguments are passed:

Go to **"Settings" → "App Spec"** and check for:

```yaml
build:
  dockerfile_path: apps/ruach-next/Dockerfile
  build_command: ""
  buildpack_stack: ""
  args:
    - name: NEXTAUTH_URL
      value: ${NEXTAUTH_URL}
    - name: NEXTAUTH_SECRET
      value: ${NEXTAUTH_SECRET}
    - name: NEXT_PUBLIC_STRAPI_URL
      value: ${NEXT_PUBLIC_STRAPI_URL}
    - name: STRAPI_REVALIDATE_SECRET
      value: ${STRAPI_REVALIDATE_SECRET}
```

### 7. Common Issues & Fixes

#### Issue: "Access denied" (403)

**Possible causes:**
1. **App hasn't been rebuilt with the fix**
   - Solution: Force rebuild and deploy

2. **App is crashing on startup**
   - Check Runtime Logs for errors
   - Verify environment variables are set
   - Check for "Ready in Xms" message

3. **CDN/Firewall blocking requests**
   - If using Cloudflare, check firewall rules
   - Disable "I'm Under Attack Mode"
   - Set Security Level to "Medium" or "Low"

4. **Wrong port configuration**
   - DigitalOcean expects port 8080 by default
   - Your app runs on port 3000
   - Add HTTP Port override: `3000`

#### Issue: Pages show 404 after successful deployment

**Cause:** Strapi was unreachable during build

**Solution:**
1. Verify `NEXT_PUBLIC_STRAPI_URL` is correct
2. Ensure Strapi is accessible from DigitalOcean build environment
3. Check Strapi firewall allows DigitalOcean IPs
4. Force rebuild after fixing Strapi connectivity

#### Issue: Build fails with module errors

**Cause:** Missing package builds

**Solution:** The Dockerfile now includes all required builds:
```dockerfile
RUN pnpm --filter @ruach/ai run build \
 && pnpm --filter @ruach/components run build \
 && pnpm --filter @ruach/addons run build \
 && pnpm --filter ruach-next... run build
```

### 8. Manual Verification Steps

After deployment completes:

**Test 1: Check app is running**
```bash
# From DigitalOcean console:
curl http://localhost:3000/api/health

# Should return: { "status": "ok" }
```

**Test 2: Check public access**
```bash
curl -I https://joinruach.org/
# Should return: HTTP 307 (redirect to /en)

curl -I https://joinruach.org/en
# Should return: HTTP 200
```

**Test 3: Check page content**
```bash
curl https://joinruach.org/en | grep "Ruach"
# Should return HTML with "Ruach Ministries"
```

### 9. If Still Getting 403

**Check if app is using App Platform or Docker:**

**App Platform (Buildpack):**
- DigitalOcean might be auto-detecting the wrong buildpack
- Explicitly set: Dockerfile

**Docker Deployment:**
- Ensure Dockerfile path is correct: `apps/ruach-next/Dockerfile`
- Build context should be: repository root (not `apps/ruach-next`)

**Network/Firewall:**
- Check DigitalOcean App → Settings → Domains
- Ensure SSL is properly configured
- Try accessing via the DigitalOcean app URL (not your custom domain)

### 10. Quick Checklist

- [ ] Latest code is deployed (commit `6970210` or later)
- [ ] Build logs show successful completion
- [ ] Runtime logs show "Ready in Xms"
- [ ] Environment variables are set correctly
- [ ] `NEXT_PUBLIC_STRAPI_URL` points to working Strapi API
- [ ] HTTP Port is set to `3000`
- [ ] Dockerfile path is `apps/ruach-next/Dockerfile`
- [ ] Build context is repository root
- [ ] Health check passes at `/api/health`

## Need More Help?

If you're still stuck, please provide:

1. **Latest deployment logs** (both build and runtime)
2. **App Spec YAML** (from Settings → App Spec)
3. **Environment variables** (names only, not values)
4. **Screenshot** of the Activity/Deployments page

This will help diagnose the exact issue.
