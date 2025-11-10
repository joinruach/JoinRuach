#!/usr/bin/env node
'use strict';

/**
 * Validation script for legacy content type removal
 *
 * Checks for existing data and dependencies before removal
 *
 * Usage:
 *   node scripts/validate-legacy-content-types.js
 */

const path = require('path');
const fs = require('fs');

const LEGACY_TYPES = [
  'api::video.video',
  'api::audio-file.audio-file',
  'api::image.image',
  'api::article.article',
  'api::testimonial.testimonial',
  'api::gallery.gallery',
  'api::reply.reply',
  'api::about.about',
  'api::contact-info.contact-info',
  'api::hero-section.hero-section',
  'api::setting.setting',
];

async function runValidation() {
  const Strapi = require('@strapi/strapi');
  let strapi;

  try {
    console.log('🔄 Loading Strapi...\n');
    strapi = await Strapi({
      distDir: path.resolve(__dirname, '..', 'dist'),
      autoReload: false,
      serveAdminPanel: false,
    }).load();

    console.log('✅ Strapi loaded successfully\n');
    console.log('=' .repeat(80));
    console.log('LEGACY CONTENT TYPE VALIDATION REPORT');
    console.log('=' .repeat(80));
    console.log();

    const report = {
      timestamp: new Date().toISOString(),
      safeToRemove: [],
      hasData: [],
      notFound: [],
      errors: [],
    };

    for (const contentType of LEGACY_TYPES) {
      const typeName = contentType.split('.')[1];
      console.log(`\n📋 Checking: ${contentType}`);
      console.log('-'.repeat(80));

      try {
        // Check if content type exists
        const contentTypeDefinition = strapi.contentTypes[contentType];

        if (!contentTypeDefinition) {
          console.log('  ℹ️  Status: Not found (already removed or never existed)');
          report.notFound.push(contentType);
          continue;
        }

        // Count entries
        const entries = await strapi.db.query(contentType).findMany({
          limit: 5,
        });

        const totalCount = await strapi.db.query(contentType).count();

        if (totalCount === 0) {
          console.log('  ✅ Status: Empty (safe to remove)');
          console.log('  📊 Count: 0 entries');
          report.safeToRemove.push({
            type: contentType,
            count: 0,
          });
        } else {
          console.log('  ⚠️  Status: Contains data (needs migration)');
          console.log(`  📊 Count: ${totalCount} entries`);
          console.log('  📝 Sample entries:');

          entries.slice(0, 3).forEach((entry, idx) => {
            const preview = {
              id: entry.id,
              ...(entry.title && { title: entry.title }),
              ...(entry.name && { name: entry.name }),
              ...(entry.slug && { slug: entry.slug }),
              createdAt: entry.createdAt,
            };
            console.log(`     ${idx + 1}. ${JSON.stringify(preview, null, 2).split('\n').join('\n        ')}`);
          });

          report.hasData.push({
            type: contentType,
            count: totalCount,
            sample: entries.slice(0, 3),
          });
        }

        // Check for relations
        const relations = Object.entries(contentTypeDefinition.attributes)
          .filter(([, attr]) => attr.type === 'relation')
          .map(([key]) => key);

        if (relations.length > 0) {
          console.log(`  🔗 Relations found: ${relations.join(', ')}`);
        }

      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        report.errors.push({
          type: contentType,
          error: err.message,
        });
      }
    }

    // Print summary
    console.log('\n\n');
    console.log('=' .repeat(80));
    console.log('SUMMARY');
    console.log('=' .repeat(80));
    console.log();
    console.log(`✅ Safe to remove (empty):         ${report.safeToRemove.length}`);
    console.log(`⚠️  Needs migration (has data):    ${report.hasData.length}`);
    console.log(`ℹ️  Not found:                     ${report.notFound.length}`);
    console.log(`❌ Errors:                         ${report.errors.length}`);
    console.log();

    // Detailed summary
    if (report.safeToRemove.length > 0) {
      console.log('✅ Types safe to remove:');
      report.safeToRemove.forEach(({ type }) => {
        console.log(`   - ${type}`);
      });
      console.log();
    }

    if (report.hasData.length > 0) {
      console.log('⚠️  Types requiring migration:');
      report.hasData.forEach(({ type, count }) => {
        console.log(`   - ${type} (${count} entries)`);
      });
      console.log();
      console.log('   🚨 DO NOT REMOVE these types before migrating data!');
      console.log('   📖 See docs/LEGACY_CONTENT_TYPE_REMOVAL.md for migration guide');
      console.log();
    }

    if (report.errors.length > 0) {
      console.log('❌ Errors encountered:');
      report.errors.forEach(({ type, error }) => {
        console.log(`   - ${type}: ${error}`);
      });
      console.log();
    }

    // Save report to file
    const reportsDir = path.resolve(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(
      reportsDir,
      `legacy-validation-${new Date().toISOString().split('T')[0]}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}\n`);

    // Exit status
    const exitCode = report.hasData.length > 0 || report.errors.length > 0 ? 1 : 0;

    if (exitCode === 0) {
      console.log('🎉 All legacy types are safe to remove!\n');
    } else {
      console.log('⚠️  Action required before removal. See report above.\n');
    }

    await strapi.destroy();
    process.exit(exitCode);

  } catch (error) {
    console.error('💥 Fatal error:', error);
    if (strapi) await strapi.destroy();
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  runValidation().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { runValidation };
