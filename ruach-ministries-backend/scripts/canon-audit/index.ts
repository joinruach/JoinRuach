#!/usr/bin/env tsx
/**
 * Canon Audit CLI
 * Main entry point for canon validation audit
 */

import 'dotenv/config';
import { exportNotionCanon } from './notion-export';
import { auditAllNodes, saveReport, printSummary } from './audit-report';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Configuration
 */
interface AuditConfig {
  notionApiKey: string;
  notionDatabaseId: string;
  exportPath: string;
  reportOutputDir: string;
  skipExport?: boolean;
}

/**
 * Load config from environment
 */
function loadConfig(): AuditConfig {
  const notionApiKey = process.env.NOTION_TOKEN ?? process.env.NOTION_API_KEY;
  const notionDatabaseId = process.env.NOTION_DB_GUIDEBOOK_NODES || process.env.NOTION_DATABASE_ID;

  if (!notionApiKey || !notionDatabaseId) {
    throw new Error(
      'Missing required environment variables: NOTION_TOKEN (or legacy NOTION_API_KEY) and NOTION_DB_GUIDEBOOK_NODES\n' +
      '(or legacy NOTION_DATABASE_ID for backwards compatibility)'
    );
  }

  return {
    notionApiKey,
    notionDatabaseId,
    exportPath: path.join(__dirname, 'data', 'notion-export.json'),
    reportOutputDir: path.join(__dirname, 'reports'),
    skipExport: process.argv.includes('--skip-export')
  };
}

/**
 * Main audit function
 */
async function runAudit() {
  console.log('🔍 Canon Audit System\n');
  console.log('━'.repeat(60));

  try {
    const config = loadConfig();

    let nodes;

    // Step 1: Export or load Notion data
    if (config.skipExport && fs.existsSync(config.exportPath)) {
      console.log('⏭️  Skipping export, loading from cache...');
      const data = fs.readFileSync(config.exportPath, 'utf-8');
      nodes = JSON.parse(data);
      console.log(`✅ Loaded ${nodes.length} nodes from ${config.exportPath}\n`);
    } else {
      console.log('Step 1: Exporting Notion Canon');
      console.log('━'.repeat(60));
      nodes = await exportNotionCanon(
        config.notionApiKey,
        config.notionDatabaseId,
        config.exportPath
      );
      console.log('');
    }

    // Step 2: Run audit
    console.log('Step 2: Running Axiom Validation');
    console.log('━'.repeat(60));
    const report = auditAllNodes(nodes);

    // Step 3: Generate reports
    console.log('\nStep 3: Generating Reports');
    console.log('━'.repeat(60));
    saveReport(report, config.reportOutputDir, 'markdown');

    // Step 4: Print summary
    printSummary(report);

    console.log('\n✅ Canon audit complete!\n');

    // Exit with error code if critical issues found
    if (report.errorNodes > 0) {
      console.log('⚠️  Exiting with error code due to critical issues.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Audit failed:', error);
    process.exit(1);
  }
}

/**
 * CLI Help
 */
function printHelp() {
  console.log(`
Canon Audit CLI

Usage:
  tsx scripts/canon-audit/index.ts [options]

Options:
  --skip-export    Skip Notion export, use cached data
  --help           Show this help message

Environment Variables (required):
  NOTION_TOKEN                Your Notion integration token (preferred)
  NOTION_API_KEY              Your Notion integration token (legacy)
  NOTION_DB_GUIDEBOOK_NODES   Notion database ID for Guidebook Nodes

Examples:
  # Run full audit (export + validate)
  npx tsx scripts/canon-audit/index.ts

  # Run audit with cached export
  npx tsx scripts/canon-audit/index.ts --skip-export

Setup:
  1. Create a Notion integration at https://www.notion.so/my-integrations
  2. Share your database with the integration
  3. Copy the database ID from the URL
  4. Set environment variables in .env file:
     NOTION_TOKEN=ntn_xxx
     NOTION_DB_GUIDEBOOK_NODES=xxx
  `);
}

/**
 * Entry point
 */
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printHelp();
  process.exit(0);
}

runAudit();
