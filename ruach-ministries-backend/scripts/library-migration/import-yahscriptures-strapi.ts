#!/usr/bin/env tsx
/**
 * Import YahScriptures via Strapi Entity Service
 *
 * This script properly imports data through Strapi's entity service,
 * ensuring schema compatibility and proper relations.
 *
 * Usage:
 *   npx tsx scripts/library-migration/import-yahscriptures-strapi.ts /path/to/YSpc1.04.bbli
 */

import Database from 'better-sqlite3';
import Strapi from '@strapi/strapi';

const BOOK_MAP: Record<number, { osis: string; name: string; testament: string; genre: string }> = {
  // Old Testament (1-39)
  1: { osis: 'Gen', name: 'Genesis', testament: 'old', genre: 'law' },
  2: { osis: 'Exod', name: 'Exodus', testament: 'old', genre: 'law' },
  3: { osis: 'Lev', name: 'Leviticus', testament: 'old', genre: 'law' },
  4: { osis: 'Num', name: 'Numbers', testament: 'old', genre: 'law' },
  5: { osis: 'Deut', name: 'Deuteronomy', testament: 'old', genre: 'law' },
  6: { osis: 'Josh', name: 'Joshua', testament: 'old', genre: 'history' },
  7: { osis: 'Judg', name: 'Judges', testament: 'old', genre: 'history' },
  8: { osis: 'Ruth', name: 'Ruth', testament: 'old', genre: 'history' },
  9: { osis: '1Sam', name: '1 Samuel', testament: 'old', genre: 'history' },
  10: { osis: '2Sam', name: '2 Samuel', testament: 'old', genre: 'history' },
  11: { osis: '1Kgs', name: '1 Kings', testament: 'old', genre: 'history' },
  12: { osis: '2Kgs', name: '2 Kings', testament: 'old', genre: 'history' },
  13: { osis: '1Chr', name: '1 Chronicles', testament: 'old', genre: 'history' },
  14: { osis: '2Chr', name: '2 Chronicles', testament: 'old', genre: 'history' },
  15: { osis: 'Ezra', name: 'Ezra', testament: 'old', genre: 'history' },
  16: { osis: 'Neh', name: 'Nehemiah', testament: 'old', genre: 'history' },
  17: { osis: 'Esth', name: 'Esther', testament: 'old', genre: 'history' },
  18: { osis: 'Job', name: 'Job', testament: 'old', genre: 'wisdom' },
  19: { osis: 'Ps', name: 'Psalms', testament: 'old', genre: 'wisdom' },
  20: { osis: 'Prov', name: 'Proverbs', testament: 'old', genre: 'wisdom' },
  21: { osis: 'Eccl', name: 'Ecclesiastes', testament: 'old', genre: 'wisdom' },
  22: { osis: 'Song', name: 'Song of Solomon', testament: 'old', genre: 'wisdom' },
  23: { osis: 'Isa', name: 'Isaiah', testament: 'old', genre: 'prophecy' },
  24: { osis: 'Jer', name: 'Jeremiah', testament: 'old', genre: 'prophecy' },
  25: { osis: 'Lam', name: 'Lamentations', testament: 'old', genre: 'prophecy' },
  26: { osis: 'Ezek', name: 'Ezekiel', testament: 'old', genre: 'prophecy' },
  27: { osis: 'Dan', name: 'Daniel', testament: 'old', genre: 'prophecy' },
  28: { osis: 'Hos', name: 'Hosea', testament: 'old', genre: 'prophecy' },
  29: { osis: 'Joel', name: 'Joel', testament: 'old', genre: 'prophecy' },
  30: { osis: 'Amos', name: 'Amos', testament: 'old', genre: 'prophecy' },
  31: { osis: 'Obad', name: 'Obadiah', testament: 'old', genre: 'prophecy' },
  32: { osis: 'Jonah', name: 'Jonah', testament: 'old', genre: 'prophecy' },
  33: { osis: 'Mic', name: 'Micah', testament: 'old', genre: 'prophecy' },
  34: { osis: 'Nah', name: 'Nahum', testament: 'old', genre: 'prophecy' },
  35: { osis: 'Hab', name: 'Habakkuk', testament: 'old', genre: 'prophecy' },
  36: { osis: 'Zeph', name: 'Zephaniah', testament: 'old', genre: 'prophecy' },
  37: { osis: 'Hag', name: 'Haggai', testament: 'old', genre: 'prophecy' },
  38: { osis: 'Zech', name: 'Zechariah', testament: 'old', genre: 'prophecy' },
  39: { osis: 'Mal', name: 'Malachi', testament: 'old', genre: 'prophecy' },

  // New Testament (40-66)
  40: { osis: 'Matt', name: 'Matthew', testament: 'new', genre: 'gospel' },
  41: { osis: 'Mark', name: 'Mark', testament: 'new', genre: 'gospel' },
  42: { osis: 'Luke', name: 'Luke', testament: 'new', genre: 'gospel' },
  43: { osis: 'John', name: 'John', testament: 'new', genre: 'gospel' },
  44: { osis: 'Acts', name: 'Acts', testament: 'new', genre: 'history' },
  45: { osis: 'Rom', name: 'Romans', testament: 'new', genre: 'epistle' },
  46: { osis: '1Cor', name: '1 Corinthians', testament: 'new', genre: 'epistle' },
  47: { osis: '2Cor', name: '2 Corinthians', testament: 'new', genre: 'epistle' },
  48: { osis: 'Gal', name: 'Galatians', testament: 'new', genre: 'epistle' },
  49: { osis: 'Eph', name: 'Ephesians', testament: 'new', genre: 'epistle' },
  50: { osis: 'Phil', name: 'Philippians', testament: 'new', genre: 'epistle' },
  51: { osis: 'Col', name: 'Colossians', testament: 'new', genre: 'epistle' },
  52: { osis: '1Thess', name: '1 Thessalonians', testament: 'new', genre: 'epistle' },
  53: { osis: '2Thess', name: '2 Thessalonians', testament: 'new', genre: 'epistle' },
  54: { osis: '1Tim', name: '1 Timothy', testament: 'new', genre: 'epistle' },
  55: { osis: '2Tim', name: '2 Timothy', testament: 'new', genre: 'epistle' },
  56: { osis: 'Titus', name: 'Titus', testament: 'new', genre: 'epistle' },
  57: { osis: 'Phlm', name: 'Philemon', testament: 'new', genre: 'epistle' },
  58: { osis: 'Heb', name: 'Hebrews', testament: 'new', genre: 'epistle' },
  59: { osis: 'Jas', name: 'James', testament: 'new', genre: 'epistle' },
  60: { osis: '1Pet', name: '1 Peter', testament: 'new', genre: 'epistle' },
  61: { osis: '2Pet', name: '2 Peter', testament: 'new', genre: 'epistle' },
  62: { osis: '1John', name: '1 John', testament: 'new', genre: 'epistle' },
  63: { osis: '2John', name: '2 John', testament: 'new', genre: 'epistle' },
  64: { osis: '3John', name: '3 John', testament: 'new', genre: 'epistle' },
  65: { osis: 'Jude', name: 'Jude', testament: 'new', genre: 'epistle' },
  66: { osis: 'Rev', name: 'Revelation', testament: 'new', genre: 'apocalyptic' },
};

interface BBLIVerse {
  Book: number;
  Chapter: number;
  Verse: number;
  Scripture: string;
}

function cleanVerseText(text: string): string {
  return text
    .replace(/<font[^>]*>/gi, '「')
    .replace(/<\/font>/gi, '」')
    .replace(/<[^>]*>/g, '')
    .trim();
}

async function importBBLI(bbliPath: string) {
  const bbliDb = new Database(bbliPath, { readonly: true });

  // Bootstrap Strapi
  const strapi = await Strapi({ distDir: './dist' }).load();

  try {
    console.log('🚀 Starting YahScriptures import via Strapi Entity Service\n');

    // 1. Get BBLI metadata
    const details = bbliDb.prepare('SELECT * FROM Details').get() as any;
    console.log(`📖 Source: ${details.Title} (${details.Abbreviation})`);
    console.log(`   Version: ${details.Version}\n`);

    // 2. Get or create public domain license
    let licensePolicy = await strapi.entityService.findMany(
      'api::library-license-policy.library-license-policy',
      {
        filters: { policyKey: 'lic:public-domain' },
        limit: 1,
      }
    );

    if (!licensePolicy || licensePolicy.length === 0) {
      console.log('Creating public domain license policy...');
      licensePolicy = [await strapi.entityService.create(
        'api::library-license-policy.library-license-policy',
        {
          data: {
            policyKey: 'lic:public-domain',
            policyName: 'Public Domain',
            allowsDistribution: true,
            requiresAttribution: false,
            allowsCommercialUse: true,
            allowsModification: true,
            policyMetadata: JSON.stringify({
              description: 'Content in the public domain with no copyright restrictions'
            }),
          },
        }
      )];
    }

    const license = Array.isArray(licensePolicy) ? licensePolicy[0] : licensePolicy;
    console.log(`✅ License: ${license.policyName}\n`);

    // 3. Create library document
    const documentKey = 'doc:scripture:yahscriptures';
    const existingDoc = await strapi.entityService.findMany(
      'api::library-document.library-document',
      {
        filters: { documentKey },
        limit: 1,
      }
    );

    let document;
    if (existingDoc && existingDoc.length > 0) {
      document = Array.isArray(existingDoc) ? existingDoc[0] : existingDoc;
      console.log(`⏭️  Document already exists (id: ${document.id})\n`);
    } else {
      document = await strapi.entityService.create(
        'api::library-document.library-document',
        {
          data: {
            documentKey,
            documentType: 'scripture',
            title: 'YahScriptures',
            slug: 'yahscriptures',
            translationId: 'YS',
            language: 'en',
            yearPublished: 2020,
            ingestionStatus: 'processing',
            sourceMetadata: {
              versionCode: 'YS',
              versionName: details.Title,
              bbliVersion: details.Version,
              hasApocrypha: true,
              totalBooks: 76,
            },
            licensePolicy: license.id,
            publishedAt: new Date(),
          },
        }
      );
      console.log(`✅ Created document (id: ${document.id})\n`);
    }

    // 4. Load verses
    const verses = bbliDb.prepare('SELECT * FROM Bible ORDER BY Book, Chapter, Verse').all() as BBLIVerse[];
    console.log(`📝 Found ${verses.length.toLocaleString()} verses\n`);

    // 5. Import verses as sections
    console.log('💾 Importing verses via entity service...\n');

    let sectionsCreated = 0;
    const batchSize = 100; // Smaller batches for entity service

    for (let i = 0; i < verses.length; i += batchSize) {
      const batch = verses.slice(i, i + batchSize);

      for (const verse of batch) {
        const bookInfo = BOOK_MAP[verse.Book];
        if (!bookInfo) {
          console.warn(`⚠️  Unknown book number: ${verse.Book}, skipping`);
          continue;
        }

        const sectionKey = `scripture:ys:${bookInfo.osis.toLowerCase()}:${verse.Chapter}:${verse.Verse}`;
        const osisRef = `${bookInfo.osis}.${verse.Chapter}.${verse.Verse}`;
        const cleanText = cleanVerseText(verse.Scripture);
        const hasDivineNames = cleanText.includes('「') && cleanText.includes('」');

        // Check if section already exists
        const existing = await strapi.entityService.findMany(
          'api::library-section.library-section',
          {
            filters: { sectionKey },
            limit: 1,
          }
        );

        if (!existing || existing.length === 0) {
          await strapi.entityService.create(
            'api::library-section.library-section',
            {
              data: {
                sectionKey,
                sectionType: 'verse',
                sequenceNumber: verse.Book * 1000000 + verse.Chapter * 1000 + verse.Verse,
                locator: osisRef,
                text: cleanText,
                sectionMetadata: {
                  osisRef,
                  bookName: bookInfo.name,
                  testament: bookInfo.testament,
                  bookNumber: verse.Book,
                  hasDivineNames,
                },
                document: document.id,
                publishedAt: new Date(),
              },
            }
          );
          sectionsCreated++;
        }
      }

      console.log(`   Progress: ${Math.min(i + batchSize, verses.length).toLocaleString()} / ${verses.length.toLocaleString()} verses`);
    }

    // 6. Update document with final counts
    await strapi.entityService.update(
      'api::library-document.library-document',
      document.id,
      {
        data: {
          totalSections: sectionsCreated,
          ingestionStatus: 'completed',
        },
      }
    );

    console.log(`\n✅ Import complete!`);
    console.log(`   Sections created: ${sectionsCreated.toLocaleString()}`);
    console.log(`   Document updated: ${document.documentKey}\n`);

  } finally {
    bbliDb.close();
    await strapi.destroy();
  }
}

const bbliPath = process.argv[2];
if (!bbliPath) {
  console.error('Usage: npx tsx import-yahscriptures-strapi.ts <path-to-bbli-file>');
  process.exit(1);
}

importBBLI(bbliPath).catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
