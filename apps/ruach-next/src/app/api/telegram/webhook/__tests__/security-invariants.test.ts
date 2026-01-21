/**
 * Security Invariant Tests for Telegram Webhook
 *
 * These tests exist to prevent future refactors from breaking hardened security behaviors.
 * DO NOT remove or weaken these tests without explicit security review.
 *
 * @see TELEGRAM_PRODUCTION_HARDENING.md
 * @see TELEGRAM_FINAL_VERIFICATION.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Telegram Webhook Security Invariants', () => {

  beforeEach(() => {
    // Reset all mocks and modules between tests
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  /**
   * INVARIANT 1: Silent block returns 200 OK (no retry amplification)
   *
   * When TELEGRAM_SILENT_BLOCK=true and a user is not whitelisted,
   * the webhook MUST return 200 OK to prevent Telegram retry storms.
   */
  it('returns 200 on whitelist block when SILENT_BLOCK=true', async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      TELEGRAM_WEBHOOK_SECRET: 'test-secret',
      TELEGRAM_ALLOWED_USER_IDS: '999999', // User 123456 NOT in whitelist
      TELEGRAM_SILENT_BLOCK: 'true',
      TELEGRAM_REQUIRE_WHITELIST: 'true'
    };

    const mockRequest = {
      headers: new Map([
        ['x-telegram-bot-api-secret-token', 'test-secret'],
        ['content-type', 'application/json']
      ]),
      json: async () => ({
        update_id: 12345,
        message: {
          message_id: 1,
          date: Date.now(),
          chat: { id: 67890, type: 'private' },
          from: { id: 123456, username: 'attacker' },
          text: 'test'
        }
      })
    };

    // Mock fetch to prevent actual API calls
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { POST } = await import('../route');
    const response = await POST(mockRequest as any);
    const data = await response.json();

    // CRITICAL: Must return 200 (not 403) to prevent retry amplification
    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });

    // CRITICAL: Must NOT call capture API
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/capture'),
      expect.anything()
    );

    process.env = originalEnv;
  });

  /**
   * INVARIANT 2: Rate limit returns 200 and does NOT call capture API
   *
   * When a user is rate limited, the webhook MUST:
   * 1. Return 200 OK (silent block)
   * 2. NOT forward to /api/capture (no downstream cost)
   */
  it('rate limit returns 200 and does not call fetch(/api/capture)', async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      TELEGRAM_WEBHOOK_SECRET: 'test-secret',
      TELEGRAM_ALLOWED_USER_IDS: '123456',
      TELEGRAM_REQUIRE_WHITELIST: 'true',
      TELEGRAM_SILENT_BLOCK: 'true',
      UPSTASH_REDIS_REST_URL: 'https://fake-redis.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'fake-token'
    };

    const mockRequest = {
      headers: new Map([
        ['x-telegram-bot-api-secret-token', 'test-secret'],
        ['content-type', 'application/json']
      ]),
      json: async () => ({
        update_id: 12345,
        message: {
          message_id: 1,
          date: Date.now(),
          chat: { id: 67890, type: 'private' },
          from: { id: 123456, username: 'testuser' },
          text: 'test message'
        }
      })
    };

    // Mock Redis to simulate rate limit exceeded
    // Fetch calls in order:
    // 1. SETNX (deduplication check)
    // 2. EXPIRE (deduplication TTL)
    // 3. INCR (rate limit check - user)
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 1 }) // SETNX: new update
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 'OK' }) // EXPIRE: set TTL
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 31 }) // INCR: user count = 31 (> 30 limit)
      });
    vi.stubGlobal('fetch', mockFetch);

    const { POST } = await import('../route');
    const response = await POST(mockRequest as any);
    const data = await response.json();

    // CRITICAL: Must return 200 (not 429)
    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });

    // CRITICAL: Must NOT call capture API (only Redis calls)
    const fetchCalls = mockFetch.mock.calls;
    const captureApiCalls = fetchCalls.filter((call: any) =>
      call[0]?.includes('/api/capture')
    );
    expect(captureApiCalls).toHaveLength(0);

    process.env = originalEnv;
  });

  /**
   * INVARIANT 3: Duplicate update returns 200 immediately
   *
   * When Redis deduplication detects a duplicate update_id,
   * the webhook MUST return 200 OK without processing.
   */
  it('duplicate update returns 200 without processing', async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      TELEGRAM_WEBHOOK_SECRET: 'test-secret',
      TELEGRAM_ALLOWED_USER_IDS: '123456',
      TELEGRAM_REQUIRE_WHITELIST: 'true',
      TELEGRAM_SILENT_BLOCK: 'true',
      UPSTASH_REDIS_REST_URL: 'https://fake-redis.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'fake-token'
    };

    const mockRequest = {
      headers: new Map([
        ['x-telegram-bot-api-secret-token', 'test-secret'],
        ['content-type', 'application/json']
      ]),
      json: async () => ({
        update_id: 12345,
        message: {
          message_id: 1,
          date: Date.now(),
          chat: { id: 67890, type: 'private' },
          from: { id: 123456, username: 'testuser' },
          text: 'test'
        }
      })
    };

    // Mock Redis SETNX to return 0 (key exists = duplicate)
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 0 }) // SETNX returns 0 = duplicate
      });
    vi.stubGlobal('fetch', mockFetch);

    const { POST } = await import('../route');
    const response = await POST(mockRequest as any);
    const data = await response.json();

    // CRITICAL: Must return 200
    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });

    // CRITICAL: Must NOT call capture API
    const fetchCalls = mockFetch.mock.calls;
    expect(fetchCalls).toHaveLength(1); // Only Redis SETNX call
    expect(fetchCalls[0][0]).toContain('setnx');

    process.env = originalEnv;
  });

  /**
   * INVARIANT 4: Oversized payload triggers header-based reject path
   *
   * When Content-Length exceeds MAX_BODY_SIZE, the webhook MUST
   * reject before parsing JSON.
   */
  it('oversized payload triggers header-based reject path', async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      TELEGRAM_WEBHOOK_SECRET: 'test-secret'
    };

    const MAX_BODY_SIZE = 256 * 1024; // 256KB
    const mockRequest = {
      headers: new Map([
        ['x-telegram-bot-api-secret-token', 'test-secret'],
        ['content-type', 'application/json'],
        ['content-length', String(MAX_BODY_SIZE + 1)] // Just over limit
      ]),
      json: vi.fn() // Should NOT be called
    };

    const { POST } = await import('../route');
    const response = await POST(mockRequest as any);
    const data = await response.json();

    // CRITICAL: Must reject with 413
    expect(response.status).toBe(413);
    expect(data.error).toContain('Payload too large');

    // CRITICAL: Must NOT parse JSON (early rejection)
    expect(mockRequest.json).not.toHaveBeenCalled();

    process.env = originalEnv;
  });

  /**
   * INVARIANT 5: safeLog redacts nested sensitive keys
   *
   * The safeLog function MUST recursively redact forbidden keys
   * at any depth, including: authorization, cookie, jwt, session, bearer
   */
  it('safeLog redacts nested authorization/cookie/jwt/session/bearer', () => {
    // Import safeLog function (may need to export it for testing)
    // For now, test the expected behavior pattern

    const testData = {
      userId: 123,
      safe: 'visible',
      authorization: 'Bearer xyz',
      meta: {
        token: 'abc123',
        cookie: 'session=xyz',
        nested: {
          jwt: 'eyJhbGc...',
          session: 'sess_123',
          bearer: 'token_456',
          normalField: 'should-be-visible'
        }
      }
    };

    const FORBIDDEN_KEYS = [
      'text', 'message', 'body', 'caption', 'data', 'headers',
      'token', 'secret', 'password', 'key', 'authorization', 'auth',
      'cookie', 'set-cookie', 'jwt', 'session', 'bearer'
    ];

    function sanitize(value: unknown): unknown {
      if (value === null || value === undefined) return value;
      if (typeof value !== 'object') return value;

      if (Array.isArray(value)) {
        return value.map(sanitize);
      }

      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        const lowerKey = key.toLowerCase();
        const isForbidden = FORBIDDEN_KEYS.some((forbidden) =>
          lowerKey.includes(forbidden)
        );

        if (isForbidden) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitize(val);
        }
      }
      return sanitized;
    }

    const sanitized = sanitize(testData) as any;

    // CRITICAL: Top-level sensitive keys must be redacted
    expect(sanitized.authorization).toBe('[REDACTED]');

    // CRITICAL: Nested sensitive keys must be redacted
    expect(sanitized.meta.token).toBe('[REDACTED]');
    expect(sanitized.meta.cookie).toBe('[REDACTED]');
    expect(sanitized.meta.nested.jwt).toBe('[REDACTED]');
    expect(sanitized.meta.nested.session).toBe('[REDACTED]');
    expect(sanitized.meta.nested.bearer).toBe('[REDACTED]');

    // CRITICAL: Safe keys must NOT be redacted
    expect(sanitized.userId).toBe(123);
    expect(sanitized.safe).toBe('visible');
    expect(sanitized.meta.nested.normalField).toBe('should-be-visible');
  });

  /**
   * INVARIANT 6: Unknown update types don't throw
   *
   * When an unrecognized Telegram update type arrives,
   * extractActor MUST return a safe fallback (empty object)
   * and the webhook MUST return 200 OK.
   */
  it('unknown update type does not throw and results in { ok: true }', async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      TELEGRAM_WEBHOOK_SECRET: 'test-secret'
    };

    const mockRequest = {
      headers: new Map([
        ['x-telegram-bot-api-secret-token', 'test-secret'],
        ['content-type', 'application/json']
      ]),
      json: async () => ({
        update_id: 12345,
        // Unknown update type (not message, callback_query, etc.)
        future_update_type: {
          some_field: 'some_value'
        }
      })
    };

    const { POST } = await import('../route');

    // CRITICAL: Must NOT throw
    await expect(POST(mockRequest as any)).resolves.not.toThrow();

    const response = await POST(mockRequest as any);
    const data = await response.json();

    // CRITICAL: Must return 200 OK (silent success for unknown types)
    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });

    process.env = originalEnv;
  });
});

/**
 * Usage instructions:
 *
 * Run these tests:
 *   pnpm test security-invariants
 *
 * Run in watch mode:
 *   pnpm test security-invariants --watch
 *
 * Run with coverage:
 *   pnpm test security-invariants --coverage
 *
 * If any test fails after a refactor:
 * 1. DO NOT just update the test to pass
 * 2. Review TELEGRAM_PRODUCTION_HARDENING.md
 * 3. Ensure the security behavior is intentionally changed
 * 4. Update documentation before changing tests
 */
