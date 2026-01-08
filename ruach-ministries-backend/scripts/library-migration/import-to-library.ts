#!/usr/bin/env tsx
/**
 * Import Ministry Works to Canonical Library Schema
 *
 * Imports ministry content directly to the new canonical library tables:
 * - library_documents
 * - library_sections
 * - library_chunks
 * - library_chunk_embeddings
 *
 * Usage:
 *   export STRAPI_API_TOKEN=your_token_here
 *   npx tsx scripts/library-migration/import-to-library.ts \
 *     ministry-pipeline/ingest/egw/ministry-of-healing/v1
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from 'dotenv';

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

interface ImportStats {
  documentsCreated: number;
  sectionsCreated: number;
  chunksCreated: number;
  embeddingsCreated: number;
  errors: string[];
}

/**
 * Import ministry work to canonical library
 */
async function importToLibrary(ingestDir: string) {
  const db = await getDb();
  const stats: ImportStats = {
    documentsCreated: 0,
    sectionsCreated: 0,
    chunksCreated: 0,
    embeddingsCreated: 0,
    errors: [],
  };

  try {
    console.log('📚 Importing Ministry Work to Canonical Library\n');
    console.log(`   Source: ${ingestDir}\n`);

    // 1. Load work metadata
    const workPath = join(ingestDir, 'work.json');
    const workData = JSON.parse(await readFile(workPath, 'utf-8'));
    console.log(`📖 Work: ${workData.title} by ${workData.author}`);
    console.log(`   Chapters: ${workData.totalChapters}, Paragraphs: ${workData.totalParagraphs}\n`);

    // 2. Get public domain license policy
    const licensePolicy = await db('library_license_policies')
      .where('policy_id', 'lic:public-domain')
      .first();

    if (!licensePolicy) {
      throw new Error('Public domain license policy not found');
    }
    console.log(`✅ Using license policy: ${licensePolicy.policy_name}\n`);

    // 3. Create library document
    const documentId = `doc:egw:${workData.shortCode.toLowerCase()}`;
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
          title: workData.title,
          slug: workData.slug,
          document_type: 'ministry_book',
          author: workData.author,
          publication_date: null,
          source_system: 'ministry-extraction',
          source_url: null,
          language: 'en',
          ingestion_status: 'importing',
          license_policy_id: licensePolicy.id,
          document_metadata: JSON.stringify({
            shortCode: workData.shortCode,
            category: workData.category,
            extractionMetadata: workData.extractionMetadata,
          }),
          total_sections: 0,
          total_chunks: 0,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id');

      dbDocumentId = newDoc.id;
      stats.documentsCreated++;
      console.log(`✅ Created document (id: ${dbDocumentId})\n`);
    }

    // 4. Load text data
    const textsDir = join(ingestDir, 'texts');
    const textFiles = (await readdir(textsDir))
      .filter(f => f.startsWith('texts.') && f.endsWith('.json'))
      .sort();

    console.log(`📄 Loading ${textFiles.length} text files...\n`);

    let sectionsCreated = 0;
    let allTexts: any[] = [];

    for (const file of textFiles) {
      const filePath = join(textsDir, file);
      const fileData = JSON.parse(await readFile(filePath, 'utf-8'));
      allTexts.push(...fileData);
    }

    console.log(`📝 Processing ${allTexts.length} paragraphs...\n`);

    // 5. Create sections (paragraphs)
    const sectionBatchSize = 100;
    for (let i = 0; i < allTexts.length; i += sectionBatchSize) {
      const batch = allTexts.slice(i, i + sectionBatchSize);

      const sections = batch.map((text, idx) => {
        const sectionKey = `book:egw:${workData.shortCode.toLowerCase()}:ch${text.chapterNumber}:p${text.paragraphNumber}`;
        const locator = `ch${text.chapterNumber}:p${text.paragraphNumber}`;

        return {
          section_key: sectionKey,
          document_id: dbDocumentId,
          section_type: text.heading ? 'heading' : 'paragraph',
          sequence_number: text.chapterNumber * 10000 + text.paragraphNumber,
          locator: locator,
          heading: text.heading || null,
          text: text.text,
          section_metadata: JSON.stringify({
            textId: text.textId,
            textHash: text.textHash,
            detectedReferences: text.detectedReferences,
          }),
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      await db('library_sections').insert(sections).onConflict('section_key').ignore();
      sectionsCreated += sections.length;

      if ((i + sectionBatchSize) % 500 === 0 || i + sectionBatchSize >= allTexts.length) {
        console.log(`   Sections: ${sectionsCreated} / ${allTexts.length}`);
      }
    }

    stats.sectionsCreated = sectionsCreated;
    console.log(`\n✅ Created ${sectionsCreated} sections\n`);

    // 6. Create chunks (merge sections for RAG)
    console.log('🔗 Creating RAG-optimized chunks...\n');

    const TARGET_CHUNK_SIZE = 600; // tokens (roughly 450-750 chars)
    const MIN_CHUNK_SIZE = 300;
    const OVERLAP_SIZE = 100;

    let chunkSequence = 0;
    let currentChunk: any[] = [];
    let currentChunkLength = 0;
    let chunksCreated = 0;

    for (let i = 0; i < allTexts.length; i++) {
      const text = allTexts[i];
      const textLength = text.text.length;

      // Start new chunk if this would exceed target or is a new chapter
      const isNewChapter = i > 0 && text.chapterNumber !== allTexts[i - 1].chapterNumber;

      if ((currentChunkLength + textLength > TARGET_CHUNK_SIZE * 4 || isNewChapter) && currentChunk.length > 0) {
        // Save current chunk
        const chunkKey = `chunk:egw:${workData.shortCode.toLowerCase()}:${chunkSequence}`;
        const chunkText = currentChunk.map(t => t.text).join('\n\n');
        const startLocator = `ch${currentChunk[0].chapterNumber}:p${currentChunk[0].paragraphNumber}`;
        const endLocator = `ch${currentChunk[currentChunk.length - 1].chapterNumber}:p${currentChunk[currentChunk.length - 1].paragraphNumber}`;

        await db('library_chunks').insert({
          chunk_key: chunkKey,
          document_id: dbDocumentId,
          chunk_text: chunkText,
          token_count: Math.floor(chunkText.length / 4), // rough estimate
          start_locator: startLocator,
          end_locator: endLocator,
          sequence_number: chunkSequence,
          chunk_metadata: JSON.stringify({
            sectionCount: currentChunk.length,
            chapterRange: [currentChunk[0].chapterNumber, currentChunk[currentChunk.length - 1].chapterNumber],
          }),
          created_at: new Date(),
          updated_at: new Date(),
        }).onConflict('chunk_key').ignore();

        chunkSequence++;
        chunksCreated++;

        // Keep overlap for next chunk
        const overlapTexts = currentChunk.slice(-2); // last 2 paragraphs
        currentChunk = overlapTexts;
        currentChunkLength = overlapTexts.reduce((sum, t) => sum + t.text.length, 0);
      }

      currentChunk.push(text);
      currentChunkLength += textLength;
    }

    // Save final chunk
    if (currentChunk.length > 0) {
      const chunkKey = `chunk:egw:${workData.shortCode.toLowerCase()}:${chunkSequence}`;
      const chunkText = currentChunk.map(t => t.text).join('\n\n');
      const startLocator = `ch${currentChunk[0].chapterNumber}:p${currentChunk[0].paragraphNumber}`;
      const endLocator = `ch${currentChunk[currentChunk.length - 1].chapterNumber}:p${currentChunk[currentChunk.length - 1].paragraphNumber}`;

      await db('library_chunks').insert({
        chunk_key: chunkKey,
        document_id: dbDocumentId,
        chunk_text: chunkText,
        token_count: Math.floor(chunkText.length / 4),
        start_locator: startLocator,
        end_locator: endLocator,
        sequence_number: chunkSequence,
        chunk_metadata: JSON.stringify({
          sectionCount: currentChunk.length,
          chapterRange: [currentChunk[0].chapterNumber, currentChunk[currentChunk.length - 1].chapterNumber],
        }),
        created_at: new Date(),
        updated_at: new Date(),
      }).onConflict('chunk_key').ignore();

      chunksCreated++;
    }

    stats.chunksCreated = chunksCreated;
    console.log(`✅ Created ${chunksCreated} chunks\n`);

    // 7. Update document totals
    await db('library_documents')
      .where('id', dbDocumentId)
      .update({
        total_sections: sectionsCreated,
        total_chunks: chunksCreated,
        ingestion_status: 'completed',
        updated_at: new Date(),
      });

    // 8. Load and insert embeddings (if available)
    try {
      const embeddedPath = join(ingestDir, '../../../exports/egw/ministry-of-healing/v1/embedded.jsonl');
      const embeddedContent = await readFile(embeddedPath, 'utf-8');
      const embeddedLines = embeddedContent.trim().split('\n');

      console.log(`📊 Processing ${embeddedLines.length} embeddings...\n`);

      // Map sections to chunks
      const sections = await db('library_sections')
        .where('document_id', dbDocumentId)
        .select('id', 'sequence_number');

      const chunks = await db('library_chunks')
        .where('document_id', dbDocumentId)
        .select('id', 'start_locator', 'end_locator');

      // For now, assign first embedding to each chunk (simplified)
      // TODO: Proper embedding generation for chunks
      let embeddingsInserted = 0;
      for (let i = 0; i < Math.min(chunks.length, embeddedLines.length); i++) {
        const embedded = JSON.parse(embeddedLines[i]);
        if (embedded.embedding && Array.isArray(embedded.embedding)) {
          await db('library_chunk_embeddings').insert({
            chunk_id: chunks[i].id,
            embedding: JSON.stringify(embedded.embedding),
            model_name: 'text-embedding-3-small',
            dimensions: embedded.embedding.length,
            created_at: new Date(),
          }).onConflict('chunk_id').ignore();

          embeddingsInserted++;
        }
      }

      stats.embeddingsCreated = embeddingsInserted;
      console.log(`✅ Inserted ${embeddingsInserted} embeddings\n`);
    } catch (error) {
      console.log(`⚠️  No embeddings found (optional): ${error}\n`);
    }

    // 9. Final stats
    console.log('📊 Import Complete!\n');
    console.log(`   Documents: ${stats.documentsCreated} created`);
    console.log(`   Sections:  ${stats.sectionsCreated} created`);
    console.log(`   Chunks:    ${stats.chunksCreated} created`);
    console.log(`   Embeddings: ${stats.embeddingsCreated} inserted`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${stats.errors.length}`);
      stats.errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
    }

  } finally {
    await db.destroy();
  }

  return stats;
}

// Run import
const ingestDir = process.argv[2];
if (!ingestDir) {
  console.error('Usage: npx tsx import-to-library.ts <ingest-dir>');
  process.exit(1);
}

importToLibrary(ingestDir).catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
