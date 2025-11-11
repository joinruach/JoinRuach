/**
 * Media-related types
 */

export type MediaType = 'video' | 'audio' | 'image' | 'document';
export type MediaPlatform = 'youtube' | 'vimeo' | 'tiktok' | 'rumble' | 'local';

export interface MediaItem {
  id: number;
  title: string;
  slug: string;
  description?: string;
  type: MediaType;
  platform: MediaPlatform;
  externalId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  views?: number;
  likes?: number;
  featured?: boolean;
  publishedAt?: string;
}

export interface VideoMetadata {
  codec?: string;
  bitrate?: number;
  framerate?: number;
  resolution?: string;
}

export interface AudioMetadata {
  codec?: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
}

export interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}
