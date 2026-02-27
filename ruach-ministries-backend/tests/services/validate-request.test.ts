/**
 * Regression tests for standardized Zod validation error shape.
 *
 * Ensures every validation failure returns:
 * { error: "VALIDATION_ERROR", details: { fieldErrors: { ... } } }
 *
 * If this shape changes, every frontend consumer breaks.
 */

import { z } from 'zod';
import { validateRequest } from '../../src/utils/validate-request';

function createMockCtx(): { status: number; body: unknown } {
  return { status: 200, body: null };
}

const TestSchema = z.object({
  name: z.string().min(1, 'name is required'),
  age: z.number().int().positive(),
  email: z.string().email().optional(),
});

describe('validateRequest', () => {
  describe('valid data', () => {
    it('returns parsed data on success', () => {
      const ctx = createMockCtx();
      const result = validateRequest(ctx, TestSchema, {
        name: 'Alice',
        age: 30,
      });

      expect(result).toEqual({ name: 'Alice', age: 30 });
      expect(ctx.status).toBe(200); // unchanged
    });

    it('strips unknown fields', () => {
      const ctx = createMockCtx();
      const result = validateRequest(ctx, TestSchema, {
        name: 'Bob',
        age: 25,
        hackerField: 'DROP TABLE users;',
      });

      expect(result).not.toHaveProperty('hackerField');
    });
  });

  describe('invalid data returns standardized shape', () => {
    it('returns null on failure', () => {
      const ctx = createMockCtx();
      const result = validateRequest(ctx, TestSchema, {});

      expect(result).toBeNull();
    });

    it('sets status to 400', () => {
      const ctx = createMockCtx();
      validateRequest(ctx, TestSchema, {});

      expect(ctx.status).toBe(400);
    });

    it('returns error code VALIDATION_ERROR', () => {
      const ctx = createMockCtx();
      validateRequest(ctx, TestSchema, {});

      const body = ctx.body as Record<string, unknown>;
      expect(body.error).toBe('VALIDATION_ERROR');
    });

    it('returns details.fieldErrors object', () => {
      const ctx = createMockCtx();
      validateRequest(ctx, TestSchema, {});

      const body = ctx.body as {
        error: string;
        details: { fieldErrors: Record<string, string[]> };
      };
      expect(body.details).toBeDefined();
      expect(body.details.fieldErrors).toBeDefined();
      expect(typeof body.details.fieldErrors).toBe('object');
    });

    it('includes field-level errors for missing required fields', () => {
      const ctx = createMockCtx();
      validateRequest(ctx, TestSchema, { name: '' });

      const body = ctx.body as {
        details: { fieldErrors: Record<string, string[]> };
      };

      // name should have error (empty string fails min(1))
      expect(body.details.fieldErrors.name).toBeDefined();
      expect(body.details.fieldErrors.name.length).toBeGreaterThan(0);
    });

    it('includes field-level errors for wrong types', () => {
      const ctx = createMockCtx();
      validateRequest(ctx, TestSchema, { name: 'Alice', age: 'not-a-number' });

      const body = ctx.body as {
        details: { fieldErrors: Record<string, string[]> };
      };

      expect(body.details.fieldErrors.age).toBeDefined();
    });

    it('includes field-level errors for invalid email', () => {
      const ctx = createMockCtx();
      validateRequest(ctx, TestSchema, {
        name: 'Alice',
        age: 30,
        email: 'not-an-email',
      });

      const body = ctx.body as {
        details: { fieldErrors: Record<string, string[]> };
      };

      expect(body.details.fieldErrors.email).toBeDefined();
    });
  });

  describe('shape contract (machine-parseable)', () => {
    it('body has exactly error and details keys', () => {
      const ctx = createMockCtx();
      validateRequest(ctx, TestSchema, {});

      const body = ctx.body as Record<string, unknown>;
      const keys = Object.keys(body).sort();
      expect(keys).toEqual(['details', 'error']);
    });

    it('details has exactly fieldErrors key', () => {
      const ctx = createMockCtx();
      validateRequest(ctx, TestSchema, {});

      const body = ctx.body as {
        details: Record<string, unknown>;
      };
      const keys = Object.keys(body.details);
      expect(keys).toEqual(['fieldErrors']);
    });
  });
});
