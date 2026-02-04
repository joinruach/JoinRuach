import type { Core } from "@strapi/strapi";
import SyncEngine from "../../../services/sync-engine";

/**
 * Phase 9: Recording Session Sync Service
 *
 * Strapi service wrapper for sync-engine
 * Provides Strapi-friendly interface to audio sync functionality
 */

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Trigger sync analysis for a recording session
   *
   * @param sessionId - Recording session ID
   * @param masterCamera - Optional master camera override
   * @returns Sync results with offsets and confidence
   */
  async syncSession(sessionId: string, masterCamera?: string) {
    try {
      strapi.log.info(`[sync-service] Starting sync for session ${sessionId}`);

      // Update status to 'syncing'
      await strapi.entityService.update(
        'api::recording-session.recording-session',
        sessionId,
        {
          data: { status: 'syncing' }
        }
      );

      // Run sync engine
      const result = await SyncEngine.detectSync(sessionId, strapi, masterCamera);

      strapi.log.info(
        `[sync-service] Sync completed for session ${sessionId}. All reliable: ${result.allReliable}`
      );

      return result;
    } catch (error) {
      strapi.log.error(
        `[sync-service] Sync failed for session ${sessionId}:`,
        error instanceof Error ? error.message : error
      );

      // Update status back to draft on failure
      await strapi.entityService.update(
        'api::recording-session.recording-session',
        sessionId,
        {
          data: { status: 'draft' }
        }
      );

      throw error;
    }
  },

  /**
   * Get sync results for a session
   *
   * @param sessionId - Recording session ID
   * @returns Sync offsets, confidence, and operator status
   */
  async getSyncResults(sessionId: string) {
    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId
    ) as any;

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Classify each camera's confidence
    const classification: Record<string, string> = {};
    if (session.syncConfidence) {
      for (const [camera, score] of Object.entries(session.syncConfidence)) {
        classification[camera] = SyncEngine._classifyConfidence(score as number);
      }
    }

    return {
      sessionId,
      masterCamera: session.anchorAngle,
      offsets: session.syncOffsets_ms || {},
      confidence: session.syncConfidence || {},
      classification,
      operatorStatus: session.operatorStatus || 'pending',
      status: session.status
    };
  },

  /**
   * Approve sync offsets (operator confirms they look good)
   *
   * @param sessionId - Recording session ID
   * @param approvedBy - User ID who approved
   * @param notes - Optional approval notes
   */
  async approveSync(sessionId: string, approvedBy?: string, notes?: string) {
    strapi.log.info(`[sync-service] Approving sync for session ${sessionId}`);

    await strapi.entityService.update(
      'api::recording-session.recording-session',
      sessionId,
      {
        data: {
          operatorStatus: 'approved',
          status: 'synced',
          metadata: {
            syncApprovedBy: approvedBy,
            syncApprovedAt: new Date().toISOString(),
            syncApprovalNotes: notes
          }
        }
      }
    );

    return this.getSyncResults(sessionId);
  },

  /**
   * Correct sync offsets (operator manually adjusts)
   *
   * @param sessionId - Recording session ID
   * @param correctedOffsets - Manually corrected offsets in milliseconds
   * @param correctedBy - User ID who made corrections
   * @param notes - Optional correction notes
   */
  async correctSync(
    sessionId: string,
    correctedOffsets: Record<string, number>,
    correctedBy?: string,
    notes?: string
  ) {
    strapi.log.info(`[sync-service] Correcting sync for session ${sessionId}`);

    // Get current session to preserve original offsets
    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId
    ) as any;

    await strapi.entityService.update(
      'api::recording-session.recording-session',
      sessionId,
      {
        data: {
          syncOffsets_ms: correctedOffsets,
          operatorStatus: 'corrected',
          status: 'synced',
          metadata: {
            ...session.metadata,
            originalSyncOffsets_ms: session.syncOffsets_ms, // Preserve original
            syncCorrectedBy: correctedBy,
            syncCorrectedAt: new Date().toISOString(),
            syncCorrectionNotes: notes
          }
        }
      }
    );

    return this.getSyncResults(sessionId);
  }
});
