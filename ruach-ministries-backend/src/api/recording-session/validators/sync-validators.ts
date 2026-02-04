import { z } from 'zod';

/**
 * Phase 9: Track E - Sync Request Validators
 *
 * Zod schemas for validating sync API requests
 */

/**
 * POST /recording-sessions/:id/sync/compute
 */
export const ComputeSyncRequestSchema = z.object({
  masterCamera: z.string().optional(),
});

export type ComputeSyncRequest = z.infer<typeof ComputeSyncRequestSchema>;

/**
 * POST /recording-sessions/:id/sync/approve
 */
export const ApproveSyncRequestSchema = z.object({
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type ApproveSyncRequest = z.infer<typeof ApproveSyncRequestSchema>;

/**
 * POST /recording-sessions/:id/sync/correct
 */
export const CorrectSyncRequestSchema = z.object({
  offsets: z.record(z.string(), z.number()).refine(
    (offsets) => Object.keys(offsets).length > 0,
    { message: 'At least one camera offset must be provided' }
  ),
  correctedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type CorrectSyncRequest = z.infer<typeof CorrectSyncRequestSchema>;

/**
 * Helper to validate request body
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}
