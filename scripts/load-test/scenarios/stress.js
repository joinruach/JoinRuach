/**
 * K6 Stress Test Scenario
 *
 * Pushes the system to its limits to identify breaking points,
 * capacity constraints, and recovery behavior.
 *
 * Gradually increases from 50 to 400 concurrent users to observe:
 * - Performance degradation patterns
 * - Error rate changes under extreme load
 * - Database connection pool exhaustion
 * - Memory/CPU utilization
 * - Recovery after load reduction
 *
 * Usage:
 *   k6 run scripts/load-test/scenarios/stress.js
 *   k6 run scripts/load-test/scenarios/stress.js --env BASE_URL=https://staging.api.com
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  baseConfig,
  executionProfiles,
  setupTestConfig,
  getAuthHeaders,
  getJsonHeaders,
} from '../k6-config.js';

// Custom metrics for stress testing
const errorRate = new Rate('stress_errors');
const timeout = new Rate('stress_timeouts');
const slowRequests = new Trend('slow_requests_duration');
const criticalErrors = new Counter('critical_errors');

// Test configuration
export const options = {
  ...setupTestConfig('Stress Test'),
  stages: executionProfiles.stress.stages,
  // Thresholds specifically for stress testing
  thresholds: {
    'http_req_failed': ['rate<0.05'], // Allow up to 5% failures under stress
    'stress_errors': ['rate<0.05'],
    'stress_timeouts': ['rate<0.02'],
  },
};

export default function () {
  const baseUrl = baseConfig.baseUrl;
  const apiUrl = baseConfig.endpoints.api;

  // Stress test scenarios
  try {
    stressUserJourney();
  } catch (error) {
    criticalErrors.add(1);
    console.error(`Critical error in stress test: ${error}`);
  }

  sleep(1);
}

/**
 * Stress test user journey - more aggressive than normal load
 */
function stressUserJourney() {
  // Heavy API calls
  group('Heavy Dashboard Load', function () {
    const response = http.get(`${baseConfig.baseUrl}/api/dashboard`, {
      headers: getAuthHeaders(),
      tags: { page: 'dashboard', stress: 'high' },
      timeout: '30s',
    });

    const success = response.status === 200;
    errorRate.add(!success);

    if (response.timings.duration > 5000) {
      slowRequests.add(response.timings.duration);
    }

    check(response, {
      'dashboard loads under stress': (r) => r.status === 200 || r.status === 503,
      'no critical errors': (r) => r.status !== 500,
    });
  });

  sleep(0.5);

  // Heavy search with complex queries
  group('Complex Search', function () {
    const complexQuery = 'stress test query with multiple filters';
    const response = http.get(
      `${apiUrl}/search?q=${encodeURIComponent(complexQuery)}&limit=100&sort=relevance&filters=active,verified`,
      {
        headers: getAuthHeaders(),
        tags: { endpoint: 'search', stress: 'high' },
        timeout: '30s',
      }
    );

    const success = response.status === 200;
    errorRate.add(!success);

    if (response.status === 0 || response.timings.duration > 10000) {
      timeout.add(true);
    }

    check(response, {
      'search handles stress': (r) => r.status === 200 || r.status === 503 || r.status === 429,
    });
  });

  sleep(0.5);

  // Bulk data operations
  group('Bulk Operations', function () {
    for (let i = 0; i < 5; i++) {
      const payload = JSON.stringify({
        items: Array.from({ length: 10 }).map((_, idx) => ({
          id: `item-${idx}`,
          title: `Stress Test Item ${idx}`,
          value: Math.random() * 1000,
        })),
      });

      const response = http.post(`${apiUrl}/bulk-create`, payload, {
        headers: getJsonHeaders(),
        headers: getAuthHeaders(),
        tags: { endpoint: 'bulk', operation: 'create', stress: 'high' },
        timeout: '30s',
      });

      const success = response.status === 200 || response.status === 201;
      errorRate.add(!success);

      check(response, {
        'bulk operation response received': (r) => r.status !== 0,
      });

      sleep(0.1);
    }
  });

  sleep(0.5);

  // Database stress with concurrent queries
  group('Database Stress', function () {
    for (let i = 0; i < 3; i++) {
      const response = http.get(`${apiUrl}/expensive-query?depth=${i}`, {
        headers: getAuthHeaders(),
        tags: { endpoint: 'database', stress: 'high' },
        timeout: '30s',
      });

      const success = response.status === 200;
      errorRate.add(!success);

      if (response.timings.duration > 5000) {
        slowRequests.add(response.timings.duration);
      }

      check(response, {
        'expensive query completes': (r) => r.status !== 0,
      });

      sleep(0.2);
    }
  });

  sleep(0.5);

  // Concurrent file operations
  group('Concurrent File Operations', function () {
    for (let i = 0; i < 3; i++) {
      const filePayload = JSON.stringify({
        filename: `stress-test-file-${Date.now()}-${i}.txt`,
        size: Math.random() * 5000000, // 0-5MB
        content: 'x'.repeat(Math.random() * 10000),
      });

      const response = http.post(`${apiUrl}/files/upload-metadata`, filePayload, {
        headers: getJsonHeaders(),
        headers: getAuthHeaders(),
        tags: { endpoint: 'upload', stress: 'high' },
        timeout: '30s',
      });

      const success = response.status === 200 || response.status === 201;
      errorRate.add(!success);

      check(response, {
        'file operation initiated': (r) => r.status !== 0,
      });

      sleep(0.1);
    }
  });

  sleep(0.5);

  // Cache stampede simulation
  group('Cache Stress', function () {
    const cacheKeys = Array.from({ length: 20 }).map((_, i) => `cache-key-${i}`);

    for (const key of cacheKeys) {
      const response = http.get(`${apiUrl}/cache/${key}`, {
        headers: getAuthHeaders(),
        tags: { endpoint: 'cache', stress: 'high' },
        timeout: '10s',
      });

      const success = response.status === 200 || response.status === 404;
      errorRate.add(!success);

      check(response, {
        'cache request processed': (r) => r.status !== 0,
      });

      sleep(0.05);
    }
  });

  sleep(0.5);

  // Connection pool stress
  group('Connection Pool Stress', function () {
    const promises = [];

    for (let i = 0; i < 10; i++) {
      const response = http.get(`${apiUrl}/status`, {
        headers: getAuthHeaders(),
        tags: { endpoint: 'status', stress: 'high' },
        timeout: '20s',
      });

      const success = response.status === 200;
      errorRate.add(!success);

      promises.push(response);
    }

    check(promises[0], {
      'connections handle stress': (r) => r !== null,
    });
  });

  // Long-running request
  if (Math.random() < 0.3) {
    group('Long-Running Operation', function () {
      const response = http.get(`${baseConfig.endpoints.generation}/status/long-task`, {
        headers: getAuthHeaders(),
        tags: { endpoint: 'generation', stress: 'high', type: 'long' },
        timeout: '120s',
      });

      const success = response.status === 200 || response.status === 202;
      errorRate.add(!success);

      if (response.timings.duration > 30000) {
        slowRequests.add(response.timings.duration);
      }

      check(response, {
        'long operation handled': (r) => r.status !== 0,
      });
    });
  }
}

/**
 * Test teardown with summary
 */
export function teardown(data) {
  console.log('=== Stress Test Summary ===');
  console.log(`Error rate: ${(errorRate.value * 100).toFixed(2)}%`);
  console.log(`Timeout rate: ${(timeout.value * 100).toFixed(2)}%`);
  console.log(`Critical errors: ${criticalErrors.value}`);
  console.log(`Average slow request time: ${slowRequests.value.toFixed(0)}ms`);
}
