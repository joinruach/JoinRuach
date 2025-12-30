# Reverse Proxy Configuration Guide

This guide explains how to configure your reverse proxy to work with Strapi's secure cookie authentication.

## Problem

The error `"Cannot send secure cookie over unencrypted connection"` occurs when:
1. `NODE_ENV=production` (enables `secure: true` on cookies)
2. The backend receives HTTP requests (from reverse proxy)
3. The proxy doesn't forward HTTPS headers correctly

## Solution Overview

Enable proxy header trust in Strapi (`server.js:20`) and configure your reverse proxy to send the required headers.

## Required Headers

Your reverse proxy MUST send these headers:

```
X-Forwarded-Proto: https
X-Forwarded-Host: api.joinruach.org
X-Forwarded-For: <client-ip>
```

## Configuration by Platform

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.joinruach.org;

    # SSL configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:1337;

        # Required headers for Strapi
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts for large uploads
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.joinruach.org;
    return 301 https://$server_name$request_uri;
}
```

### Cloudflare

Cloudflare automatically sends `X-Forwarded-Proto` when SSL/TLS is enabled.

**Required Settings:**
1. **SSL/TLS Mode:** Full or Full (Strict)
   - Dashboard → SSL/TLS → Overview → Encryption mode
2. **Always Use HTTPS:** ON
   - Dashboard → SSL/TLS → Edge Certificates → Always Use HTTPS

**Cloudflare automatically forwards:**
- `CF-Connecting-IP` (client IP)
- `X-Forwarded-Proto` (protocol)
- `X-Forwarded-For` (client IP)

**Optional - Custom Rules:**
If headers are missing, add a Transform Rule:

```
Dashboard → Rules → Transform Rules → Modify Request Header

Rule: Set X-Forwarded-Proto
Value: https
```

### AWS Application Load Balancer (ALB)

ALB automatically sends these headers when SSL is terminated:

```
X-Forwarded-For: <client-ip>
X-Forwarded-Proto: https
X-Forwarded-Port: 443
```

**Configuration:**
1. Create HTTPS listener (port 443) with SSL certificate
2. Create target group pointing to Strapi (port 1337)
3. Configure health check: `/api/health` or `/_health`

**ALB Health Check:**
```
Protocol: HTTP
Path: /_health
Port: 1337
Healthy threshold: 2
Unhealthy threshold: 3
Timeout: 10 seconds
Interval: 30 seconds
```

### Caddy

Caddy automatically handles HTTPS and forwards headers correctly.

```caddyfile
api.joinruach.org {
    reverse_proxy localhost:1337 {
        # Headers are automatically set by Caddy
        # X-Forwarded-For, X-Forwarded-Proto, X-Forwarded-Host
    }
}
```

### Traefik

```yaml
http:
  routers:
    strapi:
      rule: "Host(`api.joinruach.org`)"
      service: strapi-service
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt

  services:
    strapi-service:
      loadBalancer:
        servers:
          - url: "http://localhost:1337"
```

Traefik automatically adds `X-Forwarded-*` headers.

### Docker Compose with Nginx

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - strapi

  strapi:
    build: .
    environment:
      NODE_ENV: production
      # No need to set COOKIE_SECURE - defaults to true in production
    expose:
      - "1337"
```

## Verification

After configuring your proxy, deploy and check the logs:

### 1. Check Startup Logs

Look for these validation messages:

```
✅ Proxy configuration: true
🔍 First production request - Proxy headers diagnostic
```

### 2. Check First Request Log

Should show:

```json
{
  "proxyConfig": {
    "koa_proxy_enabled": true,
    "cookie_secure": "true"
  },
  "headers": {
    "x-forwarded-proto": "https",
    "x-forwarded-host": "api.joinruach.org",
    "x-forwarded-for": "134.199.205.146"
  },
  "request": {
    "protocol": "https",
    "secure": true
  }
}
```

### 3. Test Login

```bash
curl -X POST https://api.joinruach.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@example.com",
    "password": "password"
  }' \
  -c cookies.txt \
  -v
```

**Success indicators:**
- Response: `200 OK`
- Cookie header present: `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict`
- No error about secure cookies

**Failure indicators:**
- Response: `400 Bad Request`
- Error: `"Cannot send secure cookie over unencrypted connection"`
- Missing `Set-Cookie` header

## Troubleshooting

### Issue: "Cannot send secure cookie over unencrypted connection"

**Cause:** Proxy not sending `X-Forwarded-Proto: https`

**Solution:**
1. Check proxy configuration (see platform sections above)
2. Verify SSL is terminated at proxy, not backend
3. Check logs for: `"Missing x-forwarded-proto header"`

### Issue: "Protocol mismatch: X-Forwarded-Proto is https but ctx.request.secure is false"

**Cause:** `proxy: true` not set in `server.js`

**Solution:**
```javascript
// server.js
module.exports = ({ env }) => ({
  proxy: env('NODE_ENV') === 'production',
  // ... other config
});
```

### Issue: Headers present but still failing

**Temporary workaround (NOT RECOMMENDED):**
```bash
# .env (production)
COOKIE_SECURE=false
```

⚠️ **Security Warning:** This sends refresh tokens over HTTP. Only use if:
- You're behind a trusted reverse proxy
- The proxy terminates SSL correctly
- Internal communication is on a private network

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COOKIE_SECURE` | `true` (in prod) | Force secure cookies. Set to `false` only behind trusted proxy |
| `NODE_ENV` | - | Set to `production` for secure cookies |
| `PUBLIC_URL` | - | Full HTTPS URL (e.g., `https://api.joinruach.org`) |

## Security Checklist

- [ ] Reverse proxy terminates SSL/TLS
- [ ] SSL certificate is valid and not self-signed
- [ ] `X-Forwarded-Proto: https` header is sent
- [ ] `proxy: true` is set in `server.js`
- [ ] `NODE_ENV=production` is set
- [ ] `PUBLIC_URL` uses `https://`
- [ ] Tested login flow in production
- [ ] Checked logs for proxy header warnings

## Additional Resources

- [Koa Proxy Documentation](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestip)
- [Strapi Deployment Guide](https://docs.strapi.io/dev-docs/deployment)
- [OWASP Secure Cookie Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
