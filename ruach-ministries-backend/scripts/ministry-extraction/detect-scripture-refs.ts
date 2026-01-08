#!/usr/bin/env tsx
/**
 * Scripture Reference Detector
 *
 * Detects Bible references in ministry text using regex patterns.
 * Looks up verse IDs in Strapi for relation creation.
 *
 * Usage:
 *   npx tsx scripts/ministry-extraction/detect-scripture-refs.ts \
 *     <input-jsonl> <output-jsonl>
 *
 * Environment Variables:
 *   STRAPI_URL - Strapi base URL (default: http://localhost:1337)
 *   STRAPI_API_TOKEN - Strapi API token (required for verse lookup)
 *
 * @version 1.0.0
 */

import { readFile, writeFile } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { STRAPI_URL, STRAPI_API_TOKEN } from '../strapi-env';

interface MinistryParagraph {
  book: string;
  chapter: number;
  paragraph: number;
  text: string;
  pdfPage: number;
  heading?: string;
  confidence: number;
}

interface ScriptureReference {
  raw: string;
  normalized: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  confidence: number;
  verseIds: number[];
}

interface EnrichedParagraph extends MinistryParagraph {
  detectedReferences?: ScriptureReference[];
}

// Bible book name mappings (including common abbreviations)
const BOOK_NAMES: Record<string, string> = {
  // Old Testament
  'genesis': 'Genesis', 'gen': 'Genesis', 'ge': 'Genesis', 'gn': 'Genesis',
  'exodus': 'Exodus', 'exod': 'Exodus', 'exo': 'Exodus', 'ex': 'Exodus',
  'leviticus': 'Leviticus', 'lev': 'Leviticus', 'le': 'Leviticus', 'lv': 'Leviticus',
  'numbers': 'Numbers', 'num': 'Numbers', 'nu': 'Numbers', 'nm': 'Numbers', 'nb': 'Numbers',
  'deuteronomy': 'Deuteronomy', 'deut': 'Deuteronomy', 'de': 'Deuteronomy', 'dt': 'Deuteronomy',
  'joshua': 'Joshua', 'josh': 'Joshua', 'jos': 'Joshua', 'jsh': 'Joshua',
  'judges': 'Judges', 'judg': 'Judges', 'jdg': 'Judges', 'jg': 'Judges', 'jdgs': 'Judges',
  'ruth': 'Ruth', 'rth': 'Ruth', 'ru': 'Ruth',
  '1 samuel': '1 Samuel', '1samuel': '1 Samuel', '1sam': '1 Samuel', '1sa': '1 Samuel',
  '2 samuel': '2 Samuel', '2samuel': '2 Samuel', '2sam': '2 Samuel', '2sa': '2 Samuel',
  '1 kings': '1 Kings', '1kings': '1 Kings', '1kgs': '1 Kings', '1ki': '1 Kings',
  '2 kings': '2 Kings', '2kings': '2 Kings', '2kgs': '2 Kings', '2ki': '2 Kings',
  '1 chronicles': '1 Chronicles', '1chronicles': '1 Chronicles', '1chron': '1 Chronicles', '1chr': '1 Chronicles', '1ch': '1 Chronicles',
  '2 chronicles': '2 Chronicles', '2chronicles': '2 Chronicles', '2chron': '2 Chronicles', '2chr': '2 Chronicles', '2ch': '2 Chronicles',
  'ezra': 'Ezra', 'ezr': 'Ezra', 'ez': 'Ezra',
  'nehemiah': 'Nehemiah', 'neh': 'Nehemiah', 'ne': 'Nehemiah',
  'esther': 'Esther', 'esth': 'Esther', 'es': 'Esther',
  'job': 'Job', 'jb': 'Job',
  'psalms': 'Psalms', 'psalm': 'Psalms', 'ps': 'Psalms', 'psa': 'Psalms', 'psm': 'Psalms', 'pss': 'Psalms',
  'proverbs': 'Proverbs', 'prov': 'Proverbs', 'pro': 'Proverbs', 'prv': 'Proverbs', 'pr': 'Proverbs',
  'ecclesiastes': 'Ecclesiastes', 'eccles': 'Ecclesiastes', 'eccle': 'Ecclesiastes', 'ecc': 'Ecclesiastes', 'ec': 'Ecclesiastes',
  'song of solomon': 'Song of Solomon', 'song': 'Song of Solomon', 'sos': 'Song of Solomon', 'so': 'Song of Solomon', 'canticles': 'Song of Solomon', 'canticle of canticles': 'Song of Solomon',
  'isaiah': 'Isaiah', 'isa': 'Isaiah', 'is': 'Isaiah',
  'jeremiah': 'Jeremiah', 'jer': 'Jeremiah', 'je': 'Jeremiah', 'jr': 'Jeremiah',
  'lamentations': 'Lamentations', 'lam': 'Lamentations', 'la': 'Lamentations',
  'ezekiel': 'Ezekiel', 'ezek': 'Ezekiel', 'eze': 'Ezekiel', 'ezk': 'Ezekiel',
  'daniel': 'Daniel', 'dan': 'Daniel', 'da': 'Daniel', 'dn': 'Daniel',
  'hosea': 'Hosea', 'hos': 'Hosea', 'ho': 'Hosea',
  'joel': 'Joel', 'joe': 'Joel', 'jl': 'Joel',
  'amos': 'Amos', 'am': 'Amos',
  'obadiah': 'Obadiah', 'obad': 'Obadiah', 'ob': 'Obadiah',
  'jonah': 'Jonah', 'jnh': 'Jonah', 'jon': 'Jonah',
  'micah': 'Micah', 'mic': 'Micah', 'mc': 'Micah',
  'nahum': 'Nahum', 'nah': 'Nahum', 'na': 'Nahum',
  'habakkuk': 'Habakkuk', 'hab': 'Habakkuk', 'hb': 'Habakkuk',
  'zephaniah': 'Zephaniah', 'zeph': 'Zephaniah', 'zep': 'Zephaniah', 'zp': 'Zephaniah',
  'haggai': 'Haggai', 'hag': 'Haggai', 'hg': 'Haggai',
  'zechariah': 'Zechariah', 'zech': 'Zechariah', 'zec': 'Zechariah', 'zc': 'Zechariah',
  'malachi': 'Malachi', 'mal': 'Malachi', 'ml': 'Malachi',

  // New Testament
  'matthew': 'Matthew', 'matt': 'Matthew', 'mat': 'Matthew', 'mt': 'Matthew',
  'mark': 'Mark', 'mar': 'Mark', 'mrk': 'Mark', 'mk': 'Mark', 'mr': 'Mark',
  'luke': 'Luke', 'luk': 'Luke', 'lk': 'Luke',
  'john': 'John', 'joh': 'John', 'jhn': 'John', 'jn': 'John',
  'acts': 'Acts', 'act': 'Acts', 'ac': 'Acts',
  'romans': 'Romans', 'rom': 'Romans', 'ro': 'Romans', 'rm': 'Romans',
  '1 corinthians': '1 Corinthians', '1corinthians': '1 Corinthians', '1cor': '1 Corinthians', '1co': '1 Corinthians', '1 cor': '1 Corinthians',
  '2 corinthians': '2 Corinthians', '2corinthians': '2 Corinthians', '2cor': '2 Corinthians', '2co': '2 Corinthians', '2 cor': '2 Corinthians',
  'galatians': 'Galatians', 'gal': 'Galatians', 'ga': 'Galatians',
  'ephesians': 'Ephesians', 'ephes': 'Ephesians', 'eph': 'Ephesians', 'ep': 'Ephesians',
  'philippians': 'Philippians', 'phil': 'Philippians', 'php': 'Philippians', 'pp': 'Philippians',
  'colossians': 'Colossians', 'col': 'Colossians', 'co': 'Colossians',
  '1 thessalonians': '1 Thessalonians', '1thessalonians': '1 Thessalonians', '1thess': '1 Thessalonians', '1th': '1 Thessalonians', '1 thess': '1 Thessalonians',
  '2 thessalonians': '2 Thessalonians', '2thessalonians': '2 Thessalonians', '2thess': '2 Thessalonians', '2th': '2 Thessalonians', '2 thess': '2 Thessalonians',
  '1 timothy': '1 Timothy', '1timothy': '1 Timothy', '1tim': '1 Timothy', '1ti': '1 Timothy', '1 tim': '1 Timothy',
  '2 timothy': '2 Timothy', '2timothy': '2 Timothy', '2tim': '2 Timothy', '2ti': '2 Timothy', '2 tim': '2 Timothy',
  'titus': 'Titus', 'tit': 'Titus', 'ti': 'Titus',
  'philemon': 'Philemon', 'philem': 'Philemon', 'phm': 'Philemon', 'pm': 'Philemon',
  'hebrews': 'Hebrews', 'heb': 'Hebrews', 'he': 'Hebrews',
  'james': 'James', 'jas': 'James', 'jm': 'James',
  '1 peter': '1 Peter', '1peter': '1 Peter', '1pet': '1 Peter', '1pe': '1 Peter', '1pt': '1 Peter',
  '2 peter': '2 Peter', '2peter': '2 Peter', '2pet': '2 Peter', '2pe': '2 Peter', '2pt': '2 Peter',
  '1 john': '1 John', '1john': '1 John', '1jn': '1 John', '1jo': '1 John',
  '2 john': '2 John', '2john': '2 John', '2jn': '2 John', '2jo': '2 John',
  '3 john': '3 John', '3john': '3 John', '3jn': '3 John', '3jo': '3 John',
  'jude': 'Jude', 'jud': 'Jude', 'jd': 'Jude',
  'revelation': 'Revelation', 'rev': 'Revelation', 're': 'Revelation', 'the revelation': 'Revelation',
};

// Scripture reference patterns
const SCRIPTURE_PATTERNS = [
  // "Matthew 5:3-10" or "Matt. 5:3-10"
  /\b([123]?\s*[A-Z][a-z]+\.?)\s+(\d+):(\d+)(?:-(\d+))?\b/g,
  // "Gen. 1:1" or "1 Cor. 13:1"
  /\b([123]?\s*[A-Z][a-z]+)\.\s+(\d+):(\d+)(?:-(\d+))?\b/g,
];

/**
 * Normalize book name to canonical form
 */
function normalizeBookName(bookName: string): string | null {
  const normalized = bookName.toLowerCase().replace(/\./g, '').trim();
  return BOOK_NAMES[normalized] || null;
}

/**
 * Detect scripture references in text
 */
function detectReferences(text: string): ScriptureReference[] {
  const references: ScriptureReference[] = [];
  const seen = new Set<string>();

  for (const pattern of SCRIPTURE_PATTERNS) {
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0; // Reset regex state

    while ((match = pattern.exec(text)) !== null) {
      const [raw, bookRaw, chapterStr, verseStartStr, verseEndStr] = match;

      // Normalize book name
      const book = normalizeBookName(bookRaw);
      if (!book) continue;

      const chapter = parseInt(chapterStr, 10);
      const verseStart = parseInt(verseStartStr, 10);
      const verseEnd = verseEndStr ? parseInt(verseEndStr, 10) : verseStart;

      // Create unique key to avoid duplicates
      const key = `${book}-${chapter}-${verseStart}-${verseEnd}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Create normalized reference ID
      const normalized = `${book.toLowerCase().replace(/\s+/g, '-')}-${chapter}-${verseStart}${verseEnd > verseStart ? `-${verseEnd}` : ''}`;

      references.push({
        raw,
        normalized,
        book,
        chapter,
        verseStart,
        verseEnd,
        confidence: 0.9, // High confidence for regex matches
        verseIds: [], // Will be populated by verse lookup
      });
    }
  }

  return references;
}

/**
 * Look up verse IDs in Strapi
 */
async function lookupVerseIds(references: ScriptureReference[]): Promise<void> {
  if (!STRAPI_API_TOKEN) {
    console.warn('⚠️  STRAPI_API_TOKEN not set - skipping verse ID lookup');
    return;
  }

  for (const ref of references) {
    try {
      // Query for verses matching this reference
      const filters = [
        `filters[book][$eq]=${encodeURIComponent(ref.book)}`,
        `filters[chapter][$eq]=${ref.chapter}`,
        `filters[verse][$gte]=${ref.verseStart}`,
        `filters[verse][$lte]=${ref.verseEnd}`,
      ].join('&');

      const url = `${STRAPI_URL}/api/scripture-verses?${filters}&fields[0]=id`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      });

      if (!response.ok) {
        console.warn(`⚠️  Failed to lookup verses for ${ref.raw}: ${response.status}`);
        continue;
      }

      const data: { data?: Array<{ id: number }> } = await response.json();
      ref.verseIds = (data.data || []).map((v) => v.id);

      if (ref.verseIds.length === 0) {
        console.warn(`⚠️  No verses found for ${ref.raw}`);
      }
    } catch (error) {
      console.error(`❌ Error looking up verses for ${ref.raw}:`, error);
    }
  }
}

/**
 * Process JSONL file and detect scripture references
 */
async function processFile(inputPath: string, outputPath: string, lookupVerses: boolean = false): Promise<void> {
  console.log('📖 Scripture Reference Detector');
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Verse lookup: ${lookupVerses ? 'enabled' : 'disabled'}`);
  console.log('');

  let processed = 0;
  let totalReferences = 0;

  const readStream = createReadStream(inputPath, 'utf-8');
  const writeStream = createWriteStream(outputPath, 'utf-8');
  const rl = createInterface({ input: readStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;

    const paragraph: MinistryParagraph = JSON.parse(line);

    // Detect references
    const references = detectReferences(paragraph.text);

    // Look up verse IDs if enabled
    if (lookupVerses && references.length > 0) {
      await lookupVerseIds(references);
    }

    // Create enriched paragraph
    const enriched: EnrichedParagraph = {
      ...paragraph,
      detectedReferences: references.length > 0 ? references : undefined,
    };

    writeStream.write(JSON.stringify(enriched) + '\n');

    processed++;
    totalReferences += references.length;

    if (processed % 100 === 0) {
      process.stdout.write(`   Processed ${processed} paragraphs, found ${totalReferences} references...\r`);
    }
  }

  writeStream.end();

  console.log(`\n✅ Completed!`);
  console.log(`   Paragraphs processed: ${processed}`);
  console.log(`   Scripture references found: ${totalReferences}`);
  console.log(`   Average references per paragraph: ${(totalReferences / processed).toFixed(2)}`);
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/ministry-extraction/detect-scripture-refs.ts <input-jsonl> <output-jsonl> [--lookup-verses]');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx scripts/ministry-extraction/detect-scripture-refs.ts \\');
    console.error('    ministry-pipeline/exports/egw/ministry-of-healing/v1/paragraphs.jsonl \\');
    console.error('    ministry-pipeline/exports/egw/ministry-of-healing/v1/refs.jsonl \\');
    console.error('    --lookup-verses');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];
  const lookupVerses = args.includes('--lookup-verses');

  try {
    await processFile(inputPath, outputPath, lookupVerses);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
