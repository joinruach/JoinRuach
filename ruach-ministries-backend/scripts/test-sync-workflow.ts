#!/usr/bin/env tsx

/**
 * Phase 9: Track E - Sync Workflow Test Script
 *
 * Manual test script for verifying the complete sync workflow
 * Usage: pnpm tsx scripts/test-sync-workflow.ts <session-id>
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN;

interface SyncResult {
  sessionId: string;
  masterCamera: string;
  offsets: Record<string, number>;
  confidence: Record<string, number>;
  classification: Record<string, string>;
  operatorStatus: string;
  status: string;
}

async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
) {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed (${response.status}): ${error}`);
  }

  return response.json();
}

async function testSyncWorkflow(sessionId: string) {
  console.log('='.repeat(60));
  console.log('Phase 9: Sync Workflow Test');
  console.log('='.repeat(60));
  console.log(`Session ID: ${sessionId}`);
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  try {
    // Step 1: Compute sync offsets
    console.log('Step 1: Computing sync offsets...');
    const computeResponse = await apiRequest(
      `/api/recording-sessions/${sessionId}/sync/compute`,
      'POST',
      { masterCamera: 'A' }
    );

    if (!computeResponse.success) {
      throw new Error('Sync computation failed');
    }

    console.log('✓ Sync computed successfully');
    console.log('\nResults:');
    console.log(`  Master Camera: ${computeResponse.data.masterCamera}`);
    console.log(`  All Reliable: ${computeResponse.data.allReliable}`);
    console.log('\nPer-Camera Results:');

    for (const result of computeResponse.data.results) {
      const badge = {
        'looks-good': '✓',
        'review-suggested': '⚠',
        'needs-manual-nudge': '✗',
      }[result.classification];

      console.log(
        `  ${badge} Camera ${result.camera}: ${result.offsetMs}ms ` +
          `(confidence: ${result.confidence.toFixed(2)}, ` +
          `classification: ${result.classification})`
      );
    }

    // Step 2: Get sync results
    console.log('\n' + '-'.repeat(60));
    console.log('Step 2: Retrieving sync results...');
    const getResponse = await apiRequest(
      `/api/recording-sessions/${sessionId}/sync`
    );

    if (!getResponse.success) {
      throw new Error('Failed to get sync results');
    }

    console.log('✓ Sync results retrieved');
    console.log(`  Operator Status: ${getResponse.data.operatorStatus}`);
    console.log(`  Session Status: ${getResponse.data.status}`);

    const syncData: SyncResult = getResponse.data;

    // Step 3: Decide action based on confidence
    console.log('\n' + '-'.repeat(60));
    console.log('Step 3: Operator review...');

    const hasLowConfidence = Object.values(syncData.classification).some(
      (c) => c === 'needs-manual-nudge'
    );

    if (hasLowConfidence) {
      console.log('⚠ Low confidence detected - Manual correction recommended');
      console.log('\nApplying manual correction (+50ms to camera B)...');

      const correctedOffsets = {
        ...syncData.offsets,
        B: syncData.offsets.B + 50,
      };

      const correctResponse = await apiRequest(
        `/api/recording-sessions/${sessionId}/sync/correct`,
        'POST',
        {
          offsets: correctedOffsets,
          correctedBy: 'test-script',
          notes: 'Manual adjustment: +50ms to camera B',
        }
      );

      if (!correctResponse.success) {
        throw new Error('Failed to correct sync');
      }

      console.log('✓ Sync corrected successfully');
      console.log(`  New Offsets: ${JSON.stringify(correctedOffsets)}`);
      console.log(`  Operator Status: ${correctResponse.data.operatorStatus}`);
      console.log(`  Session Status: ${correctResponse.data.status}`);
    } else {
      console.log('✓ High confidence - Approving sync...');

      const approveResponse = await apiRequest(
        `/api/recording-sessions/${sessionId}/sync/approve`,
        'POST',
        {
          approvedBy: 'test-script',
          notes: 'Automated approval - all cameras have high confidence',
        }
      );

      if (!approveResponse.success) {
        throw new Error('Failed to approve sync');
      }

      console.log('✓ Sync approved successfully');
      console.log(`  Operator Status: ${approveResponse.data.operatorStatus}`);
      console.log(`  Session Status: ${approveResponse.data.status}`);
    }

    // Step 4: Final verification
    console.log('\n' + '-'.repeat(60));
    console.log('Step 4: Final verification...');
    const finalResponse = await apiRequest(
      `/api/recording-sessions/${sessionId}/sync`
    );

    console.log('✓ Final sync state:');
    console.log(`  Operator Status: ${finalResponse.data.operatorStatus}`);
    console.log(`  Session Status: ${finalResponse.data.status}`);
    console.log(
      `  Final Offsets: ${JSON.stringify(finalResponse.data.offsets)}`
    );

    console.log('\n' + '='.repeat(60));
    console.log('✓ Sync workflow test completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Sync workflow test failed!');
    console.error('='.repeat(60));
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// CLI execution
const sessionId = process.argv[2];

if (!sessionId) {
  console.error('Usage: pnpm tsx scripts/test-sync-workflow.ts <session-id>');
  console.error('\nEnvironment variables:');
  console.error('  API_BASE_URL - Strapi API URL (default: http://localhost:1337)');
  console.error('  STRAPI_API_TOKEN - Optional API token for authentication');
  process.exit(1);
}

testSyncWorkflow(sessionId);
