# Production Monitoring Quick Start

Quick reference guide for setting up and using the monitoring infrastructure.

## Files Created

### Setup Scripts
- `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/scripts/setup-sentry-alerts.ts` (332 lines)
- `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/scripts/setup-uptime-monitoring.ts` (415 lines)

### Load Testing
- `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/scripts/load-test/k6-config.js` (262 lines)
- `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/scripts/load-test/scenarios/smoke.js` (164 lines)
- `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/scripts/load-test/scenarios/load.js` (250 lines)
- `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/scripts/load-test/scenarios/stress.js` (280 lines)
- `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/scripts/load-test/scenarios/ai-generation.js` (366 lines)
- `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/scripts/load-test/README.md` (Comprehensive guide)

### Documentation
- `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/docs/MONITORING_SETUP.md` (771 lines)

**Total**: 2,840 lines of code and documentation

## Quick Commands

### 1. Sentry Setup

```bash
# Set environment variables
export SENTRY_AUTH_TOKEN="your-token"
export SENTRY_ORG="your-org"
export SENTRY_PROJECT="ruach-prod"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
export ALERT_EMAIL="alerts@ruach.app"

# Run setup (dry-run first)
npx tsx scripts/setup-sentry-alerts.ts --dry-run

# Apply configuration
npx tsx scripts/setup-sentry-alerts.ts
```

### 2. UptimeRobot Setup

```bash
# View configuration
export PRODUCTION_API_URL="https://api.ruach.app"
export PRODUCTION_FRONTEND_URL="https://ruach.app"
npx tsx scripts/setup-uptime-monitoring.ts

# Validate endpoints
npx tsx scripts/setup-uptime-monitoring.ts --validate

# Setup via API (requires API key)
export UPTIME_ROBOT_API_KEY="your-key"
npx tsx scripts/setup-uptime-monitoring.ts --setup-api
```

### 3. Load Testing

```bash
# Install k6
brew install k6

# Run smoke test (quick 50-second test)
k6 run scripts/load-test/scenarios/smoke.js

# Run load test
k6 run scripts/load-test/scenarios/load.js

# Run stress test
k6 run scripts/load-test/scenarios/stress.js

# Run AI generation test
k6 run scripts/load-test/scenarios/ai-generation.js

# Test against production
BASE_URL=https://api.ruach.app \
API_TOKEN=your-token \
k6 run scripts/load-test/scenarios/load.js
```

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Ruach Platform Services                 │
│  API | DB | Cache | Generation | Frontend     │
└────────┬────────────────────────────┬──────────┘
         │                            │
    ┌────▼─────┐                ┌────▼──────────┐
    │  Sentry   │                │  UptimeRobot  │
    │  Errors   │                │  Availability │
    └────┬──────┘                └────┬──────────┘
         │                            │
         └────────────┬───────────────┘
                      │
           ┌──────────▼────────────┐
           │   Slack/Email         │
           │   Alerts & Reports    │
           └───────────────────────┘

Load Testing (Local/CI):
k6 → JSON Report → Metrics Dashboard
```

## What Gets Monitored

### Sentry (Error Tracking)
- High error rates (>5%)
- Slow transactions (>30s)
- Generation failures (>10/min)
- Critical errors (production)
- Quota exceeded (>100 errors/min)

### UptimeRobot (Availability)
- API health (`/health`)
- AI generation service
- Database connectivity
- Cache health
- Authentication service
- API gateway status
- Frontend availability
- WebSocket service
- File upload service
- Search service

### K6 Load Tests
- **Smoke**: Validates basic functionality
- **Load**: Normal traffic simulation (100 VUs)
- **Stress**: Breaking point testing (400 VUs)
- **AI Generation**: AI endpoint focus (20 VUs)

## Performance Targets

| Service | Target | Warning | Critical |
|---------|--------|---------|----------|
| API Response (p95) | <500ms | >1s | >2s |
| Database Query (p95) | <500ms | >1s | >2s |
| Generation (p95) | <30s | >60s | >120s |
| Error Rate | <1% | 1-5% | >5% |
| Availability | 99.95% | 99-99.95% | <99% |

## Alert Channels

### Critical Alerts (Immediate Response)
- Slack: #alerts-critical
- Email: alerts@ruach.app
- Triggers: Service down, high error rate, DB issues

### Warning Alerts (30-minute Response)
- Slack: #alerts
- Triggers: Performance degradation, queue buildup

### Info Alerts (Hourly Digest)
- Dashboard: Monitoring dashboard
- Triggers: Status changes, quota updates

## Setting Up Alerts

### Slack Integration
1. Create incoming webhook
2. Set webhook URL in environment
3. Configure channels in Sentry

### Email Integration
1. Configure email address
2. Whitelist Sentry IPs
3. Test alert delivery

### PagerDuty Integration
1. Create escalation policy
2. Add team members
3. Set up on-call schedule

## Common Issues & Solutions

### High False Alarm Rate
- Increase frequency threshold
- Raise alert thresholds
- Check for scheduled maintenance

### Missed Alerts
- Verify webhook URLs
- Check email whitelist
- Test alert delivery manually

### High Load Test Cost
- Reduce VU count
- Shorten test duration
- Use staging environment

### Generation Failures in Load Test
- Check rate limits
- Verify API credentials
- Check AI service status
- Allow higher error threshold (10%)

## Maintenance Schedule

| Frequency | Task |
|-----------|------|
| Daily | Check error trends, verify alerts |
| Weekly | Run load tests, review metrics |
| Monthly | Stress test, capacity planning |
| Quarterly | Alert tuning, runbook updates |

## Documentation References

- **Full Monitoring Guide**: `/docs/MONITORING_SETUP.md`
- **Load Testing Details**: `/scripts/load-test/README.md`
- **Sentry Setup**: `scripts/setup-sentry-alerts.ts`
- **UptimeRobot Setup**: `scripts/setup-uptime-monitoring.ts`

## Key Metrics to Monitor

### Business Metrics
- Generation requests per minute
- AI API cost per day
- Error rate trend
- User impact percentage

### Technical Metrics
- API response time (p95, p99)
- Database query time
- Cache hit ratio
- Queue depth
- Token usage

### Infrastructure Metrics
- CPU utilization
- Memory usage
- Network bandwidth
- Disk space
- Connection count

## Next Steps

1. **Setup Sentry**
   - Create Sentry project
   - Generate auth token
   - Configure alerts

2. **Setup UptimeRobot**
   - Create account
   - Add monitors
   - Configure contacts

3. **Run First Load Test**
   ```bash
   k6 run scripts/load-test/scenarios/smoke.js
   ```

4. **Establish Baseline**
   - Document metrics
   - Set thresholds
   - Configure dashboards

5. **Integrate with CI/CD**
   - Add smoke tests to pipeline
   - Schedule load tests
   - Automate reporting

## Support

- Sentry: https://sentry.io/docs/
- k6: https://k6.io/docs/
- UptimeRobot: https://uptimerobot.com/help/
- Team Slack: #monitoring
