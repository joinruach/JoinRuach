/**
 * Share utilities for generating share text and tracking
 */

export interface ShareContent {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  image?: string;
}

/**
 * Generate share text for different content types
 */
export function generateShareText(
  type: "media" | "course" | "series" | "event",
  title: string,
  customText?: string
): string {
  if (customText) return customText;

  const prefixes = {
    media: "Check out this powerful testimony from Ruach Ministries:",
    course: "Join me in this transformative course from Ruach Ministries:",
    series: "Dive into this compelling series from Ruach Ministries:",
    event: "Don't miss this upcoming event from Ruach Ministries:",
  };

  return `${prefixes[type]} ${title}`;
}

/**
 * Get default hashtags for content type
 */
export function getDefaultHashtags(
  type: "media" | "course" | "series" | "event"
): string[] {
  const common = ["RuachMinistries", "Faith", "Jesus"];

  const typeSpecific = {
    media: ["Testimony", "Worship"],
    course: ["Discipleship", "Learning"],
    series: ["BibleStudy", "Teaching"],
    event: ["Ministry", "Community"],
  };

  return [...common, ...typeSpecific[type]];
}

/**
 * Generate absolute URL for sharing
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://joinruach.org";
  return `${baseUrl}${path}`;
}

/**
 * Track share event (client-side only)
 */
export function trackShare(
  platform: string,
  contentType: string,
  contentId: string | number
): void {
  if (typeof window === "undefined") return;

  // Track with Plausible if available
  if (window.plausible) {
    window.plausible("Share", {
      props: {
        platform,
        contentType,
        contentId: String(contentId),
      },
    });
  }

  // Track with Google Analytics if available
  if (window.gtag) {
    window.gtag("event", "share", {
      method: platform,
      content_type: contentType,
      content_id: String(contentId),
    });
  }

  // Console log in development
  if (process.env.NODE_ENV === "development") {
    console.log("Share tracked:", { platform, contentType, contentId });
  }
}

/**
 * Generate Open Graph metadata object
 */
export function generateOGMetadata(content: ShareContent) {
  return {
    title: content.title,
    description: content.description || "Ruach Ministries - Transforming lives through truth and creativity",
    url: content.url,
    siteName: "Ruach Ministries",
    images: content.image
      ? [
          {
            url: content.image,
            width: 1200,
            height: 630,
            alt: content.title,
          },
        ]
      : [],
    type: "website",
  };
}

/**
 * Generate Twitter Card metadata object
 */
export function generateTwitterMetadata(content: ShareContent) {
  return {
    card: "summary_large_image",
    title: content.title,
    description: content.description || "Ruach Ministries - Transforming lives through truth and creativity",
    images: content.image ? [content.image] : [],
  };
}

// Type declarations for analytics
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
    gtag?: (command: string, event: string, params?: Record<string, any>) => void;
  }
}
