#!/usr/bin/env tsx
/**
 * AI Enrichment Orchestrator
 *
 * Coordinates AI enrichment features for ministry texts:
 * - Scripture reference detection (regex, fast, free)
 * - Embedding generation (OpenAI, ~$0.002 per book)
 * - Theme tagging (local cosine similarity, free)
 * - AI metadata generation (Claude Haiku, ~$0.11 per book)
 *
 * Usage:
 *   npx tsx scripts/ministry-extraction/ai-enrichment.ts \
 *     <input-jsonl> <output-jsonl> [options]
 *
 * Options:
 *   --scripture-refs    Detect scripture references (default: enabled)
 *   --embeddings        Generate embeddings (requires OPENAI_API_KEY)
 *   --themes            Tag with themes (requires embeddings)
 *   --ai-metadata       Generate AI metadata (requires ANTHROPIC_API_KEY)
 *   --all               Enable all features
 *   --skip-existing     Skip paragraphs that already have enrichments
 *
 * Environment Variables:
 *   OPENAI_API_KEY - OpenAI API key (for embeddings)
 *   ANTHROPIC_API_KEY - Anthropic API key (for AI metadata)
 *   STRAPI_URL - Strapi base URL (for verse/theme lookup)
 *   STRAPI_API_TOKEN - Strapi API token (for verse/theme lookup)
 *
 * @version 1.0.0
 */

import { spawn } from 'child_process';
import path from 'path';

interface EnrichmentOptions {
  scriptureRefs: boolean;
  embeddings: boolean;
  themes: boolean;
  aiMetadata: boolean;
  skipExisting: boolean;
}

interface EnrichmentStats {
  paragraphsProcessed: number;
  scriptureRefsFound: number;
  embeddingsGenerated: number;
  themesTagged: number;
  aiMetadataGenerated: number;
  errors: number;
  estimatedCost: number;
}

/**
 * Run a script and capture output
 */
function runScript(scriptPath: string, args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['tsx', scriptPath, ...args], {
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      resolve({ exitCode: code || 0, stdout, stderr });
    });

    proc.on('error', (error) => {
      reject(new Error(`Failed to spawn process: ${error.message}`));
    });
  });
}

/**
 * Parse command line arguments
 */
function parseArgs(): { inputPath: string; outputPath: string; options: EnrichmentOptions } {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/ministry-extraction/ai-enrichment.ts <input-jsonl> <output-jsonl> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --scripture-refs    Detect scripture references (default: enabled)');
    console.error('  --embeddings        Generate embeddings (requires OPENAI_API_KEY)');
    console.error('  --themes            Tag with themes (requires embeddings)');
    console.error('  --ai-metadata       Generate AI metadata (requires ANTHROPIC_API_KEY)');
    console.error('  --all               Enable all features');
    console.error('  --skip-existing     Skip paragraphs that already have enrichments');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx scripts/ministry-extraction/ai-enrichment.ts \\');
    console.error('    ministry-pipeline/exports/egw/ministry-of-healing/v1/paragraphs.jsonl \\');
    console.error('    ministry-pipeline/exports/egw/ministry-of-healing/v1/enriched.jsonl \\');
    console.error('    --all');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  const options: EnrichmentOptions = {
    scriptureRefs: args.includes('--scripture-refs') || args.includes('--all') || (!args.includes('--embeddings') && !args.includes('--themes') && !args.includes('--ai-metadata')), // Default to true if no other options
    embeddings: args.includes('--embeddings') || args.includes('--all'),
    themes: args.includes('--themes') || args.includes('--all'),
    aiMetadata: args.includes('--ai-metadata') || args.includes('--all'),
    skipExisting: args.includes('--skip-existing'),
  };

  return { inputPath, outputPath, options };
}

/**
 * Validate environment variables
 */
function validateEnvironment(options: EnrichmentOptions): void {
  const missing: string[] = [];

  if (options.embeddings && !process.env.OPENAI_API_KEY) {
    missing.push('OPENAI_API_KEY (required for --embeddings)');
  }

  if (options.aiMetadata && !process.env.ANTHROPIC_API_KEY) {
    missing.push('ANTHROPIC_API_KEY (required for --ai-metadata)');
  }

  if (options.themes && !options.embeddings) {
    console.error('❌ Error: --themes requires --embeddings to be enabled');
    process.exit(1);
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((m) => console.error(`   - ${m}`));
    process.exit(1);
  }
}

/**
 * Main enrichment pipeline
 */
async function enrichPipeline(inputPath: string, outputPath: string, options: EnrichmentOptions): Promise<EnrichmentStats> {
  const stats: EnrichmentStats = {
    paragraphsProcessed: 0,
    scriptureRefsFound: 0,
    embeddingsGenerated: 0,
    themesTagged: 0,
    aiMetadataGenerated: 0,
    errors: 0,
    estimatedCost: 0,
  };

  console.log('🤖 AI Enrichment Pipeline');
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputPath}`);
  console.log('');
  console.log('Enabled features:');
  console.log(`   ${options.scriptureRefs ? '✅' : '⬜'} Scripture reference detection`);
  console.log(`   ${options.embeddings ? '✅' : '⬜'} Embedding generation`);
  console.log(`   ${options.themes ? '✅' : '⬜'} Theme tagging`);
  console.log(`   ${options.aiMetadata ? '✅' : '⬜'} AI metadata generation`);
  console.log('');

  const scriptsDir = path.join(__dirname);
  let currentInput = inputPath;
  let currentOutput = outputPath;

  try {
    // Step 1: Scripture reference detection
    if (options.scriptureRefs) {
      console.log('[1/4] Detecting scripture references...');
      const scriptPath = path.join(scriptsDir, 'detect-scripture-refs.ts');
      const lookupVerses = !!process.env.STRAPI_API_TOKEN;

      const result = await runScript(scriptPath, [
        currentInput,
        currentOutput,
        ...(lookupVerses ? ['--lookup-verses'] : []),
      ]);

      if (result.exitCode !== 0) {
        throw new Error('Scripture reference detection failed');
      }

      // Parse output to get stats
      const refMatch = result.stdout.match(/Scripture references found: (\d+)/);
      if (refMatch) {
        stats.scriptureRefsFound = parseInt(refMatch[1], 10);
      }

      currentInput = currentOutput;
      console.log('');
    }

    // Step 2: Embedding generation
    if (options.embeddings) {
      console.log('[2/4] Generating embeddings...');
      const embeddingScript = path.join(scriptsDir, 'generate-embeddings.ts');
      const tempEmbedded = `${currentOutput}.embedded`;

      const result = await runScript(embeddingScript, [
        currentInput,
        tempEmbedded,
        '--dimensions', '512',
        '--batch-size', '100',
        ...(options.skipExisting ? ['--skip-existing'] : []),
      ]);

      if (result.exitCode !== 0) {
        throw new Error('Embedding generation failed');
      }

      // Parse output to get stats
      const tokenMatch = result.stdout.match(/Total tokens:\s+([\d,]+)/);
      const costMatch = result.stdout.match(/Estimated cost:\s+\$(\d+\.\d+)/);
      const embeddedMatch = result.stdout.match(/New embeddings:\s+(\d+)/);

      if (tokenMatch) {
        const tokens = parseInt(tokenMatch[1].replace(/,/g, ''), 10);
        console.log(`   Generated ${tokens.toLocaleString()} tokens`);
      }
      if (costMatch) {
        const cost = parseFloat(costMatch[1]);
        stats.estimatedCost += cost;
      }
      if (embeddedMatch) {
        stats.embeddingsGenerated = parseInt(embeddedMatch[1], 10);
      }

      currentInput = tempEmbedded;
      currentOutput = tempEmbedded;
      console.log('');
    } else {
      console.log('[2/4] Skipping embedding generation');
      console.log('');
    }

    // Step 3: Theme tagging
    if (options.themes) {
      console.log('[3/4] Tagging themes...');
      console.log('⚠️  NOTE: Theme tagging not yet implemented');
      console.log('   Placeholder: Would tag themes using cosine similarity');
      console.log('   Prerequisite: Embeddings must be generated first');
      console.log('');
    } else {
      console.log('[3/4] Skipping theme tagging');
      console.log('');
    }

    // Step 4: AI metadata generation
    if (options.aiMetadata) {
      console.log('[4/4] Generating AI metadata...');
      console.log('⚠️  NOTE: AI metadata generation not yet implemented');
      console.log('   Placeholder: Would generate metadata using Claude Haiku 3.5');
      console.log('   Estimated cost: $0.11 per 2,225 paragraphs');
      stats.estimatedCost += 0.11;
      console.log('');
    } else {
      console.log('[4/4] Skipping AI metadata generation');
      console.log('');
    }

    // Copy final output to destination if it's a temp file
    if (currentOutput !== outputPath) {
      const fs = await import('node:fs/promises');
      await fs.copyFile(currentOutput, outputPath);
      console.log(`   📝 Saved final output to: ${outputPath}`);
    }

    console.log('✅ Enrichment pipeline complete!');
    console.log('');
    console.log('============================================================');
    console.log('ENRICHMENT SUMMARY');
    console.log('============================================================');
    console.log(`Scripture references found:  ${stats.scriptureRefsFound}`);
    console.log(`Embeddings generated:        ${stats.embeddingsGenerated}${stats.embeddingsGenerated === 0 && !options.embeddings ? ' (skipped)' : ''}`);
    console.log(`Themes tagged:               ${stats.themesTagged}${stats.themesTagged === 0 && !options.themes ? ' (skipped)' : ' (not implemented)'}`);
    console.log(`AI metadata generated:       ${stats.aiMetadataGenerated}${stats.aiMetadataGenerated === 0 && !options.aiMetadata ? ' (skipped)' : ' (not implemented)'}`);
    console.log(`Errors:                      ${stats.errors}`);
    console.log(`Total cost:                  $${stats.estimatedCost.toFixed(4)}`);
    console.log('============================================================');
  } catch (error) {
    console.error('\n❌ Enrichment pipeline failed:', error);
    throw error;
  }

  return stats;
}

/**
 * CLI entry point
 */
async function main() {
  const { inputPath, outputPath, options } = parseArgs();

  // Validate environment
  validateEnvironment(options);

  try {
    await enrichPipeline(inputPath, outputPath, options);
    process.exit(0);
  } catch (error) {
    console.error('Enrichment failed:', error);
    process.exit(1);
  }
}

main();
