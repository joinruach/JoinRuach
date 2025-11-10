'use strict';

module.exports = {
  async up(knex) {
    const ensureIndex = async (table, columns, statement) => {
      const tableExists = await knex.schema.hasTable(table);
      if (!tableExists) {
        console.log(`Skipping index creation for ${table} - table does not exist`);
        return;
      }

      const checks = await Promise.all(columns.map((column) => knex.schema.hasColumn(table, column)));
      if (checks.every(Boolean)) {
        await knex.raw(statement);
        console.log(`Created index on ${table}(${columns.join(', ')})`);
      } else {
        console.log(`Skipping index creation for ${table}(${columns.join(', ')}) - missing columns`);
      }
    };

    // Media items - featured flag
    await ensureIndex(
      'media_items',
      ['featured'],
      'CREATE INDEX IF NOT EXISTS "idx_media_item_featured" ON "media_items" ("featured") WHERE "featured" = true'
    );

    // Media items - released_at for sorting
    await ensureIndex(
      'media_items',
      ['released_at'],
      'CREATE INDEX IF NOT EXISTS "idx_media_item_released_at" ON "media_items" ("released_at" DESC)'
    );

    // Media items - category + featured + released_at for filtered listings
    await ensureIndex(
      'media_items',
      ['category_id', 'featured', 'released_at'],
      'CREATE INDEX IF NOT EXISTS "idx_media_category_featured_released" ON "media_items" ("category_id", "featured", "released_at" DESC)'
    );

    // Lessons - order for sorting
    await ensureIndex(
      'lessons',
      ['order'],
      'CREATE INDEX IF NOT EXISTS "idx_lesson_order" ON "lessons" ("order")'
    );

    // Lessons - course + order for course lesson listings
    await ensureIndex(
      'lessons',
      ['course_id', 'order'],
      'CREATE INDEX IF NOT EXISTS "idx_lesson_course_order" ON "lessons" ("course_id", "order")'
    );

    // Events - start_date for filtering upcoming/past events
    await ensureIndex(
      'events',
      ['start_date'],
      'CREATE INDEX IF NOT EXISTS "idx_event_start_date" ON "events" ("start_date")'
    );

    // Lesson progress - user + course + lesson for progress lookups
    await ensureIndex(
      'lesson_progresses',
      ['user_id', 'course_id', 'lesson_id'],
      'CREATE INDEX IF NOT EXISTS "idx_lesson_progress_user_course_lesson" ON "lesson_progresses" ("user_id", "course_id", "lesson_id")'
    );

    // Lesson comments - approved + created_at for displaying comments
    await ensureIndex(
      'lesson_comments',
      ['approved', 'created_at'],
      'CREATE INDEX IF NOT EXISTS "idx_lesson_comment_approved_created" ON "lesson_comments" ("approved", "created_at" DESC)'
    );

    console.log('✅ Critical database indexes created successfully');
  },

  async down(knex) {
    await knex.raw('DROP INDEX IF EXISTS "idx_lesson_comment_approved_created"');
    await knex.raw('DROP INDEX IF EXISTS "idx_lesson_progress_user_course_lesson"');
    await knex.raw('DROP INDEX IF EXISTS "idx_event_start_date"');
    await knex.raw('DROP INDEX IF EXISTS "idx_lesson_course_order"');
    await knex.raw('DROP INDEX IF EXISTS "idx_lesson_order"');
    await knex.raw('DROP INDEX IF EXISTS "idx_media_category_featured_released"');
    await knex.raw('DROP INDEX IF EXISTS "idx_media_item_released_at"');
    await knex.raw('DROP INDEX IF EXISTS "idx_media_item_featured"');

    console.log('🔄 Critical database indexes dropped');
  },
};
