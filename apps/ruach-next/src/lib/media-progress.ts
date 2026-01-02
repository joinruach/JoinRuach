/**
 * Hybrid playback position persistence.
 * - Always saves to localStorage (instant, offline-friendly)
 * - Optionally syncs to backend (cross-device, requires auth)
 */

const STORAGE_PREFIX = "media_progress_";
const EXPIRY_DAYS = 7;

export interface PlaybackProgress {
  currentTime: number;
  duration: number;
  completed: boolean;
  lastUpdated: string;
}

/**
 * Save playback position to localStorage
 */
export function savePlaybackPosition(
  mediaId: string | number,
  currentTime: number,
  duration?: number,
  completed?: boolean
): void {
  if (typeof window === "undefined") return;

  const key = `${STORAGE_PREFIX}${mediaId}`;
  const data: PlaybackProgress = {
    currentTime,
    duration: duration || 0,
    completed: completed || false,
    lastUpdated: new Date().toISOString(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save playback position:", error);
  }
}

/**
 * Get playback position from localStorage
 * Returns 0 if not found or expired
 */
export function getPlaybackPosition(mediaId: string | number): PlaybackProgress {
  if (typeof window === "undefined") {
    return { currentTime: 0, duration: 0, completed: false, lastUpdated: new Date().toISOString() };
  }

  const key = `${STORAGE_PREFIX}${mediaId}`;

  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return { currentTime: 0, duration: 0, completed: false, lastUpdated: new Date().toISOString() };
    }

    const progress: PlaybackProgress = JSON.parse(data);

    // Check if expired (7 days)
    const lastUpdated = new Date(progress.lastUpdated).getTime();
    const now = Date.now();
    const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    if (now - lastUpdated > expiryMs) {
      // Expired - remove from storage
      localStorage.removeItem(key);
      return { currentTime: 0, duration: 0, completed: false, lastUpdated: new Date().toISOString() };
    }

    return progress;
  } catch (error) {
    console.error("Failed to get playback position:", error);
    return { currentTime: 0, duration: 0, completed: false, lastUpdated: new Date().toISOString() };
  }
}

/**
 * Clear playback position for a specific media item
 */
export function clearPlaybackPosition(mediaId: string | number): void {
  if (typeof window === "undefined") return;

  const key = `${STORAGE_PREFIX}${mediaId}`;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear playback position:", error);
  }
}

/**
 * Get all saved playback positions
 */
export function getAllPlaybackPositions(): Record<string, PlaybackProgress> {
  if (typeof window === "undefined") return {};

  const positions: Record<string, PlaybackProgress> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const mediaId = key.replace(STORAGE_PREFIX, "");
        const progress = getPlaybackPosition(mediaId);
        if (progress.currentTime > 0) {
          positions[mediaId] = progress;
        }
      }
    }
  } catch (error) {
    console.error("Failed to get all playback positions:", error);
  }

  return positions;
}

/**
 * Clear all expired playback positions
 */
export function cleanupExpiredPositions(): void {
  if (typeof window === "undefined") return;

  const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const progress: PlaybackProgress = JSON.parse(data);
          const lastUpdated = new Date(progress.lastUpdated).getTime();

          if (now - lastUpdated > expiryMs) {
            keysToRemove.push(key);
          }
        }
      }
    }

    // Remove expired items
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} expired playback positions`);
    }
  } catch (error) {
    console.error("Failed to cleanup expired positions:", error);
  }
}
