import { z } from 'zod';

/**
 * Media Transcode Request Validators
 * Zod schemas for validating transcode API requests
 */

const ResolutionSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bitrate: z.string().min(1),
  label: z.string().min(1),
});

/** POST /media-transcode/queue */
export const QueueTranscodeRequestSchema = z.object({
  mediaItemId: z.number().int().positive('mediaItemId must be a positive integer'),
  sourceFileUrl: z.string().url('sourceFileUrl must be a valid URL'),
  sourceFileName: z.string().min(1, 'sourceFileName is required'),
  mediaType: z.enum(['video', 'audio']),
  jobType: z.enum(['transcode', 'thumbnail', 'extract-audio', 'proxy', 'mezzanine', 'extract-audio-wav']),
  resolutions: z.array(ResolutionSchema).optional(),
  thumbnailTimestamps: z.array(z.number().nonnegative()).optional(),
  audioFormat: z.enum(['mp3', 'aac', 'ogg']).optional(),
});

export type QueueTranscodeRequest = z.infer<typeof QueueTranscodeRequestSchema>;

/** POST /media-transcode/quick-queue */
export const QuickQueueRequestSchema = z.object({
  mediaItemId: z.number().int().positive('mediaItemId must be a positive integer'),
  sourceFileUrl: z.string().url('sourceFileUrl must be a valid URL'),
  sourceFileName: z.string().min(1, 'sourceFileName is required'),
});

export type QuickQueueRequest = z.infer<typeof QuickQueueRequestSchema>;
