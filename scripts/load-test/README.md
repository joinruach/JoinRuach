# K6 Load Testing Infrastructure

Comprehensive load testing suite for the Ruach platform using k6, an open-source load testing tool built in Go.

## Quick Start

### Installation

```bash
# macOS (Homebrew)
brew install k6

# Ubuntu/Debian
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6-stable.list
sudo apt-get update
sudo apt-get install k6

# Windows (Chocolatey)
choco install k6

# Docker
docker pull grafana/k6
```

### Run a Smoke Test

```bash
k6 run scripts/load-test/scenarios/smoke.js
```

### Run Against Production

```bash
BASE_URL=https://api.ruach.app k6 run scripts/load-test/scenarios/load.js
```

## Test Scenarios

### 1. Smoke Test
**File:** `scenarios/smoke.js`

Quick validation test to catch critical issues fast.

**When to use:**
- Before deployment to catch breaking changes
- During CI/CD pipeline for rapid feedback
- Quick health checks

**Characteristics:**
- Duration: ~50 seconds
- Peak users: 1
- Very light load

**Run:**
```bash
k6 run scripts/load-test/scenarios/smoke.js
```

**Key endpoints tested:**
- Health check endpoint
- API status
- Authentication
- Database connectivity
- Cache health
- Generation endpoint

### 2. Load Test
**File:** `scenarios/load.js`

Normal load test simulating typical user traffic patterns.

**When to use:**
- Baseline performance measurement
- Regular performance monitoring
- Before releases
- After major code changes

**Characteristics:**
- Duration: ~5.5 minutes
- Peak users: 100
- Gradual ramp-up and ramp-down
- Mixed user journeys

**Run:**
```bash
k6 run scripts/load-test/scenarios/load.js
```

**Simulates:**
- Dashboard loading
- Search and filtering
- Content viewing
- Data mutations (CRUD operations)
- List retrieval
- Analytics events
- ~20% generation requests

### 3. Stress Test
**File:** `scenarios/stress.js`

Pushes system to limits to identify breaking points.

**When to use:**
- Find capacity limits
- Identify bottlenecks
- Test recovery mechanisms
- Before scaling decisions

**Characteristics:**
- Duration: ~5.5 minutes
- Peak users: 400
- Aggressive request patterns
- Multiple concurrent operations
- Higher timeout allowances

**Run:**
```bash
k6 run scripts/load-test/scenarios/stress.js
```

**Tests:**
- Heavy dashboard loads
- Complex searches
- Bulk operations
- Database stress
- Concurrent file operations
- Cache stampede scenarios
- Connection pool stress

### 4. AI Generation Load Test
**File:** `scenarios/ai-generation.js`

Specialized test for AI generation endpoints.

**When to use:**
- AI endpoint reliability testing
- Queue management validation
- Token usage tracking
- Cost estimation

**Characteristics:**
- Duration: ~3 minutes
- Peak users: 20
- Focused on generation endpoints
- Tracks token usage and costs

**Run:**
```bash
k6 run scripts/load-test/scenarios/ai-generation.js
```

**Tests:**
- Simple text generation
- Long-form generation (essays)
- Streaming generation
- Complex multi-part generation
- Queue depth monitoring
- Token tracking

## Configuration

### Environment Variables

```bash
# Base URL for testing
BASE_URL=http://localhost:3000

# Authentication
TEST_EMAIL=test@example.com
TEST_PASSWORD=testpassword123
API_TOKEN=your-api-token

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ALERT_EMAIL=alerts@ruach.app

# Load Impact (if using cloud execution)
PROJECT_ID=123456

# Logging
VERBOSE=true
LOG_FAILED=true
```

### Configuration Files

- **`k6-config.js`** - Shared configuration for all tests
  - Base URLs and endpoints
  - Common headers
  - Thresholds and performance criteria
  - Execution profiles
  - Helper functions

## Running Tests

### Local Execution

```bash
# Run with default settings
k6 run scripts/load-test/scenarios/smoke.js

# Run with custom VUs and duration
k6 run scripts/load-test/scenarios/load.js --vus 50 --duration 10m

# Run with specific stages
k6 run scripts/load-test/scenarios/stress.js --stage 1m:100 --stage 2m:200

# Verbose output
k6 run scripts/load-test/scenarios/load.js -v

# Profile mode (sample mode, fast execution)
k6 run scripts/load-test/scenarios/load.js --profile profile
```

### Docker Execution

```bash
docker run -i grafana/k6 run - <scripts/load-test/scenarios/load.js

# With environment variables
docker run -i \
  -e BASE_URL=https://api.staging.com \
  -e API_TOKEN=token123 \
  grafana/k6 run - <scripts/load-test/scenarios/load.js
```

### Cloud Execution (k6 Cloud)

```bash
# Login to k6 Cloud
k6 login cloud

# Run on cloud infrastructure
k6 cloud scripts/load-test/scenarios/load.js

# With options
k6 cloud \
  --vus 100 \
  --duration 10m \
  scripts/load-test/scenarios/stress.js
```

## Interpreting Results

### Key Metrics

**Response Times:**
- `p(95) < 500ms` - 95th percentile response time
- `p(99) < 1000ms` - 99th percentile response time
- `p(99.9) < 2000ms` - 99.9th percentile response time

**Error Rates:**
- `http_req_failed` - Percentage of requests that failed
- `checks` - Percentage of checks that passed
- `generation_errors` - Specific metric for AI endpoint failures

**Custom Metrics:**
- `queue_wait_time_ms` - Time spent in generation queue
- `generation_time_ms` - Total generation request time
- `tokens_used` - Total tokens consumed
- `estimated_cost` - Estimated API call costs

### Example Output

```
scenarios: 2 (100.00% of all VUs)
data_received..................: 3.4 MB 68 kB/s
data_sent.......................: 3.1 MB 62 kB/s
http_req_blocked...............: avg=1.14ms    min=100µs   med=400µs   max=48.23ms  p(90)=2.52ms   p(95)=3.44ms
http_req_connecting............: avg=612.53µs  min=0s      med=0s      max=26.96ms  p(90)=1.11ms   p(95)=1.5ms
http_req_duration..............: avg=250.71ms  min=54.23ms med=192.33ms max=1.23s    p(90)=439.12ms p(95)=523.52ms
http_req_failed................: 0.00%   ✓ 0
http_req_receiving.............: avg=12.33ms   min=100µs   med=10.2ms   max=156.21ms p(90)=24.51ms  p(95)=30.12ms
http_req_sending...............: avg=11.34ms   min=50µs    med=8.32ms   max=148.31ms p(90)=21.23ms  p(95)=25.22ms
http_req_tls_handshaking.......: avg=0s        min=0s      med=0s       max=0s       p(90)=0s       p(95)=0s
http_req_waiting...............: avg=227.04ms  min=44.12ms med=171.23ms max=1.15s    p(90)=410.55ms p(95)=492.12ms
http_reqs.......................: 1000   20.33/s
iteration_duration.............: avg=1.26s     min=1.05s   med=1.19s    max=2.15s    p(90)=1.42s    p(95)=1.55s
vus............................: 50     min=50     max=50
vus_max.........................: 50     min=50     max=50
```

### Success Criteria

Tests pass when:
1. `http_req_failed` rate < configured threshold (usually 1%)
2. `checks` pass rate > 95%
3. Response time percentiles meet thresholds
4. No critical errors during execution

## Performance Baselines

Expected performance metrics for the Ruach platform:

| Scenario | Metric | Target | Acceptable | Warning |
|----------|--------|--------|------------|---------|
| API Endpoints | p95 | <500ms | <1s | >2s |
| Search | p95 | <1s | <2s | >3s |
| Generation | p95 | <30s | <60s | >120s |
| Database | p95 | <500ms | <1s | >2s |
| Smoke Test | Errors | 0% | <1% | >5% |
| Load Test | Errors | <1% | <5% | >10% |
| Stress Test | Errors | <5% | <10% | >20% |

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests

on:
  push:
    branches: [main, staging]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run smoke test
        run: |
          docker run -i \
            -e BASE_URL=${{ secrets.API_BASE_URL }} \
            -e API_TOKEN=${{ secrets.API_TOKEN }} \
            grafana/k6 run - <scripts/load-test/scenarios/smoke.js

  load-test:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2

      - name: Run load test
        run: |
          docker run -i \
            -e BASE_URL=${{ secrets.STAGING_API_URL }} \
            -e API_TOKEN=${{ secrets.API_TOKEN }} \
            grafana/k6 run - <scripts/load-test/scenarios/load.js

      - name: Report to Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Load test completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Troubleshooting

### High Error Rate

1. Check target server is running and healthy
2. Verify authentication credentials
3. Check for rate limiting (429 responses)
4. Review server logs for errors
5. Reduce VU count and re-run

### Timeout Issues

1. Increase timeout values in config
2. Check network connectivity
3. Verify server response times
4. Check server resource utilization
5. Reduce concurrent request load

### Memory Issues

1. Reduce VU count
2. Shorter test duration
3. Disable verbose logging
4. Use cloud execution for large tests

## Best Practices

1. **Start Small**: Begin with smoke tests, progress to stress tests
2. **Baseline First**: Establish baseline metrics before changes
3. **Test Realistically**: Use data that matches production patterns
4. **Regular Testing**: Schedule regular load tests (daily/weekly)
5. **Document Issues**: Track performance issues and resolutions
6. **Collaborate**: Share results with the team
7. **Iterate**: Use results to guide optimization efforts

## Resources

- **k6 Documentation**: https://k6.io/docs/
- **k6 Community**: https://community.grafana.com/c/k6/
- **k6 API Reference**: https://k6.io/docs/using-k6/apis/
- **Performance Testing Guide**: https://k6.io/docs/testing-guides/

## Support

For issues or questions:
1. Check k6 documentation
2. Review test output and logs
3. Consult team runbooks
4. Open issue in project repository

## License

These load tests are part of the Ruach platform.
