/**
 * Admin Panel Configuration
 * Configures authentication, API tokens, and Preview feature
 */

const DEFAULT_REFRESH_TOKEN_LIFESPAN_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_SESSION_LIFESPAN_MS = 7 * 24 * 60 * 60 * 1000;

const parseDurationMs = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  const matches = value.match(/^(\d+(?:\.\d+)?)([dhms])$/i);
  if (!matches) {
    return fallback;
  }

  const [, amountStr, unit] = matches;
  const amount = Number(amountStr);
  if (Number.isNaN(amount)) {
    return fallback;
  }

  const multipliers: Record<string, number> = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  };

  const multiplier = multipliers[unit.toLowerCase()];
  if (!multiplier) {
    return fallback;
  }

  return amount * multiplier;
};

export default ({ env }) => {
  const clientUrl = env('CLIENT_URL', 'http://localhost:3000');
  const previewSecret = env('PREVIEW_SECRET');
  const adminRefreshTokenLifespan = parseDurationMs(
    env('ADMIN_REFRESH_TOKEN_LIFESPAN', '30d'),
    DEFAULT_REFRESH_TOKEN_LIFESPAN_MS
  );
  const adminSessionLifespan = parseDurationMs(
    env('ADMIN_SESSION_LIFESPAN', '7d'),
    DEFAULT_SESSION_LIFESPAN_MS
  );

  /**
   * Generate preview pathname based on content type and document
   * Maps Strapi content types to their corresponding frontend routes
   */
  const getPreviewPathname = (uid: string, { locale, document }): string | null => {
    const { slug } = document || {};

    // Handle different content types with their specific URL patterns
    switch (uid) {
      // Courses
      case 'api::course.course': {
        if (!slug) {
          return '/courses'; // Courses listing page
        }
        return `/courses/${slug}`; // Individual course page
      }

      // Lessons (require course relationship)
      case 'api::lesson.lesson': {
        // Lessons are accessed through their parent course
        // You may need to fetch the course slug from the relationship
        if (!document?.course) {
          return null; // Can't preview lesson without course context
        }
        // This would require fetching the course slug
        // For now, return null - lessons are previewed within course context
        return null;
      }

      // Events
      case 'api::event.event': {
        if (!slug) {
          return '/events'; // Events listing page
        }
        return `/events/${slug}`; // Individual event page
      }

      // Media Items (videos, testimonies, teachings, etc.)
      case 'api::media-item.media-item': {
        if (!slug) {
          return '/media'; // Media listing page
        }
        return `/media/${slug}`; // Individual media item page
      }

      // Blog Posts
      case 'api::blog-post.blog-post': {
        if (!slug) {
          return '/blog'; // Blog listing page (if exists)
        }
        return `/blog/${slug}`; // Individual blog post page (if exists)
      }

      // Articles
      case 'api::article.article': {
        if (!slug) {
          return '/articles'; // Articles listing page (if exists)
        }
        return `/articles/${slug}`; // Individual article page (if exists)
      }

      // Series
      case 'api::series.series': {
        if (!slug) {
          return '/series'; // Series listing page (if exists)
        }
        return `/series/${slug}`; // Individual series page (if exists)
      }

      // Outreach Stories
      case 'api::outreach-story.outreach-story': {
        if (!slug) {
          return '/community-outreach/stories'; // Stories listing
        }
        return `/community-outreach/stories/${slug}`; // Individual story
      }

      // Static/Single Types - these typically don't have individual preview pages
      case 'api::about.about':
        return '/about';

      case 'api::contact-info.contact-info':
        return '/contact';

      case 'api::faq.faq':
        return null; // FAQs might be embedded in other pages

      // Default: no preview available for this content type
      default: {
        return null;
      }
    }
  };

  return {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
      sessions: {
        maxRefreshTokenLifespan: adminRefreshTokenLifespan,
        maxSessionLifespan: adminSessionLifespan,
      },
    },
    apiToken: {
      salt: env('API_TOKEN_SALT'),
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT'),
      },
    },
    flags: {
      nps: env.bool('FLAG_NPS', true),
      promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    },
    // Preview Feature Configuration
    preview: {
      enabled: true, // Enable preview functionality
      config: {
        allowedOrigins: clientUrl, // Restrict preview access to frontend domain
        async handler(uid, { documentId, locale, status }) {
          // Fetch the complete document from Strapi
          const document = await strapi.documents(uid).findOne({
            documentId,
            // Include locale if your content types are internationalized
            // locale,
          });

          // Generate the preview pathname based on content type and document
          const pathname = getPreviewPathname(uid, { locale, document });

          // Disable preview if the pathname is not found
          if (!pathname) {
            return null;
          }

          // Use Next.js draft mode with preview secret and content status
          const urlSearchParams = new URLSearchParams({
            url: pathname,
            secret: previewSecret || 'preview-secret-fallback',
            status: status || 'draft',
          });

          return `${clientUrl}/api/preview?${urlSearchParams}`;
        },
      },
    },
  };
};
