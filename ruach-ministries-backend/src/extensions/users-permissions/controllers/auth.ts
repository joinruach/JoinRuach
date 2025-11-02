/**
 * Auth Controller Override
 *
 * Handles email confirmation with proper redirect URLs including status query params
 */

const getEnv = (name: string, fallback: string = ''): string => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length ? value.trim() : fallback;
};

const trimTrailingSlash = (value: string = ''): string => value.replace(/\/$/, '');

const appendQueryParam = (base: string, key: string, value: string): string => {
  if (!base) return base;

  const hasQuery = base.includes('?');
  const separator = hasQuery ? (base.endsWith('?') || base.endsWith('&') ? '' : '&') : '?';
  return `${base}${separator}${key}=${encodeURIComponent(value)}`;
};

const getRedirectUrl = (status: 'success' | 'error'): string => {
  const publicBase = trimTrailingSlash(
    getEnv('STRAPI_PUBLIC_URL', getEnv('FRONTEND_URL', 'http://localhost:3000'))
  );

  const baseRedirect = getEnv(
    'STRAPI_EMAIL_CONFIRM_REDIRECT',
    `${publicBase}/confirmed`
  );

  return appendQueryParam(baseRedirect, 'status', status);
};

export default ({ strapi }) => ({
  /**
   * Email confirmation handler
   *
   * Verifies the confirmation token and redirects to frontend with status
   *
   * @route GET /api/auth/email-confirmation
   * @param {string} confirmation - The confirmation token from email link
   */
  async emailConfirmation(ctx) {
      const { confirmation: confirmationToken } = ctx.query;

      try {
        // Validate token exists
        if (!confirmationToken) {
          strapi.log.warn('Email confirmation attempted without token', {
            category: 'authentication',
            ip: ctx.request.ip,
          });
          return ctx.redirect(getRedirectUrl('error'));
        }

        // Verify and decode the JWT token
        let decoded;
        try {
          decoded = await strapi.plugins['users-permissions'].services.jwt.verify(
            confirmationToken
          );
        } catch (err) {
          strapi.log.warn('Invalid confirmation token', {
            category: 'authentication',
            error: err.message,
          });
          return ctx.redirect(getRedirectUrl('error'));
        }

        // Find user by ID from token
        const user = await strapi.query('plugin::users-permissions.user').findOne({
          where: { id: decoded.id },
        });

        if (!user) {
          strapi.log.warn('User not found for confirmation token', {
            category: 'authentication',
            userId: decoded.id,
          });
          return ctx.redirect(getRedirectUrl('error'));
        }

        // Check if already confirmed
        if (user.confirmed) {
          strapi.log.info('User already confirmed', {
            category: 'authentication',
            userId: user.id,
            email: user.email,
          });
          return ctx.redirect(getRedirectUrl('success'));
        }

        // Update user as confirmed
        await strapi.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: { confirmed: true, confirmationToken: null },
        });

        strapi.log.info('Email confirmed successfully', {
          category: 'authentication',
          userId: user.id,
          email: user.email,
        });

        return ctx.redirect(getRedirectUrl('success'));
      } catch (error) {
        strapi.log.error('Email confirmation error', {
          category: 'authentication',
          error: error.message,
          stack: error.stack,
        });
        return ctx.redirect(getRedirectUrl('error'));
      }
    },
  });
