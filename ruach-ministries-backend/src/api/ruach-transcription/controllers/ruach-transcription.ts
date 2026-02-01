/**
 * Ruach Transcription Controller
 * API endpoints for audio/video transcription with Whisper API
 */

import type { Core } from '@strapi/strapi';

/**
 * POST /api/ruach-transcription/transcribe
 * Queue a new transcription job
 */
export async function transcribe(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { sourceMediaId, mediaUrl, audioBase64, language } = ctx.request.body;

    // Validate required fields
    if (!sourceMediaId) {
      return ctx.badRequest('sourceMediaId is required');
    }

    if (!mediaUrl && !audioBase64) {
      return ctx.badRequest('Either mediaUrl or audioBase64 is required');
    }

    // Validate media item exists
    const entityService = strapi.entityService as any;
    const mediaItem = await entityService.findOne('api::media-item.media-item', sourceMediaId);

    if (!mediaItem) {
      return ctx.notFound('Media item not found');
    }

    // Queue transcription job
    const transcriptionService = strapi.service('api::library.ruach-transcription') as any;
    const transcriptionId = await transcriptionService.queueTranscription({
      sourceMediaId,
      mediaUrl,
      audioBase64,
      language: language || 'en',
    });

    ctx.body = {
      transcriptionId,
      status: 'pending',
      message: 'Transcription queued for processing',
    };
  } catch (error: any) {
    strapi.log.error('[ruach-transcription] Transcription queuing failed', error);

    ctx.status = 500;
    ctx.body = {
      status: 'error',
      error: error.message || 'Failed to queue transcription',
      details: error.stack,
    };
  }
}

/**
 * GET /api/ruach-transcription/:id
 * Get transcription status and results
 */
export async function getTranscription(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { id } = ctx.params;

    const transcriptionService = strapi.service('api::library.ruach-transcription') as any;
    const transcription = await transcriptionService.getTranscription(id);

    ctx.body = {
      data: transcription,
    };
  } catch (error: any) {
    strapi.log.error('[ruach-transcription] Failed to get transcription', error);

    if (error.message.includes('not found')) {
      return ctx.notFound('Transcription not found');
    }

    ctx.status = 500;
    ctx.body = {
      status: 'error',
      error: error.message || 'Failed to get transcription',
    };
  }
}

/**
 * POST /api/ruach-transcription/:id/summarize
 * Generate or regenerate summary from existing transcript
 */
export async function regenerateSummary(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { id } = ctx.params;

    const transcriptionService = strapi.service('api::library.ruach-transcription') as any;
    const summary = await transcriptionService.regenerateSummary(id);

    ctx.body = {
      transcriptionId: id,
      summary,
      message: 'Summary generated successfully',
    };
  } catch (error: any) {
    strapi.log.error('[ruach-transcription] Summary generation failed', error);

    if (error.message.includes('not found')) {
      return ctx.notFound('Transcription not found');
    }

    ctx.status = 500;
    ctx.body = {
      status: 'error',
      error: error.message || 'Failed to generate summary',
    };
  }
}

/**
 * GET /api/ruach-transcription/media/:mediaId
 * Get transcription for a media item
 */
export async function getMediaTranscription(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { mediaId } = ctx.params;

    const entityService = strapi.entityService as any;

    // Find transcription by media ID
    const transcriptions = await entityService.findMany('api::library-transcription.library-transcription', {
      filters: { sourceMediaId: mediaId },
      sort: { createdAt: 'desc' },
      limit: 1,
    });

    const transcription = transcriptions?.[0];

    if (!transcription) {
      return ctx.notFound('No transcription found for this media');
    }

    ctx.body = {
      data: {
        transcriptionId: transcription.transcriptionId,
        status: transcription.status,
        transcriptText: transcription.transcriptText,
        transcriptVTT: transcription.transcriptVTT,
        transcriptSRT: transcription.transcriptSRT,
        summary: transcription.summary,
        keyMoments: transcription.keyMoments || [],
        durationSeconds: transcription.durationSeconds,
        language: transcription.language,
        confidence: transcription.confidence,
        createdAt: transcription.createdAt,
        updatedAt: transcription.updatedAt,
      },
    };
  } catch (error: any) {
    strapi.log.error('[ruach-transcription] Failed to get media transcription', error);

    ctx.status = 500;
    ctx.body = {
      status: 'error',
      error: error.message || 'Failed to get transcription',
    };
  }
}

/**
 * GET /api/ruach-transcription/:id/vtt
 * Download transcription as VTT file
 */
export async function downloadVTT(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { id } = ctx.params;

    const transcriptionService = strapi.service('api::library.ruach-transcription') as any;
    const transcription = await transcriptionService.getTranscription(id);

    if (!transcription.transcriptVTT) {
      return ctx.badRequest('No VTT transcription available');
    }

    ctx.set('Content-Type', 'text/vtt');
    ctx.set('Content-Disposition', `attachment; filename="transcription-${id}.vtt"`);
    ctx.body = transcription.transcriptVTT;
  } catch (error: any) {
    strapi.log.error('[ruach-transcription] Failed to download VTT', error);

    if (error.message.includes('not found')) {
      return ctx.notFound('Transcription not found');
    }

    ctx.status = 500;
    ctx.body = { error: error.message || 'Failed to download VTT' };
  }
}

/**
 * GET /api/ruach-transcription/:id/srt
 * Download transcription as SRT file
 */
export async function downloadSRT(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { id } = ctx.params;

    const transcriptionService = strapi.service('api::library.ruach-transcription') as any;
    const transcription = await transcriptionService.getTranscription(id);

    if (!transcription.transcriptSRT) {
      return ctx.badRequest('No SRT transcription available');
    }

    ctx.set('Content-Type', 'text/plain');
    ctx.set('Content-Disposition', `attachment; filename="transcription-${id}.srt"`);
    ctx.body = transcription.transcriptSRT;
  } catch (error: any) {
    strapi.log.error('[ruach-transcription] Failed to download SRT', error);

    if (error.message.includes('not found')) {
      return ctx.notFound('Transcription not found');
    }

    ctx.status = 500;
    ctx.body = { error: error.message || 'Failed to download SRT' };
  }
}

export default {
  transcribe,
  getTranscription,
  regenerateSummary,
  getMediaTranscription,
  downloadVTT,
  downloadSRT,
};
