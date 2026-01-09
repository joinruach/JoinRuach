#!/usr/bin/env tsx
/**
 * Upload source files to R2 for archival
 *
 * Uploads source files (BBLI, PDF, etc.) to Cloudflare R2 storage
 * for backup and future reference.
 *
 * Usage:
 *   npx tsx scripts/library-migration/upload-source-to-r2.ts <source-file> <target-path>
 *
 * Examples:
 *   npx tsx upload-source-to-r2.ts /path/to/YSpc1.04.bbli library/originals/yahscriptures/YSpc1.04.bbli
 *   npx tsx upload-source-to-r2.ts /path/to/book.pdf library/originals/egw/ministry-of-healing/book.pdf
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'fs/promises';
import { basename } from 'path';
import { createHash } from 'crypto';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('❌ Missing R2 configuration. Required env vars:');
  console.error('   - R2_ENDPOINT');
  console.error('   - R2_ACCESS_KEY_ID');
  console.error('   - R2_SECRET_ACCESS_KEY');
  console.error('   - R2_BUCKET_NAME');
  process.exit(1);
}

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Calculate SHA256 hash of file
 */
async function calculateFileHash(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Check if file exists in R2
 */
async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') return false;
    throw error;
  }
}

/**
 * Upload file to R2
 */
async function uploadToR2(sourcePath: string, targetPath: string) {
  console.log('📤 Uploading to R2 Storage\n');

  // Read file
  console.log(`   Source: ${sourcePath}`);
  const content = await readFile(sourcePath);
  const fileSize = content.length;
  const fileName = basename(sourcePath);

  console.log(`   Size: ${formatBytes(fileSize)}`);

  // Calculate hash
  console.log('   Calculating SHA256...');
  const sha256 = await calculateFileHash(sourcePath);
  console.log(`   SHA256: ${sha256}\n`);

  // Check if already exists
  const exists = await fileExistsInR2(targetPath);
  if (exists) {
    console.log(`⚠️  File already exists at: ${targetPath}`);
    console.log('   Skipping upload. Use --force to overwrite.\n');
    return;
  }

  // Determine content type
  let contentType = 'application/octet-stream';
  if (targetPath.endsWith('.pdf')) contentType = 'application/pdf';
  else if (targetPath.endsWith('.bbli')) contentType = 'application/x-sqlite3';
  else if (targetPath.endsWith('.json')) contentType = 'application/json';
  else if (targetPath.endsWith('.jsonl')) contentType = 'application/x-ndjson';

  // Upload
  console.log(`   Uploading to: ${targetPath}`);
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: targetPath,
    Body: content,
    ContentType: contentType,
    Metadata: {
      'original-filename': fileName,
      'sha256': sha256,
      'upload-timestamp': new Date().toISOString(),
    },
  }));

  console.log('   ✓ Upload complete\n');

  // Construct public URL (if applicable)
  if (R2_PUBLIC_URL && targetPath.startsWith('uploads/')) {
    const publicUrl = `${R2_PUBLIC_URL}/${targetPath.replace('uploads/', '')}`;
    console.log(`📍 Public URL: ${publicUrl}\n`);
  } else {
    console.log(`📍 R2 Path: ${targetPath}\n`);
  }

  console.log('✅ File uploaded successfully!');
  console.log(`   Bucket: ${R2_BUCKET_NAME}`);
  console.log(`   Key: ${targetPath}`);
  console.log(`   SHA256: ${sha256}\n`);

  // Store metadata in database
  await storeMetadata(targetPath, sha256, fileSize, fileName);
}

/**
 * Store upload metadata in database
 */
async function storeMetadata(r2Path: string, sha256: string, fileSize: number, fileName: string) {
  const { default: knex } = await import('knex');
  const db = knex({
    client: 'postgres',
    connection: {
      host: process.env.LOCAL_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_DATABASE_PORT || '5432'),
      database: process.env.LOCAL_DATABASE_NAME || 'strapi_db',
      user: process.env.LOCAL_DATABASE_USERNAME || 'postgres',
      password: process.env.LOCAL_DATABASE_PASSWORD || 'postgres',
    }
  });

  try {
    // Update document with source file info
    const docType = r2Path.includes('yahscriptures') ? 'doc:scripture:yahscriptures' : null;

    if (docType) {
      const sourceFileMetadata = {
        sourceFile: {
          fileName,
          sha256,
          size: fileSize,
          uploadedAt: new Date().toISOString(),
        }
      };

      await db('library_documents')
        .where('document_id', docType)
        .update({
          file_sha256: sha256,
          source_url: r2Path,
          document_metadata: db.raw(
            `COALESCE(document_metadata, '{}'::jsonb) || ?::jsonb`,
            [JSON.stringify(sourceFileMetadata)]
          ),
          updated_at: new Date(),
        });

      console.log('📊 Database metadata updated\n');
    }
  } finally {
    await db.destroy();
  }
}

// Main
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: npx tsx upload-source-to-r2.ts <source-file> <target-path>');
  console.error('');
  console.error('Examples:');
  console.error('  npx tsx upload-source-to-r2.ts ~/Downloads/YSpc1.04.bbli library/originals/yahscriptures/YSpc1.04.bbli');
  console.error('  npx tsx upload-source-to-r2.ts book.pdf library/originals/egw/ministry-of-healing/book.pdf');
  process.exit(1);
}

const [sourcePath, targetPath] = args;

uploadToR2(sourcePath, targetPath).catch(error => {
  console.error('❌ Upload failed:', error);
  process.exit(1);
});
