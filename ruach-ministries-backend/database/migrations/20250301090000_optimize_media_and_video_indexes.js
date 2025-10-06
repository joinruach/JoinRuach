'use strict';

module.exports = {
  async up(knex) {
    const ensureIndex = async (table, columns, statement) => {
      const tableExists = await knex.schema.hasTable(table);
      if (!tableExists) {
        return;
      }

      const checks = await Promise.all(columns.map((column) => knex.schema.hasColumn(table, column)));
      if (checks.every(Boolean)) {
        await knex.raw(statement);
      }
    };

    await ensureIndex(
      'media_items',
      ['type', 'released_at'],
      'CREATE INDEX IF NOT EXISTS "ix_media_item_type_released_at" ON "media_items" ("type", "released_at" DESC)'
    );

    await ensureIndex(
      'media_items',
      ['category_id', 'released_at'],
      'CREATE INDEX IF NOT EXISTS "ix_media_item_category_released_at" ON "media_items" ("category_id", "released_at" DESC)'
    );

    await ensureIndex(
      'videos',
      ['trending_video'],
      'CREATE INDEX IF NOT EXISTS "ix_video_trending_flag" ON "videos" ("trending_video")'
    );
  },

  async down(knex) {
    await knex.raw('DROP INDEX IF EXISTS "ix_video_trending_flag"');
    await knex.raw('DROP INDEX IF EXISTS "ix_media_item_category_released_at"');
    await knex.raw('DROP INDEX IF EXISTS "ix_media_item_type_released_at"');
  },
};
