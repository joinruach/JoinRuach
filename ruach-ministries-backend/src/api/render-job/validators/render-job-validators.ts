import { z } from 'zod';

/**
 * Render Job Request Validators
 * Zod schemas for validating render job API requests
 */

/** POST /render-jobs/trigger */
export const TriggerRenderRequestSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  format: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TriggerRenderRequest = z.infer<typeof TriggerRenderRequestSchema>;
