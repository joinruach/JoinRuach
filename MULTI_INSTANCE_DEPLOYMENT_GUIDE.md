# Multi-Instance Deployment Guide

**JoinRuach.org - Production Scaling Guide**

This guide covers deploying and scaling the JoinRuach.org application across multiple instances for high availability, load balancing, and horizontal scaling.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Redis Configuration](#redis-configuration)
4. [Load Balancer Setup](#load-balancer-setup)
5. [Strapi Backend Multi-Instance](#strapi-backend-multi-instance)
6. [Next.js Frontend Multi-Instance](#nextjs-frontend-multi-instance)
7. [Health Checks](#health-checks)
8. [Deployment Strategies](#deployment-strategies)
9. [Monitoring & Debugging](#monitoring--debugging)
10. [Testing Multi-Instance Setup](#testing-multi-instance-setup)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying multiple instances, ensure:

- ✅ **Redis is configured and running** (completed in H1 implementation)
- ✅ **PostgreSQL database** is production-ready with connection pooling
- ✅ **Environment variables** are identical across all instances
- ✅ **Secrets** are stored in secure vault (AWS Secrets Manager, 1Password, etc.)
- ✅ **CDN** is configured for static assets (Cloudflare R2)
- ✅ **Domain SSL certificates** are valid and configured

---

## Architecture Overview

### Single-Instance Architecture (Current)

```
┌─────────┐      ┌──────────────┐      ┌─────────────┐
│ Browser │─────▶│ Next.js App  │─────▶│ Strapi API  │
└─────────┘      │ (Port 3000)  │      │ (Port 1337) │
                 └──────────────┘      └─────────────┘
                         │                     │
                         ▼                     ▼
                 ┌──────────────┐      ┌─────────────┐
                 │  NextAuth    │      │  PostgreSQL │
                 │  (Sessions)  │      │  Database   │
                 └──────────────┘      └─────────────┘
```

### Multi-Instance Architecture (Target)

```
                        ┌──────────────┐
                        │ Load Balancer│
                        │  (Nginx/ALB) │
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │ Next.js #1  │  │ Next.js #2  │  │ Next.js #3  │
       │ (Port 3000) │  │ (Port 3000) │  │ (Port 3000) │
       └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                        ┌──────▼───────┐
                        │ Load Balancer│
                        │   (API)      │
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │ Strapi #1   │  │ Strapi #2   │  │ Strapi #3   │
       │ (Port 1337) │  │ (Port 1337) │  │ (Port 1337) │
       └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
       ┌──────▼──────┐                  ┌──────▼──────┐
       │    Redis    │                  │ PostgreSQL  │
       │  (Upstash)  │                  │  (Primary)  │
       │             │                  │             │
       │ - Tokens    │                  │ - Users     │
       │ - Blacklist │                  │ - Content   │
       │ - Sessions  │                  │ - Metadata  │
       └─────────────┘                  └─────────────┘
```

### Key Differences

1. **Stateless Application Servers**: No local session storage
2. **Shared State via Redis**: All tokens, sessions, blacklist in Redis
3. **Load Balancing**: Requests distributed across healthy instances
4. **Database Connection Pooling**: Prevents connection exhaustion
5. **Graceful Shutdown**: Drains connections before stopping

---

## Redis Configuration

### Why Redis is Critical for Multi-Instance

When running multiple Strapi instances:

- **Without Redis**: Each instance has its own in-memory token store
  - User logs in on Instance #1 → refresh token stored locally
  - Load balancer routes refresh request to Instance #2 → token not found
  - **Result**: User logged out unexpectedly ❌

- **With Redis**: All instances share centralized token store
  - User logs in on Instance #1 → refresh token stored in Redis
  - Load balancer routes refresh request to Instance #2 → reads from Redis
  - **Result**: Seamless authentication across instances ✅

### Production Redis Setup (Upstash)

**Recommended**: Upstash Redis for serverless/multi-region deployments

1. **Create Upstash Redis Database**
   ```bash
   # Visit: https://console.upstash.com/
   # Create new Redis database
   # Region: Choose closest to your app servers
   # Eviction: allkeys-lru (automatic cleanup)
   ```

2. **Copy Connection Details**
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxx
   ```

3. **Configure in `.env.production`**
   ```env
   # Strapi Backend
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxx

   # Next.js Frontend (for rate limiting)
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxx
   ```

4. **Verify Redis Connection**
   ```bash
   # Start Strapi and check logs
   npm run develop

   # Should see:
   # ✅ [RedisClient] Connected to Upstash Redis
   # ✅ [TokenBlacklist] Using Redis for persistence
   # ✅ [RefreshTokenStore] Using Redis for persistence
   ```

### Alternative: Standard Redis (Self-Hosted)

For self-hosted Redis clusters:

```env
# Standard Redis URL format
REDIS_URL=redis://:password@redis.example.com:6379

# Or with TLS
REDIS_URL=rediss://:password@redis.example.com:6380
```

**Redis Cluster Configuration:**

```javascript
// redis-client.js (advanced configuration)
const cluster = new Redis.Cluster([
  { host: 'redis-1.example.com', port: 6379 },
  { host: 'redis-2.example.com', port: 6379 },
  { host: 'redis-3.example.com', port: 6379 },
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
    tls: {
      rejectUnauthorized: false
    }
  }
});
```

### Redis Persistence Settings

**Upstash (Automatic):**
- Persistence enabled by default
- Automatic backups
- 99.99% uptime SLA

**Self-Hosted (redis.conf):**
```conf
# Enable AOF (Append-Only File) for durability
appendonly yes
appendfsync everysec

# RDB snapshots as backup
save 900 1      # After 900 sec (15 min) if at least 1 key changed
save 300 10     # After 300 sec (5 min) if at least 10 keys changed
save 60 10000   # After 60 sec if at least 10000 keys changed
```

---

## Load Balancer Setup

### Option 1: Nginx (Recommended for Self-Hosted)

**Install Nginx:**
```bash
sudo apt update
sudo apt install nginx
```

**Configure Load Balancer** (`/etc/nginx/sites-available/joinruach`):

```nginx
# Upstream servers for Next.js frontend
upstream nextjs_backend {
    least_conn;  # Route to server with least connections

    server nextjs-1.internal:3000 max_fails=3 fail_timeout=30s;
    server nextjs-2.internal:3000 max_fails=3 fail_timeout=30s;
    server nextjs-3.internal:3000 max_fails=3 fail_timeout=30s;

    # Health check
    keepalive 32;
}

# Upstream servers for Strapi API
upstream strapi_backend {
    least_conn;

    server strapi-1.internal:1337 max_fails=3 fail_timeout=30s;
    server strapi-2.internal:1337 max_fails=3 fail_timeout=30s;
    server strapi-3.internal:1337 max_fails=3 fail_timeout=30s;

    keepalive 32;
}

# HTTPS redirect
server {
    listen 80;
    server_name joinruach.org www.joinruach.org;
    return 301 https://$server_name$request_uri;
}

# Main frontend (Next.js)
server {
    listen 443 ssl http2;
    server_name joinruach.org www.joinruach.org;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/joinruach.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/joinruach.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req zone=general burst=20 nodelay;

    # Proxy settings
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;

        # Preserve client information
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (for Next.js dev mode)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets (optional - can serve directly)
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Strapi API backend
server {
    listen 443 ssl http2;
    server_name api.joinruach.org;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.joinruach.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.joinruach.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting (stricter for API)
    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
    limit_req zone=api burst=10 nodelay;

    # Proxy settings
    location / {
        proxy_pass http://strapi_backend;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Larger body size for file uploads
        client_max_body_size 100M;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;  # Longer for file uploads
        proxy_read_timeout 300s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://strapi_backend/health;
        access_log off;
    }
}
```

**Enable and Test:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/joinruach /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### Option 2: AWS Application Load Balancer (ALB)

**Create Target Groups:**

1. **Next.js Target Group**
   ```bash
   aws elbv2 create-target-group \
     --name joinruach-nextjs-tg \
     --protocol HTTP \
     --port 3000 \
     --vpc-id vpc-xxxxx \
     --health-check-path / \
     --health-check-interval-seconds 30 \
     --health-check-timeout-seconds 5 \
     --healthy-threshold-count 2 \
     --unhealthy-threshold-count 3
   ```

2. **Strapi Target Group**
   ```bash
   aws elbv2 create-target-group \
     --name joinruach-strapi-tg \
     --protocol HTTP \
     --port 1337 \
     --vpc-id vpc-xxxxx \
     --health-check-path /health \
     --health-check-interval-seconds 30
   ```

**Create Application Load Balancer:**
```bash
aws elbv2 create-load-balancer \
  --name joinruach-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4
```

**Add Listeners:**
```bash
# HTTP → HTTPS redirect
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'

# HTTPS listener for Next.js
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:.../joinruach-nextjs-tg
```

**Configure Sticky Sessions (Optional):**
```bash
# Not required with Redis-backed sessions, but can reduce Redis reads
aws elbv2 modify-target-group-attributes \
  --target-group-arn arn:aws:elasticloadbalancing:.../joinruach-nextjs-tg \
  --attributes Key=stickiness.enabled,Value=true \
              Key=stickiness.type,Value=lb_cookie \
              Key=stickiness.lb_cookie.duration_seconds,Value=3600
```

### Option 3: Cloudflare Load Balancing

**Prerequisites:**
- Cloudflare Business plan or higher
- DNS managed by Cloudflare

**Create Load Balancer:**
1. Go to Traffic → Load Balancing
2. Create Load Balancer: `joinruach.org`
3. Add origin pools:
   - **Pool 1**: `nextjs-primary` (nextjs-1, nextjs-2, nextjs-3)
   - **Pool 2**: `nextjs-fallback` (backup instances)
4. Health checks:
   - Path: `/`
   - Interval: 60 seconds
   - Timeout: 5 seconds
   - Retries: 2

**Benefits:**
- Global Anycast (routes to nearest server)
- DDoS protection included
- SSL/TLS termination
- Geographic routing

---

## Strapi Backend Multi-Instance

### Instance Configuration

Each Strapi instance needs **identical** configuration:

**Environment Variables** (`.env.production`):
```env
# CRITICAL: Must be identical across all instances
NODE_ENV=production
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=<SAME_SALT_ALL_INSTANCES>
ADMIN_JWT_SECRET=<SAME_ADMIN_JWT_SECRET_ALL_INSTANCES>
JWT_SECRET=<SAME_JWT_SECRET_ALL_INSTANCES>

# Database - shared PostgreSQL
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres.internal
DATABASE_PORT=5432
DATABASE_NAME=joinruach_production
DATABASE_USERNAME=joinruach_user
DATABASE_PASSWORD=secure_password
DATABASE_SSL=true

# Redis - shared instance
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxx

# Public URLs
STRAPI_PUBLIC_URL=https://api.joinruach.org
FRONTEND_URL=https://joinruach.org

# Cookie security
COOKIE_SECURE=true

# CORS - same origins
CORS_ALLOWED_ORIGINS=https://joinruach.org,https://www.joinruach.org
```

### Database Connection Pooling

**PostgreSQL Connection Limits:**

With multiple instances, you'll hit connection limits quickly:
- Default PostgreSQL max_connections: 100
- 3 Strapi instances × 25 connections each = 75 connections
- Add admin panels, background jobs → easily exceeds 100

**Solution 1: Increase PostgreSQL max_connections**

Edit `postgresql.conf`:
```conf
max_connections = 300
shared_buffers = 2GB  # 25% of RAM
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

**Solution 2: Connection Pooling with PgBouncer** (Recommended)

Install PgBouncer:
```bash
sudo apt install pgbouncer
```

Configure `/etc/pgbouncer/pgbouncer.ini`:
```ini
[databases]
joinruach_production = host=localhost port=5432 dbname=joinruach_production

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 300
default_pool_size = 25
reserve_pool_size = 5
```

Update Strapi connection:
```env
DATABASE_HOST=pgbouncer.internal
DATABASE_PORT=6432  # PgBouncer port
```

**Benefits:**
- Reuses database connections
- Handles 300+ client connections with 25 DB connections
- Reduces connection overhead

### File Upload Handling

**Problem**: User uploads file to Instance #1, but subsequent requests go to Instance #2 which doesn't have the file locally.

**Solution**: Use centralized storage (already implemented with Cloudflare R2)

Verify `ruach-ministries-backend/config/plugins.js`:
```javascript
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudflare-r2',
      providerOptions: {
        accessKeyId: env('CLOUDFLARE_R2_ACCESS_KEY_ID'),
        secretAccessKey: env('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
        params: {
          Bucket: env('CLOUDFLARE_R2_BUCKET_NAME'),
        },
        cloudflareAccountId: env('CLOUDFLARE_ACCOUNT_ID'),
      },
      // Public URL for file access
      publicUrl: env('CLOUDFLARE_R2_PUBLIC_URL'),
    },
  },
});
```

**Result**: All instances read/write from the same R2 bucket ✅

### Health Check Endpoint

Create `ruach-ministries-backend/src/api/health/routes/health.js`:
```javascript
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/health',
      handler: 'health.check',
      config: {
        auth: false,  // No authentication required
        policies: [],
        middlewares: [],
      },
    },
  ],
};
```

Create `ruach-ministries-backend/src/api/health/controllers/health.js`:
```javascript
'use strict';

const { redisClient } = require('../../../services/redis-client');

module.exports = {
  async check(ctx) {
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
    };

    // Check database
    try {
      await strapi.db.connection.raw('SELECT 1');
      checks.services.database = 'healthy';
    } catch (error) {
      checks.services.database = 'unhealthy';
      checks.status = 'degraded';
    }

    // Check Redis
    try {
      if (redisClient.isAvailable()) {
        await redisClient.set('health_check', Date.now().toString(), 10);
        checks.services.redis = 'healthy';
      } else {
        checks.services.redis = 'unavailable';
      }
    } catch (error) {
      checks.services.redis = 'unhealthy';
      checks.status = 'degraded';
    }

    // Return 200 if healthy, 503 if unhealthy
    ctx.status = checks.status === 'healthy' ? 200 : 503;
    ctx.body = checks;
  },
};
```

**Test Health Endpoint:**
```bash
curl https://api.joinruach.org/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-11-04T10:30:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Graceful Shutdown

Handle shutdown signals properly to drain connections:

**Update `ruach-ministries-backend/server.js`:**
```javascript
'use strict';

const strapi = require('@strapi/strapi');
const app = strapi({ distDir: './dist' });

let server;

// Start server
app.start().then((strapiInstance) => {
  server = strapiInstance.server.httpServer;
  console.log('✅ Strapi server started');
});

// Graceful shutdown handler
function gracefulShutdown(signal) {
  console.log(`\n⚠️  Received ${signal}, starting graceful shutdown...`);

  if (server) {
    // Stop accepting new connections
    server.close(() => {
      console.log('✅ HTTP server closed');

      // Close database connections
      if (strapi && strapi.db && strapi.db.connection) {
        strapi.db.connection.destroy().then(() => {
          console.log('✅ Database connections closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      console.error('⏰ Forcing shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

## Next.js Frontend Multi-Instance

### Session Management with NextAuth

NextAuth sessions are **stateless by default** when using JWT strategy (which JoinRuach.org uses). This means:

✅ **No server-side session storage required**
✅ **Works across multiple instances automatically**
✅ **Session data encoded in JWT cookie**

Verify `apps/ruach-next/src/app/api/auth/[...nextauth]/route.ts`:
```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // ... provider config
    }),
  ],
  session: {
    strategy: "jwt",  // ✅ Stateless - works multi-instance
    maxAge: 60 * 60,  // 1 hour
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,  // Must be identical across instances
    maxAge: 60 * 60,
  },
  // ...
};
```

**Critical**: `NEXTAUTH_SECRET` must be **identical** on all Next.js instances:

```env
# MUST BE THE SAME ON ALL INSTANCES
NEXTAUTH_SECRET=<YOUR_48_CHARACTER_SECRET_FROM_OPENSSL_RAND_BASE64_48>
```

If secrets differ:
- User logs in on Instance #1 → JWT signed with Secret A
- Load balancer routes to Instance #2 → tries to verify with Secret B
- **Result**: JWT verification fails, user logged out ❌

### Static Asset Handling

Next.js builds include static assets in `.next/static/`:

**Option 1: Build once, deploy to all instances** (Recommended)
```bash
# Build on CI/CD server
npm run build

# Deploy .next/ directory to all instances
rsync -avz .next/ instance-1:/app/.next/
rsync -avz .next/ instance-2:/app/.next/
rsync -avz .next/ instance-3:/app/.next/
```

**Option 2: Build on each instance**
```bash
# On each instance during deployment
npm ci --production
npm run build
npm start
```

**Option 3: CDN for static assets** (Advanced)
```javascript
// next.config.mjs
export default {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://cdn.joinruach.org/_next'
    : '',
  // Upload .next/static/* to CDN during build
};
```

### Environment Consistency

**All Next.js instances need identical `.env.production`:**

```env
# CRITICAL: Must be identical across all instances
NEXTAUTH_URL=https://joinruach.org
NEXTAUTH_SECRET=<SAME_NEXTAUTH_SECRET_ALL_INSTANCES>
NEXT_PUBLIC_STRAPI_URL=https://api.joinruach.org
STRAPI_API_TOKEN=<SAME_STRAPI_API_TOKEN_ALL_INSTANCES>

# Redis for rate limiting
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxx

# Other public vars
NEXT_PUBLIC_SITE_URL=https://joinruach.org
STRIPE_SECRET_KEY=sk_live_xxxxx
```

**Automated Deployment** (recommended):
```bash
#!/bin/bash
# deploy-nextjs.sh

# Build once
npm run build

# Copy to all instances
for instance in nextjs-1 nextjs-2 nextjs-3; do
  echo "Deploying to $instance..."

  # Copy .env (from secrets manager)
  scp .env.production "$instance:/app/.env.production"

  # Copy built application
  rsync -avz --delete .next/ "$instance:/app/.next/"
  rsync -avz --delete public/ "$instance:/app/public/"
  rsync -avz package.json package-lock.json "$instance:/app/"

  # Restart instance
  ssh "$instance" "cd /app && pm2 restart nextjs"
done
```

---

## Health Checks

### Next.js Health Check

Create `apps/ruach-next/src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {} as Record<string, string>,
  };

  // Check Strapi connectivity
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
      // Short timeout
      signal: AbortSignal.timeout(5000),
    });

    health.services.strapi = response.ok ? 'healthy' : 'degraded';
  } catch (error) {
    health.services.strapi = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis (if using for rate limiting)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const redisResponse = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/ping`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
          signal: AbortSignal.timeout(3000),
        }
      );

      health.services.redis = redisResponse.ok ? 'healthy' : 'degraded';
    } catch (error) {
      health.services.redis = 'unavailable';
      // Redis is optional, don't mark as degraded
    }
  }

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
```

**Test:**
```bash
curl https://joinruach.org/api/health

{
  "status": "healthy",
  "timestamp": "2025-11-04T10:30:00.000Z",
  "environment": "production",
  "services": {
    "strapi": "healthy",
    "redis": "healthy"
  }
}
```

### Load Balancer Health Check Configuration

**Nginx:**
```nginx
# Health check in upstream block
upstream nextjs_backend {
    server nextjs-1.internal:3000 max_fails=3 fail_timeout=30s;
    server nextjs-2.internal:3000 max_fails=3 fail_timeout=30s;
    server nextjs-3.internal:3000 max_fails=3 fail_timeout=30s;

    # Check /api/health endpoint
    check interval=10000 rise=2 fall=3 timeout=5000 type=http;
    check_http_send "GET /api/health HTTP/1.1\r\nHost: joinruach.org\r\n\r\n";
    check_http_expect_alive http_2xx;
}
```

**AWS ALB:**
```bash
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:.../joinruach-nextjs-tg \
  --health-check-enabled \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200
```

---

## Deployment Strategies

### Strategy 1: Rolling Deployment (Recommended)

Deploy to instances one at a time to maintain availability:

```bash
#!/bin/bash
# rolling-deploy.sh

INSTANCES=("nextjs-1" "nextjs-2" "nextjs-3")
HEALTH_CHECK_URL="http://localhost:3000/api/health"
HEALTH_CHECK_RETRIES=10

deploy_to_instance() {
  local instance=$1

  echo "📦 Deploying to $instance..."

  # Copy files
  rsync -avz --delete .next/ "$instance:/app/.next/"

  # Restart with graceful shutdown
  ssh "$instance" "cd /app && pm2 reload nextjs --wait-ready"

  # Wait for health check
  echo "⏳ Waiting for $instance to become healthy..."
  for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    if ssh "$instance" "curl -sf $HEALTH_CHECK_URL > /dev/null"; then
      echo "✅ $instance is healthy"
      return 0
    fi
    echo "   Attempt $i/$HEALTH_CHECK_RETRIES failed, retrying in 5s..."
    sleep 5
  done

  echo "❌ $instance failed to become healthy"
  return 1
}

# Deploy to each instance sequentially
for instance in "${INSTANCES[@]}"; do
  if ! deploy_to_instance "$instance"; then
    echo "🚨 Deployment failed on $instance, aborting rollout"
    exit 1
  fi

  # Wait between deployments
  echo "⏸  Waiting 30 seconds before next deployment..."
  sleep 30
done

echo "🎉 Rolling deployment complete!"
```

**Benefits:**
- Zero downtime
- Automatic rollback on failure
- Gradual traffic shift

**Drawbacks:**
- Slower deployment (3 instances × 30s = 90 seconds minimum)
- Mixed versions during deployment

### Strategy 2: Blue-Green Deployment

Maintain two identical environments (blue = active, green = standby):

```bash
#!/bin/bash
# blue-green-deploy.sh

BLUE_INSTANCES=("nextjs-blue-1" "nextjs-blue-2" "nextjs-blue-3")
GREEN_INSTANCES=("nextjs-green-1" "nextjs-green-2" "nextjs-green-3")

# Determine current active environment
CURRENT_ENV=$(aws elbv2 describe-target-groups \
  --target-group-arns $TARGET_GROUP_ARN \
  --query 'TargetGroups[0].Tags[?Key==`Environment`].Value' \
  --output text)

if [ "$CURRENT_ENV" = "blue" ]; then
  ACTIVE_INSTANCES=("${BLUE_INSTANCES[@]}")
  STANDBY_INSTANCES=("${GREEN_INSTANCES[@]}")
  STANDBY_ENV="green"
else
  ACTIVE_INSTANCES=("${GREEN_INSTANCES[@]}")
  STANDBY_INSTANCES=("${BLUE_INSTANCES[@]}")
  STANDBY_ENV="blue"
fi

echo "📦 Current active: $CURRENT_ENV"
echo "🎯 Deploying to: $STANDBY_ENV"

# Deploy to standby environment
for instance in "${STANDBY_INSTANCES[@]}"; do
  echo "Deploying to $instance..."
  rsync -avz .next/ "$instance:/app/.next/"
  ssh "$instance" "cd /app && pm2 restart nextjs"
done

# Health check standby environment
echo "⏳ Waiting for standby environment to become healthy..."
sleep 30

all_healthy=true
for instance in "${STANDBY_INSTANCES[@]}"; do
  if ! ssh "$instance" "curl -sf http://localhost:3000/api/health > /dev/null"; then
    echo "❌ $instance is unhealthy"
    all_healthy=false
  fi
done

if [ "$all_healthy" = false ]; then
  echo "🚨 Standby environment is unhealthy, aborting switch"
  exit 1
fi

# Switch traffic to standby
echo "🔄 Switching traffic to $STANDBY_ENV..."
aws elbv2 modify-target-group \
  --target-group-arn $TARGET_GROUP_ARN \
  --targets Id=i-standby1 Id=i-standby2 Id=i-standby3

echo "✅ Traffic switched to $STANDBY_ENV"
echo "♻️  Old $CURRENT_ENV environment is now standby for next deployment"
```

**Benefits:**
- Instant rollback (switch back to blue)
- Test green environment before switching
- Zero downtime

**Drawbacks:**
- Requires double the infrastructure
- Database migrations tricky (affects both environments)

### Strategy 3: Canary Deployment

Deploy to subset of instances first (e.g., 1 of 3):

```bash
#!/bin/bash
# canary-deploy.sh

CANARY_INSTANCE="nextjs-1"
MAIN_INSTANCES=("nextjs-2" "nextjs-3")

echo "🐦 Deploying to canary instance: $CANARY_INSTANCE"

# Deploy to canary
rsync -avz .next/ "$CANARY_INSTANCE:/app/.next/"
ssh "$CANARY_INSTANCE" "cd /app && pm2 reload nextjs"

# Wait and monitor
echo "📊 Monitoring canary for 10 minutes..."
sleep 600

# Check error rate on canary
# (Example: check logs, metrics, health checks)
ERROR_RATE=$(ssh "$CANARY_INSTANCE" "grep -c ERROR /var/log/nextjs.log")

if [ "$ERROR_RATE" -gt 10 ]; then
  echo "🚨 Canary has high error rate ($ERROR_RATE), rolling back"
  ssh "$CANARY_INSTANCE" "cd /app && git checkout main && pm2 reload nextjs"
  exit 1
fi

echo "✅ Canary looks healthy, deploying to remaining instances"

# Deploy to main instances
for instance in "${MAIN_INSTANCES[@]}"; do
  echo "Deploying to $instance..."
  rsync -avz .next/ "$instance:/app/.next/"
  ssh "$instance" "cd /app && pm2 reload nextjs"
  sleep 30
done

echo "🎉 Canary deployment complete!"
```

**Benefits:**
- Early detection of issues
- Limited blast radius (only 33% of traffic)
- Gradual rollout

**Drawbacks:**
- Longer deployment time
- Requires monitoring setup

---

## Monitoring & Debugging

### Key Metrics to Monitor

1. **Application Metrics**
   - Request rate (requests/sec)
   - Response time (p50, p95, p99)
   - Error rate (5xx errors)
   - Active connections

2. **Instance Metrics**
   - CPU usage per instance
   - Memory usage per instance
   - Disk I/O
   - Network traffic

3. **Database Metrics**
   - Active connections
   - Connection pool utilization
   - Query latency
   - Slow queries

4. **Redis Metrics**
   - Memory usage
   - Evicted keys
   - Hit rate
   - Connected clients

5. **Load Balancer Metrics**
   - Requests per instance
   - Unhealthy target count
   - Response time per target
   - SSL/TLS errors

### Monitoring Tools

**Option 1: Prometheus + Grafana**

Install Node Exporter on each instance:
```bash
# Install Prometheus Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.7.0.linux-amd64.tar.gz
sudo cp node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/
```

Create systemd service `/etc/systemd/system/node_exporter.service`:
```ini
[Unit]
Description=Prometheus Node Exporter
After=network.target

[Service]
User=prometheus
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
```

Configure Prometheus to scrape instances:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'nextjs'
    static_configs:
      - targets:
        - nextjs-1:9100
        - nextjs-2:9100
        - nextjs-3:9100

  - job_name: 'strapi'
    static_configs:
      - targets:
        - strapi-1:9100
        - strapi-2:9100
        - strapi-3:9100
```

**Option 2: AWS CloudWatch** (for AWS deployments)

Install CloudWatch Agent:
```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

Configure `/opt/aws/amazon-cloudwatch-agent/etc/config.json`:
```json
{
  "metrics": {
    "namespace": "JoinRuach",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/nextjs.log",
            "log_group_name": "/joinruach/nextjs",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
```

**Option 3: Datadog** (SaaS monitoring)

Install Datadog Agent:
```bash
DD_API_KEY=<your_key> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

Tag instances in `/etc/datadog-agent/datadog.yaml`:
```yaml
tags:
  - env:production
  - app:joinruach
  - role:nextjs
  - instance:nextjs-1
```

### Centralized Logging

**Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)**

Install Filebeat on each instance:
```bash
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.0-amd64.deb
sudo dpkg -i filebeat-8.11.0-amd64.deb
```

Configure `/etc/filebeat/filebeat.yml`:
```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/nextjs*.log
      - /var/log/strapi*.log
    fields:
      app: joinruach
      instance: ${INSTANCE_NAME}

output.elasticsearch:
  hosts: ["elasticsearch.internal:9200"]
  index: "joinruach-logs-%{+yyyy.MM.dd}"
```

**Option 2: CloudWatch Logs** (AWS)

Use CloudWatch Agent (configured above) to stream logs.

**Option 3: Loki + Grafana** (lightweight alternative to ELK)

Install Promtail on each instance:
```bash
wget https://github.com/grafana/loki/releases/download/v2.9.0/promtail-linux-amd64.zip
unzip promtail-linux-amd64.zip
sudo cp promtail-linux-amd64 /usr/local/bin/promtail
```

Configure `/etc/promtail/config.yml`:
```yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki.internal:3100/loki/api/v1/push

scrape_configs:
  - job_name: nextjs
    static_configs:
      - targets:
          - localhost
        labels:
          job: nextjs
          instance: ${INSTANCE_NAME}
          __path__: /var/log/nextjs*.log
```

### Debugging Multi-Instance Issues

**Problem**: Feature works on Instance #1 but fails on Instance #2

**Debug Steps:**

1. **Check environment variables**
   ```bash
   # On each instance
   ssh instance-1 "cd /app && printenv | grep -E '(NEXTAUTH|STRAPI|REDIS)' | sort"
   ssh instance-2 "cd /app && printenv | grep -E '(NEXTAUTH|STRAPI|REDIS)' | sort"

   # Compare outputs - must be identical
   diff <(ssh instance-1 ...) <(ssh instance-2 ...)
   ```

2. **Check file consistency**
   ```bash
   # Compare .next build outputs
   ssh instance-1 "md5sum /app/.next/BUILD_ID"
   ssh instance-2 "md5sum /app/.next/BUILD_ID"

   # Should be identical
   ```

3. **Check Redis connectivity**
   ```bash
   # On each instance
   ssh instance-1 "curl -H 'Authorization: Bearer $UPSTASH_TOKEN' $UPSTASH_URL/ping"
   ssh instance-2 "curl -H 'Authorization: Bearer $UPSTASH_TOKEN' $UPSTASH_URL/ping"

   # Both should return: {"result":"PONG"}
   ```

4. **Check database connections**
   ```bash
   # On PostgreSQL server
   sudo -u postgres psql -c "SELECT client_addr, count(*) FROM pg_stat_activity WHERE datname='joinruach_production' GROUP BY client_addr;"

   # Should show connections from all instances
   ```

5. **Trace specific request**
   ```bash
   # Add request ID to logs
   # In middleware.ts:
   import { v4 as uuidv4 } from 'uuid';

   export async function middleware(req: NextRequest) {
     const requestId = uuidv4();
     console.log(`[${requestId}] ${req.method} ${req.nextUrl.pathname}`);

     const response = NextResponse.next();
     response.headers.set('X-Request-ID', requestId);
     return response;
   }

   # Then grep logs for specific request ID
   grep "abc-123-def" /var/log/nextjs-*.log
   ```

---

## Testing Multi-Instance Setup

### Test 1: Token Persistence Across Instances

**Objective**: Verify refresh tokens work across different instances

```bash
#!/bin/bash
# test-multi-instance-tokens.sh

INSTANCES=("https://instance-1.internal:3000" "https://instance-2.internal:3000" "https://instance-3.internal:3000")

echo "1️⃣ Logging in on Instance #1..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt "${INSTANCES[0]}/api/auth/callback/credentials" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}')

echo "$LOGIN_RESPONSE" | jq .

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
REFRESH_TOKEN=$(grep refreshToken cookies.txt | awk '{print $7}')

echo ""
echo "2️⃣ Testing access token on Instance #2..."
PROFILE_RESPONSE=$(curl -s "${INSTANCES[1]}/api/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$PROFILE_RESPONSE" | jq .

if echo "$PROFILE_RESPONSE" | jq -e '.email' > /dev/null; then
  echo "✅ Access token works on Instance #2"
else
  echo "❌ Access token failed on Instance #2"
  exit 1
fi

echo ""
echo "3️⃣ Refreshing token on Instance #3..."
REFRESH_RESPONSE=$(curl -s -b cookies.txt -c cookies-new.txt "${INSTANCES[2]}/api/auth/refresh" -X POST)

echo "$REFRESH_RESPONSE" | jq .

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.accessToken')

if [ "$NEW_ACCESS_TOKEN" != "null" ] && [ -n "$NEW_ACCESS_TOKEN" ]; then
  echo "✅ Token refresh works on Instance #3"
else
  echo "❌ Token refresh failed on Instance #3"
  exit 1
fi

echo ""
echo "4️⃣ Using new token on Instance #1..."
FINAL_RESPONSE=$(curl -s "${INSTANCES[0]}/api/users/me" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN")

echo "$FINAL_RESPONSE" | jq .

if echo "$FINAL_RESPONSE" | jq -e '.email' > /dev/null; then
  echo "✅ New access token works on Instance #1"
else
  echo "❌ New access token failed on Instance #1"
  exit 1
fi

echo ""
echo "🎉 All multi-instance token tests passed!"
```

**Expected Result:**
- Login on Instance #1 → success
- Use token on Instance #2 → success
- Refresh on Instance #3 → success
- Use new token on Instance #1 → success

### Test 2: Load Balancer Distribution

**Objective**: Verify load balancer distributes requests evenly

```bash
#!/bin/bash
# test-load-distribution.sh

LOAD_BALANCER="https://joinruach.org"
REQUESTS=300

echo "Sending $REQUESTS requests to load balancer..."

# Make requests and capture X-Instance-ID header
# (Add this header in middleware to identify which instance handled request)
for i in $(seq 1 $REQUESTS); do
  curl -s -o /dev/null -w "%{http_code} %{header_x_instance_id}\n" "$LOAD_BALANCER/api/health"
done | sort | uniq -c

echo ""
echo "Expected: ~100 requests per instance (if 3 instances)"
echo "Actual distribution shown above"
```

**Add instance ID header** in `middleware.ts`:
```typescript
export async function middleware(req: NextRequest) {
  const response = NextResponse.next();

  // Add instance identifier (set via env var)
  response.headers.set('X-Instance-ID', process.env.INSTANCE_ID || 'unknown');

  return response;
}
```

### Test 3: Failover Behavior

**Objective**: Verify system continues to work when one instance fails

```bash
#!/bin/bash
# test-failover.sh

LOAD_BALANCER="https://joinruach.org"

echo "1️⃣ All instances healthy - baseline test"
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$LOAD_BALANCER/api/health")
  if [ "$STATUS" != "200" ]; then
    echo "❌ Request $i failed with status $STATUS"
  else
    echo "✅ Request $i successful"
  fi
done

echo ""
echo "2️⃣ Stopping Instance #2..."
ssh instance-2 "pm2 stop nextjs"

sleep 10  # Wait for health checks to mark it unhealthy

echo ""
echo "3️⃣ Testing with Instance #2 down..."
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$LOAD_BALANCER/api/health")
  if [ "$STATUS" != "200" ]; then
    echo "❌ Request $i failed with status $STATUS"
  else
    echo "✅ Request $i successful"
  fi
done

echo ""
echo "4️⃣ Restarting Instance #2..."
ssh instance-2 "pm2 start nextjs"

sleep 10

echo ""
echo "5️⃣ All instances healthy again"
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$LOAD_BALANCER/api/health")
  if [ "$STATUS" != "200" ]; then
    echo "❌ Request $i failed with status $STATUS"
  else
    echo "✅ Request $i successful"
  fi
done
```

**Expected Result:**
- All requests succeed in step 1
- All requests succeed in step 3 (routed to instances #1 and #3)
- All requests succeed in step 5 (all instances healthy again)

### Test 4: Database Connection Pooling

**Objective**: Verify database doesn't run out of connections

```bash
#!/bin/bash
# test-db-connections.sh

echo "Simulating high concurrent load..."

# Launch 100 concurrent requests
for i in {1..100}; do
  curl -s "https://joinruach.org/api/content" > /dev/null &
done

# Wait for all to complete
wait

# Check PostgreSQL connection count
CONNECTIONS=$(sudo -u postgres psql -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='joinruach_production';")

echo "Active database connections: $CONNECTIONS"
echo "Max connections: 100"

if [ "$CONNECTIONS" -lt 100 ]; then
  echo "✅ Database connections within limits"
else
  echo "⚠️  Database connections approaching limit"
fi
```

### Test 5: Session Consistency

**Objective**: Verify user sessions work across instances

```python
#!/usr/bin/env python3
# test-session-consistency.py

import requests

# Login and get session cookie
login_response = requests.post(
    "https://joinruach.org/api/auth/callback/credentials",
    json={"email": "test@example.com", "password": "testpassword"}
)

session = login_response.cookies

print("1️⃣ Logged in successfully")

# Make 20 authenticated requests (will be distributed across instances)
for i in range(20):
    profile_response = requests.get(
        "https://joinruach.org/api/users/me",
        cookies=session
    )

    if profile_response.status_code == 200:
        print(f"✅ Request {i+1}: Authenticated successfully")
    else:
        print(f"❌ Request {i+1}: Authentication failed")
        exit(1)

print("\n🎉 All requests authenticated correctly across instances!")
```

---

## Troubleshooting

### Issue 1: "Token not found" errors intermittently

**Symptoms:**
- Some users logged out unexpectedly
- Errors like "Refresh token not found in store"
- Happens randomly, not reproducible

**Cause:** Instances using in-memory storage instead of Redis

**Diagnosis:**
```bash
# Check Strapi logs on all instances
ssh strapi-1 "grep -i redis /var/log/strapi.log | tail -20"
ssh strapi-2 "grep -i redis /var/log/strapi.log | tail -20"
ssh strapi-3 "grep -i redis /var/log/strapi.log | tail -20"

# Look for:
# ❌ "[RefreshTokenStore] Redis not available, using in-memory storage"
# ✅ "[RefreshTokenStore] Using Redis for persistence"
```

**Solution:**
```bash
# Verify Redis env vars on all instances
ssh strapi-1 "printenv | grep UPSTASH"
ssh strapi-2 "printenv | grep UPSTASH"
ssh strapi-3 "printenv | grep UPSTASH"

# Test Redis connectivity
ssh strapi-1 "curl -H 'Authorization: Bearer $UPSTASH_TOKEN' $UPSTASH_URL/ping"

# Restart Strapi instances
ssh strapi-1 "pm2 restart strapi"
ssh strapi-2 "pm2 restart strapi"
ssh strapi-3 "pm2 restart strapi"
```

### Issue 2: Load balancer routes all traffic to one instance

**Symptoms:**
- One instance at 100% CPU
- Other instances idle
- Uneven request distribution

**Cause:** Sticky sessions enabled or load balancing algorithm misconfigured

**Diagnosis:**
```bash
# Check Nginx config
grep -A 10 "upstream nextjs" /etc/nginx/sites-enabled/joinruach

# Look for:
# ❌ ip_hash;  (sticky sessions based on IP)
# ✅ least_conn;  (route to least busy instance)
```

**Solution (Nginx):**
```nginx
upstream nextjs_backend {
    # Use least_conn instead of ip_hash
    least_conn;

    server nextjs-1:3000;
    server nextjs-2:3000;
    server nextjs-3:3000;
}
```

**Solution (AWS ALB):**
```bash
# Disable sticky sessions
aws elbv2 modify-target-group-attributes \
  --target-group-arn arn:aws:elasticloadbalancing:.../joinruach-tg \
  --attributes Key=stickiness.enabled,Value=false
```

### Issue 3: Database connection errors during deployment

**Symptoms:**
- "Too many connections" errors
- 503 errors during rolling deployment
- Database connection timeouts

**Cause:** All instances create new connections simultaneously during restart

**Diagnosis:**
```sql
-- Check active connections
SELECT
  client_addr,
  count(*) as connections
FROM pg_stat_activity
WHERE datname='joinruach_production'
GROUP BY client_addr;

-- Check max connections
SHOW max_connections;
```

**Solution 1: Stagger restarts**
```bash
# In deploy script, add delay between instances
for instance in "${INSTANCES[@]}"; do
  deploy_to_instance "$instance"
  sleep 60  # Wait 1 minute before next instance
done
```

**Solution 2: Use connection pooling (PgBouncer)**
```bash
# Install PgBouncer (see Database Connection Pooling section)
sudo apt install pgbouncer

# Configure with transaction pooling
# Update DATABASE_HOST to point to PgBouncer
```

**Solution 3: Graceful connection draining**
```javascript
// In server.js
server.close(() => {
  // Wait for active queries to complete
  setTimeout(() => {
    strapi.db.connection.destroy();
  }, 5000);  // 5 second grace period
});
```

### Issue 4: File uploads fail intermittently

**Symptoms:**
- File uploads work sometimes, fail other times
- 404 errors when accessing uploaded files
- Different results on different instances

**Cause:** Files stored locally instead of centralized storage (R2)

**Diagnosis:**
```bash
# Check upload provider config
ssh strapi-1 "cat /app/config/plugins.js | grep -A 10 upload"

# Look for:
# ❌ provider: 'local'
# ✅ provider: 'cloudflare-r2'
```

**Solution:**
```javascript
// config/plugins.js
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudflare-r2',  // NOT 'local'
      providerOptions: {
        accessKeyId: env('CLOUDFLARE_R2_ACCESS_KEY_ID'),
        secretAccessKey: env('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
        params: {
          Bucket: env('CLOUDFLARE_R2_BUCKET_NAME'),
        },
        cloudflareAccountId: env('CLOUDFLARE_ACCOUNT_ID'),
      },
    },
  },
});
```

### Issue 5: NEXTAUTH_SECRET mismatch

**Symptoms:**
- Users logged out when switching instances
- JWT verification errors
- "Invalid token" errors

**Cause:** Different NEXTAUTH_SECRET on different instances

**Diagnosis:**
```bash
# Check secret on all instances (hash to avoid exposing)
ssh nextjs-1 "echo -n \$NEXTAUTH_SECRET | md5sum"
ssh nextjs-2 "echo -n \$NEXTAUTH_SECRET | md5sum"
ssh nextjs-3 "echo -n \$NEXTAUTH_SECRET | md5sum"

# All hashes must be identical
```

**Solution:**
```bash
# Generate secret ONCE
NEXTAUTH_SECRET=$(openssl rand -base64 48)

# Deploy to ALL instances
for instance in nextjs-1 nextjs-2 nextjs-3; do
  ssh "$instance" "echo 'NEXTAUTH_SECRET=$NEXTAUTH_SECRET' >> /app/.env.production"
  ssh "$instance" "pm2 restart nextjs"
done
```

### Issue 6: Redis memory exhaustion

**Symptoms:**
- Redis evicting keys prematurely
- Users logged out unexpectedly
- "OOM command not allowed" errors

**Cause:** Too many keys in Redis or maxmemory too low

**Diagnosis:**
```bash
# Check Redis memory usage (Upstash)
curl -H "Authorization: Bearer $UPSTASH_TOKEN" "$UPSTASH_URL/info/memory"

# Check key count
curl -H "Authorization: Bearer $UPSTASH_TOKEN" "$UPSTASH_URL/dbsize"
```

**Solution 1: Increase Redis memory**
```bash
# Upstash: Upgrade plan
# Self-hosted: Edit redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru  # Evict least recently used keys
```

**Solution 2: Reduce token TTL**
```javascript
// In custom-auth.js
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;  // Change from 7 days
const REFRESH_TOKEN_EXPIRY = 1 * 24 * 60 * 60;  // To 1 day

// Reduces Redis memory usage by 7x
```

**Solution 3: Clean up expired keys**
```javascript
// Add to refresh-token-store.js cleanup()
async cleanup() {
  // Remove expired Redis keys
  if (redisClient.isAvailable()) {
    const keys = await redisClient.keys(`${this.keyPrefix}*`);

    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        const tokenData = JSON.parse(data);
        if (Date.now() > tokenData.expiresAt) {
          await redisClient.del(key);
        }
      }
    }
  }

  // Also clean in-memory
  // ... existing cleanup code
}
```

---

## Summary Checklist

Before going live with multi-instance deployment:

### Infrastructure
- [ ] Redis configured (Upstash or self-hosted)
- [ ] PostgreSQL with connection pooling (PgBouncer)
- [ ] Load balancer configured (Nginx/ALB/Cloudflare)
- [ ] SSL certificates valid for all domains
- [ ] DNS records point to load balancer
- [ ] Cloudflare R2 for file storage

### Configuration
- [ ] All instances have identical `.env.production`
- [ ] `NEXTAUTH_SECRET` identical across all Next.js instances
- [ ] `APP_KEYS`, `JWT_SECRET`, etc. identical across all Strapi instances
- [ ] Redis credentials configured on all instances
- [ ] Database credentials configured on all instances
- [ ] `COOKIE_SECURE=true` on all instances

### Health Checks
- [ ] Health check endpoints implemented (`/api/health`, `/health`)
- [ ] Load balancer health checks configured
- [ ] Monitoring setup (Prometheus/CloudWatch/Datadog)
- [ ] Centralized logging configured

### Deployment
- [ ] Deployment strategy chosen (rolling/blue-green/canary)
- [ ] Deployment scripts tested
- [ ] Rollback procedure documented
- [ ] Graceful shutdown handlers implemented

### Testing
- [ ] Multi-instance token test passed
- [ ] Load distribution test passed
- [ ] Failover test passed
- [ ] Database connection pool test passed
- [ ] Session consistency test passed

### Operations
- [ ] Monitoring dashboards created
- [ ] Alerts configured (high error rate, unhealthy instances)
- [ ] Runbooks created for common issues
- [ ] On-call rotation defined

---

## Next Steps

1. **Start Small**: Deploy with 2 instances first, then scale to 3+
2. **Monitor Closely**: Watch metrics for first 48 hours after multi-instance deployment
3. **Load Test**: Simulate production traffic before going live
4. **Document**: Keep runbooks updated with lessons learned

For questions or issues, refer to:
- `DEPLOYMENT_CHECKLIST.md` - Full deployment guide
- `TESTING_GUIDE.md` - Manual testing procedures
- `LAUNCH_READINESS_AUDIT.md` - Security audit findings

---

**Created**: 2025-11-04
**Last Updated**: 2025-11-04
**Status**: Ready for Implementation
