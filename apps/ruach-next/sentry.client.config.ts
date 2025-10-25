/**
 * Sentry Client-Side Configuration
 *
 * Captures client-side errors and exceptions.
 * Automatically imported by Next.js instrumentation.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';

// Only initialize Sentry if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment and release tracking
    environment: ENVIRONMENT,
    release: `ruach-frontend@${RELEASE}`,

    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors from localhost in development
      if (ENVIRONMENT === 'development' && event.request?.url?.includes('localhost')) {
        return null;
      }

      // Filter out common browser errors
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop')) {
        return null;
      }

      return event;
    },

    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/joinruach\.org/,
          /^https:\/\/api\.joinruach\.org/,
        ],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // Network errors
      'NetworkError',
      'Failed to fetch',
    ],
  });

  // Set user context if available
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('userId');
    if (userId) {
      Sentry.setUser({ id: userId });
    }
  }
}

export default Sentry;
