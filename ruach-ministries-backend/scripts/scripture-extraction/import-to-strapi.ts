#!/usr/bin/env tsx
/**
 * YahScriptures Strapi Import Script
 * Imports extracted scripture JSON data into Strapi content types
 */

import { readdir, readFile } from 'fs/promises';
import * as path from 'path';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

if (!STRAPI_API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN environment variable is required');
  console.error('   Create an API token in Strapi Admin → Settings → API Tokens');
  process.exit(1);
}

interface Work {
  workId: string;
  canonicalName: string;
  translatedTitle: string;
  shortCode: string;
  testament: string;
  canonicalOrder: number;
  genre: string;
  totalChapters: number;
  totalVerses: number;
  verses?: string[];
}

interface Verse {
  verseId: string;
  work: string;
  chapter: number;
  verse: number;
  text: string;
  paleoHebrewDivineNames: boolean;
  hasFootnotes: boolean;
  footnotes: any;
}

class StrapiImporter {
  private baseUrl: string;
  private headers: Record<string, string>;
  private workIdMap: Map<string, number> = new Map();

  constructor(url: string, token: string) {
    this.baseUrl = url;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async importWorks(worksPath: string): Promise<void> {
    console.log('📚 Importing scripture works...');

    const worksData = await readFile(worksPath, 'utf-8');
    const works: Work[] = JSON.parse(worksData);

    console.log(`   Found ${works.length} works to import`);

    for (const work of works) {
      try {
        // Check if work already exists
        const existing = await this.findWork(work.workId);

        if (existing) {
          console.log(`   ⏭️  ${work.canonicalName} already exists (ID: ${existing.id})`);
          this.workIdMap.set(work.workId, existing.id);
          continue;
        }

        // Create new work
        const created = await this.createWork(work);
        this.workIdMap.set(work.workId, created.id);

        console.log(`   ✅ Imported: ${work.canonicalName} (ID: ${created.id})`);
      } catch (error) {
        console.error(`   ❌ Failed to import ${work.canonicalName}:`, error);
      }
    }

    console.log(`\n✅ Works import complete! ${this.workIdMap.size} works in database.\n`);
  }

  async importVerses(versesDir: string): Promise<void> {
    console.log('📖 Importing scripture verses...');

    const files = await readdir(versesDir);
    const verseFiles = files.filter(f => f.startsWith('verses_chunk_') && f.endsWith('.json'));

    console.log(`   Found ${verseFiles.length} verse chunk files`);

    let totalImported = 0;
    let totalSkipped = 0;

    for (const file of verseFiles.sort()) {
      const filePath = path.join(versesDir, file);
      const versesData = await readFile(filePath, 'utf-8');
      const verses: Verse[] = JSON.parse(versesData);

      console.log(`\n   Processing ${file} (${verses.length} verses)...`);

      // Import in batches of 100
      const batchSize = 100;
      for (let i = 0; i < verses.length; i += batchSize) {
        const batch = verses.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(verse => this.importVerse(verse))
        );

        const imported = results.filter(r => r.status === 'fulfilled').length;
        const skipped = results.filter(r => r.status === 'rejected').length;

        totalImported += imported;
        totalSkipped += skipped;

        process.stdout.write(`\r   Progress: ${totalImported + totalSkipped} / ${verses.length} verses`);
      }

      console.log(`\n   ✅ Chunk complete: ${totalImported} imported, ${totalSkipped} skipped`);
    }

    console.log(`\n✅ Verses import complete!`);
    console.log(`   Total imported: ${totalImported}`);
    console.log(`   Total skipped: ${totalSkipped}\n`);
  }

  private async findWork(workId: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/scripture-works?filters[workId][$eq]=${workId}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.[0] || null;
    } catch (error) {
      console.error(`Error finding work ${workId}:`, error);
      return null;
    }
  }

  private async createWork(work: Work): Promise<any> {
    const payload = {
      data: {
        workId: work.workId,
        canonicalName: work.canonicalName,
        translatedTitle: work.translatedTitle,
        shortCode: work.shortCode,
        testament: work.testament,
        canonicalOrder: work.canonicalOrder,
        totalChapters: work.totalChapters,
        totalVerses: work.totalVerses,
        genre: work.genre,
      }
    };

    const response = await fetch(`${this.baseUrl}/api/scripture-works`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result.data;
  }

  private async importVerse(verse: Verse): Promise<void> {
    // Check if verse already exists
    const existing = await this.findVerse(verse.verseId);
    if (existing) {
      return; // Skip duplicates
    }

    // Get Strapi ID for the work
    const workStrapiId = this.workIdMap.get(verse.work);
    if (!workStrapiId) {
      throw new Error(`Work not found in map: ${verse.work}`);
    }

    const payload = {
      data: {
        verseId: verse.verseId,
        work: workStrapiId,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        paleoHebrewDivineNames: verse.paleoHebrewDivineNames,
        hasFootnotes: verse.hasFootnotes,
        footnotes: verse.footnotes,
      }
    };

    const response = await fetch(`${this.baseUrl}/api/scripture-verses`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  }

  private async findVerse(verseId: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/scripture-verses?filters[verseId][$eq]=${verseId}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data?.[0] || null;
    } catch {
      return null;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: tsx import-to-strapi.ts <extracted-data-directory>');
    console.error('');
    console.error('Example:');
    console.error('  tsx import-to-strapi.ts ./extracted_scripture');
    process.exit(1);
  }

  const dataDir = path.resolve(args[0]);
  const worksFile = path.join(dataDir, 'works.json');

  console.log('🚀 Starting YahScriptures import to Strapi');
  console.log(`   Data directory: ${dataDir}`);
  console.log(`   Strapi URL: ${STRAPI_URL}\n`);

  try {
    const importer = new StrapiImporter(STRAPI_URL, STRAPI_API_TOKEN);

    // Step 1: Import works
    await importer.importWorks(worksFile);

    // Step 2: Import verses
    await importer.importVerses(dataDir);

    console.log('🎉 Import complete!');
    console.log('\nNext steps:');
    console.log('1. Verify data in Strapi Admin → Content Manager');
    console.log('2. Set up permissions for public access to scripture content');
    console.log('3. Test the API endpoints:');
    console.log(`   GET ${STRAPI_URL}/api/scripture-works`);
    console.log(`   GET ${STRAPI_URL}/api/scripture-verses?populate=work`);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();
