/**
 * Tests for Rate Limiter Service
 *
 * Tests the rate limiting functionality for login, uploads, and media endpoints.
 */

import { rateLimiter } from '../../src/services/rate-limiter';

describe('RateLimiter Service', () => {
  beforeEach(() => {
    // Clear rate limiter state between tests
    rateLimiter.clear();
  });

  describe('Basic rate limiting', () => {
    it('should allow requests within the limit', async () => {
      const key = 'test:ip:192.168.1.1';
      const maxAttempts = 5;
      const windowMs = 60000; // 1 minute

      // First 5 attempts should be allowed
      for (let i = 0; i < maxAttempts; i++) {
        const result = await rateLimiter.check(key, maxAttempts, windowMs);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(maxAttempts - (i + 1));
      }
    });

    it('should block requests exceeding the limit', async () => {
      const key = 'test:ip:192.168.1.2';
      const maxAttempts = 3;
      const windowMs = 60000;

      // First 3 attempts allowed
      for (let i = 0; i < maxAttempts; i++) {
        await rateLimiter.check(key, maxAttempts, windowMs);
      }

      // 4th attempt should be blocked
      const result = await rateLimiter.check(key, maxAttempts, windowMs);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should return correct resetAt timestamp', async () => {
      const key = 'test:ip:192.168.1.3';
      const maxAttempts = 5;
      const windowMs = 60000;

      const beforeTime = Date.now();
      const result = await rateLimiter.check(key, maxAttempts, windowMs);
      const afterTime = Date.now();

      expect(result.resetAt).toBeGreaterThanOrEqual(beforeTime + windowMs);
      expect(result.resetAt).toBeLessThanOrEqual(afterTime + windowMs);
    });
  });

  describe('Window expiration', () => {
    it('should reset after window expires', async () => {
      const key = 'test:ip:192.168.1.4';
      const maxAttempts = 2;
      const windowMs = 100; // 100ms for fast testing

      // Use up the limit
      await rateLimiter.check(key, maxAttempts, windowMs);
      await rateLimiter.check(key, maxAttempts, windowMs);

      // Should be blocked
      let result = await rateLimiter.check(key, maxAttempts, windowMs);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again after window expiration
      result = await rateLimiter.check(key, maxAttempts, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxAttempts - 1);
    });
  });

  describe('Multiple keys', () => {
    it('should track different keys independently', async () => {
      const key1 = 'test:ip:192.168.1.5';
      const key2 = 'test:ip:192.168.1.6';
      const maxAttempts = 3;
      const windowMs = 60000;

      // Use up limit for key1
      for (let i = 0; i < maxAttempts; i++) {
        await rateLimiter.check(key1, maxAttempts, windowMs);
      }

      // key1 should be blocked
      const result1 = await rateLimiter.check(key1, maxAttempts, windowMs);
      expect(result1.allowed).toBe(false);

      // key2 should still be allowed
      const result2 = await rateLimiter.check(key2, maxAttempts, windowMs);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(maxAttempts - 1);
    });
  });

  describe('Reset functionality', () => {
    it('should reset rate limit for specific key', async () => {
      const key = 'test:ip:192.168.1.7';
      const maxAttempts = 2;
      const windowMs = 60000;

      // Use up the limit
      await rateLimiter.check(key, maxAttempts, windowMs);
      await rateLimiter.check(key, maxAttempts, windowMs);

      // Should be blocked
      let result = await rateLimiter.check(key, maxAttempts, windowMs);
      expect(result.allowed).toBe(false);

      // Reset the key
      const wasReset = await rateLimiter.reset(key);
      expect(wasReset).toBe(true);

      // Should be allowed again
      result = await rateLimiter.check(key, maxAttempts, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxAttempts - 1);
    });

    it('should return false when resetting non-existent key', async () => {
      const wasReset = await rateLimiter.reset('non:existent:key');
      expect(wasReset).toBe(false);
    });
  });

  describe('IP extraction', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const ctx = {
        get: (header: string) => {
          if (header === 'x-forwarded-for') return '192.168.1.10, 10.0.0.1';
          return null;
        },
        ip: '127.0.0.1',
        request: { ip: '127.0.0.1' },
      };

      const ip = rateLimiter.getClientIp(ctx as any);
      expect(ip).toBe('192.168.1.10');
    });

    it('should extract IP from x-real-ip header if x-forwarded-for is not present', () => {
      const ctx = {
        get: (header: string) => {
          if (header === 'x-real-ip') return '192.168.1.11';
          return null;
        },
        ip: '127.0.0.1',
        request: { ip: '127.0.0.1' },
      };

      const ip = rateLimiter.getClientIp(ctx as any);
      expect(ip).toBe('192.168.1.11');
    });

    it('should fallback to ctx.ip if headers are not present', () => {
      const ctx = {
        get: () => null,
        ip: '192.168.1.12',
        request: { ip: '192.168.1.12' },
      };

      const ip = rateLimiter.getClientIp(ctx as any);
      expect(ip).toBe('192.168.1.12');
    });

    it('should return "unknown" if no IP can be determined', () => {
      const ctx = {
        get: () => null,
        request: {},
      };

      const ip = rateLimiter.getClientIp(ctx as any);
      expect(ip).toBe('unknown');
    });
  });

  describe('Cleanup functionality', () => {
    it('should remove expired entries', () => {
      const key = 'test:ip:192.168.1.13';
      const maxAttempts = 5;
      const windowMs = 100; // 100ms

      // Add entry
      rateLimiter.check(key, maxAttempts, windowMs);
      expect(rateLimiter.size()).toBeGreaterThan(0);

      // Wait for expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          // Run cleanup
          rateLimiter.cleanup();

          // Entry should be removed
          expect(rateLimiter.size()).toBe(0);
          resolve(undefined);
        }, 150);
      });
    });

    it('should not remove non-expired entries', () => {
      const key = 'test:ip:192.168.1.14';
      const maxAttempts = 5;
      const windowMs = 60000; // 1 minute

      rateLimiter.check(key, maxAttempts, windowMs);
      const sizeBefore = rateLimiter.size();

      rateLimiter.cleanup();
      const sizeAfter = rateLimiter.size();

      expect(sizeAfter).toBe(sizeBefore);
    });
  });

  describe('Login-specific scenarios', () => {
    it('should enforce IP-based login limits', async () => {
      const ip = '192.168.1.100';
      const ipKey = `login:ip:${ip}`;
      const maxAttempts = 5;
      const windowMs = 15 * 60 * 1000; // 15 minutes

      // Simulate 5 failed login attempts
      for (let i = 0; i < maxAttempts; i++) {
        const result = await rateLimiter.check(ipKey, maxAttempts, windowMs);
        expect(result.allowed).toBe(true);
      }

      // 6th attempt should be blocked
      const result = await rateLimiter.check(ipKey, maxAttempts, windowMs);
      expect(result.allowed).toBe(false);
    });

    it('should enforce username-based login limits', async () => {
      const username = 'test@example.com';
      const usernameKey = `login:user:${username}`;
      const maxAttempts = 3;
      const windowMs = 15 * 60 * 1000;

      // Simulate 3 failed login attempts
      for (let i = 0; i < maxAttempts; i++) {
        const result = await rateLimiter.check(usernameKey, maxAttempts, windowMs);
        expect(result.allowed).toBe(true);
      }

      // 4th attempt should be blocked
      const result = await rateLimiter.check(usernameKey, maxAttempts, windowMs);
      expect(result.allowed).toBe(false);
    });

    it('should allow successful login to reset username limit', async () => {
      const username = 'test@example.com';
      const usernameKey = `login:user:${username}`;
      const maxAttempts = 3;
      const windowMs = 15 * 60 * 1000;

      // Simulate 2 failed attempts
      await rateLimiter.check(usernameKey, maxAttempts, windowMs);
      await rateLimiter.check(usernameKey, maxAttempts, windowMs);

      // Successful login - reset the limit
      await rateLimiter.reset(usernameKey);

      // Should be allowed again
      const result = await rateLimiter.check(usernameKey, maxAttempts, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxAttempts - 1);
    });
  });

  describe('Media view rate limiting', () => {
    it('should limit views per media item per IP', async () => {
      const mediaId = 123;
      const ip = '192.168.1.200';
      const key = `media:view:${mediaId}:${ip}`;
      const maxViews = 10;
      const windowMs = 60 * 60 * 1000; // 1 hour

      // Simulate 10 views
      for (let i = 0; i < maxViews; i++) {
        const result = await rateLimiter.check(key, maxViews, windowMs);
        expect(result.allowed).toBe(true);
      }

      // 11th view should be blocked
      const result = await rateLimiter.check(key, maxViews, windowMs);
      expect(result.allowed).toBe(false);
    });

    it('should track views per media item separately', async () => {
      const ip = '192.168.1.201';
      const media1 = `media:view:1:${ip}`;
      const media2 = `media:view:2:${ip}`;
      const maxViews = 10;
      const windowMs = 60 * 60 * 1000;

      // Use up limit for media1
      for (let i = 0; i < maxViews; i++) {
        await rateLimiter.check(media1, maxViews, windowMs);
      }

      // media1 should be blocked
      const result1 = await rateLimiter.check(media1, maxViews, windowMs);
      expect(result1.allowed).toBe(false);

      // media2 should still be allowed
      const result2 = await rateLimiter.check(media2, maxViews, windowMs);
      expect(result2.allowed).toBe(true);
    });
  });
});
