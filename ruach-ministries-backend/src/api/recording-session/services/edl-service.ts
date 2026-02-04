import type { Core } from '@strapi/strapi';
import EDLGenerator from '../../../services/edl-generator';
import type { EDLGenerationOptions } from '../../../types/canonical-edl';
import { createHash } from 'crypto';

/**
 * Phase 11: Recording Session EDL Service
 *
 * Strapi service wrapper for EDL generation and workflow management
 */

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Generate EDL for a recording session
   *
   * @param sessionId - Recording session ID
   * @param options - Generation options
   * @returns EDL metadata
   */
  async computeEDL(sessionId: string, options?: Partial<EDLGenerationOptions>) {
    try {
      strapi.log.info(`[edl-service] Computing EDL for session ${sessionId}`);

      // Load session with existing EDL
      const session = await strapi.entityService.findOne(
        'api::recording-session.recording-session',
        sessionId,
        {
          populate: ['assets', 'transcript', 'edl']
        }
      ) as any;

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Check if EDL exists and is locked
      if (session.edl && session.edl.status === 'locked') {
        throw new Error(
          `EDL for session ${sessionId} is locked. Cannot regenerate locked EDLs.`
        );
      }

      // Generate EDL
      const generator = new EDLGenerator();
      const canonicalEdl = await generator.generateEDL(sessionId, strapi, options);
      // Strapi JSON fields expect plain objects; cast to JSON-serialisable shape
      const canonicalEdlJson = canonicalEdl as unknown as any;

      // Calculate hashes for audit
      const transcriptHash = this.calculateHash(
        JSON.stringify(session.transcript?.metadata?.masterTranscript || {})
      );
      const assetsHash = this.calculateHash(
        JSON.stringify(session.assets.map((a: any) => ({ id: a.id, angle: a.angle })))
      );

      // Create or update EDL entity
      let edlEntity;
      if (session.edl) {
        // Update existing EDL
        edlEntity = await strapi.entityService.update(
          'api::edit-decision-list.edit-decision-list',
          session.edl.id,
          {
            data: {
              version: session.edl.version + 1,
              status: 'draft',
              source: 'ai',
              canonicalEdl: canonicalEdlJson,
              audit: {
                generatedAt: new Date().toISOString(),
                options,
                transcriptHash,
                assetsHash,
                generator: 'EDLGenerator v1.0'
              },
              metadata: {
                regenerated: true,
                previousVersion: session.edl.version
              }
            }
          }
        ) as any;
      } else {
        // Create new EDL
        edlEntity = await strapi.entityService.create(
          'api::edit-decision-list.edit-decision-list',
          {
            data: {
              edlId: `edl-${sessionId}`,
              session: session.id,
              version: 1,
              status: 'draft',
              source: 'ai',
              timebase: 'ms',
              canonicalEdl: canonicalEdlJson,
              audit: {
                generatedAt: new Date().toISOString(),
                options,
                transcriptHash,
                assetsHash,
                generator: 'EDLGenerator v1.0'
              },
              metadata: {}
            }
          }
        ) as any;

        // Link to session
        await strapi.entityService.update(
          'api::recording-session.recording-session',
          sessionId,
          {
            data: { edl: edlEntity.id }
          }
        );
      }

      // Update session status
      await strapi.entityService.update(
        'api::recording-session.recording-session',
        sessionId,
        {
          data: { status: 'editing' }
        }
      );

      strapi.log.info(
        `[edl-service] EDL generated for session ${sessionId}: ` +
        `${canonicalEdl.metrics?.cutCount} cuts, ${canonicalEdl.tracks.chapters?.length || 0} chapters`
      );

      return {
        sessionId,
        edlId: edlEntity.edlId,
        version: edlEntity.version,
        status: edlEntity.status,
        cutCount: canonicalEdl.metrics?.cutCount || 0,
        chapterCount: canonicalEdl.tracks.chapters?.length || 0,
        avgShotLengthMs: canonicalEdl.metrics?.avgShotLenMs || 0,
        confidence: canonicalEdl.metrics?.confidence || 0
      };
    } catch (error) {
      strapi.log.error(
        `[edl-service] EDL computation failed for session ${sessionId}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  },

  /**
   * Get EDL for a session
   *
   * @param sessionId - Recording session ID
   * @returns EDL data
   */
  async getEDL(sessionId: string) {
    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId,
      {
        populate: ['edl']
      }
    ) as any;

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.edl) {
      throw new Error(`Session ${sessionId} has no EDL. Run compute first.`);
    }

    const edl = session.edl;

    return {
      sessionId,
      edlId: edl.edlId,
      version: edl.version,
      status: edl.status,
      source: edl.source,
      canonicalEdl: edl.canonicalEdl,
      audit: edl.audit,
      metadata: edl.metadata
    };
  },

  /**
   * Approve EDL for use
   *
   * @param sessionId - Recording session ID
   * @param approvedBy - User ID who approved
   * @param notes - Optional approval notes
   * @returns Updated EDL data
   */
  async approveEDL(sessionId: string, approvedBy?: string, notes?: string) {
    strapi.log.info(`[edl-service] Approving EDL for session ${sessionId}`);

    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId,
      {
        populate: ['edl']
      }
    ) as any;

    if (!session || !session.edl) {
      throw new Error(`Session ${sessionId} has no EDL to approve`);
    }

    const edl = session.edl;

    // Update EDL status
    await strapi.entityService.update(
      'api::edit-decision-list.edit-decision-list',
      edl.id,
      {
        data: {
          status: 'approved',
          metadata: {
            ...edl.metadata,
            approvedBy,
            approvedAt: new Date().toISOString(),
            approvalNotes: notes
          }
        }
      }
    );

    return this.getEDL(sessionId);
  },

  /**
   * Lock EDL for rendering (immutable)
   *
   * @param sessionId - Recording session ID
   * @param lockedBy - User ID who locked
   * @param notes - Optional lock notes
   * @returns Updated EDL data
   */
  async lockEDL(sessionId: string, lockedBy?: string, notes?: string) {
    strapi.log.info(`[edl-service] Locking EDL for session ${sessionId}`);

    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId,
      {
        populate: ['edl']
      }
    ) as any;

    if (!session || !session.edl) {
      throw new Error(`Session ${sessionId} has no EDL to lock`);
    }

    const edl = session.edl;

    // Verify EDL is approved
    if (edl.status !== 'approved') {
      throw new Error(
        `Cannot lock EDL for session ${sessionId}. EDL must be approved first (current status: ${edl.status}).`
      );
    }

    // Lock EDL
    await strapi.entityService.update(
      'api::edit-decision-list.edit-decision-list',
      edl.id,
      {
        data: {
          status: 'locked',
          metadata: {
            ...edl.metadata,
            lockedBy,
            lockedAt: new Date().toISOString(),
            lockNotes: notes
          }
        }
      }
    );

    // Update session status to rendering
    await strapi.entityService.update(
      'api::recording-session.recording-session',
      sessionId,
      {
        data: { status: 'rendering' }
      }
    );

    return this.getEDL(sessionId);
  },

  /**
   * Calculate hash for audit trail
   */
  calculateHash(data: string): string {
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }
});
