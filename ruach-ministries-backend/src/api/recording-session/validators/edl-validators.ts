import { z } from 'zod';

/**
 * EDL Request Validators
 * Zod schemas for validating EDL API requests
 */

const CutSchema = z.object({
  cameraId: z.string().min(1),
  startTime: z.number().nonnegative(),
  endTime: z.number().positive(),
  confidence: z.number().min(0).max(1).optional(),
}).refine(
  (cut) => cut.endTime > cut.startTime,
  { message: 'endTime must be greater than startTime' }
);

const ChapterSchema = z.object({
  title: z.string().min(1),
  startTime: z.number().nonnegative(),
  endTime: z.number().positive().optional(),
});

/** POST /recording-sessions/:id/edl/compute */
export const ComputeEDLRequestSchema = z.object({
  masterCamera: z.string().optional(),
  minShotLength: z.number().positive().optional(),
  switchCooldown: z.number().positive().optional(),
}).optional().default({});

export type ComputeEDLRequest = z.infer<typeof ComputeEDLRequestSchema>;

/** PUT /recording-sessions/:id/edl */
export const UpdateEDLRequestSchema = z.object({
  cuts: z.array(CutSchema).min(1, 'At least one cut is required'),
});

export type UpdateEDLRequest = z.infer<typeof UpdateEDLRequestSchema>;

/** PUT /recording-sessions/:id/edl/chapters */
export const UpdateChaptersRequestSchema = z.object({
  chapters: z.array(ChapterSchema).min(1, 'At least one chapter is required'),
});

export type UpdateChaptersRequest = z.infer<typeof UpdateChaptersRequestSchema>;

/** POST /recording-sessions/:id/edl/approve */
export const ApproveEDLRequestSchema = z.object({
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type ApproveEDLRequest = z.infer<typeof ApproveEDLRequestSchema>;

/** POST /recording-sessions/:id/edl/lock */
export const LockEDLRequestSchema = z.object({
  lockedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type LockEDLRequest = z.infer<typeof LockEDLRequestSchema>;
