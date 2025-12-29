/**
 * Auth Controller Override
 *
 * Handles email confirmation with proper redirect URLs including status query params
 */

const crypto = require('crypto');

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

const getRedirectUrl = (status: 'success' | 'error', reason?: string): string => {
  const publicBase = trimTrailingSlash(
    getEnv('STRAPI_PUBLIC_URL', getEnv('FRONTEND_URL', 'http://localhost:3000'))
  );

  const baseRedirect = getEnv(
    'STRAPI_EMAIL_CONFIRM_REDIRECT',
    `${publicBase}/confirmed`
  );

  let url = appendQueryParam(baseRedirect, 'status', status);

  if (reason && status === 'error') {
    url = appendQueryParam(url, 'reason', reason);
  }

  return url;
};

/**
 * Detect if token is JWT format vs legacy hex token
 */
const isJWTFormat = (token: string): boolean => {
  // JWT format: xxx.yyy.zzz (base64url encoded parts separated by dots)
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
};

/**
 * Create a safe hash of token for logging (never log full token)
 */
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 8);
};

export default ({ strapi }) => {
  const getJwtService = () => strapi.plugin('users-permissions')?.service('jwt');

  return {
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
          return ctx.redirect(getRedirectUrl('error', 'missing_token'));
        }

        // Check token format - detect legacy hex tokens
        if (!isJWTFormat(confirmationToken)) {
          strapi.log.warn('Non-JWT confirmation token detected (legacy format)', {
            category: 'authentication',
            tokenHash: hashToken(confirmationToken),
            tokenLength: confirmationToken.length,
            ip: ctx.request.ip,
          });
          return ctx.redirect(getRedirectUrl('error', 'legacy_token'));
        }

        // Verify and decode the JWT token
        let decoded;
        const jwtService = getJwtService();
        if (!jwtService) {
          strapi.log.error('users-permissions plugin JWT service not available for confirmation', {
            category: 'authentication',
          });
          return ctx.redirect(getRedirectUrl('error', 'server_error'));
        }

        try {
          decoded = await jwtService.verify(confirmationToken);
        } catch (err) {
          strapi.log.warn('Invalid confirmation token', {
            category: 'authentication',
            tokenHash: hashToken(confirmationToken),
            error: err.name || 'VerificationError',
            message: err.message,
            ip: ctx.request.ip,
          });

          // Provide specific error reasons
          const reason = err.name === 'TokenExpiredError' ? 'expired_token' : 'invalid_token';
          return ctx.redirect(getRedirectUrl('error', reason));
        }

        // Find user by ID from token
        const user = await strapi.query('plugin::users-permissions.user').findOne({
          where: { id: decoded.id },
        });

        if (!user) {
          strapi.log.warn('User not found for confirmation token', {
            category: 'authentication',
            userId: decoded.id,
            ip: ctx.request.ip,
          });
          return ctx.redirect(getRedirectUrl('error', 'user_not_found'));
        }

        // Check if already confirmed
        if (user.confirmed) {
          strapi.log.info('User already confirmed', {
            category: 'authentication',
            userId: user.id,
            email: user.email,
            ip: ctx.request.ip,
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
          ip: ctx.request.ip,
        });

        return ctx.redirect(getRedirectUrl('success'));
      } catch (error) {
        strapi.log.error('Email confirmation error', {
          category: 'authentication',
          error: error.message,
          stack: error.stack,
          ip: ctx.request.ip,
        });
        return ctx.redirect(getRedirectUrl('error', 'server_error'));
      }
    },
  };
};
