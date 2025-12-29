/**
 * Strapi Scripture Cleanup Script
 * Run this from within the Strapi directory with: node scripts/cleanup-scripture.js
 * This script has full permissions since it runs inside Strapi
 */

const strapiPath = require('path').resolve(__dirname, '..');

async function cleanup() {
  console.log('🧹 Starting scripture data cleanup...');
  console.log('   Loading Strapi...');

  // Load Strapi instance
  const Strapi = require('@strapi/strapi');
  const app = await Strapi().load();

  try {
    const contentTypes = [
      'api::scripture-verse.scripture-verse',
      'api::scripture-token.scripture-token',
      'api::scripture-lemma.scripture-lemma',
      'api::scripture-alignment.scripture-alignment',
      'api::scripture-theme.scripture-theme',
      'api::scripture-book.scripture-book',
      'api::scripture-work.scripture-work',
    ];

    const labels = [
      'scripture verses',
      'scripture tokens',
      'scripture lemmas',
      'scripture alignments',
      'scripture themes',
      'scripture books',
      'scripture works',
    ];

    for (let i = 0; i < contentTypes.length; i++) {
      const contentType = contentTypes[i];
      const label = labels[i];

      console.log(`\n🗑️  Deleting all ${label}...`);

      let page = 1;
      let totalDeleted = 0;

      while (true) {
        // Fetch a page of entities
        const entities = await strapi.entityService.findMany(contentType, {
          start: (page - 1) * 100,
          limit: 100,
        });

        if (!entities || entities.length === 0) {
          break;
        }

        // Delete all entities in this page
        for (const entity of entities) {
          await strapi.entityService.delete(contentType, entity.id);
          totalDeleted++;

          if (totalDeleted % 100 === 0) {
            console.log(`   Deleted ${totalDeleted} ${label}...`);
          }
        }

        page++;
      }

      console.log(`✅ Deleted ${totalDeleted} ${label}`);
    }

    console.log('\n✅ Cleanup complete! All scripture data has been deleted.');
    console.log('   You can now run the import script to re-import fresh data.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await app.destroy();
  }
}

cleanup();
