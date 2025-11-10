#!/usr/bin/env node
'use strict';

/**
 * Migration script to convert lesson-comment slug-based relations to proper FK relations
 *
 * This script:
 * 1. Finds all lesson-comments with courseSlug and lessonSlug
 * 2. Looks up the actual course and lesson entities by slug
 * 3. Updates the comment with proper course_id and lesson_id relations
 * 4. Logs progress and any errors encountered
 *
 * Usage:
 *   node scripts/migrate-lesson-comments.js
 */

const path = require('path');

async function runMigration() {
  const Strapi = require('@strapi/strapi');
  let strapi;

  try {
    // Load Strapi instance
    console.log('🔄 Loading Strapi...');
    strapi = await Strapi({
      distDir: path.resolve(__dirname, '..', 'dist'),
      autoReload: false,
      serveAdminPanel: false,
    }).load();

    console.log('✅ Strapi loaded successfully\n');

    // Fetch all lesson comments
    const comments = await strapi.db.query('api::lesson-comment.lesson-comment').findMany({
      populate: ['course', 'lesson'],
    });

    console.log(`📊 Found ${comments.length} lesson comments to process\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const comment of comments) {
      const { id, courseSlug, lessonSlug, course, lesson } = comment;

      // Skip if already has proper relations
      if (course && lesson) {
        console.log(`⏭️  Comment #${id} already has relations, skipping`);
        skipCount++;
        continue;
      }

      // Skip if missing slug data
      if (!courseSlug || !lessonSlug) {
        console.log(`⚠️  Comment #${id} missing slug data, skipping`);
        skipCount++;
        continue;
      }

      try {
        // Find course by slug
        const courseEntity = await strapi.db.query('api::course.course').findOne({
          where: { slug: courseSlug },
        });

        if (!courseEntity) {
          console.log(`❌ Comment #${id}: Course not found for slug "${courseSlug}"`);
          errorCount++;
          continue;
        }

        // Find lesson by slug and course
        const lessonEntity = await strapi.db.query('api::lesson.lesson').findOne({
          where: {
            slug: lessonSlug,
            course: courseEntity.id,
          },
        });

        if (!lessonEntity) {
          console.log(`❌ Comment #${id}: Lesson not found for slug "${lessonSlug}" in course "${courseSlug}"`);
          errorCount++;
          continue;
        }

        // Update comment with proper relations
        await strapi.db.query('api::lesson-comment.lesson-comment').update({
          where: { id },
          data: {
            course: courseEntity.id,
            lesson: lessonEntity.id,
          },
        });

        console.log(`✅ Comment #${id}: Updated relations (course: ${courseEntity.id}, lesson: ${lessonEntity.id})`);
        successCount++;

      } catch (err) {
        console.error(`❌ Comment #${id}: Error during migration:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`  ✅ Successfully migrated: ${successCount}`);
    console.log(`  ⏭️  Skipped (already migrated): ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📊 Total processed: ${comments.length}\n`);

    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with errors. Please review the logs above.');
    }

  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  } finally {
    if (strapi) {
      console.log('\n🔄 Closing Strapi...');
      await strapi.destroy();
      console.log('✅ Strapi closed\n');
    }
    process.exit(0);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };
