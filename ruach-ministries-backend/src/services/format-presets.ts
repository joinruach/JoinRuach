/**
 * Stage 1: Format Presets
 *
 * Central definition for all render output formats.
 * Every render consumer (Lambda runner, render-all, worker) reads from here.
 */

export type FormatSlug = 'full_16_9' | 'short_9_16' | 'clip_1_1' | 'thumbnail';

export interface FormatPreset {
  compositionId: string;
  width: number;
  height: number;
  fps: number;
  codec: 'h264' | 'h265';
  imageFormat: 'jpeg' | 'png';
  crf: number;
  audioBitrate: string;
  lufsTarget: number;
  maxDurationSec?: number;
  description: string;
  /** Thumbnail preset renders a single still frame instead of video */
  isStill: boolean;
}

export const FORMAT_PRESETS: Record<FormatSlug, FormatPreset> = {
  full_16_9: {
    compositionId: 'MultiCam',
    width: 1920,
    height: 1080,
    fps: 30,
    codec: 'h264',
    imageFormat: 'jpeg',
    crf: 23,
    audioBitrate: '192k',
    lufsTarget: -14,
    description: 'Full episode – 16:9 landscape',
    isStill: false,
  },
  short_9_16: {
    compositionId: 'ShortVertical',
    width: 1080,
    height: 1920,
    fps: 30,
    codec: 'h264',
    imageFormat: 'jpeg',
    crf: 23,
    audioBitrate: '192k',
    lufsTarget: -14,
    maxDurationSec: 60,
    description: 'Short vertical clip – 9:16 for Reels/Shorts',
    isStill: false,
  },
  clip_1_1: {
    compositionId: 'SquareClip',
    width: 1080,
    height: 1080,
    fps: 30,
    codec: 'h264',
    imageFormat: 'jpeg',
    crf: 23,
    audioBitrate: '192k',
    lufsTarget: -14,
    description: 'Square clip – 1:1 for social feeds',
    isStill: false,
  },
  thumbnail: {
    compositionId: 'ThumbnailStill',
    width: 1920,
    height: 1080,
    fps: 1,
    codec: 'h264',
    imageFormat: 'jpeg',
    crf: 1,
    audioBitrate: '0k',
    lufsTarget: 0,
    description: 'Thumbnail – single frame still',
    isStill: true,
  },
};

export const ALL_FORMAT_SLUGS: FormatSlug[] = [
  'full_16_9',
  'short_9_16',
  'clip_1_1',
  'thumbnail',
];

/**
 * Get a format preset by slug. Throws if slug is invalid.
 */
export function getPreset(slug: string): FormatPreset {
  const preset = FORMAT_PRESETS[slug as FormatSlug];
  if (!preset) {
    throw new Error(
      `Unknown format slug "${slug}". Valid slugs: ${ALL_FORMAT_SLUGS.join(', ')}`
    );
  }
  return preset;
}

/**
 * Type guard for format slug validation.
 */
export function isValidFormatSlug(value: string): value is FormatSlug {
  return ALL_FORMAT_SLUGS.includes(value as FormatSlug);
}
