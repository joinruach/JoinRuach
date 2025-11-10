/**
 * Migration Script — Legacy → New Strapi v5 Content Types
 * --------------------------------------------------------
 * Safely migrates data from old content types (video, image, about, etc.)
 * into their new normalized equivalents.
 *
 * Run with:
 *   node ruach-ministries-backend/scripts/migrate-legacy-content-types.js
 */

const path = require('path');
const { createStrapi } = require('@strapi/strapi');

(async () => {
  console.log('🔄 Initializing Strapi for migration...');
  const strapi = await createStrapi({
    distDir: path.resolve(__dirname, '..', 'dist'),
    autoReload: false,
    serveAdminPanel: false,
  }).load();
  console.log('✅ Strapi loaded successfully.\n');

  // Helper to convert blocks to plain text
  const blocksToText = (blocks) => {
    if (!blocks) return '';
    if (typeof blocks === 'string') return blocks;
    if (Array.isArray(blocks)) {
      return blocks
        .map(block => {
          if (block.type === 'paragraph' && block.children) {
            return block.children.map(child => child.text || '').join('');
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }
    return '';
  };

  // Mapping of legacy content types → new targets
  const migrations = [
    {
      old: 'video',
      new: 'media-item',
      transform: (entry) => {
        const releasedAt = entry.publishedDate
          ? new Date(entry.publishedDate)
          : entry.publishedAt
            ? new Date(entry.publishedAt)
            : new Date();

        return {
          title: entry.title,
          description: blocksToText(entry.description),
          slug: entry.slug || `video-${entry.id}`,
          thumbnail: entry.thumbnail,
          videoUrl: entry.videoUrl,
          featured: entry.trending_video || false,
          type: entry.isShort ? 'short' : 'teaching',
          releasedAt: releasedAt.toISOString(),
          tags: entry.tags,
          legacyVideoId: entry.id,
        };
      },
    },
    {
      old: 'image',
      new: 'media-item',
      transform: (entry) => {
        const releasedAt = entry.publishedAt
          ? new Date(entry.publishedAt)
          : new Date();

        return {
          title: entry.title || `Image ${entry.id}`,
          description: entry.altText || '',
          slug: `image-${entry.id}`,
          thumbnail: entry.imageFile,
          gallery: entry.imageFile ? [entry.imageFile] : [],
          type: 'testimony',
          releasedAt: releasedAt.toISOString(),
          featured: false,
          tags: entry.tags,
          legacyImageId: entry.id,
        };
      },
    },
  ];

  // Content types that need manual migration
  const manualMigrations = [
    { type: 'about', reason: 'Target content type needs to be created', suggestion: 'Create a blog-post or page content type' },
    { type: 'contact-info', reason: 'Should be merged into global singleType', suggestion: 'Manually update api::global.global' },
    { type: 'hero-section', reason: 'Should be merged into global or video-hero', suggestion: 'Manually update api::global.global or api::video-hero.video-hero' },
    { type: 'setting', reason: 'Should be merged into global singleType', suggestion: 'Manually update api::global.global' },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    const { old: oldType, new: newType, transform } = migration;
    console.log(`📦 Migrating api::${oldType}.${oldType} → api::${newType}.${newType}`);

    try {
      // Check if target content type exists
      if (!strapi.contentTypes[`api::${newType}.${newType}`]) {
        console.log(`   ⚠️  Target content type api::${newType}.${newType} not found. Skipping.\n`);
        errorCount++;
        continue;
      }

      const oldEntries = await strapi.db.query(`api::${oldType}.${oldType}`).findMany();
      if (!oldEntries.length) {
        console.log(`   ✅ No entries found for ${oldType}. Skipping.\n`);
        continue;
      }

      let migratedCount = 0;
      let skippedCount = 0;

      for (const entry of oldEntries) {
        // Transform the data using the provided function
        const data = transform ? transform(entry) : { ...entry };

        // Check if already migrated by slug
        if (data.slug) {
          const existing = await strapi.db
            .query(`api::${newType}.${newType}`)
            .findOne({ where: { slug: data.slug } });

          if (existing) {
            console.log(`   ⏩ Skipping ${data.slug} - already exists`);
            skippedCount++;
            continue;
          }
        }

        // Strip Strapi system fields
        delete data.id;
        delete data.createdAt;
        delete data.updatedAt;
        delete data.createdBy;
        delete data.updatedBy;
        delete data.localizations;
        delete data.migratedAt;
        delete data.legacyVideoId;
        delete data.legacyImageId;

        await strapi.db.query(`api::${newType}.${newType}`).create({ data });
        migratedCount++;
      }

      const summary = migratedCount > 0 || skippedCount > 0
        ? `${migratedCount} new, ${skippedCount} skipped`
        : '0';
      console.log(`   ✅ Migration complete: ${summary}\n`);
      successCount += migratedCount;
    } catch (err) {
      console.error(`   ❌ Error migrating ${oldType}:`, err.message);
      errorCount++;
    }
  }

  // Report on manual migrations needed
  console.log('\n' + '='.repeat(80));
  console.log('MANUAL MIGRATION REQUIRED');
  console.log('='.repeat(80) + '\n');

  for (const { type, reason, suggestion } of manualMigrations) {
    try {
      const count = await strapi.db.query(`api::${type}.${type}`).count();
      if (count > 0) {
        console.log(`⚠️  ${type} (${count} entries)`);
        console.log(`   Reason: ${reason}`);
        console.log(`   Suggestion: ${suggestion}\n`);
      }
    } catch (err) {
      // Content type might not exist
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successfully migrated: ${successCount} entries`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(80) + '\n');

  console.log('🏁 Migration complete.');
  await strapi.destroy();
  process.exit(0);
})();