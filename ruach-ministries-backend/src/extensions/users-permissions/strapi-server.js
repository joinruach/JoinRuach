/**
 * Custom Users-Permissions Plugin Extension
 *
 * Adds logging for email confirmation emails
 */

'use strict';

const logger = require('../../config/logger');

const DEFAULT_BACKEND_URL = 'http://localhost:1337';
const DEFAULT_PUBLIC_URL = 'http://localhost:3000';
const DEFAULT_CONFIRM_REDIRECT = `${DEFAULT_PUBLIC_URL}/confirmed?status=success`;

const getEnv = (name, fallback) => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length ? value.trim() : fallback;
};

const trimTrailingSlash = (value = '') => value.replace(/\/$/, '');

const appendQueryParam = (base, key, value) => {
  if (!base) {
    return base;
  }

  const hasQuery = base.includes('?');
  const separator = hasQuery ? (base.endsWith('?') || base.endsWith('&') ? '' : '&') : '?';
  return `${base}${separator}${key}=${value}`;
};

const joinPath = (base, path) => `${trimTrailingSlash(base)}${path}`;

const resolveConfirmationLinkBase = (strapiInstance) => {
  const overrideLink = getEnv('STRAPI_EMAIL_CONFIRM_LINK', '');
  if (overrideLink) {
    return trimTrailingSlash(overrideLink);
  }

  const backendBase =
    trimTrailingSlash(getEnv('STRAPI_BACKEND_URL', '')) ||
    trimTrailingSlash(strapiInstance?.config?.get('server.url')) ||
    trimTrailingSlash(getEnv('PUBLIC_URL', '')) ||
    DEFAULT_BACKEND_URL;

  return joinPath(backendBase, '/api/auth/email-confirmation');
};

module.exports = (plugin) => {
  // Override only the emailConfirmation method in the auth controller
  const customAuthMethods = require('./controllers/auth');
  const originalEmailConfirmation = plugin.controllers.auth.emailConfirmation;

  // Override emailConfirmation while keeping all other auth methods
  plugin.controllers.auth.emailConfirmation = customAuthMethods.default({ strapi }).emailConfirmation;

  // Wrap the email service to add logging
  plugin.services.user.sendConfirmationEmail = async function (user) {
    logger.info('Sending confirmation email', {
      category: 'authentication',
      userId: user.id,
      email: user.email,
      confirmed: user.confirmed,
    });

    try {
      // Get the email plugin
      const emailService = strapi.plugin('email').service('email');

      // Get the plugin store for email settings
      const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
      const emailSettings = await pluginStore.get({ key: 'email' });
      const advancedSettings = await pluginStore.get({ key: 'advanced' });

      if (!emailSettings || !emailSettings.email_confirmation) {
        logger.error('Email confirmation template not configured', {
          category: 'authentication',
          hasEmailSettings: !!emailSettings,
        });
        throw new Error('Email confirmation template not configured');
      }

      // Generate confirmation code
      const jwtService = strapi.plugin('users-permissions').service('jwt');
      const confirmationToken = jwtService.issue({
        id: user.id,
      });

      // Update user with confirmation token
      await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { confirmationToken },
      });

      const template = emailSettings.email_confirmation.options;
      const publicBase =
        trimTrailingSlash(getEnv('STRAPI_PUBLIC_URL', getEnv('FRONTEND_URL', ''))) ||
        DEFAULT_PUBLIC_URL;
      const confirmationRedirect =
        advancedSettings.email_confirmation_redirection ||
        getEnv('STRAPI_EMAIL_CONFIRM_REDIRECT', `${publicBase}/confirmed?status=success`) ||
        DEFAULT_CONFIRM_REDIRECT;
      const confirmationLinkBase = resolveConfirmationLinkBase(strapi);
      const confirmationLink = appendQueryParam(confirmationLinkBase, 'confirmation', confirmationToken);

      const replacements = {
        '<%= URL %>': confirmationRedirect,
        '{{ URL }}': confirmationRedirect,
        '<%= CODE %>': confirmationToken,
        '<%= USER.username %>': user.username || user.email,
        '{{ CODE }}': confirmationToken,
        '{{ USER.username }}': user.username || user.email,
        '{{ CONFIRMATION_REDIRECT }}': confirmationRedirect,
        '{{ CONFIRMATION_LINK }}': confirmationLink,
        '<%= CONFIRMATION_LINK %>': confirmationLink,
      };

      const replacePlaceholders = (input = '') =>
        Object.entries(replacements).reduce(
          (acc, [placeholder, value]) => acc.replace(new RegExp(placeholder, 'g'), value),
          input
        );

      let message = replacePlaceholders(template.message);

      if (!message || !message.includes(confirmationToken)) {
        message = [
          `<p>Welcome to Ruach!</p>`,
          `<p>To finish setting up your account, please confirm your email.</p>`,
          `<p><a href="${confirmationLink}">Confirm My Email</a></p>`,
          `<p>If the button does not work, copy and paste this link into your browser:</p>`,
          `<p>${confirmationLink}</p>`,
          `<p>With gratitude,<br />The Ruach Team</p>`,
        ].join('\n\n');
      }

      logger.info('Attempting to send confirmation email', {
        category: 'authentication',
        userId: user.id,
        to: user.email,
        from: template.from?.email || 'no-reply@updates.joinruach.org',
        confirmationRedirect,
        confirmationLink,
      });

      await emailService.send({
        to: user.email,
        from: template.from?.email || template.from || 'no-reply@updates.joinruach.org',
        subject: template.object,
        text: message.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        html: message,
      });

      logger.info('Confirmation email sent successfully', {
        category: 'authentication',
        userId: user.id,
        email: user.email,
      });

      return { user, confirmationToken };
    } catch (error) {
      logger.error('Failed to send confirmation email', {
        category: 'authentication',
        userId: user.id,
        email: user.email,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  };

  return plugin;
};
