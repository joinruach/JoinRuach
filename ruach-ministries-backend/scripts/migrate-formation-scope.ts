/**
 * Migration: Set Formation Scope for Existing Guidebook Nodes
 *
 * This script updates all existing guidebook nodes to have a Formation Scope
 * based on the authoritative scope assignment (2025-12-30).
 *
 * Usage:
 *   npx tsx scripts/migrate-formation-scope.ts
 *   npx tsx scripts/migrate-formation-scope.ts --dry-run
 *
 * @version 1.0.0
 * @date 2025-12-30
 */

import 'dotenv/config';
import { STRAPI_API_TOKEN, STRAPI_URL } from './strapi-env';

/**
 * Formation Scope Mapping by Node Title
 * Based on authoritative scope assignment (2025-12-30)
 */
const FORMATION_SCOPE_MAP: Record<string, string> = {
  // Awakening Phase
  'the narrow gate': 'Individual',
  'come out of her': 'Individual',
  'first separation': 'Individual',
  'awakening checkpoint': 'Individual',
  'count the cost': 'Individual',
  'cost of discipleship': 'Individual',
  'fewness': 'Individual',
  'remnant pattern': 'Ecclesia',

  // Discernment / Warfare Layer
  'discernment': 'Individual',
  'test the spirits': 'Individual',
  'signs': 'Individual',
  'language can deceive': 'Individual',
  'word as plumb line': 'Individual',
  'conviction vs condemnation': 'Individual',
  'false peace': 'Individual',
  'true rest': 'Individual',

  // Repentance / Obedience Layer
  'repentance': 'Individual',
  'realignment': 'Individual',
  'obedience': 'Individual',
  'first fruits': 'Individual',
  'renouncing false coverings': 'Individual',
  'prayer': 'Individual',
  'breaks the fog': 'Individual',

  // Identity / Gospel Layer
  'identity': 'Individual',
  'beloved before useful': 'Individual',
  'gospel': 'Individual',
  'grace not performance': 'Individual',
  'not all who say lord': 'Individual',
  'fear of yhwh': 'Individual',
  'clean not crippling': 'Individual',

  // Commissioning Phase
  'the call': 'Individual',
  'distributed kingdom order': 'Network'
};

/**
 * Determine formation scope from node title
 */
function determineFormationScope(title: string): string {
  const normalizedTitle = title.toLowerCase();

  // Check explicit mapping first
  for (const [key, scope] of Object.entries(FORMATION_SCOPE_MAP)) {
    if (normalizedTitle.includes(key)) {
      return scope;
    }
  }

  // Default to Individual (safest assumption)
  return 'Individual';
}

/**
 * Fetch all guidebook nodes from Strapi
 */
async function fetchAllNodes(): Promise<any[]> {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/guidebook-nodes?pagination[pageSize]=1000`,
      {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch nodes: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching nodes:', error);
    throw error;
  }
}

/**
 * Update a node's formation scope
 */
async function updateNodeScope(
  nodeId: number,
  title: string,
  scope: string,
  dryRun: boolean
): Promise<boolean> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would update "${title}" → ${scope}`);
    return true;
  }

  try {
    const response = await fetch(
      `${STRAPI_URL}/api/guidebook-nodes/${nodeId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            formationScope: scope
          }
        }),
      }
    );

    if (response.ok) {
      console.log(`  ✅ Updated "${title}" → ${scope}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`  ❌ Failed to update "${title}": ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error updating "${title}":`, error);
    return false;
  }
}

/**
 * Main migration function
 */
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('🔄 Formation Scope Migration');
  console.log(`📍 Strapi URL: ${STRAPI_URL}`);
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Step 1: Fetch all nodes
    console.log('━'.repeat(60));
    console.log('Step 1: Fetching Guidebook Nodes');
    console.log('━'.repeat(60));

    const nodes = await fetchAllNodes();
    console.log(`✅ Found ${nodes.length} nodes\n`);

    // Step 2: Analyze scopes
    console.log('━'.repeat(60));
    console.log('Step 2: Analyzing Formation Scopes');
    console.log('━'.repeat(60));

    const scopeCounts: Record<string, number> = {
      'Individual': 0,
      'Household': 0,
      'Ecclesia': 0,
      'Network': 0
    };

    const updates: Array<{ id: number; title: string; currentScope: string; newScope: string }> = [];

    for (const node of nodes) {
      const currentScope = node.formationScope;
      const determinedScope = determineFormationScope(node.title);

      scopeCounts[determinedScope]++;

      if (!currentScope || currentScope !== determinedScope) {
        updates.push({
          id: node.id,
          title: node.title,
          currentScope: currentScope || '(none)',
          newScope: determinedScope
        });
      }
    }

    console.log('Formation Scope Distribution:');
    Object.entries(scopeCounts).forEach(([scope, count]) => {
      console.log(`  ${scope}: ${count} nodes`);
    });

    console.log(`\n${updates.length} nodes need updating\n`);

    // Step 3: Update nodes
    if (updates.length > 0) {
      console.log('━'.repeat(60));
      console.log(`Step 3: Updating Nodes${dryRun ? ' (DRY RUN)' : ''}`);
      console.log('━'.repeat(60));

      let successCount = 0;
      let failCount = 0;

      for (const update of updates) {
        const success = await updateNodeScope(
          update.id,
          update.title,
          update.newScope,
          dryRun
        );

        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      console.log('\n' + '═'.repeat(60));
      console.log('MIGRATION SUMMARY');
      console.log('═'.repeat(60));
      console.log(`Total nodes: ${nodes.length}`);
      console.log(`Nodes needing update: ${updates.length}`);
      console.log(`✅ Successful: ${successCount}`);
      if (failCount > 0) {
        console.log(`❌ Failed: ${failCount}`);
      }
      console.log('═'.repeat(60));

      if (dryRun) {
        console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
      } else {
        console.log('\n✅ Migration complete!');
      }
    } else {
      console.log('✅ All nodes already have correct Formation Scope. No migration needed.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// CLI help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Formation Scope Migration Script

Usage:
  npx tsx scripts/migrate-formation-scope.ts [options]

Options:
  --dry-run    Preview changes without applying them
  --help       Show this help message

Environment Variables (required):
  STRAPI_URL           Strapi backend URL (default: http://localhost:1337)
  STRAPI_API_TOKEN     Strapi API token with write permissions

Examples:
  # Preview migration
  npx tsx scripts/migrate-formation-scope.ts --dry-run

  # Apply migration
  npx tsx scripts/migrate-formation-scope.ts

  # Migrate production
  STRAPI_URL=https://api.joinruach.org \\
  STRAPI_API_TOKEN=<token> \\
  npx tsx scripts/migrate-formation-scope.ts --dry-run
  `);
  process.exit(0);
}

main();
