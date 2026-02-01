# Production Monitoring and Load Testing Setup

Comprehensive guide to monitoring and load testing infrastructure for the Ruach platform.

## Overview

This document covers the complete monitoring and performance testing stack:

1. **Error Tracking**: Sentry for error monitoring and alerting
2. **Uptime Monitoring**: UptimeRobot for service availability
3. **Load Testing**: K6 for performance and stress testing
4. **Dashboards**: Centralized monitoring and alerting

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Services                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Server | DB | Cache | AI Generation Service    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────┬─────────────────────────────────────────────────┘
              │
    ┌─────────┼─────────┬──────────────┐
    │         │         │              │
    ▼         ▼         ▼              ▼
  Sentry   UptimeRobot  k6 Tests   Custom Webhooks
    │         │         │              │
    └─────────┼─────────┴──────────────┘
              │
         ┌────▼────┐
         │ Slack   │
         │ Email   │
         │ Teams   │
         └─────────┘
```

## 1. Sentry Alert Configuration

### Setup

```bash
# Set environment variables
export SENTRY_AUTH_TOKEN="your-sentry-auth-token"
export SENTRY_ORG="your-org-slug"
export SENTRY_PROJECT="ruach-prod"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
export ALERT_EMAIL="alerts@ruach.app"

# Run setup script
npx tsx scripts/setup-sentry-alerts.ts

# Dry run to see what will be configured
npx tsx scripts/setup-sentry-alerts.ts --dry-run
```

### Configured Alerts

#### 1. High Error Rate (>5%)
- **Condition**: Error rate exceeds 5% of all transactions
- **Severity**: Critical
- **Notification**: Slack + Email
- **Frequency**: Every 5 minutes

**Action Items:**
- Check recent deployments
- Review error logs in Sentry
- Check service health status
- Notify on-call engineer

#### 2. Slow Transactions (>30s)
- **Condition**: Individual transaction exceeds 30 seconds
- **Severity**: Warning
- **Notification**: Slack
- **Frequency**: Every 30 minutes

**Action Items:**
- Review database query performance
- Check external API latency
- Monitor resource utilization
- Consider optimization

#### 3. Generation Failures
- **Condition**: >10 generation errors per minute
- **Severity**: Critical
- **Notification**: Slack + Email
- **Frequency**: Every 5 minutes

**Action Items:**
- Check AI model availability
- Verify API token validity
- Check rate limits
- Review generation queue

#### 4. Critical Errors in Production
- **Condition**: Any error-level event in production
- **Severity**: Critical
- **Notification**: Slack + Email
- **Frequency**: Immediate

**Action Items:**
- Review error details
- Identify affected users
- Plan mitigation
- Schedule fix if needed

#### 5. Quota Exceeded
- **Condition**: >100 errors per minute
- **Severity**: Warning
- **Notification**: Slack
- **Frequency**: Every 10 minutes

**Action Items:**
- Check API usage
- Review rate limit headers
- Contact API provider if needed
- Implement backoff strategy

### Sentry Configuration Details

**Alert Channels:**
- **Slack**: Posts to #alerts-critical and #alerts
- **Email**: Sent to alerts@ruach.app

**Rule Composition:**
- Conditions: Define when alerts trigger
- Actions: Define notification channels
- Frequency: Prevents alert spam

**Best Practices:**
1. Always set frequency to prevent alert fatigue
2. Use action matching "any" for OR logic
3. Environment-specific rules for prod/staging
4. Regular review of alert effectiveness

## 2. UptimeRobot Monitoring

### Setup

```bash
# Configure environment
export PRODUCTION_API_URL="https://api.ruach.app"
export PRODUCTION_FRONTEND_URL="https://ruach.app"
export ALERT_EMAIL="alerts@ruach.app"

# View configuration
npx tsx scripts/setup-uptime-monitoring.ts

# Validate endpoints are accessible
npx tsx scripts/setup-uptime-monitoring.ts --validate

# Setup monitors via API (requires UPTIME_ROBOT_API_KEY)
npx tsx scripts/setup-uptime-monitoring.ts --setup-api
```

### Monitors Configuration

#### Critical Monitors (5 minute interval)

1. **API Health Check**
   - URL: `/health`
   - Expected Status: 200
   - Timeout: 10s
   - Alerts: Slack + Email

2. **AI Generation Service**
   - URL: `/api/generation/health`
   - Expected Status: 200
   - Timeout: 15s
   - Alerts: Slack + Email

3. **Database Connection**
   - URL: `/api/health/db`
   - Expected Status: 200
   - Timeout: 10s
   - Alerts: Slack + Email

4. **Authentication Service**
   - URL: `/api/auth/health`
   - Expected Status: 200
   - Timeout: 10s
   - Alerts: Slack + Email

5. **API Gateway**
   - URL: `/api/status`
   - Expected Status: 200
   - Timeout: 10s
   - Alerts: Slack + Email

#### Warning Monitors (10 minute interval)

6. **Cache Health**
   - URL: `/api/health/cache`
   - Expected Status: 200
   - Timeout: 10s
   - Alerts: Slack

7. **Frontend Application**
   - URL: Homepage
   - Expected Status: 200
   - Timeout: 15s
   - Alerts: Slack

8. **WebSocket Service**
   - URL: `/api/websocket/health`
   - Expected Status: 200
   - Timeout: 10s
   - Alerts: Slack

9. **File Upload Service**
   - URL: `/api/upload/health`
   - Expected Status: 200
   - Timeout: 10s
   - Alerts: Slack

10. **Search Service**
    - URL: `/api/search/health`
    - Expected Status: 200
    - Timeout: 10s
    - Alerts: Slack

### Manual Setup in UptimeRobot Dashboard

1. Log in to UptimeRobot
2. Go to **Settings → Alert Contacts**
3. Add alert contacts:
   - Email: alerts@ruach.app
   - Slack: Webhook URL
   - Webhook: `{API_URL}/webhooks/uptime-robot-alerts`

4. Create monitors with above configuration
5. Set status page for public availability
6. Configure incident tracking

### Response Codes

- **200 OK**: Service healthy
- **503 Service Unavailable**: Maintenance or overload
- **429 Too Many Requests**: Rate limited
- **5xx**: Server errors

### Escalation Policy

| Service | Down Time | Action |
|---------|-----------|--------|
| API | > 5 min | Notify on-call |
| Database | > 2 min | Critical escalation |
| Generation | > 10 min | Notify team |
| Frontend | > 5 min | Notify on-call |
| Auth | > 2 min | Critical escalation |

## 3. K6 Load Testing

### Quick Start

```bash
# Install k6
brew install k6  # macOS
# or apt-get install k6  # Linux

# Run smoke test
k6 run scripts/load-test/scenarios/smoke.js

# Run load test
BASE_URL=https://api.ruach.app k6 run scripts/load-test/scenarios/load.js

# Run stress test
k6 run scripts/load-test/scenarios/stress.js --duration 5m --vus 400

# Run AI generation tests
k6 run scripts/load-test/scenarios/ai-generation.js
```

### Test Types

#### Smoke Test (Quick validation)
- **Duration**: 50 seconds
- **Peak VUs**: 1
- **Purpose**: Validate basic functionality
- **Frequency**: Before each deployment

```bash
k6 run scripts/load-test/scenarios/smoke.js
```

#### Load Test (Normal traffic)
- **Duration**: 5.5 minutes
- **Peak VUs**: 100
- **Purpose**: Baseline performance measurement
- **Frequency**: Daily/Weekly

```bash
k6 run scripts/load-test/scenarios/load.js
```

#### Stress Test (Breaking points)
- **Duration**: 5.5 minutes
- **Peak VUs**: 400
- **Purpose**: Find capacity limits
- **Frequency**: Monthly/Before scaling

```bash
k6 run scripts/load-test/scenarios/stress.js
```

#### AI Generation Test (AI endpoint focus)
- **Duration**: 3 minutes
- **Peak VUs**: 20
- **Purpose**: AI endpoint reliability
- **Frequency**: Weekly

```bash
k6 run scripts/load-test/scenarios/ai-generation.js
```

### Key Metrics

**Response Times:**
- p95: 95th percentile (acceptable for most users)
- p99: 99th percentile (tail latency)
- p99.9: 99.9th percentile (worst case)

**Error Tracking:**
- `http_req_failed`: Total request failures
- `checks`: Custom validation checks
- `generation_errors`: AI endpoint errors

**Custom Metrics:**
- `queue_wait_time_ms`: Generation queue wait time
- `generation_time_ms`: Total generation duration
- `tokens_used`: LLM token consumption
- `estimated_cost`: API cost estimation

### Performance Baselines

```
API Endpoints:
  p95: < 500ms
  p99: < 1000ms
  error_rate: < 1%

Search Queries:
  p95: < 1000ms
  p99: < 3000ms
  error_rate: < 1%

Generation Requests:
  p95: < 30000ms (30s)
  p99: < 60000ms (60s)
  error_rate: < 10% (AI timeouts acceptable)

Database:
  p95: < 500ms
  p99: < 1000ms
  error_rate: < 1%
```

### CI/CD Integration

Add to GitHub Actions:

```yaml
name: Load Tests

on:
  push:
    branches: [main, staging]
  schedule:
    - cron: '0 2 * * *'

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run smoke test
        run: docker run -i grafana/k6 run - <scripts/load-test/scenarios/smoke.js

  load:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - name: Run load test
        env:
          BASE_URL: ${{ secrets.API_BASE_URL }}
          API_TOKEN: ${{ secrets.API_TOKEN }}
        run: k6 run scripts/load-test/scenarios/load.js
```

## 4. Health Check Endpoints

All services must implement health check endpoints:

### Endpoint: `/health`

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-02-01T12:00:00Z",
  "version": "1.0.0",
  "uptime_seconds": 86400,
  "checks": {
    "database": "ok",
    "cache": "ok",
    "ai_service": "ok"
  }
}
```

### Endpoint: `/api/health/db`

**Response (200):**
```json
{
  "status": "healthy",
  "response_time_ms": 5,
  "connections": 25,
  "max_connections": 100
}
```

### Endpoint: `/api/health/cache`

**Response (200):**
```json
{
  "status": "healthy",
  "response_time_ms": 2,
  "memory_used_mb": 512,
  "max_memory_mb": 1024
}
```

### Endpoint: `/api/generation/health`

**Response (200):**
```json
{
  "status": "healthy",
  "model": "active",
  "queue_size": 5,
  "average_generation_time_ms": 2500,
  "tokens_today": 1500000,
  "tokens_limit": 2000000
}
```

## 5. Alert Runbooks

### Alert: High Error Rate (>5%)

**Diagnosis:**
1. Check Sentry for error patterns
2. Review recent deployments
3. Check server logs
4. Monitor resource usage

**Response:**
1. Determine root cause
2. If critical: start incident
3. Notify team
4. Implement hotfix if needed
5. Deploy and verify

**Recovery:**
1. Confirm error rate returned to normal
2. Document issue and solution
3. Update runbook if needed
4. Post-mortem for critical issues

### Alert: Database Connection Issues

**Diagnosis:**
1. Check database server status
2. Verify connection pool metrics
3. Check for long-running queries
4. Review recent schema changes

**Response:**
1. Kill long-running queries if needed
2. Increase connection pool temporarily
3. Notify database team
4. Scale database if needed

**Recovery:**
1. Verify connections normalized
2. Identify query optimization opportunities
3. Implement fixes
4. Monitor for recurrence

### Alert: AI Generation Failures

**Diagnosis:**
1. Check AI service logs
2. Verify API credentials/tokens
3. Check rate limits
4. Review queue status
5. Check external AI provider status

**Response:**
1. Verify external service status
2. Check token validity
3. Review rate limit usage
4. Clear stuck generation jobs
5. Escalate to AI team if needed

**Recovery:**
1. Restore service functionality
2. Reprocess failed generations
3. Notify affected users
4. Update status page

### Alert: Frontend Unavailable

**Diagnosis:**
1. Check CDN status
2. Verify DNS resolution
3. Check web server logs
4. Verify SSL certificate

**Response:**
1. Check CDN health
2. Verify origin server
3. Check for DDoS attacks
4. Failover if needed

**Recovery:**
1. Restore service
2. Verify globally accessible
3. Clear CDN cache if needed
4. Communicate with users

## 6. On-Call Procedures

### Escalation Levels

**Level 1: Warning (Slack Notification)**
- Non-critical issues
- Performance degradation
- Isolated failures
- Response time: 30 minutes

**Level 2: Alert (Slack + Email)**
- Critical business impact
- Multiple service failures
- Database issues
- Response time: 5 minutes

**Level 3: Emergency (All channels)**
- Complete service outage
- Data loss risk
- Security issues
- Response time: Immediate

### On-Call Schedule

Use PagerDuty or similar for:
- Weekly rotation
- Escalation policies
- Incident tracking
- Post-mortem scheduling

### First Response Checklist

1. Acknowledge alert in Slack
2. Review alert details
3. Check system status page
4. Review recent changes
5. Start incident if needed
6. Communicate status to team

## 7. Monitoring Dashboard Setup

### Recommended Tools

1. **Grafana** (Recommended)
   - Visualize metrics from Prometheus
   - Create custom dashboards
   - Set up alert rules

2. **DataDog**
   - Comprehensive APM
   - Custom metrics
   - Distributed tracing

3. **New Relic**
   - Full stack monitoring
   - Real user monitoring
   - Performance insights

### Dashboard Panels

**System Health:**
- API response times (p95, p99)
- Error rates by endpoint
- Database connection count
- Cache hit ratio

**Generation Service:**
- Queue depth
- Average generation time
- Token usage
- Cost tracking
- Model availability

**Infrastructure:**
- CPU usage
- Memory utilization
- Disk usage
- Network bandwidth

**User Experience:**
- Frontend load time
- API availability
- Error rate
- User sessions

## 8. Metrics Collection

### Application Metrics

Instrument code with metrics:

```typescript
// Example: Track generation request time
const startTime = Date.now();
const result = await generateContent(prompt);
const duration = Date.now() - startTime;

metrics.histogram('generation.duration_ms', duration, {
  model: result.model,
  status: result.status,
});
```

### Metric Types

- **Gauge**: Current value (e.g., memory usage)
- **Counter**: Cumulative count (e.g., total requests)
- **Histogram**: Distribution (e.g., response times)
- **Summary**: Similar to histogram (deprecated)

### Common Metrics

```
api.request.duration_ms
api.request.error_count
api.request.success_count
db.query.duration_ms
db.connection.count
cache.hit_ratio
generation.duration_ms
generation.token_count
generation.error_count
```

## 9. Logging

### Log Levels

- **ERROR**: Critical issues requiring attention
- **WARN**: Potential issues
- **INFO**: General information
- **DEBUG**: Development/troubleshooting

### Structured Logging

```json
{
  "timestamp": "2024-02-01T12:00:00Z",
  "level": "ERROR",
  "service": "api",
  "request_id": "req-123456",
  "user_id": "user-789",
  "message": "Database connection failed",
  "error": "Connection timeout",
  "duration_ms": 5000,
  "status_code": 500
}
```

### Log Aggregation

Use ELK Stack or similar:
- **Elasticsearch**: Store logs
- **Logstash**: Process and parse
- **Kibana**: Visualize and search

## 10. Alerting Best Practices

1. **Reduce Alert Fatigue**
   - Set appropriate thresholds
   - Use frequency limiting
   - Group related alerts

2. **Actionable Alerts**
   - Include specific information
   - Link to dashboards
   - Provide runbook

3. **Testing Alerts**
   - Test alerts regularly
   - Update contact info
   - Verify notification delivery

4. **Alert Lifecycle**
   - Track alert trends
   - Tune over time
   - Retire resolved issues

## 11. Compliance and SLA

### Service Level Objectives (SLOs)

```
API Availability: 99.95%
Generation Service: 99.0% (AI timeouts acceptable)
Database: 99.99%
Frontend: 99.9%

Response Time (p95):
API: < 500ms
Search: < 1000ms
Generation: < 30000ms
```

### Error Budget

Monthly error budget = (1 - SLO) × total minutes

```
99.95% SLO = 21.6 minutes downtime allowed per month
99.9% SLO = 43.2 minutes downtime allowed per month
99% SLO = 432 minutes downtime allowed per month
```

## 12. Regular Maintenance

### Daily
- Review error trends in Sentry
- Check UptimeRobot alerts
- Verify alert notifications working

### Weekly
- Run load tests
- Review performance metrics
- Check monitoring alert effectiveness
- Update runbooks if needed

### Monthly
- Run stress tests
- Capacity planning analysis
- Alert tuning review
- Compliance check
- Team training/review

## Related Documentation

- [Load Testing Guide](../scripts/load-test/README.md)
- [API Documentation](../API_DOCUMENTATION.md)
- [Deployment Guide](../CODEX.md)
- [Incident Response](INCIDENT_RESPONSE.md)

## Support and Escalation

- **Team Slack**: #monitoring
- **Incident Channel**: #incidents
- **On-Call**: See PagerDuty schedule
- **Escalation**: Contact DevOps lead
