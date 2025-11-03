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

function createLogger(logger) {
  const fallback = {
    info: (...args) => console.log(...args),
    debug: (...args) => (console.debug ? console.debug(...args) : console.log(...args)),
    error: (...args) => console.error(...args),
  };

  if (!logger) {
    return fallback;
  }

  return {
    info: (...args) => (typeof logger.info === 'function' ? logger.info(...args) : fallback.info(...args)),
    debug: (...args) => (typeof logger.debug === 'function' ? logger.debug(...args) : fallback.debug(...args)),
    error: (...args) => (typeof logger.error === 'function' ? logger.error(...args) : fallback.error(...args)),
  };
}

function resolveKnex(input) {
  if (input && typeof input === 'function' && typeof input.raw === 'function') {
    return input;
  }

  if (input?.knex && typeof input.knex.raw === 'function') {
    return input.knex;
  }

  if (input?.connection && typeof input.connection.raw === 'function') {
    return input.connection;
  }

  throw new Error('Unable to resolve knex instance for migration');
}

async function resolveUserColumns(knex) {
  const columnInfo = await knex('up_users').columnInfo();
  const columnNames = Object.keys(columnInfo);

  const pickColumn = (...candidates) => candidates.find((name) => columnNames.includes(name));

  const confirmationToken = pickColumn('confirmation_token', 'confirmationtoken', 'confirmationToken');
  if (!confirmationToken) {
    throw new Error('Could not locate confirmation token column on up_users table');
  }

  const confirmed = pickColumn('confirmed');
  if (!confirmed) {
    throw new Error('Could not locate confirmed column on up_users table');
  }

  const id = pickColumn('id');
  if (!id) {
    throw new Error('Could not locate id column on up_users table');
  }

  const email = pickColumn('email');
  if (!email) {
    throw new Error('Could not locate email column on up_users table');
  }

  const username = pickColumn('username');
  if (!username) {
    throw new Error('Could not locate username column on up_users table');
  }

  return {
    table: 'up_users',
    columns: { confirmationToken, confirmed, id, email, username },
  };
}

async function migrateUsers(knexInstance, optionalLogger) {
  const knex = resolveKnex(knexInstance);
  const logger = createLogger(optionalLogger);

  logger.info('🔍 Starting legacy token migration...');

  try {
    const { table, columns } = await resolveUserColumns(knex);

    const usersWithTokens = await knex(table)
      .select({
        id: columns.id,
        email: columns.email,
        username: columns.username,
        confirmed: columns.confirmed,
        confirmationToken: columns.confirmationToken,
      })
      .whereNotNull(columns.confirmationToken);

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

      if (!isLegacyToken(token)) {
        logger.debug(`⏩ Skipping user ${user.email} - already has JWT token`);
        skippedCount++;
        continue;
      }

      logger.info(`🔧 Migrating user: ${user.email} (ID: ${user.id})`);
      logger.debug(`  Legacy token hash: ${crypto.createHash('sha256').update(token).digest('hex').slice(0, 8)}...`);

      await knex(table)
        .where(columns.id, user.id)
        .update({
          [columns.confirmed]: true,
          [columns.confirmationToken]: null,
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
  async up(knex) {
    await migrateUsers(knex);
  },
  async down() {
    // no-op: auto-confirmed users remain confirmed
  },
};

if (require.main === module) {
  (async () => {
    const Strapi = require('@strapi/strapi');
    let app;

    try {
      console.log('🚀 Bootstrapping Strapi...');
      app = await Strapi().load();
      await migrateUsers(app.db.connection, app.log);
      console.log('✅ Legacy confirmation token migration completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      if (app) {
        await app.destroy();
      }
    }
  })();
}
