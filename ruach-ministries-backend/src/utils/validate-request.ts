/**
 * Shared Zod validation helper for Strapi controllers.
 *
 * Returns a consistent error shape on validation failure:
 * { error: "VALIDATION_ERROR", details: { fieldErrors: { ... } } }
 */

import type { z } from 'zod';

interface StrapiContext {
  status: number;
  body: unknown;
}

/**
 * Parse request data with a Zod schema.
 * On failure, sets ctx to 400 with a standardized error body and returns null.
 * On success, returns the parsed data.
 */
export function validateRequest<T extends z.ZodTypeAny>(
  ctx: StrapiContext,
  schema: T,
  data: unknown
): z.infer<T> | null {
  const result = schema.safeParse(data);

  if (!result.success) {
    ctx.status = 400;
    ctx.body = {
      error: 'VALIDATION_ERROR',
      details: {
        fieldErrors: result.error.flatten().fieldErrors,
      },
    };
    return null;
  }

  return result.data;
}
