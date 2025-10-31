const trimTrailingSlash = (value = '') => value.replace(/\/$/, '');

const ensureConfirmationLinkPath = (base) => {
  const normalized = trimTrailingSlash(base || '');

  if (!normalized) {
    return 'http://localhost:1337/api/auth/email-confirmation';
  }

  return normalized.includes('/api/auth/email-confirmation')
    ? normalized
    : `${normalized}/api/auth/email-confirmation`;
};

const appendQueryParam = (base, key, value) => {
  if (!base) {
    return base;
  }

  const hasQuery = base.includes('?');
  const separator = hasQuery ? (base.endsWith('?') || base.endsWith('&') ? '' : '&') : '?';
  return `${base}${separator}${key}=${value}`;
};

module.exports = ({ env }) => {
  const backendBase =
    env('STRAPI_EMAIL_CONFIRM_LINK', env('STRAPI_BACKEND_URL', env('PUBLIC_URL'))) ||
    'http://localhost:1337';
  const confirmEmailUrl = ensureConfirmationLinkPath(backendBase);

  const frontendBase = trimTrailingSlash(
    env(
      'FRONTEND_URL',
      'https://joinruach.org'
    )
  );
  const fallbackRedirectBase = trimTrailingSlash(
    `${frontendBase || 'http://localhost:3000'}/confirmed`
  );
  const rawRedirectInput = trimTrailingSlash(
    env('STRAPI_EMAIL_CONFIRM_REDIRECT', fallbackRedirectBase)
  );
  const redirectBase = rawRedirectInput?.includes('/api/auth/email-confirmation')
    ? fallbackRedirectBase
    : rawRedirectInput || fallbackRedirectBase;
  const redirectUrl =
    redirectBase.includes('?') || redirectBase.endsWith('&')
      ? redirectBase
      : appendQueryParam(redirectBase, 'status', 'success');

  return {
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          baseUrl: env('UPLOAD_CDN_URL', 'https://cdn.joinruach.org'),
          s3Options: {
            endpoint: env('R2_ENDPOINT'),
            forcePathStyle: true,
            region: 'auto',
            credentials: {
              accessKeyId: env('R2_ACCESS_KEY_ID'),
              secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
            },
            params: {
              Bucket: env('R2_BUCKET_NAME'),
            },
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
    email: {
      config: {
        provider: 'resend',
        providerOptions: {
          apiKey: env('RESEND_API_KEY'),
        },
        settings: {
          defaultFrom: 'Ruach <no-reply@updates.joinruach.org>',
          defaultReplyTo: 'support@updates.joinruach.org',
          confirmEmailUrl,
        },
        emailConfirmation: {
          redirectUrl,
        },
      },
    },
    'users-permissions': {
      config: {
        jwtSecret: env('JWT_SECRET'),
      },
    },
  };
};
