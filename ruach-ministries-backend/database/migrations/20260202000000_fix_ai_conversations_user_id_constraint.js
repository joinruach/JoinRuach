/**
 * Fix ai_conversations.user_id foreign key constraint
 *
 * Issue: Strapi migration attempts to alter column type while FK exists
 * Solution: Drop constraint, ensure correct type, recreate constraint
 */

module.exports = {
  /**
   * Run migration
   */
  async up(knex) {
    console.log('🔧 Fixing ai_conversations.user_id foreign key constraint...');

    // Check if ai_conversations table exists
    const tableExists = await knex.schema.hasTable('ai_conversations');
    if (!tableExists) {
      console.log('⚠️  ai_conversations table does not exist, skipping migration');
      return;
    }

    // Check if the column exists
    const hasColumn = await knex.schema.hasColumn('ai_conversations', 'user_id');
    if (!hasColumn) {
      console.log('⚠️  ai_conversations.user_id column does not exist, skipping migration');
      return;
    }

    try {
      // Step 1: Get all existing constraint names on the user_id column
      const constraints = await knex.raw(`
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'ai_conversations'::regclass
          AND contype = 'f'
          AND conkey @> ARRAY[(
            SELECT attnum
            FROM pg_attribute
            WHERE attrelid = 'ai_conversations'::regclass
              AND attname = 'user_id'
          )]
      `);

      // Step 2: Drop all foreign key constraints on user_id
      if (constraints.rows && constraints.rows.length > 0) {
        for (const row of constraints.rows) {
          console.log(`🗑️  Dropping constraint: ${row.conname}`);
          await knex.raw(`ALTER TABLE ai_conversations DROP CONSTRAINT IF EXISTS "${row.conname}"`);
        }
      } else {
        console.log('ℹ️  No existing foreign key constraints found');
      }

      // Step 3: Ensure column type is integer (matching up_users.id)
      // PostgreSQL will only allow this if data is compatible
      await knex.raw(`
        ALTER TABLE ai_conversations
        ALTER COLUMN user_id TYPE integer USING user_id::integer
      `);
      console.log('✅ Ensured user_id column is type integer');

      // Step 4: Re-create the foreign key constraint with a known name
      await knex.raw(`
        ALTER TABLE ai_conversations
        ADD CONSTRAINT ai_conversations_user_id_fk
        FOREIGN KEY (user_id)
        REFERENCES up_users(id)
        ON DELETE CASCADE
      `);
      console.log('✅ Re-created foreign key constraint: ai_conversations_user_id_fk');

      // Step 5: Ensure index exists for performance
      const indexExists = await knex.raw(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'ai_conversations'
          AND indexname = 'ai_conversations_user_id_idx'
      `);

      if (!indexExists.rows || indexExists.rows.length === 0) {
        await knex.raw(`
          CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx
          ON ai_conversations(user_id)
        `);
        console.log('✅ Created index: ai_conversations_user_id_idx');
      }

      console.log('🎉 ai_conversations.user_id constraint fix completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  /**
   * Rollback migration
   */
  async down(knex) {
    console.log('🔄 Rolling back ai_conversations.user_id constraint fix...');

    // Check if table exists
    const tableExists = await knex.schema.hasTable('ai_conversations');
    if (!tableExists) {
      console.log('⚠️  ai_conversations table does not exist, nothing to rollback');
      return;
    }

    try {
      // Drop the constraint we created
      await knex.raw(`
        ALTER TABLE ai_conversations
        DROP CONSTRAINT IF EXISTS ai_conversations_user_id_fk
      `);
      console.log('✅ Dropped constraint: ai_conversations_user_id_fk');

      // Optionally drop the index
      await knex.raw(`
        DROP INDEX IF EXISTS ai_conversations_user_id_idx
      `);
      console.log('✅ Dropped index: ai_conversations_user_id_idx');

      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  },
};
