# Deployment Troubleshooting: Access Denied / 403 Error

## Current Issue

The website https://joinruach.org returns **"Access denied"** with HTTP 403 status code. This means requests are being blocked **before** reaching the Next.js application.

## Test Results

```bash
$ curl https://joinruach.org/
Access denied  # HTTP 403

$ curl https://joinruach.org/en
Access denied  # HTTP 403
```

## Root Cause

This is **NOT** a Next.js routing or build issue. The application is either:
1. **Not running** or **crashed**
2. **Blocked by a firewall/CDN**
3. **Misconfigured** in the deployment platform

## Troubleshooting Steps

### 1. Check Application Status (DigitalOcean)

If you're using DigitalOcean App Platform:

```bash
# Check app status in DigitalOcean console
# Go to: Apps → JoinRuach → Activity

# Check for:
- Deployment status: Should show "Live"
- Build logs: Look for errors
- Runtime logs: Check for crashes
```

### 2. Check Firewall Rules

```bash
# DigitalOcean Firewall
# Go to: Networking → Firewalls
# Ensure:
- Inbound HTTP (80) is allowed
- Inbound HTTPS (443) is allowed
- Source: All IPv4, All IPv6
```

### 3. Check CDN Configuration (Cloudflare/Other)

If using Cloudflare or another CDN:

```bash
# Cloudflare Settings:
- Security → WAF: Check if rules are blocking traffic
- Security → Bot Fight Mode: May block curl/automated requests
- Firewall Rules: Check for IP blocks
- Under Attack Mode: Disable if enabled

# Try: Purge cache and disable "I'm Under Attack Mode"
```

### 4. Check Load Balancer / Reverse Proxy

If using a load balancer:

```bash
# Check health checks are passing
# Verify backend target is the correct port (usually 3000)
# Check SSL/TLS termination settings
```

### 5. Verify DNS Configuration

```bash
# Check DNS is pointing to the correct server
$ dig joinruach.org +short

# Should return your server's IP address
# Not Cloudflare IPs (if you're not using Cloudflare)
```

### 6. Check Application Logs

```bash
# DigitalOcean App Platform:
# Go to: Apps → JoinRuach → Runtime Logs

# Look for:
- "Ready in X ms" (indicates app started successfully)
- Error messages
- Port binding issues
```

### 7. Test Direct Server Access

If using a CDN, try accessing the origin server directly:

```bash
# Get origin IP from DNS/deployment platform
# Try: curl http://YOUR_ORIGIN_IP:3000/

# If this works, the issue is with CDN/firewall
# If this fails, the issue is with the application
```

## Common Fixes

### Fix 1: Restart the Application

**DigitalOcean App Platform:**
1. Go to Apps → JoinRuach
2. Click "Force Rebuild and Deploy"
3. Wait for deployment to complete

### Fix 2: Check Environment Variables

Ensure required environment variables are set in production:

```bash
NEXTAUTH_URL=https://joinruach.org
NEXTAUTH_SECRET=<your-secret>
NEXT_PUBLIC_STRAPI_URL=<your-strapi-url>
STRAPI_REVALIDATE_SECRET=<your-secret>
```

**Missing environment variables can cause the app to crash on startup.**

### Fix 3: Disable CDN Security Temporarily

**Cloudflare:**
1. Go to Security → Settings
2. Temporarily disable "I'm Under Attack Mode"
3. Set Security Level to "Essentially Off"
4. Test if site works

**If site works after disabling, you need to adjust security rules.**

### Fix 4: Check Standalone Output

If using Docker with `output: 'standalone'`:

```bash
# Ensure Dockerfile copies necessary files:
COPY --from=builder /repo/apps/ruach-next/.next/standalone ./
COPY --from=builder /repo/apps/ruach-next/.next/static ./.next/static
COPY --from=builder /repo/apps/ruach-next/public ./public

# Start command should be:
CMD ["node", "apps/ruach-next/server.js"]
```

### Fix 5: Check Port Configuration

```bash
# Ensure app is listening on correct port
# DigitalOcean App Platform expects port 8080 or 3000

# In your start command:
next start -p 3000

# Or with standalone:
node apps/ruach-next/server.js  # Defaults to 3000
```

## Verification

Once fixed, you should see:

```bash
$ curl -I https://joinruach.org/
HTTP/2 307   # Temporary Redirect
Location: /en

$ curl -I https://joinruach.org/en
HTTP/2 200   # Success!
```

## Next Steps

1. **Check your deployment platform logs** (DigitalOcean, Vercel, etc.)
2. **Look for application errors** or crash logs
3. **Verify environment variables** are set correctly
4. **Test with CDN/firewall disabled** to isolate the issue
5. **Check SSL certificate** is valid

## Need Help?

If you're still stuck, provide:
- Deployment platform (DigitalOcean, Vercel, AWS, etc.)
- Recent deployment logs
- Any error messages from the platform
- CDN provider (Cloudflare, etc.)
