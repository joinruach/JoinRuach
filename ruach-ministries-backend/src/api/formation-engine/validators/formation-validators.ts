import { z } from 'zod';

/**
 * Formation Engine Request Validators
 * Zod schemas for validating formation API requests
 */

const VALID_EVENT_TYPES = [
  'content_viewed',
  'content_completed',
  'reflection_submitted',
  'checkpoint_passed',
  'checkpoint_failed',
  'assessment_completed',
  'prayer_logged',
  'discussion_participated',
  'mentorship_session',
  'service_completed',
  'testimony_shared',
  'scripture_memorized',
  'fast_completed',
  'community_engaged',
  'worship_attended',
  'giving_recorded',
  'sabbath_observed',
] as const;

/** POST /formation/emit-event */
export const EmitEventRequestSchema = z.object({
  eventType: z.enum(VALID_EVENT_TYPES, {
    message: `eventType must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
  }),
  eventData: z.record(z.string(), z.unknown()).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'eventData must not be empty' }
  ),
  userId: z.union([z.string(), z.number()]).optional(),
  anonymousUserId: z.string().optional(),
  eventMetadata: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => data.userId !== undefined || data.anonymousUserId !== undefined,
  { message: 'userId or anonymousUserId is required' }
);

export type EmitEventRequest = z.infer<typeof EmitEventRequestSchema>;
