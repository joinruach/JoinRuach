# Formation Engine - Production Deployment Guide

## Overview

The Ruach Formation Platform is now complete and ready for deployment. This document provides instructions for deploying and maintaining the system in production.

## What's Included

### Backend (Strapi v5)
✅ **17 Content Types**
- YahScriptures (8): works, books, verses, tokens, lemmas, alignments, themes, glossary
- Iron Chamber (4): insights, votes, margin-reflections, living-commentary
- Formation Engine (5): phases, guidebook-nodes, canon-axioms, canon-releases, events/journeys/reflections

✅ **Services**
- Formation Engine service (event sourcing, state projection, access control)
- Iron Chamber service (permissions, margin reflections, insights, commentary)
- AI Sharpening service (Claude API integration)
- BullMQ Queue service (async processing)

✅ **API Endpoints**
- Formation Engine: emit-event, get-state, recompute, can-access, queue-stats
- Iron Chamber: margin-reflections, insights, votes, living-commentary, curation
- Health Check: /_health

✅ **Production Features**
- Rate limiting (write: 20/min, read: 100/min, moderate: 30/min)
- Health check endpoint for monitoring
- Error handling and logging
- Input validation

### Frontend (Next.js 14)
✅ **Pages**
- Guidebook landing and phase pages
- Scripture browser (YahScriptures)
- Formation debug/state viewer
- Formation checkpoint flow

✅ **Libraries**
- Formation state projection (`@/lib/formation/state`)
- Strapi client integration
- User ID management (anonymous + authenticated)

### Shared Packages
✅ **@ruach/formation**
- TypeScript types and enums
- Formation state interface
- Event types
- Strapi client
- State projection logic

## Prerequisites

### Required Services
- PostgreSQL 15+
- Redis 7+
- Node.js 20+
- pnpm 8+

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ruach_formation
DATABASE_USERNAME=your_user
DATABASE_PASSWORD=your_password
DATABASE_SSL=false # true in production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD= # optional

# Claude API
CLAUDE_API_KEY=sk-ant-your-key-here

# Strapi
APP_KEYS=generated-app-keys
API_TOKEN_SALT=generated-token-salt
ADMIN_JWT_SECRET=generated-jwt-secret
TRANSFER_TOKEN_SALT=generated-transfer-salt
JWT_SECRET=generated-jwt-secret

# URLs
HOST=0.0.0.0
PORT=1337
APP_FRONTEND_URL=https://yourdomain.com

# Node
NODE_ENV=production
```

#### Frontend (.env.local)
```bash
# Strapi
NEXT_PUBLIC_STRAPI_URL=https://api.yourdomain.com
STRAPI_API_TOKEN=your-api-token-here
STRAPI_FORMATION_TOKEN=your-formation-specific-token
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Build shared packages
pnpm --filter @ruach/formation build
```

### 2. Start Strapi Backend

```bash
cd ruach-ministries-backend

# Development
pnpm develop

# Production
pnpm build
pnpm start
```

### 3. Create API Token

1. Go to Strapi Admin → Settings → API Tokens
2. Create a new token with:
   - Name: "Formation Engine"
   - Token type: Full access (or custom with formation permissions)
   - Token duration: Unlimited
3. Copy the token and add to `.env` as `STRAPI_API_TOKEN`

### 4. Seed Formation Content

```bash
cd ruach-ministries-backend

# Export API token
export STRAPI_API_TOKEN=your-token-here
export STRAPI_URL=http://localhost:1337

# Run seed script
npx tsx scripts/seed-formation-content.ts
```

This will create:
- 5 Formation Phases (Awakening → Stewardship)
- 3 Guidebook Nodes for Awakening phase
- 5 Canon Axioms

### 5. Import Scripture Data

```bash
cd ruach-ministries-backend

# Extract YahScriptures PDF (if not done already)
python scripts/scripture-extraction/extract-yahscriptures.py \
  /path/to/yahscriptures.pdf \
  ./extracted_scripture

# Import to Strapi
npx tsx scripts/scripture-extraction/import-to-strapi.ts ./extracted_scripture
```

### 6. Start Frontend

```bash
cd apps/ruach-next

# Development
pnpm dev

# Production
pnpm build
pnpm start
```

### 7. Set Permissions

In Strapi Admin → Settings → Roles:

**Public role:**
- ✅ scripture-work: find, findOne
- ✅ scripture-verse: find, findOne
- ✅ formation-phase: find, findOne
- ✅ guidebook-node: find, findOne
- ✅ formation-event: create
- ✅ formation-journey: find, findOne
- ✅ iron-insight: find, findOne
- ✅ margin-reflection: find, create
- ✅ living-commentary: find, findOne

**Authenticated role:** (all public + voting/curation)
- ✅ insight-vote: create
- ✅ living-commentary: create

## Testing the System

### 1. Test Health Check

```bash
curl http://localhost:1337/_health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-29T...",
  "queues": {
    "stateRecomputation": { "active": 0, "waiting": 0, "failed": 0 },
    "reflectionAnalysis": { "active": 0, "waiting": 0, "failed": 0 }
  },
  "uptime": 123.45,
  "memory": { "used": 50.5, "total": 100.0 }
}
```

### 2. Test Formation Journey Flow

```bash
# 1. Emit covenant_entered event
curl -X POST http://localhost:1337/api/formation/emit-event \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "covenant_entered",
    "eventData": {"covenantType": "formation_journey"},
    "anonymousUserId": "test-user-123"
  }'

# 2. Get formation state
curl http://localhost:1337/api/formation/state/test-user-123

# 3. Check queue stats
curl http://localhost:1337/api/formation/queue-stats
```

### 3. Test Scripture API

```bash
# List scripture works
curl http://localhost:1337/api/scripture-works

# Get specific verse
curl http://localhost:1337/api/scripture-verses?filters[verseId][$eq]=GEN_1_1
```

### 4. Test Rate Limiting

```bash
# This should hit rate limit after 20 requests in 1 minute
for i in {1..25}; do
  curl -X POST http://localhost:1337/api/formation/emit-event \
    -H "Content-Type: application/json" \
    -d '{"eventType":"covenant_entered","eventData":{},"anonymousUserId":"test-'$i'"}'
  echo ""
done
```

Expected response after 20 requests:
```json
{
  "error": "Too many write requests. Please slow down.",
  "retryAfter": 45
}
```

## Production Deployment

### Option 1: Docker Compose

See `docs/FORMATION-ENGINE-IMPLEMENTATION.md` for complete Docker Compose configuration.

```bash
# Build and start services
docker-compose -f docker-compose.production.yml up -d --build

# Check logs
docker-compose -f docker-compose.production.yml logs -f strapi

# Check health
curl https://api.yourdomain.com/_health
```

### Option 2: Platform-as-a-Service

#### Strapi Backend (Railway, Render, Heroku)

1. Connect your GitHub repository
2. Set environment variables (see above)
3. Set build command: `cd ruach-ministries-backend && pnpm install && pnpm build`
4. Set start command: `cd ruach-ministries-backend && pnpm start`
5. Add PostgreSQL and Redis add-ons

#### Next.js Frontend (Vercel, Netlify)

1. Connect your GitHub repository
2. Set root directory: `apps/ruach-next`
3. Set environment variables (see above)
4. Build command: `pnpm build`
5. Deploy

## Monitoring

### Health Check Endpoint

Monitor `GET /_health` for:
- HTTP 200 = healthy
- HTTP 503 = degraded or error
- Response includes queue stats, uptime, memory usage

### Queue Monitoring

Access queue stats:
```bash
curl http://localhost:1337/api/formation/queue-stats
```

For visual monitoring, install BullBoard (see docs).

### Key Metrics

Monitor:
- Event emission rate
- State recomputation latency
- AI analysis queue depth
- Claude API success/failure rate
- Rate limit hit rate
- Memory usage
- Database connection pool

## Backup Strategy

### Critical Data

**Formation Events** (most critical - immutable audit trail):
```bash
# Daily backup
pg_dump -U $DB_USER -d $DB_NAME -t formation_events > formation_events_$(date +%Y%m%d).sql
```

**Scripture Data** (static, low priority):
```bash
# Weekly backup
pg_dump -U $DB_USER -d $DB_NAME \
  -t scripture_works \
  -t scripture_verses \
  > scripture_$(date +%Y%m%d).sql
```

### Redis Persistence

Configure Redis with AOF:
```bash
redis-server --appendonly yes
```

## Troubleshooting

### BullMQ Workers Not Processing

**Problem:** Events emitted but state not updating
**Solution:**
1. Check Redis connection:
   ```bash
   redis-cli ping
   ```
2. Check Strapi logs for worker initialization
3. Verify `REDIS_HOST` and `REDIS_PORT` in `.env`
4. Restart Strapi to reinitialize workers

### Claude API Errors

**Problem:** "Claude API key not configured"
**Solution:**
1. Verify `CLAUDE_API_KEY` in `.env`
2. Check API key is valid at console.anthropic.com
3. Verify API key has sufficient credits

### Rate Limit Too Strict

**Problem:** Users hitting rate limits too quickly
**Solution:**
1. Adjust limits in `src/middlewares/rate-limit.ts`
2. Implement Redis-backed rate limiting for distributed systems
3. Add user authentication to increase limits for logged-in users

### Formation State Not Loading

**Problem:** Frontend shows "No formation journey started"
**Solution:**
1. Check `NEXT_PUBLIC_STRAPI_URL` is correct
2. Verify `STRAPI_FORMATION_TOKEN` has correct permissions
3. Check browser console for CORS errors
4. Verify user ID is being created (check cookies)

## Scaling Considerations

### Database
- Add read replicas for high traffic
- Index frequently queried fields (see docs)
- Consider partitioning `formation_events` by date

### Redis
- Use Redis Cluster for high availability
- Separate Redis instances for BullMQ vs caching

### BullMQ Workers
- Increase concurrency for state recomputation (currently 5)
- Limit Claude API concurrency to respect rate limits (currently 2)
- Run workers on separate processes/servers for scale

### Caching
- Cache formation state in Redis (5 min TTL)
- Cache scripture data indefinitely
- Use CDN for static assets

## Security Checklist

- [ ] Change all default secrets and tokens
- [ ] Enable DATABASE_SSL in production
- [ ] Restrict Strapi admin access by IP
- [ ] Use HTTPS for all endpoints
- [ ] Enable CORS only for your domain
- [ ] Review and restrict API permissions
- [ ] Enable rate limiting (already implemented)
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated
- [ ] Regular security audits

## Next Steps

### Phase 1: Content (Current)
- [x] Formation phases created
- [x] Awakening guidebook nodes
- [ ] Complete all 5 phases with nodes
- [ ] Add more canon axioms
- [ ] Create canon releases

### Phase 2: Polish
- [ ] Add more sophisticated AI analysis
- [ ] Implement insight threading
- [ ] Build commentary curation UI
- [ ] Add theme-based exploration

### Phase 3: Advanced Features
- [ ] Mentorship system
- [ ] Community features
- [ ] Advanced analytics
- [ ] Mobile app

## Support

For issues or questions:
- Check logs: `docker-compose logs -f strapi`
- Review documentation: `/docs/FORMATION-ENGINE-IMPLEMENTATION.md`
- Check health: `curl /_health`
- Inspect queues: `curl /api/formation/queue-stats`

## License

Copyright © 2025 Ruach Ministries. All rights reserved.
