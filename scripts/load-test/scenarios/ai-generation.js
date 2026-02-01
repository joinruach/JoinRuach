/**
 * K6 AI Generation Load Test Scenario
 *
 * Specialized load test for AI generation endpoints.
 * Tests:
 * - Concurrent generation requests
 * - Queue management and processing
 * - Token/rate limiting
 * - LLM API reliability
 * - Fallback and error handling
 * - Cost tracking for API calls
 *
 * Usage:
 *   k6 run scripts/load-test/scenarios/ai-generation.js
 *   k6 run scripts/load-test/scenarios/ai-generation.js --vus 10 --duration 5m
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import {
  baseConfig,
  executionProfiles,
  setupTestConfig,
  getAuthHeaders,
  getJsonHeaders,
} from '../k6-config.js';

// Custom metrics
const generationErrors = new Rate('generation_errors');
const queueWaitTime = new Trend('queue_wait_time_ms');
const generationTime = new Trend('generation_time_ms');
const tokenUsage = new Counter('tokens_used');
const estimatedCost = new Gauge('estimated_cost');
const queueDepth = new Gauge('queue_depth');
const timeoutRate = new Rate('generation_timeouts');

// Test configuration - specialized for AI workloads
export const options = {
  ...setupTestConfig('AI Generation Load Test'),
  stages: [
    { duration: '30s', target: 5 }, // Ramp up
    { duration: '2m', target: 20 }, // Steady load
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    'generation_errors': ['rate<0.1'], // Allow 10% errors for AI (can timeout)
    'generation_timeouts': ['rate<0.05'],
    'http_req_failed': ['rate<0.1'],
  },
};

export default function () {
  const genUrl = baseConfig.endpoints.generation;

  // Test different generation scenarios
  const scenario = Math.random();

  if (scenario < 0.4) {
    testSimpleGeneration();
  } else if (scenario < 0.7) {
    testLongFormGeneration();
  } else if (scenario < 0.85) {
    testStreamingGeneration();
  } else {
    testComplexGeneration();
  }

  sleep(2);
}

/**
 * Simple text generation request
 */
function testSimpleGeneration() {
  group('Simple Generation Request', function () {
    const payload = JSON.stringify({
      type: 'text',
      model: 'default',
      prompt: 'Write a short summary about artificial intelligence',
      parameters: {
        temperature: 0.7,
        max_tokens: 150,
        top_p: 0.9,
      },
      options: {
        caching: true,
        timeout: 30000,
      },
    });

    const startTime = new Date();
    const response = http.post(
      `${baseConfig.endpoints.generation}/generate`,
      payload,
      {
        headers: getJsonHeaders(),
        headers: getAuthHeaders(),
        tags: { generation_type: 'simple', model: 'default' },
        timeout: '45s',
      }
    );

    const duration = new Date() - startTime;
    const success = response.status === 200 || response.status === 202;
    generationErrors.add(!success);

    if (response.status === 0) {
      timeoutRate.add(true);
    }

    if (success) {
      generationTime.add(duration);

      try {
        const body = JSON.parse(response.body);
        if (body.result) {
          tokenUsage.add(body.tokens_used || 0);
          estimatedCost.value = (estimatedCost.value || 0) + (body.estimated_cost || 0);
        }
        if (body.queue_depth) {
          queueDepth.value = body.queue_depth;
        }
      } catch {
        // Response parsing error
      }
    }

    check(response, {
      'generation request accepted': (r) => r.status === 200 || r.status === 202,
      'response has generated content': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result || body.status === 'pending';
        } catch {
          return false;
        }
      },
      'response time reasonable': (r) => duration < 60000,
    });
  });
}

/**
 * Long-form generation (essay, article, etc.)
 */
function testLongFormGeneration() {
  group('Long-Form Generation', function () {
    const payload = JSON.stringify({
      type: 'text',
      model: 'advanced',
      prompt: 'Write a comprehensive article about the history and future of artificial intelligence',
      parameters: {
        temperature: 0.6,
        max_tokens: 2000,
        top_p: 0.95,
        presence_penalty: 0.6,
        frequency_penalty: 0.5,
      },
      options: {
        caching: false,
        priority: 'normal',
        timeout: 120000,
      },
    });

    const startTime = new Date();
    const response = http.post(
      `${baseConfig.endpoints.generation}/generate`,
      payload,
      {
        headers: getJsonHeaders(),
        headers: getAuthHeaders(),
        tags: { generation_type: 'long_form', model: 'advanced' },
        timeout: '120s',
      }
    );

    const duration = new Date() - startTime;
    const success = response.status === 200 || response.status === 202;
    generationErrors.add(!success);

    if (success) {
      generationTime.add(duration);

      try {
        const body = JSON.parse(response.body);
        tokenUsage.add(body.tokens_used || 0);
        if (body.estimated_cost) {
          estimatedCost.value = (estimatedCost.value || 0) + body.estimated_cost;
        }
      } catch {
        // Ignore parsing errors
      }
    }

    check(response, {
      'long form generation accepted': (r) => r.status === 200 || r.status === 202,
      'response has content or is pending': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result || body.status === 'pending';
        } catch {
          return false;
        }
      },
    });
  });
}

/**
 * Streaming generation request
 */
function testStreamingGeneration() {
  group('Streaming Generation', function () {
    const payload = JSON.stringify({
      type: 'text',
      model: 'streaming',
      prompt: 'Generate a creative short story',
      parameters: {
        temperature: 0.8,
        max_tokens: 500,
        stream: true,
      },
      options: {
        timeout: 60000,
        stream_chunk_size: 50,
      },
    });

    const startTime = new Date();
    const response = http.post(
      `${baseConfig.endpoints.generation}/generate/stream`,
      payload,
      {
        headers: getJsonHeaders(),
        headers: getAuthHeaders(),
        tags: { generation_type: 'streaming' },
        timeout: '90s',
      }
    );

    const duration = new Date() - startTime;
    const success = response.status === 200;
    generationErrors.add(!success);

    generationTime.add(duration);

    check(response, {
      'streaming generation initiates': (r) => r.status === 200,
      'streaming response is valid': (r) => r.body.length > 0,
    });
  });
}

/**
 * Complex multi-part generation
 */
function testComplexGeneration() {
  group('Complex Generation Request', function () {
    const payload = JSON.stringify({
      type: 'complex',
      tasks: [
        {
          id: 'task1',
          type: 'summarization',
          input: 'A long document about AI...',
          parameters: { max_tokens: 200 },
        },
        {
          id: 'task2',
          type: 'extraction',
          input: 'Extract key points from the document',
          parameters: { max_tokens: 300 },
        },
        {
          id: 'task3',
          type: 'generation',
          prompt: 'Based on the above, generate recommendations',
          parameters: { max_tokens: 400 },
        },
      ],
      options: {
        parallel: true,
        timeout: 120000,
      },
    });

    const startTime = new Date();
    const response = http.post(
      `${baseConfig.endpoints.generation}/generate/batch`,
      payload,
      {
        headers: getJsonHeaders(),
        headers: getAuthHeaders(),
        tags: { generation_type: 'complex', batch: 'true' },
        timeout: '150s',
      }
    );

    const duration = new Date() - startTime;
    const success = response.status === 200 || response.status === 202;
    generationErrors.add(!success);

    if (success) {
      generationTime.add(duration);

      try {
        const body = JSON.parse(response.body);
        if (body.total_tokens_used) {
          tokenUsage.add(body.total_tokens_used);
        }
      } catch {
        // Ignore parsing errors
      }
    }

    check(response, {
      'complex generation accepted': (r) => r.status === 200 || r.status === 202,
      'all tasks submitted': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.tasks && Array.isArray(body.tasks);
        } catch {
          return false;
        }
      },
    });
  });
}

/**
 * Setup before test runs
 */
export function setup() {
  // Validate endpoint is accessible
  const response = http.get(
    `${baseConfig.endpoints.generation}/health`,
    {
      headers: getAuthHeaders(),
      timeout: '10s',
    }
  );

  if (response.status !== 200) {
    throw new Error(
      `AI Generation endpoint not ready: ${response.status}`
    );
  }

  return { startTime: new Date() };
}

/**
 * Teardown with detailed metrics
 */
export function teardown(data) {
  console.log('\n=== AI Generation Load Test Summary ===');
  console.log(`Generation Error Rate: ${(generationErrors.value * 100).toFixed(2)}%`);
  console.log(`Timeout Rate: ${(timeoutRate.value * 100).toFixed(2)}%`);
  console.log(`Average Generation Time: ${generationTime.value.toFixed(0)}ms`);
  console.log(`Total Tokens Used: ${tokenUsage.value}`);
  console.log(`Estimated Cost: $${estimatedCost.value.toFixed(2)}`);
  console.log(`Peak Queue Depth: ${queueDepth.value}`);
  console.log('=====================================\n');
}
