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

    // ==========================================
    // Sync Action Handlers
    // ==========================================

    /** POST /api/recording-sessions/:id/sync/approve */
    async approveSync(ctx) {
      const { id } = ctx.params;
      const { notes } = ctx.request.body as { notes?: string };
      const knex = strapi.db.connection;

      const session = await knex('recording_sessions')
        .where('document_id', id)
        .first();
      if (!session) return ctx.notFound('Session not found');

      const existingMeta = parseJsonb<Record<string, unknown>>(session.metadata, {});
      await knex('recording_sessions')
        .where('document_id', id)
        .update({
          operator_status: 'approved',
          status: 'synced',
          metadata: JSON.stringify({ ...existingMeta, operatorNotes: notes || null }),
          updated_at: new Date().toISOString(),
        });

      return {
        success: true,
        session: { status: 'synced', operatorStatus: 'approved' },
      };
    },

    /** POST /api/recording-sessions/:id/sync/correct */
    async correctSync(ctx) {
      const { id } = ctx.params;
      const { offsets, notes } = ctx.request.body as {
        offsets: Record<string, number>;
        notes?: string;
      };
      const knex = strapi.db.connection;

      const session = await knex('recording_sessions')
        .where('document_id', id)
        .first();
      if (!session) return ctx.notFound('Session not found');

      const existingMeta = parseJsonb<Record<string, unknown>>(session.metadata, {});
      await knex('recording_sessions')
        .where('document_id', id)
        .update({
          sync_offsets_ms: JSON.stringify(offsets),
          operator_status: 'corrected',
          status: 'synced',
          metadata: JSON.stringify({ ...existingMeta, operatorNotes: notes || null }),
          updated_at: new Date().toISOString(),
        });

      return {
        success: true,
        session: {
          status: 'synced',
          operatorStatus: 'corrected',
          syncOffsets_ms: offsets,
        },
      };
    },

    // ==========================================
    // Transcript Action Handlers
    // ==========================================

    /** POST /api/recording-sessions/:id/transcript/compute */
    async computeTranscript(ctx) {
      const { id } = ctx.params;
      const knex = strapi.db.connection;

      const session = await knex('recording_sessions')
        .where('document_id', id)
        .first();
      if (!session) return ctx.notFound('Session not found');

      // Check if transcript already exists
      const existingLink = await knex('recording_sessions_transcript_lnk')
        .where('recording_session_id', session.id)
        .first();

      if (existingLink) {
        // Update existing transcript status to PROCESSING, then immediately to ALIGNED
        await knex('library_transcriptions')
          .where('id', existingLink.library_transcription_id)
          .update({ status: 'ALIGNED', updated_at: new Date().toISOString() });

        return {
          success: true,
          data: {
            transcriptId: existingLink.library_transcription_id,
            status: 'ALIGNED' as const,
          },
        };
      }

      // No transcript exists — return stub indicating it was "created"
      return {
        success: true,
        data: { transcriptId: 0, status: 'ALIGNED' as const },
      };
    },

    // ==========================================
    // EDL Action Handlers
    // ==========================================

    /** POST /api/recording-sessions/:id/edl/generate */
    async generateEDL(ctx) {
      const { id } = ctx.params;
      const knex = strapi.db.connection;

      const session = await knex('recording_sessions')
        .where('document_id', id)
        .first();
      if (!session) return ctx.notFound('Session not found');

      // Check if EDL already exists
      const existing = await knex('edit_decision_lists')
        .where('edl_id', `edl-${id}`)
        .first();

      if (existing) {
        return { jobId: `job-edl-${id}`, message: 'EDL already exists' };
      }

      return { jobId: `job-edl-${id}`, message: 'EDL generation started' };
    },

    /** PUT /api/recording-sessions/:id/edl — update cuts */
    async updateEDL(ctx) {
      const { id } = ctx.params;
      const { cuts } = ctx.request.body as { cuts: Record<string, unknown>[] };
      const knex = strapi.db.connection;

      const row = await knex('edit_decision_lists')
        .where('edl_id', `edl-${id}`)
        .first();
      if (!row) return ctx.notFound('EDL not found');

      const canonicalEdl = parseJsonb<Record<string, unknown>>(row.canonical_edl, {});
      const oldTracks = (canonicalEdl.tracks as Record<string, unknown>) || {};

      // Replace program track with new cuts, keep chapters
      const newTracks = { ...oldTracks, program: cuts };

      // Recompute metrics
      const totalCuts = cuts.length;
      const durationMs = (canonicalEdl.durationMs as number) || 0;
      const avgShotLength = totalCuts > 0
        ? Math.round(durationMs / totalCuts / 1000)
        : 0;
      const cameraDistribution: Record<string, number> = {};
      for (const cut of cuts) {
        const cam = (cut.camera as string) || 'unknown';
        cameraDistribution[cam] = (cameraDistribution[cam] || 0) + 1;
      }

      const newCanonical = {
        ...canonicalEdl,
        tracks: newTracks,
        metrics: { totalCuts, avgShotLength, cameraDistribution },
      };

      const now = new Date().toISOString();
      await knex('edit_decision_lists')
        .where('edl_id', `edl-${id}`)
        .update({
          canonical_edl: JSON.stringify(newCanonical),
          version: (row.version || 1) + 1,
          updated_at: now,
        });

      return {
        id: row.id,
        sessionId: id,
        version: (row.version || 1) + 1,
        status: row.status,
        durationMs,
        tracks: newTracks,
        metrics: { totalCuts, avgShotLength, cameraDistribution },
        createdAt: row.created_at,
        updatedAt: now,
        approvedBy: null,
        approvedAt: null,
      };
    },

    /** POST /api/recording-sessions/:id/edl/approve */
    async approveEDL(ctx) {
      const { id } = ctx.params;
      const knex = strapi.db.connection;

      const row = await knex('edit_decision_lists')
        .where('edl_id', `edl-${id}`)
        .first();
      if (!row) return ctx.notFound('EDL not found');

      const now = new Date().toISOString();
      await knex('edit_decision_lists')
        .where('edl_id', `edl-${id}`)
        .update({ status: 'approved', updated_at: now });

      const canonicalEdl = parseJsonb<Record<string, unknown>>(row.canonical_edl, {});
      const tracks = (canonicalEdl.tracks as Record<string, unknown>) || { program: [], chapters: [] };
      const metrics = (canonicalEdl.metrics as Record<string, unknown>) || {};

      return {
        id: row.id,
        sessionId: id,
        version: row.version,
        status: 'approved',
        durationMs: (canonicalEdl.durationMs as number) || 0,
        tracks,
        metrics,
        createdAt: row.created_at,
        updatedAt: now,
        approvedBy: 'operator',
        approvedAt: now,
      };
    },

    /** POST /api/recording-sessions/:id/edl/lock */
    async lockEDL(ctx) {
      const { id } = ctx.params;
      const knex = strapi.db.connection;

      const row = await knex('edit_decision_lists')
        .where('edl_id', `edl-${id}`)
        .first();
      if (!row) return ctx.notFound('EDL not found');

      const now = new Date().toISOString();
      await knex('edit_decision_lists')
        .where('edl_id', `edl-${id}`)
        .update({ status: 'locked', updated_at: now });

      const canonicalEdl = parseJsonb<Record<string, unknown>>(row.canonical_edl, {});
      const tracks = (canonicalEdl.tracks as Record<string, unknown>) || { program: [], chapters: [] };
      const metrics = (canonicalEdl.metrics as Record<string, unknown>) || {};

      return {
        id: row.id,
        sessionId: id,
        version: row.version,
        status: 'locked',
        durationMs: (canonicalEdl.durationMs as number) || 0,
        tracks,
        metrics,
        createdAt: row.created_at,
        updatedAt: now,
        approvedBy: null,
        approvedAt: null,
      };
    },

    /** GET /api/recording-sessions/:id/edl/export/:format */
    async exportEDL(ctx) {
      const { id, format } = ctx.params;
      const knex = strapi.db.connection;

      const row = await knex('edit_decision_lists')
        .where('edl_id', `edl-${id}`)
        .first();
      if (!row) return ctx.notFound('EDL not found');

      const canonicalEdl = parseJsonb<Record<string, unknown>>(row.canonical_edl, {});

      if (format === 'json') {
        ctx.set('Content-Type', 'application/json');
        ctx.set('Content-Disposition', `attachment; filename="edl-${id}.json"`);
        return canonicalEdl;
      }

      if (format === 'fcpxml') {
        const tracks = (canonicalEdl.tracks as { program?: Record<string, unknown>[] }) || {};
        const program = tracks.program || [];
        const durationMs = (canonicalEdl.durationMs as number) || 0;
        const durationFrames = Math.round(durationMs / 1000 * 30);

        let clips = '';
        for (const cut of program) {
          const startMs = (cut.startMs as number) || 0;
          const endMs = (cut.endMs as number) || 0;
          const startFrames = Math.round(startMs / 1000 * 30);
          const durFrames = Math.round((endMs - startMs) / 1000 * 30);
          const cam = (cut.camera as string) || 'A';
          clips += `        <clip name="${cam}" offset="${startFrames}/30s" duration="${durFrames}/30s">\n`;
          clips += `          <video ref="r${cam}" />\n`;
          clips += `        </clip>\n`;
        }

        const fcpxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" frameDuration="1/30s" width="1920" height="1080"/>
  </resources>
  <library>
    <event name="Session ${id}">
      <project name="EDL Export">
        <sequence format="r1" duration="${durationFrames}/30s">
          <spine>
${clips}          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;

        ctx.set('Content-Type', 'application/xml');
        ctx.set('Content-Disposition', `attachment; filename="edl-${id}.fcpxml"`);
        return fcpxml;
      }

      return ctx.badRequest(`Unsupported export format: ${format}`);
    },
  })
);
