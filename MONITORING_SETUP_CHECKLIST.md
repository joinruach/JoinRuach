# Monitoring Setup Checklist

Complete checklist for implementing production monitoring and load testing.

## Phase 1: Preparation (Day 1)

### Accounts & Access
- [ ] Sentry account created
- [ ] Sentry auth token generated
- [ ] UptimeRobot account created
- [ ] k6 Cloud account (optional)
- [ ] PagerDuty account created
- [ ] Slack workspace access confirmed
- [ ] Email list configured (alerts@ruach.app)

### Credentials & Configuration
- [ ] Sentry auth token saved securely
- [ ] UptimeRobot API key saved securely
- [ ] Slack webhook URL created and tested
- [ ] Email alerts configured
- [ ] PagerDuty integration token generated
- [ ] API credentials for testing stored

## Phase 2: Infrastructure Setup (Day 2-3)

### Sentry Configuration
- [ ] Run: `npx tsx scripts/setup-sentry-alerts.ts --dry-run`
- [ ] Review dry-run output
- [ ] Verify Slack webhook working
- [ ] Verify email list receiving
- [ ] Run: `npx tsx scripts/setup-sentry-alerts.ts`
- [ ] Verify all 5 alert rules created:
  - [ ] High Error Rate (>5%)
  - [ ] Slow Transactions (>30s)
  - [ ] Generation Failures
  - [ ] Critical Errors in Production
  - [ ] Quota Exceeded
- [ ] Test alert delivery with sample error
- [ ] Verify Slack notification received
- [ ] Verify email notification received

### UptimeRobot Configuration
- [ ] Run: `npx tsx scripts/setup-uptime-monitoring.ts`
- [ ] Review configuration output
- [ ] Create alert contacts in UptimeRobot:
  - [ ] Email contact
  - [ ] Slack contact
  - [ ] Webhook contact
- [ ] Create all 10 monitors manually (or via API)
  - [ ] API Health Check (5 min interval)
  - [ ] AI Generation Service (5 min interval)
  - [ ] Database Connection (10 min interval)
  - [ ] Cache Health (10 min interval)
  - [ ] Frontend Application (10 min interval)
  - [ ] API Gateway (5 min interval)
  - [ ] Authentication Service (5 min interval)
  - [ ] WebSocket Service (10 min interval)
  - [ ] File Upload Service (10 min interval)
  - [ ] Search Service (15 min interval)
- [ ] Verify monitors are active
- [ ] Test alert notification
- [ ] Set up status page
- [ ] Share status page publicly

### Health Check Endpoints
- [ ] Implement `/health` endpoint
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-02-01T12:00:00Z",
    "checks": { "database": "ok", "cache": "ok" }
  }
  ```
- [ ] Implement `/api/health/db` endpoint
- [ ] Implement `/api/health/cache` endpoint
- [ ] Implement `/api/generation/health` endpoint
- [ ] Test all endpoints respond correctly
- [ ] Verify response times < 1 second
- [ ] Document endpoint specifications

## Phase 3: Load Testing Setup (Day 4)

### K6 Installation
- [ ] Install k6 locally
- [ ] Verify installation: `k6 version`
- [ ] Install Docker (if not already)

### Load Test Scripts
- [ ] Review all 4 scenario files:
  - [ ] `/scripts/load-test/k6-config.js`
  - [ ] `/scripts/load-test/scenarios/smoke.js`
  - [ ] `/scripts/load-test/scenarios/load.js`
  - [ ] `/scripts/load-test/scenarios/stress.js`
  - [ ] `/scripts/load-test/scenarios/ai-generation.js`
- [ ] Read load testing guide: `/scripts/load-test/README.md`

### Run Baseline Tests
- [ ] Run smoke test locally:
  ```bash
  k6 run scripts/load-test/scenarios/smoke.js
  ```
- [ ] Verify smoke test passes
- [ ] Run load test:
  ```bash
  k6 run scripts/load-test/scenarios/load.js
  ```
- [ ] Document baseline metrics
- [ ] Create performance baseline report

### Test Configuration
- [ ] Configure test environment variables
- [ ] Test against staging first
- [ ] Verify all endpoints accessible
- [ ] Adjust timeouts if needed
- [ ] Test authentication flow
- [ ] Verify error handling

## Phase 4: Monitoring Dashboard (Day 5)

### Metrics Collection
- [ ] Instrument application code with metrics
- [ ] Add response time tracking
- [ ] Add error tracking
- [ ] Add business metrics
- [ ] Verify metrics collection working

### Dashboard Setup (Choose One)
- [ ] Grafana dashboard (if using Prometheus)
  - [ ] Create system health panel
  - [ ] Create API metrics panel
  - [ ] Create generation metrics panel
  - [ ] Create error rate panel
- [ ] DataDog dashboard
  - [ ] Configure APM
  - [ ] Create custom dashboard
  - [ ] Set up alerts
- [ ] Sentry dashboard
  - [ ] Configure release tracking
  - [ ] Set up performance monitoring
  - [ ] Create custom alerts

### Report Setup
- [ ] Configure daily metrics report
- [ ] Set up weekly performance report
- [ ] Configure monthly capacity report
- [ ] Distribute reports to team

## Phase 5: On-Call & Runbooks (Day 6)

### Incident Response
- [ ] Create incident response runbook
- [ ] Document alert meanings
- [ ] Document troubleshooting steps
- [ ] Create escalation procedures

### Runbook Documentation
- [ ] High Error Rate runbook
- [ ] Database Issues runbook
- [ ] Generation Failures runbook
- [ ] Frontend Down runbook
- [ ] Performance Degradation runbook

### On-Call Setup
- [ ] Configure PagerDuty schedule
- [ ] Add team members
- [ ] Set up escalation policies
- [ ] Configure notification rules
- [ ] Test paging system
- [ ] Brief team on procedures

### Documentation
- [ ] Update team wiki/docs
- [ ] Share monitoring guide with team
- [ ] Distribute quick start guide
- [ ] Schedule training session

## Phase 6: CI/CD Integration (Day 7)

### GitHub Actions Setup
- [ ] Add smoke test to pre-deployment
  ```yaml
  - name: Run smoke test
    run: k6 run scripts/load-test/scenarios/smoke.js
  ```
- [ ] Add load test to main branch
  ```yaml
  - name: Run load test
    if: github.ref == 'refs/heads/main'
    run: k6 run scripts/load-test/scenarios/load.js
  ```
- [ ] Configure test results reporting
- [ ] Set up Slack notifications
- [ ] Create test report artifacts
- [ ] Schedule nightly stress tests

### Deployment Checks
- [ ] Add monitoring checks to deployment
- [ ] Verify health checks passing before deploy
- [ ] Automated rollback on health check failure
- [ ] Post-deployment smoke test

## Phase 7: Testing & Validation (Day 8)

### Functionality Testing
- [ ] Smoke test passes
- [ ] Load test completes without excessive errors
- [ ] Stress test identifies breaking point
- [ ] AI generation test tracks metrics correctly

### Alert Testing
- [ ] Manually trigger Sentry error
- [ ] Verify Slack alert received
- [ ] Verify email alert received
- [ ] Test Sentry alert rules
- [ ] Test UptimeRobot alert delivery
- [ ] Verify PagerDuty escalation

### Dashboard Testing
- [ ] Metrics appearing in dashboard
- [ ] Alerts showing in Slack
- [ ] Reports generating correctly
- [ ] Status page updating

### Load Test Validation
- [ ] Baseline metrics established
- [ ] Thresholds set appropriately
- [ ] Performance requirements met
- [ ] Error rates acceptable

## Phase 8: Documentation & Handoff (Day 9)

### Documentation Complete
- [ ] MONITORING_SETUP.md reviewed
- [ ] Load testing README reviewed
- [ ] Quick start guide created
- [ ] Runbooks written
- [ ] Architecture documentation complete

### Team Training
- [ ] Team briefed on monitoring system
- [ ] On-call procedures explained
- [ ] Runbooks distributed
- [ ] Dashboard access granted
- [ ] Alert channels joined

### Knowledge Transfer
- [ ] Documentation locations documented
- [ ] Key contact information shared
- [ ] Escalation process explained
- [ ] SLA targets communicated

## Phase 9: Ongoing Maintenance (Recurring)

### Daily Monitoring
- [ ] Check error trends in Sentry
- [ ] Review UptimeRobot status
- [ ] Verify no false alarms
- [ ] Acknowledge any active alerts

### Weekly Maintenance
- [ ] Run load tests
- [ ] Review performance metrics
- [ ] Check alert effectiveness
- [ ] Update runbooks if needed
- [ ] Team sync on issues

### Monthly Maintenance
- [ ] Run stress tests
- [ ] Capacity planning review
- [ ] Alert tuning adjustments
- [ ] SLA compliance check
- [ ] Cost analysis (API, cloud)
- [ ] Team retrospective

### Quarterly Maintenance
- [ ] Major load test campaign
- [ ] Disaster recovery drill
- [ ] Performance optimization review
- [ ] Vendor contract review
- [ ] Security audit
- [ ] Strategic planning

## Success Criteria

### Monitoring Operational
- [ ] All alerts working
- [ ] All endpoints monitored
- [ ] Dashboard displaying metrics
- [ ] Reports generating

### Team Ready
- [ ] On-call rotation established
- [ ] Runbooks accessible
- [ ] Team trained
- [ ] Response time targets met

### Performance Baseline
- [ ] Smoke test: < 50 seconds
- [ ] Load test: All thresholds met
- [ ] Error rate: < 1%
- [ ] Response times: < 500ms (p95)

### Documentation Complete
- [ ] All runbooks written
- [ ] Quick start guide available
- [ ] Setup guide documented
- [ ] Team trained

## Rollback Plan

If issues encountered:
1. Disable problematic alerts
2. Reduce monitoring scope
3. Troubleshoot with Sentry/UptimeRobot support
4. Restore from previous configuration
5. Document issues and solutions

## Post-Implementation Review

### 1 Week After
- [ ] Check false alarm rate
- [ ] Review alert frequency
- [ ] Team feedback collected
- [ ] Adjustments made

### 1 Month After
- [ ] Verify all systems stable
- [ ] Review cost analysis
- [ ] Check SLA achievement
- [ ] Plan optimizations

### 3 Months After
- [ ] Full system review
- [ ] Performance trends analysis
- [ ] Capacity planning review
- [ ] Update baselines if needed

## Notes

- Keep all credentials secure (use environment variables)
- Test all alerts before going live
- Document any customizations made
- Schedule regular maintenance windows
- Communicate changes to team

## Support Contacts

- Sentry Support: https://sentry.io/support/
- k6 Community: https://community.grafana.com/c/k6/
- UptimeRobot: https://uptimerobot.com/help/
- Internal Team: #monitoring Slack channel
