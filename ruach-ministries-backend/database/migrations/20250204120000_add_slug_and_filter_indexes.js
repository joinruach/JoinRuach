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

    // Strapi keeps draft rows with null published_at alongside the published version of a document,
    // so we scope slug uniqueness to published records to avoid blocking draft workflow.
    await ensureIndex(
      'media_items',
      ['slug', 'published_at'],
      'CREATE UNIQUE INDEX IF NOT EXISTS "ix_media_item_slug" ON "media_items" ("slug") WHERE "slug" IS NOT NULL AND "published_at" IS NOT NULL'
    );
    await ensureIndex(
      'videos',
      ['slug', 'published_at'],
      'CREATE UNIQUE INDEX IF NOT EXISTS "ix_video_slug" ON "videos" ("slug") WHERE "slug" IS NOT NULL AND "published_at" IS NOT NULL'
    );
    await ensureIndex(
      'lessons',
      ['slug', 'published_at'],
      'CREATE UNIQUE INDEX IF NOT EXISTS "ix_lesson_slug" ON "lessons" ("slug") WHERE "slug" IS NOT NULL AND "published_at" IS NOT NULL'
    );
    await ensureIndex(
      'courses',
      ['slug', 'published_at'],
      'CREATE UNIQUE INDEX IF NOT EXISTS "ix_course_slug" ON "courses" ("slug") WHERE "slug" IS NOT NULL AND "published_at" IS NOT NULL'
    );
    await ensureIndex(
      'events',
      ['slug', 'published_at'],
      'CREATE UNIQUE INDEX IF NOT EXISTS "ix_event_slug" ON "events" ("slug") WHERE "slug" IS NOT NULL AND "published_at" IS NOT NULL'
    );
    await ensureIndex(
      'categories',
      ['slug', 'published_at'],
      'CREATE UNIQUE INDEX IF NOT EXISTS "ix_category_slug" ON "categories" ("slug") WHERE "slug" IS NOT NULL AND "published_at" IS NOT NULL'
    );
    await ensureIndex(
      'tags',
      ['slug', 'published_at'],
      'CREATE UNIQUE INDEX IF NOT EXISTS "ix_tag_slug" ON "tags" ("slug") WHERE "slug" IS NOT NULL AND "published_at" IS NOT NULL'
    );
    await ensureIndex(
      'speakers',
      ['slug', 'published_at'],
      'CREATE UNIQUE INDEX IF NOT EXISTS "ix_speaker_slug" ON "speakers" ("slug") WHERE "slug" IS NOT NULL AND "published_at" IS NOT NULL'
    );
    await ensureIndex(
      'blog_posts',
      ['slug', 'published_at'],
      'CREATE UNIQUE INDEX IF NOT EXISTS "ix_blog_post_slug" ON "blog_posts" ("slug") WHERE "slug" IS NOT NULL AND "published_at" IS NOT NULL'
    );
    await ensureIndex(
      'articles',
      ['slug', 'published_at'],
      'CREATE UNIQUE INDEX IF NOT EXISTS "ix_article_slug" ON "articles" ("slug") WHERE "slug" IS NOT NULL AND "published_at" IS NOT NULL'
    );

    await ensureIndex(
      'media_items',
      ['type'],
      'CREATE INDEX IF NOT EXISTS "ix_media_item_type" ON "media_items" ("type")'
    );
    await ensureIndex(
      'media_items',
      ['released_at'],
      'CREATE INDEX IF NOT EXISTS "ix_media_item_released_at" ON "media_items" ("released_at" DESC)'
    );
    await ensureIndex(
      'media_items',
      ['category_id'],
      'CREATE INDEX IF NOT EXISTS "ix_media_item_category" ON "media_items" ("category_id")'
    );
    await ensureIndex(
      'videos',
      ['created_at'],
      'CREATE INDEX IF NOT EXISTS "ix_video_created_at" ON "videos" ("created_at" DESC)'
    );
    await ensureIndex(
      'lessons',
      ['course_id', 'order'],
      'CREATE INDEX IF NOT EXISTS "ix_lesson_course_order" ON "lessons" ("course_id", "order")'
    );
    await ensureIndex(
      'events',
      ['start_date'],
      'CREATE INDEX IF NOT EXISTS "ix_event_start_date" ON "events" ("start_date")'
    );
  },

  async down(knex) {
    await knex.raw('DROP INDEX IF EXISTS "ix_event_start_date"');
    await knex.raw('DROP INDEX IF EXISTS "ix_lesson_course_order"');
    await knex.raw('DROP INDEX IF EXISTS "ix_video_created_at"');
    await knex.raw('DROP INDEX IF EXISTS "ix_media_item_category"');
    await knex.raw('DROP INDEX IF EXISTS "ix_media_item_released_at"');
    await knex.raw('DROP INDEX IF EXISTS "ix_media_item_type"');

    await knex.raw('DROP INDEX IF EXISTS "ix_article_slug"');
    await knex.raw('DROP INDEX IF EXISTS "ix_blog_post_slug"');
    await knex.raw('DROP INDEX IF EXISTS "ix_speaker_slug"');
    await knex.raw('DROP INDEX IF EXISTS "ix_tag_slug"');
    await knex.raw('DROP INDEX IF EXISTS "ix_category_slug"');
    await knex.raw('DROP INDEX IF EXISTS "ix_event_slug"');
    await knex.raw('DROP INDEX IF EXISTS "ix_course_slug"');
    await knex.raw('DROP INDEX IF EXISTS "ix_lesson_slug"');
    await knex.raw('DROP INDEX IF EXISTS "ix_video_slug"');
    await knex.raw('DROP INDEX IF EXISTS "ix_media_item_slug"');
  },
};
