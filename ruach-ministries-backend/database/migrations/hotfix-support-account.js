/**
 * Hotfix: Manually Confirm support@ruachstudio.com
 *
 * Purpose: Immediate unblock for support account with legacy token
 *
 * Run: node database/migrations/hotfix-support-account.js
 */

const Strapi = require('@strapi/strapi');

async function fixSupportAccount(strapi) {
  const logger = strapi.log || console;
  const targetEmail = 'support@ruachstudio.com';

  logger.info(`🔧 Starting hotfix for ${targetEmail}...`);

  try {
    // Find the user
    const user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: { email: targetEmail },
        select: ['id', 'email', 'username', 'confirmed', 'confirmationToken'],
      });

    if (!user) {
      logger.error(`❌ User not found: ${targetEmail}`);
      return { success: false, reason: 'User not found' };
    }

    logger.info(`Found user: ${user.email} (ID: ${user.id})`);
    logger.info(`  Current status: confirmed=${user.confirmed}`);
    logger.info(`  Has token: ${!!user.confirmationToken}`);

    // Already confirmed?
    if (user.confirmed && !user.confirmationToken) {
      logger.info(`✅ User already confirmed and token cleared`);
      return { success: true, reason: 'Already confirmed' };
    }

    // Update user
    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: {
        confirmed: true,
        confirmationToken: null,
      },
    });

    logger.info(`✅ Successfully confirmed ${targetEmail}`);
    logger.info(`   ALTERED_BY: system hotfix`);
    logger.info(`   TIMESTAMP: ${new Date().toISOString()}`);

    return { success: true, reason: 'Hotfix applied' };
  } catch (error) {
    logger.error('❌ Hotfix failed:', error);
    throw error;
  }
}

// Standalone execution
if (require.main === module) {
  (async () => {
    let appContext;
    try {
      console.log('🚀 Bootstrapping Strapi...');
      appContext = await Strapi().load();
      const app = appContext;

      console.log('✅ Strapi loaded successfully\n');

      const result = await fixSupportAccount(app);

      if (result.success) {
        console.log(`\n✅ Hotfix completed: ${result.reason}`);
        console.log('   User can now login at: https://joinruach.org/login');
      } else {
        console.log(`\n❌ Hotfix failed: ${result.reason}`);
        process.exit(1);
      }

      process.exit(0);
    } catch (error) {
      console.error('❌ Hotfix script failed:', error);
      process.exit(1);
    } finally {
      if (appContext) {
        await appContext.destroy();
      }
    }
  })();
}

module.exports = { fixSupportAccount };
