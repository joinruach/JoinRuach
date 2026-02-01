/**
 * K6 Smoke Test Scenario
 *
 * Quick validation test to ensure basic functionality works.
 * Runs with minimal load to catch critical issues fast.
 *
 * Usage:
 *   k6 run scripts/load-test/scenarios/smoke.js
 *   k6 run scripts/load-test/scenarios/smoke.js --vus 1 --duration 1m
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import {
  baseConfig,
  executionProfiles,
  setupTestConfig,
  getAuthHeaders,
  getJsonHeaders,
} from '../k6-config.js';

// Test configuration
export const options = {
  ...setupTestConfig('Smoke Test'),
  stages: executionProfiles.smoke.stages,
};

export default function () {
  const baseUrl = baseConfig.baseUrl;
  const apiUrl = baseConfig.endpoints.api;

  // Test 1: Health check endpoint
  group('Health Check', function () {
    const response = http.get(`${baseUrl}/health`);

    check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 1s': (r) => r.timings.duration < 1000,
      'health check has required fields': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status && body.timestamp;
        } catch {
          return false;
        }
      },
    });

    if (response.status !== 200) {
      console.error(`Health check failed: ${response.status} ${response.body}`);
    }
  });

  sleep(1);

  // Test 2: API status endpoint
  group('API Status', function () {
    const response = http.get(`${apiUrl}/status`, {
      headers: getAuthHeaders(),
      tags: { endpoint: 'api', name: 'status' },
    });

    check(response, {
      'API status is 200': (r) => r.status === 200,
      'API status response time < 1s': (r) => r.timings.duration < 1000,
    });

    if (response.status !== 200) {
      console.error(`API status failed: ${response.status}`);
    }
  });

  sleep(1);

  // Test 3: Authentication endpoint
  group('Authentication', function () {
    const loginPayload = JSON.stringify({
      email: baseConfig.credentials.email,
      password: baseConfig.credentials.password,
    });

    const response = http.post(`${baseConfig.endpoints.auth}/login`, loginPayload, {
      headers: getJsonHeaders(),
      tags: { endpoint: 'auth', name: 'login' },
    });

    check(response, {
      'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'login response time < 2s': (r) => r.timings.duration < 2000,
    });

    // 401 is acceptable for smoke test (we don't have real credentials)
    if (response.status !== 200 && response.status !== 401) {
      console.error(`Auth endpoint failed: ${response.status}`);
    }
  });

  sleep(1);

  // Test 4: Database connectivity
  group('Database Health', function () {
    const response = http.get(`${apiUrl}/health/db`, {
      headers: getAuthHeaders(),
      tags: { endpoint: 'database', name: 'health' },
    });

    check(response, {
      'database health is 200': (r) => r.status === 200,
      'database health response time < 1s': (r) => r.timings.duration < 1000,
    });

    if (response.status !== 200) {
      console.error(`Database health check failed: ${response.status}`);
    }
  });

  sleep(1);

  // Test 5: Cache health
  group('Cache Health', function () {
    const response = http.get(`${apiUrl}/health/cache`, {
      headers: getAuthHeaders(),
      tags: { endpoint: 'cache', name: 'health' },
    });

    check(response, {
      'cache health is 200': (r) => r.status === 200,
      'cache response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (response.status !== 200) {
      console.error(`Cache health check failed: ${response.status}`);
    }
  });

  sleep(1);

  // Test 6: Generation endpoint availability
  group('Generation Endpoint', function () {
    const response = http.get(`${baseConfig.endpoints.generation}/health`, {
      headers: getAuthHeaders(),
      tags: { endpoint: 'generation', name: 'health' },
      timeout: '30s',
    });

    check(response, {
      'generation health is 200': (r) => r.status === 200,
      'generation response time < 5s': (r) => r.timings.duration < 5000,
    });

    if (response.status !== 200) {
      console.error(`Generation endpoint failed: ${response.status}`);
    }
  });

  sleep(1);
}

/**
 * Test teardown
 */
export function teardown(data) {
  console.log('Smoke test completed');
}
