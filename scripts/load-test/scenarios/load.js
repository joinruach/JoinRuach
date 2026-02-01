/**
 * K6 Load Test Scenario
 *
 * Normal load test simulating typical user traffic patterns.
 * Gradually increases load to 50 users, maintains for a period,
 * then ramps down.
 *
 * This tests:
 * - API response times under normal load
 * - Resource utilization at peak capacity
 * - Database and cache performance
 * - Error handling and recovery
 *
 * Usage:
 *   k6 run scripts/load-test/scenarios/load.js
 *   k6 run scripts/load-test/scenarios/load.js --env BASE_URL=https://prod.api.com
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import {
  baseConfig,
  executionProfiles,
  setupTestConfig,
  getAuthHeaders,
  getJsonHeaders,
} from '../k6-config.js';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  ...setupTestConfig('Load Test'),
  stages: executionProfiles.load.stages,
};

export default function () {
  const baseUrl = baseConfig.baseUrl;
  const apiUrl = baseConfig.endpoints.api;

  // Simulate user workflow
  userJourney();

  sleep(1);
}

/**
 * Simulate a typical user journey
 */
function userJourney() {
  // 1. User lands on home/dashboard
  group('Dashboard Load', function () {
    const response = http.get(`${baseConfig.baseUrl}/api/dashboard`, {
      headers: getAuthHeaders(),
      tags: { page: 'dashboard' },
      timeout: '10s',
    });

    const success = response.status === 200;
    errorRate.add(!success);

    check(response, {
      'dashboard loads successfully': (r) => r.status === 200,
      'dashboard response time < 2s': (r) => r.timings.duration < 2000,
      'dashboard has data': (r) => r.body.length > 0,
    });
  });

  sleep(1);

  // 2. User searches or filters content
  group('Search/Filter', function () {
    const searchQuery = 'test query';
    const response = http.get(
      `${apiUrl}/search?q=${encodeURIComponent(searchQuery)}&limit=20`,
      {
        headers: getAuthHeaders(),
        tags: { endpoint: 'search' },
        timeout: '15s',
      }
    );

    const success = response.status === 200;
    errorRate.add(!success);

    check(response, {
      'search returns 200': (r) => r.status === 200,
      'search response time < 1s': (r) => r.timings.duration < 1000,
      'search returns results': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.results);
        } catch {
          return false;
        }
      },
    });
  });

  sleep(2);

  // 3. User views content details
  group('View Content', function () {
    const contentId = `test-content-${Math.floor(Math.random() * 1000)}`;
    const response = http.get(`${apiUrl}/content/${contentId}`, {
      headers: getAuthHeaders(),
      tags: { endpoint: 'content', name: 'view' },
      timeout: '10s',
    });

    const success = response.status === 200;
    errorRate.add(!success);

    check(response, {
      'content view returns 200 or 404': (r) => r.status === 200 || r.status === 404,
      'content response time < 2s': (r) => r.timings.duration < 2000,
    });
  });

  sleep(1);

  // 4. User creates/updates data
  group('Data Mutation', function () {
    const payload = JSON.stringify({
      title: 'Test Item',
      description: 'Test description',
      category: 'test',
      timestamp: new Date().toISOString(),
    });

    const response = http.post(`${apiUrl}/items`, payload, {
      headers: getJsonHeaders(),
      headers: getAuthHeaders(),
      tags: { endpoint: 'items', name: 'create' },
      timeout: '15s',
    });

    const success = response.status === 201 || response.status === 200;
    errorRate.add(!success);

    check(response, {
      'create item returns 201': (r) => r.status === 201 || r.status === 200,
      'create response time < 3s': (r) => r.timings.duration < 3000,
    });
  });

  sleep(1);

  // 5. User retrieves list data
  group('List Retrieval', function () {
    const response = http.get(`${apiUrl}/items?page=1&limit=50`, {
      headers: getAuthHeaders(),
      tags: { endpoint: 'items', name: 'list' },
      timeout: '10s',
    });

    const success = response.status === 200;
    errorRate.add(!success);

    check(response, {
      'list returns 200': (r) => r.status === 200,
      'list response time < 2s': (r) => r.timings.duration < 2000,
      'list has pagination': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.total && body.page !== undefined;
        } catch {
          return false;
        }
      },
    });
  });

  sleep(1);

  // 6. User makes analytic events
  group('Analytics Events', function () {
    const eventPayload = JSON.stringify({
      event: 'user_action',
      action: 'view',
      target: 'content',
      metadata: {
        timestamp: new Date().toISOString(),
        session_id: `session-${Math.random()}`,
      },
    });

    const response = http.post(`${apiUrl}/analytics/events`, eventPayload, {
      headers: getJsonHeaders(),
      headers: getAuthHeaders(),
      tags: { endpoint: 'analytics' },
      timeout: '5s',
    });

    const success = response.status === 200 || response.status === 202;
    errorRate.add(!success);

    check(response, {
      'analytics endpoint responds': (r) => r.status === 200 || r.status === 202,
      'analytics response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(2);

  // 7. Occasionally test generation endpoint
  if (Math.random() < 0.2) {
    // 20% of users trigger generation
    group('Content Generation', function () {
      const generationPayload = JSON.stringify({
        type: 'text',
        prompt: 'Test prompt',
        options: {
          length: 'short',
        },
      });

      const response = http.post(
        `${baseConfig.endpoints.generation}/generate`,
        generationPayload,
        {
          headers: getJsonHeaders(),
          headers: getAuthHeaders(),
          tags: { endpoint: 'generation' },
          timeout: '60s',
        }
      );

      const success = response.status === 200;
      errorRate.add(!success);

      check(response, {
        'generation starts successfully': (r) => r.status === 200 || r.status === 202,
        'generation responds within timeout': (r) => r.timings.duration < 60000,
      });
    });

    sleep(3);
  }
}

/**
 * Test teardown
 */
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Error rate: ${errorRate.value.toFixed(2)}%`);
}
