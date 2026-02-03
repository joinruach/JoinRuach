const trimTrailingSlash = (value = '') => value.replace(/\/$/, '');

const joinPath = (base, path) => `${trimTrailingSlash(base)}${path}`;

module.exports = ({ env }) => {
  const backendBase = trimTrailingSlash(env('STRAPI_BACKEND_URL', 'http://localhost:1337'));
  const publicBase = trimTrailingSlash(
    env('STRAPI_PUBLIC_URL', env('FRONTEND_URL', 'http://localhost:3000'))
  );

  const confirmEmailUrl = trimTrailingSlash(
    env('STRAPI_EMAIL_CONFIRM_LINK', joinPath(backendBase, '/api/auth/email-confirmation'))
  );

  const redirectUrl = env(
    'STRAPI_EMAIL_CONFIRM_REDIRECT',
    `${publicBase}/confirmed?status=success`
  );

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
          defaultFrom: env('EMAIL_DEFAULT_FROM', 'no-reply@updates.joinruach.org'),
          defaultReplyTo: env('EMAIL_DEFAULT_REPLY_TO', 'support@ruachstudio.com'),
        },
        confirmEmailUrl,
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
    'ai-assistant': {
      enabled: false,
    },
  };
};
