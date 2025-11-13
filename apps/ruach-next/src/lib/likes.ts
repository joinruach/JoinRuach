/**
 * Likes/Reactions System Utilities
 *
 * Handles like storage, retrieval, and analytics tracking
 */

export type ContentType = "media" | "course" | "series" | "event";

export interface LikedContent {
  contentType: ContentType;
  contentId: string | number;
  likedAt: string;
}

/**
 * Get the storage key for a specific content item
 */
export function getLikeStorageKey(
  contentType: ContentType,
  contentId: string | number
): string {
  return `like_${contentType}_${contentId}`;
}

/**
 * Check if user has liked a specific content item
 */
export function isContentLiked(
  contentType: ContentType,
  contentId: string | number
): boolean {
  if (typeof window === "undefined") return false;

  const key = getLikeStorageKey(contentType, contentId);
  return localStorage.getItem(key) === "true";
}

/**
 * Like a content item
 */
export function likeContent(
  contentType: ContentType,
  contentId: string | number
): void {
  if (typeof window === "undefined") return;

  const key = getLikeStorageKey(contentType, contentId);
  const timestamp = new Date().toISOString();

  localStorage.setItem(key, "true");
  localStorage.setItem(`${key}_timestamp`, timestamp);

  // Track analytics
  trackLike(contentType, contentId, true);
}

/**
 * Unlike a content item
 */
export function unlikeContent(
  contentType: ContentType,
  contentId: string | number
): void {
  if (typeof window === "undefined") return;

  const key = getLikeStorageKey(contentType, contentId);

  localStorage.removeItem(key);
  localStorage.removeItem(`${key}_timestamp`);

  // Track analytics
  trackLike(contentType, contentId, false);
}

/**
 * Get all liked content from localStorage
 */
export function getAllLikedContent(): LikedContent[] {
  if (typeof window === "undefined") return [];

  const liked: LikedContent[] = [];

  // Iterate through all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith("like_") && !key.endsWith("_timestamp")) {
      const value = localStorage.getItem(key);

      if (value === "true") {
        // Parse the key: like_media_123 -> contentType: "media", contentId: "123"
        const parts = key.split("_");

        if (parts.length >= 3) {
          const contentType = parts[1] as ContentType;
          const contentId = parts.slice(2).join("_"); // Handle IDs with underscores
          const timestamp = localStorage.getItem(`${key}_timestamp`) || new Date().toISOString();

          liked.push({
            contentType,
            contentId,
            likedAt: timestamp,
          });
        }
      }
    }
  }

  // Sort by most recently liked first
  return liked.sort((a, b) =>
    new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime()
  );
}

/**
 * Get count of all liked content
 */
export function getLikedContentCount(): number {
  return getAllLikedContent().length;
}

/**
 * Get liked content filtered by type
 */
export function getLikedContentByType(contentType: ContentType): LikedContent[] {
  return getAllLikedContent().filter(item => item.contentType === contentType);
}

/**
 * Clear all likes (useful for testing or user reset)
 */
export function clearAllLikes(): void {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("like_")) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Track like/unlike event with analytics
 */
export function trackLike(
  contentType: ContentType,
  contentId: string | number,
  liked: boolean
): void {
  const action = liked ? "like" : "unlike";

  // Plausible Analytics
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(liked ? "Like" : "Unlike", {
      props: {
        contentType,
        contentId: contentId.toString(),
      },
    });
  }

  // Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: "engagement",
      event_label: contentType,
      value: contentId.toString(),
    });
  }

  // Console log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Likes] ${action}:`, { contentType, contentId });
  }
}

/**
 * Format like count for display
 */
export function formatLikeCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * Get like count from localStorage (for demo purposes)
 * In production, this would come from the backend
 */
export function getLocalLikeCount(
  contentType: ContentType,
  contentId: string | number
): number {
  // This is a demo implementation
  // In production, you'd fetch from your backend API
  return isContentLiked(contentType, contentId) ? 1 : 0;
}

/**
 * Export liked content as JSON (for data portability)
 */
export function exportLikedContent(): string {
  const liked = getAllLikedContent();
  return JSON.stringify(liked, null, 2);
}

/**
 * Import liked content from JSON (for data portability)
 */
export function importLikedContent(json: string): void {
  if (typeof window === "undefined") return;

  try {
    const liked: LikedContent[] = JSON.parse(json);

    liked.forEach(item => {
      const key = getLikeStorageKey(item.contentType, item.contentId);
      localStorage.setItem(key, "true");
      localStorage.setItem(`${key}_timestamp`, item.likedAt);
    });
  } catch (error) {
    console.error("Failed to import liked content:", error);
  }
}
