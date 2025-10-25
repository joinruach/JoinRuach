/**
 * Sentry Server-Side Configuration
 *
 * Captures server-side errors and API route exceptions.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.APP_VERSION || 'unknown';

const beforeSend = ((
  event,
) => {
  // Don't send development errors
  if (ENVIRONMENT === 'development') {
    console.error('Sentry would send:', event);
    return null;
  }

  return event;
}) satisfies NonNullable<Sentry.NodeOptions['beforeSend']>;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    environment: ENVIRONMENT,
    release: `ruach-frontend@${RELEASE}`,

    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Error filtering
    beforeSend,

    // Integrations
    integrations: [
      Sentry.httpIntegration(),
    ],

    // Ignore certain errors
    ignoreErrors: [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
    ],
  });
}

export default Sentry;
