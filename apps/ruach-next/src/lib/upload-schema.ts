import { z } from 'zod';

/**
 * Zod schemas for media upload validation
 */

// Step 1: File Upload (validated by FileUpload component)
export const fileUploadSchema = z.object({
  videoUrl: z.string().url().min(1, 'Video URL is required'),
  sourceKey: z.string().min(1, 'Source key is required'),
});

// Step 2: Basic Metadata
export const basicMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  contentType: z.enum(['testimony', 'teaching', 'worship', 'podcast', 'short'], {
    required_error: 'Content type is required',
  }),
});

// Step 3: Media Details
export const mediaDetailsSchema = z.object({
  thumbnail: z.number().optional(),
  speakers: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  categories: z.array(z.number()).optional(),
  series: z.number().optional(),
  weekNumber: z.number().optional(),
  episodeNumber: z.number().optional(),
});

// Step 4: Publishing Settings
export const publishingSettingsSchema = z.object({
  publishYouTube: z.boolean().optional(),
  publishFacebook: z.boolean().optional(),
  publishInstagram: z.boolean().optional(),
  publishX: z.boolean().optional(),
  publishPatreon: z.boolean().optional(),
  publishRumble: z.boolean().optional(),
  publishLocals: z.boolean().optional(),
  publishTruthSocial: z.boolean().optional(),
  autoPublish: z.boolean().optional(),
  publishNow: z.boolean().optional(),
});

// Combined schema for full media upload
export const mediaUploadSchema = fileUploadSchema
  .merge(basicMetadataSchema)
  .merge(mediaDetailsSchema)
  .merge(publishingSettingsSchema);

export type MediaUploadFormData = z.infer<typeof mediaUploadSchema>;

// Platform-specific validation rules
export const platformLimits = {
  youtube: {
    titleMaxLength: 100,
    descriptionMaxLength: 5000,
  },
  facebook: {
    titleMaxLength: 255,
    descriptionMaxLength: 63206,
  },
  instagram: {
    captionMaxLength: 2200,
  },
  x: {
    textMaxLength: 280,
  },
} as const;

/**
 * Validate title against platform limits
 */
export function validatePlatformTitle(title: string, platforms: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (platforms.includes('youtube') && title.length > platformLimits.youtube.titleMaxLength) {
    errors.push(`YouTube title must be ≤${platformLimits.youtube.titleMaxLength} characters`);
  }

  if (platforms.includes('facebook') && title.length > platformLimits.facebook.titleMaxLength) {
    errors.push(`Facebook title must be ≤${platformLimits.facebook.titleMaxLength} characters`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
