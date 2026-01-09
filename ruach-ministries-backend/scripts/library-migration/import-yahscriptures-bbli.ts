#!/usr/bin/env tsx
/**
 * Import YahScriptures BBLI to Canonical Library Schema
 *
 * Imports YahScriptures from .bbli (SQLite) format directly to:
 * - library_documents (one per testament)
 * - library_sections (verses)
 * - library_chunks (6-12 verses per chunk with 2-4 verse overlap)
 *
 * Usage:
 *   export STRAPI_API_TOKEN=your_token_here
 *   npx tsx scripts/library-migration/import-yahscriptures-bbli.ts /path/to/YSpc1.04.bbli
 */

import Database from 'better-sqlite3';
import { config } from 'dotenv';
import { join } from 'node:path';

config({ path: join(__dirname, '../../.env') });

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
if (!STRAPI_API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN environment variable required');
  process.exit(1);
}

// Database connection
async function getDb() {
  const { default: knex } = await import('knex');
  return knex({
    client: 'postgres',
    connection: {
      host: process.env.LOCAL_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_DATABASE_PORT || '5432'),
      database: process.env.LOCAL_DATABASE_NAME || 'strapi_db',
      user: process.env.LOCAL_DATABASE_USERNAME || 'postgres',
      password: process.env.LOCAL_DATABASE_PASSWORD || 'postgres',
    }
  });
}

// Book mapping with all 76 books
const BOOK_MAP: Record<number, { osis: string; name: string; testament: 'old' | 'new' | 'apocrypha'; genre: string }> = {
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
  22: { osis: 'Song', name: 'Song of Songs', testament: 'old', genre: 'wisdom' },
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

  // Apocrypha (67-78)
  67: { osis: 'Tob', name: 'Tobit', testament: 'apocrypha', genre: 'wisdom' },
  68: { osis: 'Jdt', name: 'Judith', testament: 'apocrypha', genre: 'history' },
  69: { osis: 'AddEsth', name: 'Additions to Esther', testament: 'apocrypha', genre: 'history' },
  70: { osis: 'Wis', name: 'Wisdom of Solomon', testament: 'apocrypha', genre: 'wisdom' },
  71: { osis: 'Sir', name: 'Sirach (Ecclesiasticus)', testament: 'apocrypha', genre: 'wisdom' },
  72: { osis: 'Bar', name: 'Baruch', testament: 'apocrypha', genre: 'prophecy' },
  73: { osis: 'EpJer', name: 'Epistle of Jeremiah', testament: 'apocrypha', genre: 'epistle' },
  74: { osis: 'PrAzar', name: 'Prayer of Azariah', testament: 'apocrypha', genre: 'wisdom' },
  75: { osis: 'Sus', name: 'Susanna', testament: 'apocrypha', genre: 'history' },
  78: { osis: 'Bel', name: 'Bel and the Dragon', testament: 'apocrypha', genre: 'history' },
};

interface BBLIVerse {
  Book: number;
  Chapter: number;
  Verse: number;
  Scripture: string;
}

/**
 * Clean verse text - convert HTML font tags to Unicode markers
 */
function cleanVerseText(text: string): string {
  return text
    .replace(/<font[^>]*>/gi, '「')  // Opening marker for divine names
    .replace(/<\/font>/gi, '」')     // Closing marker
    .replace(/<[^>]*>/g, '')         // Remove any other HTML
    .trim();
}

/**
 * Import YahScriptures from BBLI to canonical library
 */
async function importBBLI(bbliPath: string) {
  const bbliDb = new Database(bbliPath, { readonly: true });
  const db = await getDb();

  try {
    console.log('🚀 Starting YahScriptures BBLI import to Canonical Library\n');

    // 1. Get BBLI metadata
    const details = bbliDb.prepare('SELECT * FROM Details').get() as any;
    console.log(`📖 Source: ${details.Title} (${details.Abbreviation})`);
    console.log(`   Version: ${details.Version}\n`);

    // 2. Get public domain license
    const licensePolicy = await db('library_license_policies')
      .where('policy_id', 'lic:public-domain')
      .first();

    if (!licensePolicy) {
      throw new Error('Public domain license policy not found');
    }
    console.log(`✅ License: ${licensePolicy.policy_name}\n`);

    // 3. Create library document for YahScriptures
    const documentId = 'doc:scripture:yahscriptures';
    const existingDoc = await db('library_documents')
      .where('document_id', documentId)
      .first();

    let dbDocumentId: number;
    if (existingDoc) {
      console.log(`⏭️  Document already exists (id: ${existingDoc.id})`);
      dbDocumentId = existingDoc.id;
    } else {
      const [newDoc] = await db('library_documents')
        .insert({
          document_id: documentId,
          title: 'YahScriptures',
          slug: 'yahscriptures',
          document_type: 'scripture',
          author: null,
          publication_date: '2020-01-01',
          source_system: 'bbli-import',
          source_url: 'https://yahscriptures.com',
          language: 'en',
          ingestion_status: 'importing',
          license_policy_id: licensePolicy.id,
          document_metadata: JSON.stringify({
            versionCode: 'YS',
            versionName: details.Title,
            bbliVersion: details.Version,
            hasApocrypha: true,
            totalBooks: 76,
          }),
          total_sections: 0,
          total_chunks: 0,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id');

      dbDocumentId = newDoc.id;
      console.log(`✅ Created document (id: ${dbDocumentId})\n`);
    }

    // 4. Load all verses from BBLI
    const verses = bbliDb.prepare('SELECT * FROM Bible ORDER BY Book, Chapter, Verse').all() as BBLIVerse[];
    console.log(`📝 Found ${verses.length.toLocaleString()} verses\n`);

    // 5. Import verses as sections
    console.log('💾 Importing verses as sections...\n');

    let sectionsCreated = 0;
    const batchSize = 500;

    for (let i = 0; i < verses.length; i += batchSize) {
      const batch = verses.slice(i, i + batchSize);

      const sections = batch
        .filter(v => BOOK_MAP[v.Book]) // Skip unknown books
        .map(v => {
          const bookInfo = BOOK_MAP[v.Book];
          const sectionKey = `scripture:ys:${bookInfo.osis.toLowerCase()}:${v.Chapter}:${v.Verse}`;
          const locator = `${bookInfo.osis}.${v.Chapter}.${v.Verse}`;
          const sequenceNumber = (v.Book * 1000000) + (v.Chapter * 1000) + v.Verse;

          return {
            section_key: sectionKey,
            document_id: dbDocumentId,
            section_type: 'verse',
            sequence_number: sequenceNumber,
            locator: locator,
            heading: null,
            text: cleanVerseText(v.Scripture),
            section_metadata: JSON.stringify({
              bookNumber: v.Book,
              bookName: bookInfo.name,
              testament: bookInfo.testament,
              osisRef: locator,
              hasDivineNames: v.Scripture.includes('<font'),
            }),
            created_at: new Date(),
            updated_at: new Date(),
          };
        });

      await db('library_sections').insert(sections).onConflict('section_key').ignore();
      sectionsCreated += sections.length;

      if ((i + batchSize) % 5000 === 0 || i + batchSize >= verses.length) {
        const progress = Math.min(i + batchSize, verses.length);
        const percent = ((progress / verses.length) * 100).toFixed(1);
        console.log(`   Progress: ${progress.toLocaleString()} / ${verses.length.toLocaleString()} (${percent}%)`);
      }
    }

    console.log(`\n✅ Created ${sectionsCreated.toLocaleString()} sections\n`);

    // 6. Create chunks (merge verses for RAG)
    console.log('🔗 Creating RAG-optimized chunks...\n');

    const VERSES_PER_CHUNK = 8; // 6-12 verses
    const OVERLAP_VERSES = 3;    // 2-4 verses overlap

    let chunksCreated = 0;
    let chunkSequence = 0;

    // Group verses by book
    const versesByBook: Record<number, BBLIVerse[]> = {};
    for (const verse of verses) {
      if (!BOOK_MAP[verse.Book]) continue;
      if (!versesByBook[verse.Book]) versesByBook[verse.Book] = [];
      versesByBook[verse.Book].push(verse);
    }

    for (const [bookNum, bookVerses] of Object.entries(versesByBook)) {
      const bookInfo = BOOK_MAP[parseInt(bookNum)];

      for (let i = 0; i < bookVerses.length; i += (VERSES_PER_CHUNK - OVERLAP_VERSES)) {
        const chunkVerses = bookVerses.slice(i, i + VERSES_PER_CHUNK);
        if (chunkVerses.length === 0) break;

        const chunkKey = `chunk:scripture:ys:${bookInfo.osis.toLowerCase()}:${chunkSequence}`;
        const chunkText = chunkVerses.map(v => cleanVerseText(v.Scripture)).join(' ');
        const startVerse = chunkVerses[0];
        const endVerse = chunkVerses[chunkVerses.length - 1];
        const startLocator = `${bookInfo.osis}.${startVerse.Chapter}.${startVerse.Verse}`;
        const endLocator = `${bookInfo.osis}.${endVerse.Chapter}.${endVerse.Verse}`;

        await db('library_chunks').insert({
          chunk_key: chunkKey,
          document_id: dbDocumentId,
          chunk_text: chunkText,
          token_count: Math.floor(chunkText.length / 4), // rough estimate
          start_locator: startLocator,
          end_locator: endLocator,
          sequence_number: chunkSequence,
          chunk_metadata: JSON.stringify({
            bookNumber: parseInt(bookNum),
            bookName: bookInfo.name,
            verseCount: chunkVerses.length,
            chapterRange: [startVerse.Chapter, endVerse.Chapter],
          }),
          created_at: new Date(),
          updated_at: new Date(),
        }).onConflict('chunk_key').ignore();

        chunkSequence++;
        chunksCreated++;

        if (chunksCreated % 500 === 0) {
          console.log(`   Chunks created: ${chunksCreated.toLocaleString()}`);
        }
      }
    }

    console.log(`\n✅ Created ${chunksCreated.toLocaleString()} chunks\n`);

    // 7. Update document totals
    await db('library_documents')
      .where('id', dbDocumentId)
      .update({
        total_sections: sectionsCreated,
        total_chunks: chunksCreated,
        ingestion_status: 'completed',
        updated_at: new Date(),
      });

    // 8. Final stats
    console.log('📊 Import Complete!\n');
    console.log(`   Document: YahScriptures (id: ${dbDocumentId})`);
    console.log(`   Sections: ${sectionsCreated.toLocaleString()} verses`);
    console.log(`   Chunks:   ${chunksCreated.toLocaleString()} RAG units`);
    console.log(`\n✅ YahScriptures ready for retrieval!\n`);

  } finally {
    bbliDb.close();
    await db.destroy();
  }
}

// Run import
const bbliPath = process.argv[2];
if (!bbliPath) {
  console.error('Usage: npx tsx import-yahscriptures-bbli.ts <path-to-bbli-file>');
  console.error('');
  console.error('Example:');
  console.error('  export STRAPI_API_TOKEN=your-token-here');
  console.error('  npx tsx scripts/library-migration/import-yahscriptures-bbli.ts /Users/marcseals/Downloads/YSpc1.04.bbli');
  process.exit(1);
}

importBBLI(bbliPath).catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
