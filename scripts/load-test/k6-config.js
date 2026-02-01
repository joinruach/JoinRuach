/**
 * K6 Load Testing Configuration
 *
 * This file contains shared configuration for all k6 load tests.
 * It defines:
 * - Execution stages (ramp-up, steady-state, ramp-down)
 * - Thresholds for pass/fail criteria
 * - Common setup/teardown logic
 * - Shared metrics
 *
 * Usage: import this config in individual test scenarios
 */

export const baseConfig = {
  // Base URL for all requests (use environment variable or default)
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',

  // API endpoints
  endpoints: {
    api: `${__ENV.BASE_URL || 'http://localhost:3000'}/api`,
    generation: `${__ENV.BASE_URL || 'http://localhost:3000'}/api/generation`,
    auth: `${__ENV.BASE_URL || 'http://localhost:3000'}/api/auth`,
    health: `${__ENV.BASE_URL || 'http://localhost:3000'}/health`,
  },

  // Authentication
  credentials: {
    email: __ENV.TEST_EMAIL || 'test@example.com',
    password: __ENV.TEST_PASSWORD || 'testpassword123',
    // API token for authenticated requests
    apiToken: __ENV.API_TOKEN || 'test-token-12345',
  },

  // Performance thresholds
  thresholds: {
    // HTTP response times
    'http_req_duration': ['p(95)<500', 'p(99)<1000', 'p(99.9)<2000'],
    'http_req_duration{staticAsset:yes}': ['p(99)<500'],

    // Error rate thresholds
    'http_req_failed': ['rate<0.01'], // Less than 1% failure rate
    'checks': ['rate>0.95'], // At least 95% checks pass

    // Specific endpoint thresholds
    'http_req_duration{endpoint:generation}': [
      'p(95)<30000', // 95th percentile < 30 seconds
      'p(99)<60000', // 99th percentile < 60 seconds
    ],
    'http_req_duration{endpoint:api}': [
      'p(95)<1000',
      'p(99)<3000',
    ],

    // Connection metrics
    'http_reqs': ['count>0'],
    'http_conn_reused_aborted': ['rate<0.1'],
  },

  // Common headers
  commonHeaders: {
    'User-Agent': 'K6-LoadTest/1.0',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  },

  // Request timeouts
  timeouts: {
    api: 30000, // milliseconds
    generation: 120000, // AI generation can be slow
    upload: 60000,
  },

  // Logging
  logging: {
    verbose: __ENV.VERBOSE === 'true',
    logFailedRequests: __ENV.LOG_FAILED === 'true',
  },
};

/**
 * Standard execution profiles for different test scenarios
 */
export const executionProfiles = {
  // Smoke test - quick validation
  smoke: {
    stages: [
      { duration: '10s', target: 1 },
      { duration: '30s', target: 1 },
      { duration: '10s', target: 0 },
    ],
    duration: '50s',
    description: 'Quick smoke test with minimal load',
  },

  // Normal load test
  load: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m30s', target: 50 },
      { duration: '20s', target: 100 },
      { duration: '1m30s', target: 100 },
      { duration: '30s', target: 0 },
    ],
    duration: '5m30s',
    description: 'Normal load test simulating typical user traffic',
  },

  // Stress test - push system to limits
  stress: {
    stages: [
      { duration: '30s', target: 50 },
      { duration: '1m', target: 100 },
      { duration: '1m', target: 200 },
      { duration: '1m', target: 300 },
      { duration: '1m', target: 400 },
      { duration: '30s', target: 0 },
    ],
    duration: '5m30s',
    description: 'Stress test to find breaking points',
  },

  // Spike test - sudden traffic spike
  spike: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m', target: 100 },
      { duration: '30s', target: 1000 },
      { duration: '1m', target: 100 },
      { duration: '30s', target: 10 },
      { duration: '10s', target: 0 },
    ],
    duration: '4m40s',
    description: 'Spike test to validate burst handling',
  },

  // Soak test - long duration at steady load
  soak: {
    stages: [
      { duration: '5m', target: 50 },
      { duration: '30m', target: 50 }, // Long steady load
      { duration: '5m', target: 0 },
    ],
    duration: '40m',
    description: 'Long-running soak test to detect memory leaks',
  },
};

/**
 * Helper function to setup common test configuration
 */
export function setupTestConfig(scenarioName) {
  const baseOptions = {
    ext: {
      loadimpact: {
        projectID: __ENV.PROJECT_ID || 0,
        name: scenarioName,
      },
    },
    noConnectionReuse: false,
    noUseCookieJar: false,
    userAgent: baseConfig.commonHeaders['User-Agent'],
  };

  // Apply thresholds
  baseOptions.thresholds = baseConfig.thresholds;

  return baseOptions;
}

/**
 * Common setup function for test scenarios
 */
export function commonSetup() {
  console.log(`Starting test against: ${baseConfig.baseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  return {
    baseUrl: baseConfig.baseUrl,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Common teardown function
 */
export function commonTeardown(data) {
  if (baseConfig.logging.verbose) {
    console.log(`Test completed at: ${new Date().toISOString()}`);
    console.log(`Test duration: ${Date.now() - data.timestamp}`);
  }
}

/**
 * Create authentication token for requests
 */
export function getAuthHeaders() {
  return {
    ...baseConfig.commonHeaders,
    'Authorization': `Bearer ${baseConfig.credentials.apiToken}`,
  };
}

/**
 * Create standard form headers for POST requests
 */
export function getFormHeaders() {
  return {
    ...baseConfig.commonHeaders,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

/**
 * Create JSON headers for POST/PUT requests
 */
export function getJsonHeaders() {
  return {
    ...baseConfig.commonHeaders,
    'Content-Type': 'application/json',
  };
}

/**
 * Helper to add custom tag to requests
 */
export function addTag(key, value) {
  return {
    tags: { [key]: value },
  };
}

/**
 * Utility to make authenticated requests
 */
export function makeAuthenticatedRequest(method, url, payload = null) {
  const options = {
    headers: getAuthHeaders(),
    ...addTag('authenticated', 'true'),
  };

  if (method === 'GET') {
    return http[method](url, options);
  }

  return http[method](url, JSON.stringify(payload), {
    headers: getJsonHeaders(),
    ...options,
  });
}

export default {
  baseConfig,
  executionProfiles,
  setupTestConfig,
  commonSetup,
  commonTeardown,
  getAuthHeaders,
  getFormHeaders,
  getJsonHeaders,
  addTag,
  makeAuthenticatedRequest,
};
