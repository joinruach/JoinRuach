import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateEnvironment } from '../validate-env';

type NodeEnvironment = 'development' | 'production' | 'test';
type MutableProcessEnv = Omit<NodeJS.ProcessEnv, 'NODE_ENV'> & {
  NODE_ENV: NodeEnvironment;
};

const setNodeEnv = (value: NodeEnvironment) => {
  (process.env as MutableProcessEnv).NODE_ENV = value;
};

describe('validateEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    vi.resetModules();
    process.env = { ...originalEnv };
    // Set to development to avoid strict production checks
    setNodeEnv('development');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('NEXTAUTH_SECRET validation', () => {
    it('should pass with a secure 32+ character secret', () => {
      process.env.NEXTAUTH_SECRET = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with short secret (< 32 characters)', () => {
      process.env.NEXTAUTH_SECRET = 'short';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('at least 32 characters');
    });

    it('should detect "change_me" pattern', () => {
      process.env.NEXTAUTH_SECRET = 'change_me_to_something_secure_with_32_chars';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('insecure pattern');
    });

    it('should detect "tobemodified" pattern', () => {
      process.env.NEXTAUTH_SECRET = 'tobemodified_minimum_32_characters_long';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('insecure pattern');
    });

    it('should detect "REPLACE_WITH" placeholder pattern', () => {
      process.env.NEXTAUTH_SECRET = 'REPLACE_WITH_RANDOM_STRING_FROM_openssl_rand_base64_48';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('insecure pattern');
    });

    it('should detect low entropy (too few unique characters)', () => {
      process.env.NEXTAUTH_SECRET = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; // 33 'a's
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('low entropy');
    });

    it('should fail when NEXTAUTH_SECRET is not set', () => {
      delete process.env.NEXTAUTH_SECRET;
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('NEXTAUTH_SECRET is not set');
    });
  });

  describe('Required URLs validation', () => {
    it('should fail when NEXTAUTH_URL is not set', () => {
      process.env.NEXTAUTH_SECRET = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
      delete process.env.NEXTAUTH_URL;
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('NEXTAUTH_URL is not set');
    });

    it('should fail when NEXT_PUBLIC_STRAPI_URL is not set', () => {
      process.env.NEXTAUTH_SECRET = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      delete process.env.NEXT_PUBLIC_STRAPI_URL;

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('NEXT_PUBLIC_STRAPI_URL is not set');
    });
  });

  describe('Redis configuration warnings', () => {
    it('should warn when Redis URL is set but token is missing', () => {
      process.env.NEXTAUTH_SECRET = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const result = validateEnvironment();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('UPSTASH_REDIS_REST_TOKEN is missing'))).toBe(true);
    });

    it('should warn when Redis token is set but URL is missing', () => {
      process.env.NEXTAUTH_SECRET = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';
      delete process.env.UPSTASH_REDIS_REST_URL;
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const result = validateEnvironment();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('UPSTASH_REDIS_REST_URL is missing'))).toBe(true);
    });

    it('should warn when neither Redis URL nor token are set', () => {
      process.env.NEXTAUTH_SECRET = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const result = validateEnvironment();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Redis credentials not configured'))).toBe(true);
    });
  });

  describe('Production vs Development behavior', () => {
    it('should be more strict in production mode', () => {
      setNodeEnv('production');
      process.env.NEXTAUTH_SECRET = 'short'; // Too short
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide warnings in development mode for weak secrets', () => {
      setNodeEnv('development');
      process.env.NEXTAUTH_SECRET = 'short'; // Too short
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

      const result = validateEnvironment();

      // In development, should warn rather than error
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple validation errors', () => {
    it('should report all validation errors at once', () => {
      setNodeEnv('production');
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXTAUTH_URL;
      delete process.env.NEXT_PUBLIC_STRAPI_URL;

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
