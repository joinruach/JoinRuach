/**
 * Test Mocks
 *
 * Mock functions and objects for testing
 */

import { vi } from 'vitest';

/**
 * Mock Strapi Context
 */
export const createMockStrapiContext = () => ({
  strapi: {
    db: {
      query: vi.fn(),
      transaction: vi.fn(),
    },
    entityService: {
      findMany: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    plugins: {},
    services: {},
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  },
});

/**
 * Mock Koa Context (for Strapi API tests)
 */
export const createMockKoaContext = () => ({
  request: {
    body: {},
    query: {},
    header: {},
  },
  response: {
    status: 200,
    body: null,
  },
  state: {
    user: null,
  },
  send: vi.fn(),
  created: vi.fn(),
  badRequest: vi.fn(),
  unauthorized: vi.fn(),
  forbidden: vi.fn(),
  notFound: vi.fn(),
  internalServerError: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  throw: vi.fn(),
});

/**
 * Mock Redis Client
 */
export const createMockRedis = () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  incr: vi.fn(),
  decr: vi.fn(),
  hget: vi.fn(),
  hset: vi.fn(),
  hdel: vi.fn(),
  hgetall: vi.fn(),
  keys: vi.fn(),
  scan: vi.fn(),
  quit: vi.fn(),
});

/**
 * Mock S3/R2 Client
 */
export const createMockS3Client = () => ({
  send: vi.fn().mockResolvedValue({}),
  putObject: vi.fn().mockResolvedValue({}),
  getObject: vi.fn().mockResolvedValue({}),
  deleteObject: vi.fn().mockResolvedValue({}),
  headObject: vi.fn().mockResolvedValue({}),
});

/**
 * Mock Stripe Client
 */
export const createMockStripe = () => ({
  customers: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    del: vi.fn(),
  },
  subscriptions: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
});

/**
 * Mock SendGrid/Email Client
 */
export const createMockEmailClient = () => ({
  send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  sendMultiple: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
});

/**
 * Mock Next-Auth Session
 */
export const createMockSession = (user?: Record<string, unknown>) => ({
  user: user || {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Mock Next.js Request
 */
export const createMockNextRequest = (
  method: string = 'GET',
  body?: Record<string, unknown>
) => {
  const url = 'http://localhost:3000/api/test';
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * Mock Next.js Response
 */
export const createMockNextResponse = () => ({
  json: vi.fn(),
  status: vi.fn().mockReturnThis(),
  redirect: vi.fn(),
  headers: new Headers(),
});

/**
 * Mock File Upload
 */
export const createMockFile = (
  name: string = 'test.jpg',
  type: string = 'image/jpeg',
  size: number = 102400
) => {
  const blob = new Blob(['test file content'], { type });
  return new File([blob], name, { type });
};

/**
 * Mock FormData
 */
export const createMockFormData = (fields: Record<string, unknown> = {}) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
};

/**
 * Mock Fetch Response
 */
export const createMockFetchResponse = <T = unknown>(
  data: T,
  status: number = 200
) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers(),
  blob: async () => new Blob([JSON.stringify(data)]),
});

/**
 * Mock Environment Variables
 */
export const mockEnv = (vars: Record<string, string>) => {
  const originalEnv = { ...process.env };
  Object.entries(vars).forEach(([key, value]) => {
    process.env[key] = value;
  });
  return () => {
    // Restore original env
    process.env = originalEnv;
  };
};

/**
 * Mock Console Methods
 */
export const mockConsole = () => {
  const originalConsole = { ...console };
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  console.info = vi.fn();
  console.debug = vi.fn();

  return () => {
    // Restore original console
    Object.assign(console, originalConsole);
  };
};
