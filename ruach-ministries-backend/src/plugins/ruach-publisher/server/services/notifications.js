/**
 * Ruach Publisher - Notification Service
 *
 * Sends email notifications for publishing failures
 */

'use strict';

const logger = require('../../../../config/logger');

module.exports = ({ strapi }) => ({
  /**
   * Send email notification for publishing failure
   *
   * @param {object} mediaItem - The media item that failed to publish
   * @param {string} platform - The platform that failed
   * @param {object} error - The error details
   * @param {number} attempts - Number of attempts made
   */
  async notifyPublishingFailure(mediaItem, platform, error, attempts = 0) {
    const recipients = getNotificationRecipients();

    if (!recipients || recipients.length === 0) {
      logger.warn('No notification recipients configured', {
        category: 'publisher',
        mediaItemId: mediaItem.id,
        platform,
      });
      return;
    }

    const subject = `Publishing Failed: ${mediaItem.title} → ${formatPlatform(platform)}`;
    const emailHtml = buildFailureEmail(mediaItem, platform, error, attempts);

    try {
      await strapi.plugin('email').service('email').send({
        to: recipients,
        from: process.env.EMAIL_DEFAULT_FROM || 'no-reply@updates.joinruach.org',
        subject,
        html: emailHtml,
      });

      logger.info('Publishing failure notification sent', {
        category: 'publisher',
        mediaItemId: mediaItem.id,
        platform,
        recipients: recipients.join(', '),
      });
    } catch (emailError) {
      logger.error('Failed to send publishing failure notification', {
        category: 'publisher',
        mediaItemId: mediaItem.id,
        platform,
        error: emailError.message,
      });
    }
  },

  /**
   * Send summary notification for final failure (after all retries exhausted)
   *
   * @param {object} mediaItem - The media item
   * @param {string} platform - The platform
   * @param {object} error - The error details
   * @param {number} maxAttempts - Maximum attempts configured
   */
  async notifyFinalFailure(mediaItem, platform, error, maxAttempts = 3) {
    const recipients = getNotificationRecipients();

    if (!recipients || recipients.length === 0) {
      return;
    }

    const subject = `⚠️ FINAL FAILURE: ${mediaItem.title} → ${formatPlatform(platform)}`;
    const emailHtml = buildFinalFailureEmail(mediaItem, platform, error, maxAttempts);

    try {
      await strapi.plugin('email').service('email').send({
        to: recipients,
        from: process.env.EMAIL_DEFAULT_FROM || 'no-reply@updates.joinruach.org',
        subject,
        html: emailHtml,
      });

      logger.info('Final publishing failure notification sent', {
        category: 'publisher',
        mediaItemId: mediaItem.id,
        platform,
        recipients: recipients.join(', '),
      });
    } catch (emailError) {
      logger.error('Failed to send final failure notification', {
        category: 'publisher',
        mediaItemId: mediaItem.id,
        platform,
        error: emailError.message,
      });
    }
  },
});

/**
 * Get notification recipients from environment
 */
function getNotificationRecipients() {
  const recipientsEnv = process.env.PUBLISHER_NOTIFICATION_EMAILS;

  if (!recipientsEnv) {
    // Default fallback
    return ['admin@joinruach.org', 'content@joinruach.org'];
  }

  return recipientsEnv
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

/**
 * Format platform name for display
 */
function formatPlatform(platform) {
  const platformNames = {
    youtube: 'YouTube',
    facebook: 'Facebook',
    instagram: 'Instagram',
    x: 'X (Twitter)',
    patreon: 'Patreon',
    rumble: 'Rumble',
    locals: 'Locals',
    truthsocial: 'Truth Social',
  };

  return platformNames[platform] || platform;
}

/**
 * Build HTML email for publishing failure
 */
function buildFailureEmail(mediaItem, platform, error, attempts) {
  const adminUrl = process.env.STRAPI_PUBLIC_URL || 'https://api.joinruach.org';
  const mediaItemUrl = `${adminUrl}/admin/content-manager/collection-types/api::media-item.media-item/${mediaItem.id}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .error-box { background: #fff; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Publishing Failed</h2>
    </div>
    <div class="content">
      <p><strong>Media Item:</strong> ${escapeHtml(mediaItem.title)}</p>
      <p><strong>Platform:</strong> ${formatPlatform(platform)}</p>
      <p><strong>Attempts:</strong> ${attempts} of 3</p>

      <div class="error-box">
        <strong>Error:</strong><br>
        <code>${escapeHtml(error.message || error)}</code>
      </div>

      ${attempts < 3 ? '<p>⏱️ The system will automatically retry this publication.</p>' : '<p>⚠️ <strong>All retries exhausted.</strong> Manual intervention required.</p>'}

      <a href="${mediaItemUrl}" class="button">View in Admin</a>

      <div class="footer">
        <p>This is an automated notification from Ruach Publishing System.</p>
        <p>To update notification recipients, modify <code>PUBLISHER_NOTIFICATION_EMAILS</code> in your environment configuration.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build HTML email for final failure (all retries exhausted)
 */
function buildFinalFailureEmail(mediaItem, platform, error, maxAttempts) {
  const adminUrl = process.env.STRAPI_PUBLIC_URL || 'https://api.joinruach.org';
  const mediaItemUrl = `${adminUrl}/admin/content-manager/collection-types/api::media-item.media-item/${mediaItem.id}`;
  const retryUrl = `${adminUrl}/api/ruach-publisher/retry/${mediaItem.id}/${platform}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .error-box { background: #fff; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 5px 10px 0; }
    .button-danger { background: #dc3545; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚠️ FINAL PUBLISHING FAILURE</h2>
    </div>
    <div class="content">
      <div class="warning-box">
        <strong>All ${maxAttempts} automatic retry attempts have been exhausted.</strong><br>
        Manual intervention is required.
      </div>

      <p><strong>Media Item:</strong> ${escapeHtml(mediaItem.title)}</p>
      <p><strong>Platform:</strong> ${formatPlatform(platform)}</p>
      <p><strong>Total Attempts:</strong> ${maxAttempts}</p>

      <div class="error-box">
        <strong>Error:</strong><br>
        <code>${escapeHtml(error.message || error)}</code>
      </div>

      <h3>Next Steps:</h3>
      <ol>
        <li>Review the error message above</li>
        <li>Check ${formatPlatform(platform)} API credentials and permissions</li>
        <li>Verify the media item content meets platform requirements</li>
        <li>Manually retry publishing after fixing the issue</li>
      </ol>

      <a href="${mediaItemUrl}" class="button">View in Admin</a>

      <div class="footer">
        <p>This is an automated notification from Ruach Publishing System.</p>
        <p><strong>Action Required:</strong> This content was NOT published to ${formatPlatform(platform)}.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
