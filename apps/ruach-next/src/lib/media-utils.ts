import type { MediaItem, MediaFormat, VideoSource } from "@/contexts/MediaPlayerContext";

/**
 * Detect the media format based on source information
 */
export function getMediaFormat(media: MediaItem): MediaFormat {
  const { source } = media;

  // Check if it's an iframe embed (YouTube, Vimeo, etc.)
  if (source.kind === "youtube" || source.kind === "vimeo" || source.kind === "rumble") {
    return "video-iframe";
  }

  // Check if it's a file
  if (source.kind === "file") {
    const url = source.file?.url || source.url || "";

    // Check for audio extensions
    if (url.match(/\.(mp3|wav|m4a|ogg|aac|flac)$/i)) {
      return "audio";
    }

    // Video file - check orientation from metadata or default to landscape
    if (media.orientation === "portrait") {
      return "video-portrait";
    }

    return "video-landscape";
  }

  // Custom sources default to video file
  return "video-file";
}

/**
 * Get the playback URL from a video source
 */
export function getMediaUrl(source: VideoSource): string {
  if (source.kind === "file" && source.file?.url) {
    return source.file.url;
  }

  if (source.url) {
    return source.url;
  }

  return "";
}

/**
 * Get the embed URL for iframe-based videos
 */
export function getEmbedUrl(source: VideoSource): string {
  switch (source.kind) {
    case "youtube": {
      const embedId = source.embedId || extractYouTubeId(source.url || "");
      if (!embedId) return "";

      const params = new URLSearchParams();
      params.set("rel", "0"); // Don't show related videos
      params.set("modestbranding", "1"); // Minimal YouTube branding

      if (source.startSeconds) {
        params.set("start", source.startSeconds.toString());
      }

      return `https://www.youtube-nocookie.com/embed/${embedId}?${params.toString()}`;
    }

    case "vimeo": {
      const embedId = source.embedId || extractVimeoId(source.url || "");
      if (!embedId) return "";

      return `https://player.vimeo.com/video/${embedId}`;
    }

    case "rumble": {
      // Rumble embed format
      if (source.url) {
        return source.url.replace("rumble.com/", "rumble.com/embed/");
      }
      return "";
    }

    case "custom": {
      return source.url || "";
    }

    default:
      return "";
  }
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Check if a media source is audio-only
 */
export function isAudioOnly(media: MediaItem): boolean {
  const format = getMediaFormat(media);
  return format === "audio";
}
