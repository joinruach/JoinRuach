/**
 * Import Canon Content from Notion to Strapi
 *
 * This script:
 * 1. Exports content from Notion database
 * 2. Validates against Canon Law axiom hierarchy
 * 3. Transforms to Strapi schema format
 * 4. Creates/updates records in Strapi
 *
 * Usage:
 *   npx tsx scripts/import-from-notion.ts
 *   npx tsx scripts/import-from-notion.ts --dry-run
 *   npx tsx scripts/import-from-notion.ts --skip-validation
 *
 * @version 1.0.0
 * @date 2025-12-30
 */

import 'dotenv/config';
import { exportNotionCanon } from './canon-audit/notion-export';
import { auditAllNodes } from './canon-audit/audit-report';
import { STRAPI_API_TOKEN, STRAPI_URL } from './strapi-env';
import type { NotionNode } from './canon-audit/types';
import * as crypto from 'crypto';

interface ImportStats {
  phasesCreated: number;
  phasesUpdated: number;
  phasesSkipped: number;
  axiomsCreated: number;
  axiomsUpdated: number;
  axiomsSkipped: number;
  nodesCreated: number;
  nodesUpdated: number;
  nodesSkipped: number;
  errors: string[];
}

interface CommandLineArgs {
  dryRun: boolean;
  skipValidation: boolean;
  skipExport: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CommandLineArgs {
  return {
    dryRun: process.argv.includes('--dry-run'),
    skipValidation: process.argv.includes('--skip-validation'),
    skipExport: process.argv.includes('--skip-export')
  };
}

/**
 * Generate checksum for content
 */
function generateChecksum(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Fetch existing Strapi record by notionPageId
 */
async function fetchByNotionId(
  contentType: string,
  notionPageId: string
): Promise<any | null> {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/${contentType}?filters[notionPageId][$eq]=${notionPageId}`,
      {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) return null;

    const data: { data?: any[] } = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error(`Error fetching ${contentType} by Notion ID:`, error);
    return null;
  }
}

/**
 * Create or update a Strapi record
 */
async function upsertStrapiRecord(
  contentType: string,
  data: any,
  notionPageId: string,
  dryRun: boolean = false
): Promise<'created' | 'updated' | 'skipped' | 'error'> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would upsert ${contentType}:`, data.title || data.name);
    return 'skipped';
  }

  try {
    // Check if record exists
    const existing = await fetchByNotionId(contentType, notionPageId);

    if (existing) {
      // Check if update needed (compare checksums)
      if (existing.checksum === data.checksum) {
        console.log(`  ⏭️  Skipped (unchanged): ${data.title || data.name}`);
        return 'skipped';
      }

      // Update existing record
      const response = await fetch(`${STRAPI_URL}/api/${contentType}/${existing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        console.log(`  🔄 Updated: ${data.title || data.name}`);
        return 'updated';
      } else {
        const error = await response.text();
        console.error(`  ❌ Update failed: ${error}`);
        return 'error';
      }
    } else {
      // Create new record
      const response = await fetch(`${STRAPI_URL}/api/${contentType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        console.log(`  ✅ Created: ${data.title || data.name}`);
        return 'created';
      } else {
        const error = await response.text();
        console.error(`  ❌ Creation failed: ${error}`);
        return 'error';
      }
    }
  } catch (error) {
    console.error(`  ❌ Error upserting ${contentType}:`, error);
    return 'error';
  }
}

/**
 * Import formation phases
 */
async function importPhases(
  nodes: NotionNode[],
  stats: ImportStats,
  dryRun: boolean
): Promise<void> {
  console.log('\n📘 Importing Formation Phases...');

  // Extract unique phases from nodes
  const phases = new Set<string>();
  nodes.forEach(node => {
    if (node.phase) {
      phases.add(node.phase);
    }
  });

  // Phase metadata
  const phaseMetadata: Record<string, { name: string; description: string; order: number }> = {
    'awakening': {
      name: 'Awakening',
      description: 'Introduction to covenant thinking and spiritual foundations',
      order: 1
    },
    'separation': {
      name: 'Separation',
      description: 'Understanding separation from the world\'s systems',
      order: 2
    },
    'discernment': {
      name: 'Discernment',
      description: 'Developing spiritual discernment and wisdom',
      order: 3
    },
    'commission': {
      name: 'Commission',
      description: 'Receiving and walking in your calling',
      order: 4
    },
    'stewardship': {
      name: 'Stewardship',
      description: 'Living as a faithful steward of God\'s kingdom',
      order: 5
    }
  };

  for (const phaseSlug of Array.from(phases).sort()) {
    const metadata = phaseMetadata[phaseSlug];
    if (!metadata) {
      console.log(`  ⚠️  Unknown phase: ${phaseSlug}`);
      continue;
    }

    const phaseData = {
      phaseId: phaseSlug,
      name: metadata.name,
      slug: phaseSlug,
      description: metadata.description,
      order: metadata.order,
      notionPageId: `phase-${phaseSlug}`,
      checksum: generateChecksum(JSON.stringify(metadata))
    };

    const result = await upsertStrapiRecord(
      'formation-phases',
      phaseData,
      phaseData.notionPageId,
      dryRun
    );

    if (result === 'created') stats.phasesCreated++;
    else if (result === 'updated') stats.phasesUpdated++;
    else if (result === 'skipped') stats.phasesSkipped++;
  }
}

/**
 * Import canon axioms
 */
async function importAxioms(
  nodes: NotionNode[],
  stats: ImportStats,
  dryRun: boolean
): Promise<void> {
  console.log('\n⚖️  Importing Canon Axioms...');

  // Extract unique axioms from nodes
  const axiomSet = new Set<string>();
  nodes.forEach(node => {
    if (node.axioms) {
      node.axioms.forEach(axiom => axiomSet.add(axiom));
    }
  });

  // TODO: In production, you'd fetch actual axiom data from Notion
  // For now, we'll create placeholder axioms
  console.log(`  ℹ️  Found ${axiomSet.size} unique axioms referenced`);
  console.log(`  ⚠️  Axiom import requires additional Notion database configuration`);
  console.log(`  ⚠️  Skipping axiom import for now - implement based on your Notion schema`);
}

/**
 * Transform Notion node to Strapi guidebook-node format
 */
function transformNodeToStrapi(node: NotionNode, phaseId: number | null): any {
  const content = node.content || '';

  return {
    nodeId: node.id.replace(/-/g, '').substring(0, 32), // Notion ID without dashes
    notionPageId: node.id,
    title: node.title,
    slug: node.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    content: content,
    checksum: generateChecksum(content),
    orderInPhase: node.order || 1,
    nodeType: determineNodeType(node),
    formationScope: determineFormationScope(node),
    sensitivity: 'Medium',
    checkpointType: isCheckpoint(node) ? 'Text Response' : 'None',
    phase: phaseId,
    syncedToStrapi: true,
    syncLock: false,
    publishedAt: null // Draft by default
  };
}

/**
 * Formation Scope Mapping
 * Based on authoritative scope assignment (2025-12-30)
 *
 * Individual: Personal conscience, repentance, discernment, obedience
 * Household: Family alignment, shared rhythms, domestic order
 * Ecclesia: Remnant recognition, mutual accountability, shared identity
 * Network: Structure, authority distribution, multiplication
 */
const FORMATION_SCOPE_MAP: Record<string, string> = {
  // Awakening Phase
  'the narrow gate': 'Individual',
  'come out of her': 'Individual', // Transitions to Household
  'awakening checkpoint': 'Individual',
  'count the cost': 'Individual',
  'the cost of discipleship': 'Individual',
  'fewness': 'Individual', // Transitions to Ecclesia
  'remnant pattern': 'Ecclesia',
  'the remnant pattern': 'Ecclesia',

  // Discernment / Warfare Layer
  'discernment': 'Individual',
  'test the spirits': 'Individual',
  'signs': 'Individual',
  'language can deceive': 'Individual',
  'the word as plumb line': 'Individual', // Transitions to Ecclesia
  'conviction vs condemnation': 'Individual',
  'false peace': 'Individual',
  'true rest': 'Individual',

  // Repentance / Obedience Layer
  'repentance': 'Individual',
  'realignment': 'Individual',
  'obedience': 'Individual',
  'first fruits': 'Individual',
  'renouncing false coverings': 'Individual', // Transitions to Ecclesia
  'prayer': 'Individual',
  'breaks the fog': 'Individual',

  // Identity / Gospel Layer
  'identity': 'Individual',
  'beloved before useful': 'Individual',
  'the gospel': 'Individual',
  'grace not performance': 'Individual',
  'not all who say lord': 'Individual',
  'fear of yhwh': 'Individual',
  'clean not crippling': 'Individual',

  // Commissioning Phase
  'the call': 'Individual', // Transitions to Ecclesia
  'distributed kingdom order': 'Network'
};

/**
 * Determine formation scope from node title and phase
 */
function determineFormationScope(node: NotionNode): string {
  const title = node.title.toLowerCase();

  // Check explicit mapping first
  for (const [key, scope] of Object.entries(FORMATION_SCOPE_MAP)) {
    if (title.includes(key)) {
      return scope;
    }
  }

  // Default scope by phase
  const phase = node.phase?.toLowerCase();

  switch (phase) {
    case 'awakening':
    case 'separation':
    case 'discernment':
      return 'Individual'; // Most awakening/discernment content is personal

    case 'warfare':
      return 'Individual'; // Warfare is always personal first

    case 'commissioning':
      // Commissioning can be Individual or Ecclesia, default to Individual
      if (title.includes('community') || title.includes('ecclesia') || title.includes('remnant')) {
        return 'Ecclesia';
      }
      if (title.includes('network') || title.includes('distributed')) {
        return 'Network';
      }
      return 'Individual';

    case 'stewardship':
      // Stewardship can span all scopes
      if (title.includes('household') || title.includes('family')) {
        return 'Household';
      }
      if (title.includes('community') || title.includes('ecclesia')) {
        return 'Ecclesia';
      }
      if (title.includes('network') || title.includes('multiplication')) {
        return 'Network';
      }
      return 'Individual';

    default:
      return 'Individual'; // Safe default
  }
}

/**
 * Determine node type from content
 */
function determineNodeType(node: NotionNode): string {
  const title = node.title.toLowerCase();
  const content = (node.content || '').toLowerCase();

  if (title.includes('checkpoint') || title.includes('reflection')) {
    return 'Reflection';
  }
  if (content.includes('exercise') || content.includes('practice')) {
    return 'Exercise';
  }
  if (content.includes('warning') || content.includes('danger')) {
    return 'Confrontation';
  }

  return 'Teaching'; // Default
}

/**
 * Check if node is a checkpoint
 */
function isCheckpoint(node: NotionNode): boolean {
  return node.title.toLowerCase().includes('checkpoint');
}

/**
 * Import guidebook nodes
 */
async function importNodes(
  nodes: NotionNode[],
  stats: ImportStats,
  dryRun: boolean
): Promise<void> {
  console.log('\n📖 Importing Guidebook Nodes...');

  // First, fetch all phases to get IDs
  const phasesResponse = await fetch(`${STRAPI_URL}/api/formation-phases`, {
    headers: {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    },
  });

  const phasesData: {
    data?: Array<{ id: number; slug?: string | null; phaseId?: string | null }>;
  } = await phasesResponse.json();
  const phaseMap: Record<string, number> = {};

  phasesData.data?.forEach((phase: any) => {
    phaseMap[phase.slug || phase.phaseId] = phase.id;
  });

  for (const node of nodes) {
    const phaseId = node.phase ? phaseMap[node.phase] : null;

    if (node.phase && !phaseId) {
      console.log(`  ⚠️  Phase not found for node "${node.title}": ${node.phase}`);
      stats.nodesSkipped++;
      continue;
    }

    const nodeData = transformNodeToStrapi(node, phaseId);

    const result = await upsertStrapiRecord(
      'guidebook-nodes',
      nodeData,
      node.id,
      dryRun
    );

    if (result === 'created') stats.nodesCreated++;
    else if (result === 'updated') stats.nodesUpdated++;
    else if (result === 'skipped') stats.nodesSkipped++;
    else if (result === 'error') {
      stats.errors.push(`Failed to import node: ${node.title}`);
    }
  }
}

/**
 * Print import summary
 */
function printSummary(stats: ImportStats, dryRun: boolean): void {
  console.log('\n' + '═'.repeat(60));
  console.log(dryRun ? 'DRY RUN SUMMARY' : 'IMPORT SUMMARY');
  console.log('═'.repeat(60));

  console.log('\n📘 Formation Phases:');
  console.log(`  ✅ Created: ${stats.phasesCreated}`);
  console.log(`  🔄 Updated: ${stats.phasesUpdated}`);
  console.log(`  ⏭️  Skipped: ${stats.phasesSkipped}`);

  console.log('\n⚖️  Canon Axioms:');
  console.log(`  ✅ Created: ${stats.axiomsCreated}`);
  console.log(`  🔄 Updated: ${stats.axiomsUpdated}`);
  console.log(`  ⏭️  Skipped: ${stats.axiomsSkipped}`);

  console.log('\n📖 Guidebook Nodes:');
  console.log(`  ✅ Created: ${stats.nodesCreated}`);
  console.log(`  🔄 Updated: ${stats.nodesUpdated}`);
  console.log(`  ⏭️  Skipped: ${stats.nodesSkipped}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n' + '═'.repeat(60));
}

/**
 * Main import function
 */
async function main() {
  console.log('🔄 Notion → Strapi Import');
  console.log(`📍 Strapi URL: ${STRAPI_URL}\n`);

  const args = parseArgs();
  const stats: ImportStats = {
    phasesCreated: 0,
    phasesUpdated: 0,
    phasesSkipped: 0,
    axiomsCreated: 0,
    axiomsUpdated: 0,
    axiomsSkipped: 0,
    nodesCreated: 0,
    nodesUpdated: 0,
    nodesSkipped: 0,
    errors: []
  };

  try {
    // Step 1: Export from Notion
    console.log('━'.repeat(60));
    console.log('Step 1: Exporting from Notion');
    console.log('━'.repeat(60));

    const notionApiKey = process.env.NOTION_API_KEY;
    const notionDbGuidebookNodes = process.env.NOTION_DB_GUIDEBOOK_NODES || process.env.NOTION_DATABASE_ID;

    if (!notionApiKey || !notionDbGuidebookNodes) {
      throw new Error(
        'Missing required environment variables: NOTION_API_KEY and NOTION_DB_GUIDEBOOK_NODES\n' +
        'Add them to your .env file or export them in your shell.'
      );
    }

    const nodes = await exportNotionCanon(
      notionApiKey,
      notionDbGuidebookNodes,
      './scripts/canon-audit/data/notion-export.json'
    );

    // Step 2: Validate (unless skipped)
    if (!args.skipValidation) {
      console.log('\n━'.repeat(60));
      console.log('Step 2: Validating Canon Alignment');
      console.log('━'.repeat(60));

      const auditReport = auditAllNodes(nodes);

      if (auditReport.errorNodes > 0) {
        console.error(`\n❌ Canon validation failed: ${auditReport.errorNodes} critical errors found`);
        console.error('Fix errors in Notion before importing. Run: tsx scripts/canon-audit/index.ts');
        process.exit(1);
      }

      console.log(`✅ Validation passed: ${auditReport.safeNodes} safe, ${auditReport.warningNodes} warnings`);
    } else {
      console.log('\n⏭️  Skipping validation (--skip-validation flag)');
    }

    // Step 3: Import to Strapi
    console.log('\n━'.repeat(60));
    console.log(`Step 3: Importing to Strapi${args.dryRun ? ' (DRY RUN)' : ''}`);
    console.log('━'.repeat(60));

    await importPhases(nodes, stats, args.dryRun);
    await importAxioms(nodes, stats, args.dryRun);
    await importNodes(nodes, stats, args.dryRun);

    // Step 4: Print summary
    printSummary(stats, args.dryRun);

    if (args.dryRun) {
      console.log('\n💡 This was a dry run. Run without --dry-run to actually import data.');
    } else {
      console.log('\n✅ Import complete!');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// CLI help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Notion → Strapi Import Script

Usage:
  npx tsx scripts/import-from-notion.ts [options]

Options:
  --dry-run           Preview changes without actually importing
  --skip-validation   Skip Canon Law validation (not recommended)
  --skip-export       Use cached Notion export (faster for testing)
  --help              Show this help message

Environment Variables (required):
  NOTION_API_KEY              Your Notion integration API key
  NOTION_DB_GUIDEBOOK_NODES   Notion database ID for Guidebook Nodes
  STRAPI_URL                  Strapi backend URL (default: http://localhost:1337)
  STRAPI_API_TOKEN            Strapi API token with write permissions

Examples:
  # Preview what would be imported
  npx tsx scripts/import-from-notion.ts --dry-run

  # Full import with validation
  npx tsx scripts/import-from-notion.ts

  # Skip validation (dangerous!)
  npx tsx scripts/import-from-notion.ts --skip-validation

Setup:
  See scripts/canon-audit/QUICKSTART.md for Notion integration setup
  `);
  process.exit(0);
}

main();
