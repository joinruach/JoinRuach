/**
 * Custom Users-Permissions Plugin Extension
 *
 * Adds logging for email confirmation emails
 */

'use strict';

const logger = require('../../config/logger');

module.exports = (plugin) => {
  // Wrap the email service to add logging
  const originalEmailService = plugin.services.user;

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
      const confirmationToken = strapi.plugins['users-permissions'].services.jwt.issue({
        id: user.id,
      });

      // Update user with confirmation token
      await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { confirmationToken },
      });

      const template = emailSettings.email_confirmation.options;
      const confirmationUrl = advancedSettings.email_confirmation_redirection || 'http://localhost:3000/confirmed';

      const message = template.message
        .replace(/<%= URL %>/g, confirmationUrl)
        .replace(/<%= CODE %>/g, confirmationToken)
        .replace(/<%= USER.username %>/g, user.username || user.email);

      logger.info('Attempting to send confirmation email', {
        category: 'authentication',
        userId: user.id,
        to: user.email,
        from: template.from?.email || 'no-reply@updates.joinruach.org',
        confirmationUrl,
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
