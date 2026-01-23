# Operations Runbook - Ruach Ministries

## Overview

This runbook provides step-by-step procedures for common operational tasks, incident response, and emergency procedures for the Ruach Ministries application.

**Last Updated**: October 24, 2025
**Maintainer**: DevOps Team
**On-Call Contact**: See [Contact Escalation](#contact-escalation-flow)

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Deployment Procedures](#deployment-procedures)
3. [Rollback Procedures](#rollback-procedures)
4. [Database Operations](#database-operations)
5. [Secret Rotation](#secret-rotation)
6. [Incident Response](#incident-response)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Troubleshooting](#troubleshooting)
9. [Contact Escalation Flow](#contact-escalation-flow)

---

## Quick Reference

### Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| **On-Call Engineer** | TBD | Slack: @oncall | 24/7 |
| **DevOps Lead** | TBD | Phone: +1-XXX-XXX-XXXX | Business hours |
| **CTO** | TBD | Email: cto@joinruach.org | Escalation only |
| **Third-Party Support** | DigitalOcean | https://cloud.digitalocean.com/support | 24/7 |

### Critical URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Production** | https://joinruach.org | Main application |
| **API** | https://api.joinruach.org | Backend API |
| **Admin** | https://joinruach.org/admin | Strapi admin |
| **Monitoring** | TBD | Sentry dashboard |
| **Uptime** | TBD | Uptime Kuma |
| **CI/CD** | https://github.com/your-org/ruach/actions | GitHub Actions |

### Quick Commands

```bash
# Check application health
curl https://joinruach.org/api/health
curl https://api.joinruach.org/_health

# View logs
ssh production "docker-compose logs -f --tail=100"

# Restart services
ssh production "cd /app/ruach && docker-compose restart"

# Check status
ssh production "cd /app/ruach && docker-compose ps"
```

---

## Deployment Procedures

### Standard Deployment (via CI/CD)

**Trigger**: Push to `main` branch

**Process**:
1. Code merged to `main` via pull request
2. GitHub Actions automatically builds and deploys
3. Health checks verify deployment
4. Deployment complete

**Monitoring**:
- Watch GitHub Actions: https://github.com/your-org/ruach/actions
- Check Sentry for errors: https://sentry.io/your-org/ruach
- Verify health endpoints

**Expected Duration**: 10-15 minutes

**Rollback Window**: 24 hours (auto-rollback if health checks fail)

### Manual Deployment (Emergency)

**When to Use**: CI/CD is down or urgent hotfix needed

**Prerequisites**:
- SSH access to production server
- Docker registry access
- Database backup completed

**Steps**:

```bash
# 1. SSH into production server
ssh production

# 2. Navigate to application directory
cd /app/ruach

# 3. Backup current state
docker-compose ps > deployment-$(date +%Y%m%d-%H%M%S).txt

# 4. Pull latest images
docker-compose pull

# 5. Stop services gracefully
docker-compose stop

# 6. Start services with new images
docker-compose up -d

# 7. Verify health
curl http://localhost:3000/api/health
curl http://localhost:1337/_health

# 8. Check logs for errors
docker-compose logs -f --tail=100

# 9. Monitor for 5 minutes
# If errors occur, proceed to rollback
```

**Post-Deployment Checklist**:
- [ ] Health endpoints returning 200 OK
- [ ] No errors in Sentry
- [ ] Application accessible from public URL
- [ ] Database migrations completed (if any)
- [ ] No spike in error rate

---

## Rollback Procedures

### Automatic Rollback

**Trigger**: Health check failures after deployment

**Process**: GitHub Actions automatically reverts to previous deployment

**Verification**:
- Check GitHub Actions logs
- Verify health endpoints
- Check Sentry error rate

### Manual Rollback (Docker Image Rollback)

**When to Use**: Recent deployment causing issues

**Steps**:

```bash
# 1. SSH into production server
ssh production

# 2. Navigate to application directory
cd /app/ruach

# 3. Check current image tags
docker images | grep ruach

# 4. Stop current containers
docker-compose stop

# 5. Edit docker-compose.yml to use previous image tags
# Example: Change from :sha-abc123 to :sha-xyz789
nano docker-compose.yml

# 6. Start with previous images
docker-compose up -d

# 7. Verify rollback
curl http://localhost:3000/api/health
curl http://localhost:1337/_health

# 8. Monitor logs
docker-compose logs -f --tail=100
```

**Post-Rollback**:
- Update incident ticket with rollback details
- Schedule post-mortem
- Document root cause

### Database Rollback

**⚠️ CRITICAL**: Database rollbacks are complex and risky

**Before Rolling Back Database**:
1. Assess if database rollback is truly necessary
2. Contact database administrator
3. Ensure recent backup exists
4. Plan for downtime (30-60 minutes)

**Steps**:

```bash
# 1. Put application in maintenance mode
ssh production "cd /app/ruach && docker-compose stop frontend backend"

# 2. Backup current database state
ssh production "cd /app/ruach && docker-compose exec postgres pg_dump -U postgres ruach > /backups/pre-rollback-$(date +%Y%m%d-%H%M%S).sql"

# 3. Identify rollback point
# List available backups
ssh production "ls -lah /backups/*.sql"

# 4. Restore from backup (see Database Operations section)
# Follow "Restore from Backup" procedure

# 5. Restart application
ssh production "cd /app/ruach && docker-compose up -d"

# 6. Verify data integrity
# Run data validation queries

# 7. Exit maintenance mode
# Monitor for issues
```

---

## Database Operations

### Manual Backup

**Frequency**: Automated daily, manual before deployments

**Steps**:

```bash
# 1. SSH into production server
ssh production

# 2. Create backup directory
mkdir -p /backups

# 3. Create PostgreSQL dump
docker-compose exec -T postgres pg_dump \
  -U $POSTGRES_USER \
  -F c \
  -b \
  -v \
  -f /tmp/backup.dump \
  $POSTGRES_DB

# 4. Copy backup to server
docker cp $(docker-compose ps -q postgres):/tmp/backup.dump \
  /backups/manual-backup-$(date +%Y%m%d-%H%M%S).dump

# 5. Verify backup size
ls -lh /backups/manual-backup-*.dump

# 6. Upload to remote storage (optional)
aws s3 cp /backups/manual-backup-*.dump s3://ruach-backups/
# OR
doctl spaces cp /backups/manual-backup-*.dump spaces://ruach-backups/

# 7. Verify backup integrity
pg_restore --list /backups/manual-backup-*.dump | head -20
```

**Expected Duration**: 2-5 minutes (depends on database size)

**Backup Retention**:
- Last 7 daily backups
- Last 4 weekly backups
- Last 12 monthly backups

### Restore from Backup

**⚠️ CRITICAL**: This will overwrite the current database

**Prerequisites**:
- Application in maintenance mode
- Recent backup file available
- Database administrator approval (for production)

**Steps**:

```bash
# 1. Put application in maintenance mode
ssh production "cd /app/ruach && docker-compose stop frontend backend"

# 2. List available backups
ls -lh /backups/*.dump

# 3. Verify backup you want to restore
pg_restore --list /backups/BACKUP_FILE.dump

# 4. Drop existing database (⚠️ DESTRUCTIVE)
docker-compose exec -T postgres psql -U $POSTGRES_USER -c "DROP DATABASE $POSTGRES_DB;"

# 5. Recreate database
docker-compose exec -T postgres psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB;"

# 6. Restore from backup
docker cp /backups/BACKUP_FILE.dump \
  $(docker-compose ps -q postgres):/tmp/restore.dump

docker-compose exec -T postgres pg_restore \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  -v \
  /tmp/restore.dump

# 7. Verify restore
docker-compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt"

# 8. Restart application
docker-compose up -d

# 9. Verify application health
curl http://localhost:3000/api/health
curl http://localhost:1337/_health

# 10. Exit maintenance mode
# Monitor logs for errors
docker-compose logs -f --tail=100
```

**Post-Restore Checklist**:
- [ ] Application starts successfully
- [ ] Health endpoints returning 200
- [ ] Sample data queries return expected results
- [ ] No database connection errors in logs
- [ ] Inform stakeholders restoration complete

### Database Migration Rollback

**When**: Failed migration causing issues

**Steps**:

```bash
# 1. Check migration history
ssh production "cd /app/ruach/ruach-ministries-backend && pnpm strapi migration:list"

# 2. Rollback last migration
ssh production "cd /app/ruach/ruach-ministries-backend && pnpm strapi migration:rollback"

# 3. Verify rollback
ssh production "cd /app/ruach/ruach-ministries-backend && pnpm strapi migration:status"

# 4. Restart backend
ssh production "cd /app/ruach && docker-compose restart backend"
```

---

## Secret Rotation

### When to Rotate Secrets

**Immediately**:
- Secret potentially exposed (committed to git, leaked)
- Team member with access departs
- Security incident

**Regularly** (every 90 days):
- NEXTAUTH_SECRET
- JWT_SECRET
- API tokens
- Database passwords

### NEXTAUTH_SECRET Rotation

**Impact**: All users will be logged out

**Steps**:

```bash
# 1. Generate new secret
openssl rand -base64 48

# 2. Update GitHub Secrets
# Go to: Settings > Secrets > Actions
# Update NEXTAUTH_SECRET with new value

# 3. Update production .env
ssh production
nano /app/ruach/.env
# Update NEXTAUTH_SECRET=new_value
# Save and exit

# 4. Restart frontend
cd /app/ruach
docker-compose restart frontend

# 5. Verify health
curl http://localhost:3000/api/health

# 6. Inform users they need to re-login
# Post announcement: "We've upgraded our security. Please log in again."
```

**Expected Downtime**: None (rolling restart)

**User Impact**: All users logged out

### JWT_SECRET Rotation

**Impact**: All backend authentication tokens invalidated

**Steps**:

```bash
# 1. Generate new secret
openssl rand -base64 32

# 2. Update GitHub Secrets
# Update JWT_SECRET in GitHub repository secrets

# 3. Update production .env
ssh production
nano /app/ruach/ruach-ministries-backend/.env
# Update JWT_SECRET=new_value
# Save and exit

# 4. Restart backend
cd /app/ruach
docker-compose restart backend

# 5. Restart frontend (to invalidate session JWTs)
docker-compose restart frontend

# 6. Verify health
curl http://localhost:1337/_health
curl http://localhost:3000/api/health

# 7. Monitor for auth errors
docker-compose logs -f backend | grep -i "auth\|jwt"
```

**Expected Downtime**: < 30 seconds

**User Impact**: All users logged out

### Database Password Rotation

**Impact**: Application downtime during rotation

**Steps**:

```bash
# 1. Schedule maintenance window (15-30 minutes)

# 2. Generate new password
openssl rand -base64 32

# 3. Put application in maintenance mode
ssh production "cd /app/ruach && docker-compose stop frontend backend"

# 4. Update database password
docker-compose exec postgres psql -U postgres -c \
  "ALTER USER $POSTGRES_USER WITH PASSWORD 'NEW_PASSWORD';"

# 5. Update .env files with new password
nano /app/ruach/.env
nano /app/ruach/ruach-ministries-backend/.env
# Update DATABASE_PASSWORD=new_password
# Save and exit

# 6. Update GitHub Secrets
# Update DATABASE_PASSWORD

# 7. Restart services
docker-compose up -d

# 8. Verify database connection
docker-compose logs backend | grep -i "database\|connection"

# 9. Verify health
curl http://localhost:3000/api/health
curl http://localhost:1337/_health

# 10. Exit maintenance mode
```

**Expected Downtime**: 5-10 minutes

### API Token Rotation (Strapi, Stripe, etc.)

**Steps**:

```bash
# 1. Generate new token in third-party service
# Example: Stripe Dashboard > Developers > API Keys

# 2. Update GitHub Secrets
# Add new token as STRIPE_SECRET_KEY_NEW

# 3. Deploy with both old and new tokens
# Update code to try new token, fallback to old

# 4. Monitor for 24-48 hours
# Ensure all requests use new token

# 5. Remove old token from GitHub Secrets

# 6. Remove old token from third-party service

# 7. Deploy final version (only new token)
```

**Expected Downtime**: None (gradual migration)

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **P0** | Complete outage, data loss | Immediate | CTO + All hands |
| **P1** | Partial outage, significant impact | 15 minutes | On-call + DevOps Lead |
| **P2** | Degraded performance, minor impact | 1 hour | On-call engineer |
| **P3** | Minor issue, no immediate impact | 4 hours | During business hours |

### P0 - Critical Incident

**Examples**:
- Website completely down
- Database corrupted
- Data breach
- Payment processing failure

**Response**:

```bash
# 1. Immediately acknowledge incident
# Post in #incidents Slack channel

# 2. Assess impact
curl https://joinruach.org/api/health
curl https://api.joinruach.org/_health
# Check Sentry, logs, monitoring

# 3. Engage war room
# Start video call: Zoom/Teams
# Invite: CTO, DevOps Lead, On-Call

# 4. Implement immediate mitigation
# Enable maintenance mode
ssh production "cd /app/ruach && docker-compose stop frontend"
# Deploy known-good version (rollback)

# 5. Communicate status
# Update status page
# Notify stakeholders every 15 minutes

# 6. Fix root cause
# Apply hotfix, restore from backup, etc.

# 7. Verify fix
# Health checks, smoke tests

# 8. Restore service
ssh production "cd /app/ruach && docker-compose up -d"

# 9. Monitor for 1 hour post-restore

# 10. Post-mortem (within 48 hours)
# Document timeline, root cause, prevention
```

### P1 - High Severity

**Examples**:
- Slow response times (>5s)
- Login failures for subset of users
- Email delivery issues

**Response**:

```bash
# 1. Acknowledge within 15 minutes
# Post in #incidents

# 2. Assess scope
# How many users affected?
# Which features impacted?

# 3. Implement workaround if possible
# Rate limiting, feature flag, etc.

# 4. Investigate root cause
# Check logs, metrics, recent deployments

# 5. Fix or rollback
# Deploy fix or rollback to last known good

# 6. Verify resolution
# Test affected functionality

# 7. Monitor for 30 minutes

# 8. Document incident
# Create incident report
```

### P2 - Medium Severity

**Examples**:
- Intermittent errors
- Non-critical feature broken
- Performance degradation

**Response**:
- Investigate within 1 hour
- Create bug ticket
- Fix in next deployment
- Monitor impact

### P3 - Low Severity

**Examples**:
- Minor UI bug
- Logging errors
- Documentation outdated

**Response**:
- Create ticket
- Fix in next sprint
- No immediate action required

---

## Monitoring & Alerts

### Health Check Endpoints

**Frontend**: `GET /api/health`
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T12:00:00.000Z",
  "uptime": 86400,
  "environment": "production"
}
```

**Backend**: `GET /_health`
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T12:00:00.000Z",
  "uptime": 86400,
  "environment": "production",
  "database": "connected"
}
```

### Sentry Alerts

**Configuration**: `.sentry/alerts.yaml`

**Alert Types**:
- Error rate > 1% over 5 minutes → P1
- New error type introduced → P2
- Performance degradation (p95 > 2s) → P2

**Response**:
1. Check Sentry dashboard for details
2. Identify affected code path
3. Reproduce locally if possible
4. Deploy fix or rollback

### Uptime Monitoring

**Tool**: Uptime Kuma

**Monitors**:
- https://joinruach.org (every 60s)
- https://api.joinruach.org (every 60s)
- https://joinruach.org/api/health (every 60s)
- https://api.joinruach.org/_health (every 60s)

**Alerts**:
- Down for 3 consecutive checks → P0
- Down for 1 check → Warning

**Response**:
1. Verify alert is real (check manually)
2. SSH into server to diagnose
3. Check Docker containers status
4. Review logs for errors

### Log Monitoring

**Tool**: Winston + Logtail

**Key Logs**:
- Authentication failures
- Rate limit violations
- 500 errors
- Database connection errors

**Alert Triggers**:
- 10+ auth failures from same IP in 5 min → P2
- 5+ 500 errors in 1 min → P1
- Database connection lost → P0

### RAG Retrieval Observability

**Event**: `rag.context` (JSON log from chat API)

**Fields to index**:
- `mode` (`semantic` | `keyword` | `hybrid` | `none`)
- `fallbackUsed` (`none` | `keyword` | `disabled` | `empty` | `error`)
- `semanticEnabled`, `semanticAttempted`, `semanticChunks`, `semanticEmpty`, `semanticError`
- `keywordAttempted`, `keywordHits`
- `chunksReturned` (effective total), `semanticChunksReturned`, `keywordChunksReturned`
- `contextChars`, `retrievalOk`

**Primary SLI**: `retrievalOk` (or `chunksReturned > 0`) — alert if <95% over 15m.

**Semantic health alerts**:
- `semanticError` rate >0.5% over 15m → P1
- `semanticEmpty` rate >20% when `semanticEnabled=true` over 30m → P2 (possible embedding drift or index stale)

**Dashboards (suggested panels)**:
- Time series: `chunksReturned` split by `mode`
- Stacked bars: `fallbackUsed`
- Rates: `semanticError`, `semanticEmpty` (filter `semanticEnabled=true`)
- Distribution: `contextChars` p50/p90 to catch thin or runaway contexts

**Runbook check**: After deploys that touch RAG, verify dashboard shows `retrievalOk` ~100%, low `semanticEmpty`, and expected `fallbackUsed` mix.

---

## Troubleshooting

### Application Won't Start

**Symptoms**: Container exits immediately or won't start

**Diagnosis**:

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs frontend backend

# Check for port conflicts
netstat -tulpn | grep :3000
netstat -tulpn | grep :1337

# Check environment variables
docker-compose config

# Check disk space
df -h
```

**Common Causes**:
1. Missing environment variable
2. Port already in use
3. Disk full
4. Database not ready

**Solutions**:

```bash
# Fix missing env vars
nano .env
# Add missing variables

# Kill process using port
lsof -ti:3000 | xargs kill -9

# Free disk space
docker system prune -a

# Wait for database
docker-compose up -d postgres
sleep 10
docker-compose up -d frontend backend
```

### Database Connection Issues

**Symptoms**: "Cannot connect to database" errors

**Diagnosis**:

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;"

# Check connection string
docker-compose exec backend env | grep DATABASE
```

**Solutions**:

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check credentials
# Verify DATABASE_PASSWORD in .env matches

# Check network
docker network inspect ruach_default

# Recreate database if corrupted
# (Follow database restore procedure)
```

### High Memory Usage

**Symptoms**: Slow performance, OOM kills

**Diagnosis**:

```bash
# Check memory usage
docker stats

# Check system memory
free -h

# Check for memory leaks
docker-compose logs backend | grep -i "memory\|heap"
```

**Solutions**:

```bash
# Restart high-memory containers
docker-compose restart backend

# Increase container memory limits
# Edit docker-compose.yml
# Add: mem_limit: 2g

# Scale down if needed
# Reduce worker processes

# Investigate memory leak
# Review recent code changes
# Check for unclosed connections
```

### Slow API Responses

**Symptoms**: Response times > 2s

**Diagnosis**:

```bash
# Check response times
curl -w "@curl-format.txt" https://api.joinruach.org/_health

# Check database query performance
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
# Run: SELECT * FROM pg_stat_activity;

# Check rate limiting
docker-compose logs backend | grep -i "rate limit"

# Check CPU usage
docker stats
```

**Solutions**:

```bash
# Add database indexes
# Identify slow queries
# Create indexes on frequently queried columns

# Enable query caching
# Add Redis for caching

# Scale horizontally
# Add more backend instances

# Optimize queries
# Review N+1 queries
# Use eager loading
```

### Authentication Issues

**Symptoms**: Users can't log in, tokens invalid

**Diagnosis**:

```bash
# Check if NextAuth is configured correctly
curl https://joinruach.org/api/auth/signin

# Check backend auth endpoint
curl -X POST https://api.joinruach.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"test"}'

# Check rate limiting
docker-compose logs backend | grep -i "login\|auth"

# Check JWT secret
docker-compose exec backend env | grep JWT_SECRET
```

**Solutions**:

```bash
# Verify secrets are set correctly
# Check NEXTAUTH_SECRET and JWT_SECRET

# Clear rate limits if needed
# Restart backend to reset in-memory rate limiter
docker-compose restart backend

# Check cookie settings
# Verify SameSite, Secure flags

# Verify CORS
# Check allowed origins in config/middlewares.js
```

---

## Contact Escalation Flow

### Escalation Ladder

```
Level 1: On-Call Engineer (Immediate)
    ↓ (15 minutes)
Level 2: DevOps Lead (P0/P1)
    ↓ (30 minutes)
Level 3: CTO (P0 only)
    ↓ (1 hour)
Level 4: External Support (Database, Infrastructure)
```

### Escalation Criteria

**To DevOps Lead**:
- On-call engineer unable to resolve within 15 minutes
- P0 or P1 incident
- Requires architectural decision
- Multiple services impacted

**To CTO**:
- P0 incident unresolved after 30 minutes
- Data breach or security incident
- Requires executive decision (e.g., emergency maintenance)
- Legal or compliance implications

**To External Support**:
- Infrastructure provider issues (DigitalOcean)
- Third-party service outages (Stripe, Sentry)
- Requires vendor expertise

### Communication Templates

**P0 Incident Notification**:
```
🚨 P0 INCIDENT

Summary: [Brief description]
Impact: [Number of users affected, % of functionality]
Started: [Timestamp]
Status: Investigating / Mitigating / Resolved
ETA: [Expected resolution time]

War Room: [Zoom/Teams link]
Incident Commander: [Name]

Updates will be posted every 15 minutes.
```

**Incident Resolution**:
```
✅ INCIDENT RESOLVED

Summary: [What happened]
Duration: [Start time - End time]
Root Cause: [Technical explanation]
Impact: [Users affected, data lost, etc.]
Prevention: [Steps taken to prevent recurrence]

Post-Mortem: [Link to document]
```

### Communication Channels

| Channel | Purpose | Audience |
|---------|---------|----------|
| **#incidents** | Real-time incident updates | Engineering team |
| **#status** | Customer-facing status | All stakeholders |
| **Email** | Formal notifications | Leadership |
| **Status Page** | Public status updates | Customers |

---

## Maintenance Windows

### Scheduled Maintenance

**Frequency**: Monthly (first Sunday of month, 2-4 AM EST)

**Procedure**:

```bash
# 1 week before: Announce maintenance window
# 24 hours before: Reminder

# During window:
# 1. Enable maintenance page
# 2. Backup database
# 3. Apply updates/migrations
# 4. Restart services
# 5. Verify health
# 6. Disable maintenance page

# After: Send completion notice
```

### Emergency Maintenance

**When to Use**: Critical security updates, infrastructure failures

**Procedure**:
1. Assess urgency and impact
2. Get CTO approval (or delegate if P0)
3. Announce ASAP (minimum 1 hour notice if possible)
4. Perform maintenance
5. Post-mortem required

---

## Appendix

### Useful Commands

```bash
# View all running containers
docker-compose ps

# Restart all services
docker-compose restart

# View logs (last 100 lines, follow)
docker-compose logs -f --tail=100

# View logs for specific service
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend sh

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a

# Backup database
docker-compose exec postgres pg_dump -U postgres ruach > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres ruach
```

### Environment Variables Reference

**Frontend (.env)**:
```bash
NEXTAUTH_URL=https://joinruach.org
NEXTAUTH_SECRET=[64 char secret]
NEXT_PUBLIC_STRAPI_URL=https://api.joinruach.org
SENTRY_DSN=[Sentry DSN]
```

**Backend (.env)**:
```bash
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=ruach
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=[secret]
JWT_SECRET=[32 char secret]
ADMIN_JWT_SECRET=[32 char secret]
```

### Service Dependencies

```
Frontend (Next.js) Port 3000
    ↓
Backend (Strapi) Port 1337
    ↓
Database (PostgreSQL) Port 5432
    ↓
Redis (Optional) Port 6379
```

---

**Document Version**: 1.0
**Last Reviewed**: October 24, 2025
**Next Review**: January 24, 2026
**Owner**: DevOps Team
