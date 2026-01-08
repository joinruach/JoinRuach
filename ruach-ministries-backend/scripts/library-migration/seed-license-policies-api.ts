#!/usr/bin/env tsx
/**
 * Seed Default License Policies via REST API
 *
 * Creates default license policies using the Strapi REST API.
 * Requires Strapi to be running and STRAPI_API_TOKEN to be set.
 *
 * Usage:
 *   STRAPI_API_TOKEN=your_token npx tsx seed-license-policies-api.ts
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load .env file
config({ path: join(__dirname, '../../.env') });

const STRAPI_URL = process.env.LOCAL_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN environment variable required');
  console.error('');
  console.error('Generate a token in Strapi Admin:');
  console.error('  1. Start Strapi: npm run develop');
  console.error('  2. Go to Settings → API Tokens → Create new API Token');
  console.error('  3. Name: "Library Seeding", Type: "Full access"');
  console.error('  4. Copy the token and run:');
  console.error('     STRAPI_API_TOKEN=<token> npx tsx scripts/library-migration/seed-license-policies-api.ts');
  process.exit(1);
}

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

async function findPolicyByPolicyId(policyId: string): Promise<any | null> {
  const response = await fetch(
    `${STRAPI_URL}/api/library-license-policies?filters[policyId][$eq]=${policyId}`,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to query policies: ${response.status} ${response.statusText}`);
  }

  const result = (await response.json()) as { data: any[] };
  return result.data && result.data.length > 0 ? result.data[0] : null;
}

async function createPolicy(policy: LicensePolicy): Promise<void> {
  const response = await fetch(`${STRAPI_URL}/api/library-license-policies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({ data: policy }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create policy: ${response.status} ${errorText}`);
  }
}

async function updatePolicy(id: number, policy: LicensePolicy): Promise<void> {
  const response = await fetch(`${STRAPI_URL}/api/library-license-policies/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({ data: policy }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update policy: ${response.status} ${errorText}`);
  }
}

async function seedLicensePolicies() {
  console.log('📜 Seeding default license policies...');
  console.log(`🌐 Strapi URL: ${STRAPI_URL}`);
  console.log('');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const policy of DEFAULT_POLICIES) {
    try {
      const existing = await findPolicyByPolicyId(policy.policyId);

      if (existing) {
        await updatePolicy(existing.id, policy);
        console.log(`   ✓ Updated: ${policy.policyName} (${policy.policyId})`);
        updated++;
      } else {
        await createPolicy(policy);
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
}

seedLicensePolicies()
  .then(() => {
    console.log('');
    console.log('✅ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  });

// Make this file a module
export {};
