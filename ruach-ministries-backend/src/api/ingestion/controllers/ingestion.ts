import type { Core } from '@strapi/strapi';
import { enqueueIngestion } from '../../../services/unified-ingestion-queue';
import crypto from 'crypto';

/**
 * POST /api/ingestion/enqueue
 * Enqueue an ingestion job
 */
export async function enqueue(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  try {
    const {
      contentType,
      sourceId,
      versionId,
      fileUrl,
      fileType,
      fileHash,
      fileSizeBytes,
      ingestionParams,
    } = ctx.request.body;

    if (!contentType || !sourceId || !versionId || !fileUrl) {
      return ctx.badRequest('Missing required fields: contentType, sourceId, versionId, fileUrl');
    }

    // Create or get source record
    const db = strapi.db.connection;
    let source = await db('scripture_sources')
      .where({ source_id: sourceId })
      .first();

    if (!source) {
      // Create new source
      const [sourceIdResult] = await db('scripture_sources')
        .insert({
          source_id: sourceId,
          slug: sourceId.replace(/:/g, '-'),
          title: sourceId.split(':')[1] || sourceId,
          file_url: fileUrl,
          file_type: fileType || 'pdf',
          file_size_bytes: fileSizeBytes,
          file_sha256: fileHash,
          testament_scope: ingestionParams?.testament || 'all',
          metadata: JSON.stringify({}),
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id');

      source = { id: sourceIdResult.id, source_id: sourceId };
    }

    // Calculate determinism key
    const parserVersion = '1.0.0';
    const determinismKey = crypto
      .createHash('sha256')
      .update(
        `${parserVersion}${JSON.stringify(ingestionParams)}${fileHash}`
      )
      .digest('hex');

    // Check if version already exists
    const existingVersion = await db('scripture_versions')
      .where({ determinism_key: determinismKey })
      .first();

    if (existingVersion) {
      return ctx.conflict('Version with this content already exists');
    }

    // Create version record
    const [versionRecord] = await db('scripture_versions')
      .insert({
        version_id: versionId,
        source_id: source.id,
        parser_version: parserVersion,
        ingestion_params: JSON.stringify(ingestionParams || {}),
        determinism_key: determinismKey,
        status: 'pending',
        progress: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('id');

    // Build job payload
    let job: any;
    if (contentType === 'scripture') {
      job = {
        contentType: 'scripture',
        sourceId,
        versionId,
        fileUrl,
        fileType: fileType || 'pdf',
        scriptureParams: {
          testament: ingestionParams?.testament || 'all',
          preserveFormatting: ingestionParams?.preserveFormatting ?? true,
          validateCanonical: ingestionParams?.validateCanonical ?? true,
        },
      };
    } else if (contentType === 'canon') {
      job = {
        contentType: 'canon',
        sourceId,
        versionId,
        fileUrl,
        fileType: fileType || 'pdf',
        canonParams: {
          bookSlug: sourceId.split(':')[1] || 'unknown',
          maxNodeChars: 10000,
          formationPhases: ingestionParams?.formationPhases,
          axioms: ingestionParams?.axioms,
        },
      };
    } else {
      job = {
        contentType: 'library',
        sourceId,
        versionId,
        fileUrl,
        fileType: fileType || 'pdf',
        libraryParams: {
          maxChars: 50000,
          maxTokens: 10000,
          includeToc: true,
          enableEmbeddings: true,
        },
      };
    }

    // Enqueue job
    const jobId = await enqueueIngestion(job);

    ctx.body = {
      success: true,
      jobId,
      versionId,
      status: 'pending',
    };
  } catch (error) {
    strapi.log.error('[ingestion] Enqueue failed', error);
    ctx.internalServerError('Failed to enqueue ingestion job');
  }
}

/**
 * GET /api/ingestion/versions
 * List ingestion versions with filters
 */
export async function listVersions(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  try {
    const { status, contentType, versionId } = ctx.query;
    const db = strapi.db.connection;

    let query = db('scripture_versions')
      .join('scripture_sources', 'scripture_versions.source_id', 'scripture_sources.id')
      .select(
        'scripture_versions.*',
        'scripture_sources.source_id',
        'scripture_sources.title as source_title'
      );

    if (status) {
      query = query.where('scripture_versions.status', status);
    }

    if (versionId) {
      query = query.where('scripture_versions.version_id', versionId);
    }

    // Filter by content type via source_id pattern
    if (contentType === 'scripture') {
      query = query.where('scripture_sources.source_id', 'like', 'scr:%');
    } else if (contentType === 'canon') {
      query = query.where('scripture_sources.source_id', 'like', 'canon:%');
    } else if (contentType === 'library') {
      query = query.where('scripture_sources.source_id', 'like', 'lib:%');
    }

    const versions = await query.orderBy('scripture_versions.created_at', 'desc');

    // Parse JSON fields
    const formattedVersions = versions.map((v: any) => ({
      versionId: v.version_id,
      sourceId: v.source_id,
      contentType: v.source_id.startsWith('scr:')
        ? 'scripture'
        : v.source_id.startsWith('canon:')
          ? 'canon'
          : 'library',
      status: v.status,
      progress: v.progress,
      qaMetrics: v.qa_metrics ? JSON.parse(v.qa_metrics) : null,
      createdAt: v.created_at,
      completedAt: v.completed_at,
    }));

    ctx.body = {
      versions: formattedVersions,
    };
  } catch (error) {
    strapi.log.error('[ingestion] List versions failed', error);
    ctx.internalServerError('Failed to list versions');
  }
}

/**
 * POST /api/ingestion/review
 * Submit a review action (approve/reject/needs_review)
 */
export async function submitReview(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  try {
    const { versionId, action, notes, reviewData } = ctx.request.body;
    const user = ctx.state.user;

    if (!versionId || !action) {
      return ctx.badRequest('Missing required fields: versionId, action');
    }

    if (!['approved', 'rejected', 'needs_review'].includes(action)) {
      return ctx.badRequest('Invalid action. Must be: approved, rejected, or needs_review');
    }

    const db = strapi.db.connection;

    // Create review action record
    await db('scripture_review_actions').insert({
      version_id: versionId,
      reviewer_id: user?.id || null,
      action,
      notes,
      review_data: JSON.stringify(reviewData || {}),
      created_at: new Date(),
    });

    // Update version status
    const updateData: any = {
      status: action === 'approved' ? 'reviewing' : action === 'rejected' ? 'failed' : 'reviewing',
      reviewed_at: new Date(),
      updated_at: new Date(),
    };

    if (action === 'approved') {
      updateData.status = 'reviewing'; // Will transition to processing when import starts
    }

    await db('scripture_versions')
      .where({ version_id: versionId })
      .update(updateData);

    // If approved, trigger import (queue will handle it)
    if (action === 'approved') {
      // The queue worker will check review status and import if approved
      strapi.log.info(`[ingestion] Review approved for ${versionId}, import will be triggered`);
    }

    ctx.body = {
      success: true,
      versionId,
      action,
      status: updateData.status,
    };
  } catch (error) {
    strapi.log.error('[ingestion] Submit review failed', error);
    ctx.internalServerError('Failed to submit review');
  }
}

// Export as default object for Strapi controller
export default {
  enqueue,
  listVersions,
  submitReview,
};
