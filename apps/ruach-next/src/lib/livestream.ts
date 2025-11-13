/**
 * Livestream Utilities
 *
 * Functions for managing livestream states, scheduling, and notifications
 */

// Window globals for analytics (matching scripture.ts and analytics.ts)
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
    gtag?: (command: string, action: string, params?: Record<string, string | number>) => void;
  }
}

export type LivestreamStatus = "upcoming" | "live" | "ended";

export interface LivestreamSchedule {
  id: string | number;
  title: string;
  description?: string;
  scheduledStart: Date | string;
  scheduledEnd?: Date | string;
  videoId?: string;
  thumbnailUrl?: string;
  isLive?: boolean;
}

/**
 * Get the current status of a livestream
 */
export function getLivestreamStatus(
  scheduledStart: Date | string,
  scheduledEnd?: Date | string,
  isLive?: boolean
): LivestreamStatus {
  const now = new Date();
  const start = typeof scheduledStart === "string" ? new Date(scheduledStart) : scheduledStart;
  const end = scheduledEnd
    ? typeof scheduledEnd === "string"
      ? new Date(scheduledEnd)
      : scheduledEnd
    : null;

  // If explicitly marked as live, prioritize that
  if (isLive) {
    return "live";
  }

  // Check if stream has ended
  if (end && now > end) {
    return "ended";
  }

  // Check if stream is currently live (started but not ended)
  if (now >= start) {
    return "live";
  }

  // Stream is upcoming
  return "upcoming";
}

/**
 * Check if a stream is currently live
 */
export function isStreamLive(
  scheduledStart: Date | string,
  scheduledEnd?: Date | string,
  isLive?: boolean
): boolean {
  return getLivestreamStatus(scheduledStart, scheduledEnd, isLive) === "live";
}

/**
 * Get time until stream starts (in milliseconds)
 * Returns 0 if stream has already started
 */
export function getTimeUntilStart(scheduledStart: Date | string): number {
  const now = new Date();
  const start = typeof scheduledStart === "string" ? new Date(scheduledStart) : scheduledStart;
  const diff = start.getTime() - now.getTime();
  return diff > 0 ? diff : 0;
}

/**
 * Get time until stream ends (in milliseconds)
 * Returns 0 if stream has already ended or no end time specified
 */
export function getTimeUntilEnd(scheduledEnd?: Date | string): number {
  if (!scheduledEnd) return 0;

  const now = new Date();
  const end = typeof scheduledEnd === "string" ? new Date(scheduledEnd) : scheduledEnd;
  const diff = end.getTime() - now.getTime();
  return diff > 0 ? diff : 0;
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) {
    return "Now";
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Handle plain video IDs
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    // youtu.be/VIDEO_ID
    if (hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0];
    }

    // youtube.com/watch?v=VIDEO_ID
    if (hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return videoId;

      // youtube.com/embed/VIDEO_ID or youtube.com/live/VIDEO_ID
      const pathMatch = parsed.pathname.match(/\/(embed|live)\/([a-zA-Z0-9_-]{11})/);
      if (pathMatch) return pathMatch[2];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Create YouTube live embed URL
 */
export function createYouTubeLiveUrl(
  videoId: string,
  options?: {
    autoplay?: boolean;
    muted?: boolean;
    controls?: boolean;
  }
): string {
  const params = new URLSearchParams({
    autoplay: options?.autoplay ? "1" : "0",
    mute: options?.muted ? "1" : "0",
    controls: options?.controls !== false ? "1" : "0",
    modestbranding: "1",
    rel: "0",
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Create YouTube live chat embed URL
 */
export function createYouTubeChatUrl(videoId: string, domain?: string): string {
  const embedDomain = domain || (typeof window !== "undefined" ? window.location.hostname : "localhost");
  return `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${embedDomain}`;
}

/**
 * Check if user should be notified about stream
 * (e.g., stream starts within 30 minutes and hasn't been dismissed)
 */
export function shouldNotifyUser(
  scheduledStart: Date | string,
  notificationWindowMinutes: number = 30,
  storageKey?: string
): boolean {
  const timeUntil = getTimeUntilStart(scheduledStart);
  const timeUntilMinutes = timeUntil / (1000 * 60);

  // Stream is too far away
  if (timeUntilMinutes > notificationWindowMinutes) {
    return false;
  }

  // Stream already started
  if (timeUntil <= 0) {
    return false;
  }

  // Check if notification was dismissed
  if (storageKey && typeof window !== "undefined") {
    const dismissed = localStorage.getItem(`livestream_notify_dismissed_${storageKey}`);
    if (dismissed === "true") {
      return false;
    }
  }

  return true;
}

/**
 * Dismiss livestream notification
 */
export function dismissNotification(streamId: string | number): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(`livestream_notify_dismissed_${streamId}`, "true");
  }
}

/**
 * Clear notification dismissal (for testing or when stream reschedules)
 */
export function clearNotificationDismissal(streamId: string | number): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(`livestream_notify_dismissed_${streamId}`);
  }
}

/**
 * Get upcoming livestreams from a list, sorted by scheduled time
 */
export function getUpcomingStreams(streams: LivestreamSchedule[]): LivestreamSchedule[] {
  return streams
    .filter((stream) => getLivestreamStatus(stream.scheduledStart, stream.scheduledEnd, stream.isLive) === "upcoming")
    .sort((a, b) => {
      const aTime = typeof a.scheduledStart === "string" ? new Date(a.scheduledStart).getTime() : a.scheduledStart.getTime();
      const bTime = typeof b.scheduledStart === "string" ? new Date(b.scheduledStart).getTime() : b.scheduledStart.getTime();
      return aTime - bTime;
    });
}

/**
 * Get currently live streams
 */
export function getLiveStreams(streams: LivestreamSchedule[]): LivestreamSchedule[] {
  return streams.filter((stream) =>
    getLivestreamStatus(stream.scheduledStart, stream.scheduledEnd, stream.isLive) === "live"
  );
}

/**
 * Get the next upcoming stream
 */
export function getNextStream(streams: LivestreamSchedule[]): LivestreamSchedule | null {
  const upcoming = getUpcomingStreams(streams);
  return upcoming.length > 0 ? upcoming[0] : null;
}

/**
 * Track livestream event with analytics
 */
export function trackLivestreamEvent(
  event: "view" | "join" | "chat_open" | "notification_click",
  streamId: string | number,
  metadata?: Record<string, string | number>
): void {
  // Plausible Analytics
  if (typeof window !== "undefined" && window.plausible) {
    // Convert metadata to string values for plausible
    const stringProps: Record<string, string> = {
      streamId: streamId.toString(),
    };
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        stringProps[key] = String(value);
      }
    }

    window.plausible(`Livestream ${event}`, {
      props: stringProps,
    });
  }

  // Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", `livestream_${event}`, {
      event_category: "livestream",
      event_label: streamId.toString(),
      ...metadata,
    });
  }

  // Console log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Livestream] ${event}:`, { streamId, metadata });
  }
}

/**
 * Subscribe to livestream notifications (browser notifications API)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("Browser does not support notifications");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * Send browser notification for livestream
 */
export function sendLivestreamNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    onClick?: () => void;
  }
): Notification | null {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null;
  }

  const notification = new Notification(title, {
    body: options?.body,
    icon: options?.icon || "/icon-192x192.png",
    badge: options?.badge || "/icon-192x192.png",
    tag: options?.tag || "livestream",
    requireInteraction: true,
  });

  if (options?.onClick) {
    notification.onclick = options.onClick;
  }

  return notification;
}
