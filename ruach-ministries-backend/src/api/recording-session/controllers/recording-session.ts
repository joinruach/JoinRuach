/**
 * recording-session controller
 */

import { factories } from '@strapi/strapi';

/** Safely parse JSONB that may come back as a string from knex */
function parseJsonb<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export default factories.createCoreController(
  'api::recording-session.recording-session',
  ({ strapi }) => ({
    /**
     * GET /api/recording-sessions/:id/assets
     * Returns media assets linked to this session
     */
    async findAssets(ctx) {
      const { id } = ctx.params;

      const knex = strapi.db.connection;

      // Look up session by document_id, then get linked assets
      const assets = await knex('recording_sessions_assets_lnk as lnk')
        .join('recording_sessions as rs', 'rs.id', 'lnk.recording_session_id')
        .join('media_assets as ma', 'ma.id', 'lnk.media_asset_id')
        .where('rs.document_id', id)
        .select('ma.*')
        .orderBy('lnk.media_asset_ord', 'asc');

      // Map to camelCase for frontend AssetSchema
      const mapped = assets.map((a) => ({
        id: a.id,
        documentId: a.document_id,
        assetId: a.asset_id,
        angle: a.angle,
        filename: a.asset_id,
        r2_key: a.r_2_original_url,
        r2_proxy_url: a.r_2_proxy_url,
        r2_mezzanine_url: a.r_2_mezzanine_url,
        r2_audio_wav_url: null,
        transcodingStatus: 'complete',
        uploadStatus: 'complete',
        durationMs: a.duration_ms,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      }));

      return { data: mapped };
    },

    /**
     * GET /api/recording-sessions/:id/transcript
     * Returns the transcript linked to this session
     */
    async findTranscript(ctx) {
      const { id } = ctx.params;

      const knex = strapi.db.connection;
      const row = await knex('recording_sessions_transcript_lnk as lnk')
        .join('recording_sessions as rs', 'rs.id', 'lnk.recording_session_id')
        .join('library_transcriptions as lt', 'lt.id', 'lnk.library_transcription_id')
        .where('rs.document_id', id)
        .select('lt.*')
        .first();

      if (!row) {
        return { data: { transcript: null } };
      }

      const transcript = {
        id: row.id,
        transcriptionId: row.transcription_id,
        status: row.status,
        provider: row.provider,
        providerJobId: row.provider_job_id,
        hasDiarization: row.has_diarization ?? false,
        language: row.language,
        sourceAssetId: 1,
        syncOffsets_ms: parseJsonb(row.sync_offsets_ms, {}),
        segments: parseJsonb(row.segments, []),
        words: row.words ? parseJsonb(row.words, undefined) : undefined,
        transcriptText: row.transcript_text,
        durationSeconds: row.duration_seconds,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: parseJsonb(row.metadata, {}),
      };

      return { data: { transcript } };
    },

    /**
     * GET /api/recording-sessions/:id/edl
     * Returns the EDL for this session
     */
    async findEDL(ctx) {
      const { id } = ctx.params;

      const knex = strapi.db.connection;
      const row = await knex('edit_decision_lists')
        .where('edl_id', `edl-${id}`)
        .first();

      if (!row) {
        return ctx.notFound('EDL not found');
      }

      const canonicalEdl = parseJsonb<Record<string, unknown>>(row.canonical_edl, {});
      const tracks = (canonicalEdl.tracks as Record<string, unknown>) || { program: [], chapters: [] };
      const metrics = (canonicalEdl.metrics as Record<string, unknown>) || {
        totalCuts: 0,
        avgShotLength: 0,
        cameraDistribution: {},
      };

      return {
        id: row.id,
        sessionId: id,
        version: row.version,
        status: row.status,
        durationMs: (canonicalEdl.durationMs as number) || 0,
        tracks,
        metrics,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        approvedBy: null,
        approvedAt: null,
      };
    },
  })
);
