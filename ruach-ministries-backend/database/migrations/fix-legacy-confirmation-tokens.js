/**
 * Migration: Fix Legacy Confirmation Tokens
 *
 * Purpose: Migrate users with legacy hex confirmation tokens (64 chars)
 *          to the new JWT-based confirmation system.
 *
 * Strategy:
 *   - Detect tokens that are 64-char hex (legacy format)
 *   - Option A: Auto-confirm users (safest for old accounts)
 *   - Option B: Clear token and trigger new JWT confirmation email
 *
 * Run: node database/migrations/fix-legacy-confirmation-tokens.js
 */

const crypto = require('crypto');

// Detect if token is legacy hex format (not JWT)
function isLegacyToken(token) {
  if (!token || typeof token !== 'string') return false;

  // JWT format: xxx.yyy.zzz (base64url encoded)
  const isJWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
  if (isJWT) return false;

  // Legacy format: 64-char hex
  const isHex = /^[a-f0-9]{64}$/.test(token);
  return isHex && token.length === 64;
}

async function migrateUsers(strapi) {
  const logger = strapi?.log ?? console;

  logger.info('🔍 Starting legacy token migration...');

  try {
    // Find all users with confirmation tokens
    const usersWithTokens = await strapi.db
      .query('plugin::users-permissions.user')
      .findMany({
        where: {
          confirmationToken: { $notNull: true },
        },
        select: ['id', 'email', 'username', 'confirmed', 'confirmationToken'],
      });

    logger.info(`Found ${usersWithTokens.length} users with confirmation tokens`);

    if (usersWithTokens.length === 0) {
      logger.info('✅ No users to migrate');
      return { migrated: 0, resent: 0, skipped: 0 };
    }

    let migratedCount = 0;
    let resentCount = 0;
    let skippedCount = 0;

    for (const user of usersWithTokens) {
      const token = user.confirmationToken;

      // Check if token is legacy format
      if (!isLegacyToken(token)) {
        logger.debug(`⏩ Skipping user ${user.email} - already has JWT token`);
        skippedCount++;
        continue;
      }

      logger.info(`🔧 Migrating user: ${user.email} (ID: ${user.id})`);
      logger.debug(`  Legacy token hash: ${crypto.createHash('sha256').update(token).digest('hex').slice(0, 8)}...`);

      // Strategy A: Auto-confirm (safest for existing users)
      // Assumption: If they have a legacy token, the old system was working
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          confirmed: true,
          confirmationToken: null,
        },
      });

      logger.info(`  ✅ Auto-confirmed user ${user.email}`);
      migratedCount++;

      // Optional Strategy B: Resend new JWT confirmation email
      // Uncomment to send fresh JWT tokens instead of auto-confirming
      /*
      try {
        const userService = strapi.plugin('users-permissions').service('user');
        await userService.sendConfirmationEmail(user);
        logger.info(`  📧 Resent JWT confirmation to ${user.email}`);
        resentCount++;
      } catch (emailError) {
        logger.error(`  ❌ Failed to resend confirmation to ${user.email}:`, emailError.message);
        // Still count as migrated since we cleared the legacy token
        migratedCount++;
      }
      */
    }

    logger.info('\n📊 Migration Summary:');
    logger.info(`  ✅ Auto-confirmed: ${migratedCount}`);
    logger.info(`  📧 Resent JWT: ${resentCount}`);
    logger.info(`  ⏩ Skipped (already JWT): ${skippedCount}`);
    logger.info(`  📝 Total processed: ${usersWithTokens.length}`);

    return { migrated: migratedCount, resent: resentCount, skipped: skippedCount };
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = {
  async up({ strapi }) {
    await migrateUsers(strapi);
  },
  async down() {
    // no-op: auto-confirmed users remain confirmed
  },
};
