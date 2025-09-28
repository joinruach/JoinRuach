'use strict';

module.exports = {
  async up(knex) {
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS "ix_media_item_slug" ON "media_items" ("slug")');
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS "ix_video_slug" ON "videos" ("slug")');
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS "ix_lesson_slug" ON "lessons" ("slug")');
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS "ix_course_slug" ON "courses" ("slug")');
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS "ix_event_slug" ON "events" ("slug")');
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS "ix_category_slug" ON "categories" ("slug")');
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS "ix_tag_slug" ON "tags" ("slug")');
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS "ix_speaker_slug" ON "speakers" ("slug")');
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS "ix_blog_post_slug" ON "blog_posts" ("slug")');
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS "ix_article_slug" ON "articles" ("slug")');

    await knex.raw('CREATE INDEX IF NOT EXISTS "ix_media_item_type" ON "media_items" ("type")');
    await knex.raw('CREATE INDEX IF NOT EXISTS "ix_media_item_released_at" ON "media_items" ("released_at" DESC)');
    await knex.raw('CREATE INDEX IF NOT EXISTS "ix_media_item_category" ON "media_items" ("category_id")');
    await knex.raw('CREATE INDEX IF NOT EXISTS "ix_video_created_at" ON "videos" ("created_at" DESC)');
    await knex.raw('CREATE INDEX IF NOT EXISTS "ix_lesson_course_order" ON "lessons" ("course_id", "order")');
    await knex.raw('CREATE INDEX IF NOT EXISTS "ix_event_start_date" ON "events" ("start_date")');
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
