#!/usr/bin/env tsx
/**
 * Seed Default License Policies (Direct Database)
 *
 * Creates default license policies by inserting directly into the database.
 * Does not require Strapi to be running.
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load .env file
config({ path: join(__dirname, '../../.env') });

// Database configuration from env (prefer LOCAL for development)
const DB_HOST = process.env.LOCAL_DATABASE_HOST || process.env.DATABASE_HOST || 'localhost';
const DB_PORT = parseInt(process.env.LOCAL_DATABASE_PORT || process.env.DATABASE_PORT || '5432');
const DB_NAME = process.env.LOCAL_DATABASE_NAME || process.env.DATABASE_NAME || 'strapi_db';
const DB_USER = process.env.LOCAL_DATABASE_USERNAME || process.env.DATABASE_USERNAME || 'postgres';
const DB_PASSWORD = process.env.LOCAL_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres';

type LicensePolicy = {
  policyId: string;
  policyName: string;
  licenseType: string;
  allowCommercial: boolean;
  allowDerivatives: boolean;
  requireAttribution: boolean;
  maxChunkLength: number;
  maxChunksPerResponse: number;
  allowRagRetrieval: boolean;
  allowFullTextSearch: boolean;
  allowEmbedding: boolean;
  attributionTemplate: string;
  legalText: string;
  policyMetadata: Record<string, any>;
};

const DEFAULT_POLICIES: LicensePolicy[] = [
  {
    policyId: 'lic:public-domain',
    policyName: 'Public Domain - Unrestricted',
    licenseType: 'public_domain',
    allowCommercial: true,
    allowDerivatives: true,
    requireAttribution: false,
    maxChunkLength: 5000,
    maxChunksPerResponse: 20,
    allowRagRetrieval: true,
    allowFullTextSearch: true,
    allowEmbedding: true,
    attributionTemplate: 'From {title} (Public Domain)',
    legalText:
      '<p>This content is in the public domain and may be freely used, reproduced, and distributed without restriction.</p>',
    policyMetadata: {
      description: 'For works published before 1928 or explicitly released to public domain',
      examples: ['EGW books (author died 1915)', 'KJV Bible', 'Ancient texts'],
    },
  },
  {
    policyId: 'lic:fair-use-500',
    policyName: 'Fair Use - Limited Quotation (500 chars)',
    licenseType: 'fair_use',
    allowCommercial: false,
    allowDerivatives: false,
    requireAttribution: true,
    maxChunkLength: 500,
    maxChunksPerResponse: 3,
    allowRagRetrieval: true,
    allowFullTextSearch: true,
    allowEmbedding: true,
    attributionTemplate: 'From {title} by {author} (used under fair use)',
    legalText:
      '<p>Limited quotations permitted under fair use doctrine for educational and non-commercial purposes. Attribution required.</p>',
    policyMetadata: {
      description: 'For copyrighted works where we rely on fair use for short quotations',
      maxQuotePercentage: 10,
      examples: ['Modern theology books', 'Commentaries', 'Articles'],
    },
  },
  {
    policyId: 'lic:fair-use-1200',
    policyName: 'Fair Use - Extended Quotation (1200 chars)',
    licenseType: 'fair_use',
    allowCommercial: false,
    allowDerivatives: false,
    requireAttribution: true,
    maxChunkLength: 1200,
    maxChunksPerResponse: 5,
    allowRagRetrieval: true,
    allowFullTextSearch: true,
    allowEmbedding: true,
    attributionTemplate: 'From {title} by {author} (used under fair use)',
    legalText:
      '<p>Extended quotations permitted under fair use doctrine for educational and non-commercial purposes. Attribution required.</p>',
    policyMetadata: {
      description: 'For works where we have more generous fair use allowance',
      maxQuotePercentage: 20,
      examples: ['Academic papers', 'Bible commentaries', 'Study materials'],
    },
  },
  {
    policyId: 'lic:cc-by-sa',
    policyName: 'Creative Commons BY-SA 4.0',
    licenseType: 'creative_commons',
    allowCommercial: true,
    allowDerivatives: true,
    requireAttribution: true,
    maxChunkLength: 5000,
    maxChunksPerResponse: 20,
    allowRagRetrieval: true,
    allowFullTextSearch: true,
    allowEmbedding: true,
    attributionTemplate:
      'From {title} by {author} (CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/)',
    legalText:
      '<p>Licensed under Creative Commons Attribution-ShareAlike 4.0 International. You may use, share, and adapt this work for any purpose, including commercially, provided you give attribution and distribute derivatives under the same license.</p>',
    policyMetadata: {
      description: 'For works licensed under CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      shareAlike: true,
    },
  },
  {
    policyId: 'lic:internal-only',
    policyName: 'Internal Use Only - No Retrieval',
    licenseType: 'proprietary',
    allowCommercial: false,
    allowDerivatives: false,
    requireAttribution: true,
    maxChunkLength: 0,
    maxChunksPerResponse: 0,
    allowRagRetrieval: false,
    allowFullTextSearch: false,
    allowEmbedding: false,
    attributionTemplate: 'Internal content - Not for public use',
    legalText:
      '<p>This content is stored for internal reference only and may not be retrieved, quoted, or distributed.</p>',
    policyMetadata: {
      description: 'For content we want to store but not use in RAG/generation',
      examples: ['Copyrighted works pending permission', 'Personal notes'],
    },
  },
  {
    policyId: 'lic:unknown-blocked',
    policyName: 'Unknown License - Blocked',
    licenseType: 'custom',
    allowCommercial: false,
    allowDerivatives: false,
    requireAttribution: true,
    maxChunkLength: 0,
    maxChunksPerResponse: 0,
    allowRagRetrieval: false,
    allowFullTextSearch: false,
    allowEmbedding: false,
    attributionTemplate: 'License status unknown - Not available',
    legalText:
      '<p>The license status of this content has not been determined. Use is blocked until legal review is complete.</p>',
    policyMetadata: {
      description: 'Default policy for new content until license is verified',
      requiresReview: true,
    },
  },
];

async function seedLicensePolicies() {
  console.log('📜 Seeding default license policies (direct database)...');
  console.log(`🗄️  Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  console.log('');

  // Import knex
  const { default: knex } = await import('knex');

  // Create database connection
  const db = knex({
    client: 'postgres',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
    },
    pool: { min: 1, max: 1 },
  });

  try {
    // Check if table exists
    const tableExists = await db.schema.hasTable('library_license_policies');

    if (!tableExists) {
      console.error('❌ Table library_license_policies does not exist!');
      console.error('   Make sure Strapi has generated the table schema first.');
      console.error('   Run: npm run strapi develop (let it start once, then stop it)');
      process.exit(1);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const policy of DEFAULT_POLICIES) {
      try {
        // Check if policy already exists
        const existing = await db('library_license_policies')
          .where({ policy_id: policy.policyId })
          .first();

        // Prepare database row (convert camelCase to snake_case)
        const dbRow = {
          policy_id: policy.policyId,
          policy_name: policy.policyName,
          license_type: policy.licenseType,
          allow_commercial: policy.allowCommercial,
          allow_derivatives: policy.allowDerivatives,
          require_attribution: policy.requireAttribution,
          max_chunk_length: policy.maxChunkLength,
          max_chunks_per_response: policy.maxChunksPerResponse,
          allow_rag_retrieval: policy.allowRagRetrieval,
          allow_full_text_search: policy.allowFullTextSearch,
          allow_embedding: policy.allowEmbedding,
          attribution_template: policy.attributionTemplate,
          legal_text: policy.legalText,
          policy_metadata: JSON.stringify(policy.policyMetadata),
          created_at: new Date(),
          updated_at: new Date(),
        };

        if (existing) {
          // Update existing policy
          await db('library_license_policies')
            .where({ id: existing.id })
            .update({
              ...dbRow,
              created_at: existing.created_at, // Preserve original created_at
            });
          console.log(`   ✓ Updated: ${policy.policyName} (${policy.policyId})`);
          updated++;
        } else {
          // Create new policy
          await db('library_license_policies').insert(dbRow);
          console.log(`   + Created: ${policy.policyName} (${policy.policyId})`);
          created++;
        }
      } catch (error: any) {
        console.error(`   ✗ Failed to seed ${policy.policyId}:`, error.message);
        skipped++;
      }
    }

    console.log('');
    console.log('📜 License policy seeding complete:');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total:   ${created + updated + skipped}`);
    console.log('');
    console.log('ℹ️  Default policy for new documents: lic:unknown-blocked');
    console.log('ℹ️  Verify and assign appropriate policies before enabling retrieval');
  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

seedLicensePolicies()
  .then(() => {
    console.log('');
    console.log('✅ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });

// Make this file a module
export {};
