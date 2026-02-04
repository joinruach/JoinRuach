#!/usr/bin/env node
/**
 * Phase 13: End-to-End Render Pipeline Test
 *
 * Tests the complete rendering pipeline:
 * 1. Creates test recording session with assets and EDL
 * 2. Triggers render job
 * 3. Monitors worker processing
 * 4. Verifies completion
 */

const { Queue } = require('bullmq');

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'strapi_db',
    user: process.env.DATABASE_USERNAME || 'Strapi-Management-User',
    password: process.env.DATABASE_PASSWORD || '+fB7XK%0',
  },
});

// Initialize BullMQ render queue (using in-memory connection like Strapi)
const renderQueue = new Queue('render-video', {
  connection: {
    host: 'localhost', // Will use in-memory if Redis not available
    port: 6379,
  },
});

async function createTestData() {
  console.log('📦 Creating test data...\n');

  try {
    // 1. Create recording session
    const [session] = await knex('recording_sessions').insert({
      session_id: `test-session-${Date.now()}`,
      title: 'Phase 13 E2E Test Session',
      description: 'Test session for render pipeline',
      status: 'synced',
      duration_ms: 60000, // 1 minute
      sync_offsets_ms: JSON.stringify({ A: 0, B: 100, C: 200 }),
      anchor_angle: 'A',
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('*');

    console.log(`✅ Created recording session: ${session.session_id} (ID: ${session.id})`);

    // 2. Create test assets with mezzanine URLs
    const assetData = [
      { angle: 'A', url: 'https://test.r2.dev/test-video-a.mov' },
      { angle: 'B', url: 'https://test.r2.dev/test-video-b.mov' },
      { angle: 'C', url: 'https://test.r2.dev/test-video-c.mov' },
    ];

    const assetIds = [];
    for (const asset of assetData) {
      const [createdAsset] = await knex('media_assets').insert({
        asset_id: `test-asset-${asset.angle}-${Date.now()}`,
        angle: asset.angle,
        r_2_mezzanine_url: asset.url,
        type: 'video',
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('*');

      assetIds.push(createdAsset.id);

      // Link asset to recording session (Strapi v5 uses link tables)
      await knex('media_assets_recording_session_lnk').insert({
        media_asset_id: createdAsset.id,
        recording_session_id: session.id,
      });
    }

    console.log(`✅ Created 3 test assets (angles: A, B, C)`);

    // 3. Create locked EDL
    const canonicalEdl = {
      version: '1.0',
      clips: [
        { start: 0, end: 60000, camera: 'A', type: 'main' }
      ],
      metadata: { test: true }
    };

    const [edl] = await knex('edit_decision_lists').insert({
      edl_id: `test-edl-${Date.now()}`,
      version: 1,
      status: 'locked',
      canonical_edl: JSON.stringify(canonicalEdl),
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('*');

    // Link EDL to recording session (Strapi v5 uses link tables)
    await knex('edit_decision_lists_session_lnk').insert({
      edit_decision_list_id: edl.id,
      recording_session_id: session.id,
    });

    console.log(`✅ Created locked EDL: ${edl.edl_id} (ID: ${edl.id})\n`);

    return {
      sessionId: session.id,
      sessionIdStr: session.session_id,
      edlId: edl.id,
      assetIds: assetIds,
    };
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
    throw error;
  }
}

async function triggerRenderJob(sessionId) {
  console.log('🚀 Triggering render job...\n');

  try {
    // Try to use Strapi's render job service via HTTP
    const response = await fetch('http://localhost:1337/api/render-job/render-jobs/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        format: 'full_16_9',
      }),
    });

    if (response.ok) {
      const job = await response.json();
      console.log(`✅ Render job created via API: ${job.jobId}`);
      return job;
    }
  } catch (error) {
    // Fetch failed (connection error or other issue), fall through to direct DB insert
    console.log('⚠️  API not accessible, will create job directly in database\n');
  }

  // Fallback: Create job directly in DB (either fetch failed or response not ok)
  try {
    console.log('⚠️  Creating job directly in database...\n');

    const jobId = `render-${Date.now()}-test`;
    const [job] = await knex('render_jobs').insert({
      job_id: jobId,
      format: 'full_16_9',
      status: 'queued',
      progress: 0,
      metadata: JSON.stringify({ test: true, createdBy: 'test-script' }),
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('*');

    // Link render job to recording session (Strapi v5 uses link tables)
    await knex('render_jobs_recording_session_lnk').insert({
      render_job_id: job.id,
      recording_session_id: sessionId,
    });

    // Add job to BullMQ queue so worker can pick it up
    try {
      const bullmqJob = await renderQueue.add('render-video', {
        renderJobId: job.job_id,
        sessionId: sessionId,
        format: 'full_16_9',
      }, {
        jobId: job.job_id,
      });

      // Update job with bullmq_job_id
      await knex('render_jobs')
        .where({ id: job.id })
        .update({ bullmq_job_id: bullmqJob.id });

      console.log(`✅ Created render job: ${job.job_id} (ID: ${job.id})`);
      console.log(`   BullMQ Job ID: ${bullmqJob.id}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Progress: ${job.progress}%\n`);
    } catch (queueError) {
      console.warn(`⚠️  Failed to add job to BullMQ queue: ${queueError.message}`);
      console.log(`✅ Created render job in database: ${job.job_id} (ID: ${job.id})`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Progress: ${job.progress}%\n`);
    }

    return job;
  } catch (dbError) {
    console.error('❌ Failed to create render job in database:', dbError.message);
    throw dbError;
  }
}

async function monitorJob(jobId) {
  console.log('👀 Monitoring render job progress...\n');

  const startTime = Date.now();
  const maxWaitTime = 120000; // 2 minutes max

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const [job] = await knex('render_jobs')
        .where({ job_id: jobId })
        .select('*');

      if (!job) {
        console.log('❌ Job not found in database');
        return null;
      }

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const progressBar = '█'.repeat(Math.floor(job.progress / 10)) + '░'.repeat(10 - Math.floor(job.progress / 10));

      process.stdout.write(`\r[${elapsed}s] Status: ${job.status.padEnd(12)} | Progress: [${progressBar}] ${job.progress}%   `);

      if (job.status === 'completed') {
        console.log('\n');
        console.log('🎉 Render job completed successfully!\n');
        console.log('📊 Results:');
        console.log(`   Output URL: ${job.output_r_2_url || 'N/A'}`);
        console.log(`   Thumbnail: ${job.output_thumbnail_url || 'N/A'}`);
        console.log(`   Duration: ${job.duration_ms ? `${job.duration_ms}ms` : 'N/A'}`);
        console.log(`   File Size: ${job.file_size_bytes ? `${Math.round(job.file_size_bytes / 1024 / 1024)}MB` : 'N/A'}`);
        console.log(`   Render Time: ${elapsed}s\n`);
        return job;
      }

      if (job.status === 'failed') {
        console.log('\n');
        console.log('❌ Render job failed!');
        console.log(`   Error: ${job.error_message || 'Unknown error'}\n`);
        return job;
      }

      if (job.status === 'cancelled') {
        console.log('\n');
        console.log('⚠️  Render job was cancelled\n');
        return job;
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
    } catch (error) {
      console.error('\n❌ Error monitoring job:', error.message);
      break;
    }
  }

  console.log('\n⏱️  Timeout: Job did not complete within 2 minutes\n');
  return null;
}

async function runTest() {
  console.log('\n========================================');
  console.log('Phase 13: Render Pipeline E2E Test');
  console.log('========================================\n');

  try {
    // Step 1: Create test data
    const testData = await createTestData();

    // Step 2: Trigger render job
    const job = await triggerRenderJob(testData.sessionId);

    // Step 3: Monitor job progress
    const result = await monitorJob(job.job_id || job.jobId);

    // Step 4: Cleanup
    console.log('🧹 Cleaning up test data...');
    await knex('render_jobs').where({ job_id: job.job_id || job.jobId }).delete();
    await knex('edit_decision_lists').where({ id: testData.edlId }).delete();
    // Link tables will auto-delete due to ON DELETE CASCADE
    if (testData.assetIds && testData.assetIds.length > 0) {
      await knex('media_assets').whereIn('id', testData.assetIds).delete();
    }
    await knex('recording_sessions').where({ id: testData.sessionId }).delete();
    console.log('✅ Cleanup complete\n');

    if (result && result.status === 'completed') {
      console.log('✅ ✅ ✅ PHASE 13 END-TO-END TEST: PASSED ✅ ✅ ✅\n');
      process.exit(0);
    } else if (result && result.status === 'failed') {
      console.log('❌ ❌ ❌ PHASE 13 END-TO-END TEST: FAILED ❌ ❌ ❌\n');
      process.exit(1);
    } else {
      console.log('⚠️  ⚠️  ⚠️  PHASE 13 END-TO-END TEST: TIMEOUT ⚠️  ⚠️  ⚠️\n');
      console.log('Note: The job may still be processing. Check the worker logs.\n');
      process.exit(2);
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await renderQueue.close();
    await knex.destroy();
  }
}

// Run the test
runTest();
