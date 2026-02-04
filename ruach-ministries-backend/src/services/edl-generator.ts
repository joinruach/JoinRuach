import type { Core } from '@strapi/strapi';
import type { CanonicalEDL, EDLGenerationOptions } from '../types/canonical-edl';
import CameraSwitcher from './camera-switcher';
import ChapterGenerator from './chapter-generator';
import EDLValidator from './edl-validator';

/**
 * Phase 11: EDL Generator
 *
 * Main orchestrator for generating Canonical EDL from session data
 */

export default class EDLGenerator {
  /**
   * Generate a Canonical EDL for a recording session
   *
   * @param sessionId - Recording session ID
   * @param strapi - Strapi instance
   * @param options - Generation options
   * @returns Complete Canonical EDL ready for storage
   */
  async generateEDL(
    sessionId: string,
    strapi: Core.Strapi,
    options?: Partial<EDLGenerationOptions>
  ): Promise<CanonicalEDL> {
    try {
      strapi.log.info(`[edl-generator] Starting EDL generation for session ${sessionId}`);

      // 1. Load session with all required data
      const session = await strapi.entityService.findOne(
        'api::recording-session.recording-session',
        sessionId,
        {
          populate: ['assets', 'transcript']
        }
      ) as any;

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // 2. Validate prerequisites
      this.validatePrerequisites(session, sessionId);

      // 3. Extract data
      const alignedTranscripts = session.transcript.metadata?.masterTranscript;
      const syncOffsets = session.syncOffsets_ms;
      const masterCamera = session.anchorAngle || 'A';
      const durationMs = session.duration_ms;

      // 4. Generate program track (camera cuts)
      strapi.log.info(`[edl-generator] Generating camera cuts for session ${sessionId}`);
      const programCuts = CameraSwitcher.generateCuts(
        alignedTranscripts,
        sessionId,
        masterCamera,
        durationMs,
        options
      );

      // 5. Generate chapters (if enabled)
      let chapters: CanonicalEDL['tracks']['chapters'] = undefined;
      if (options?.includeChapters !== false) {
        try {
          strapi.log.info(`[edl-generator] Generating chapters for session ${sessionId}`);
          const masterTranscript = alignedTranscripts[masterCamera];
          const chapterGenerator = new ChapterGenerator(process.env.ANTHROPIC_API_KEY);
          chapters = await chapterGenerator.generateChapters(masterTranscript, sessionId);
        } catch (error) {
          strapi.log.warn(
            `[edl-generator] Chapter generation failed for session ${sessionId}, continuing without chapters:`,
            error instanceof Error ? error.message : error
          );
          chapters = undefined;
        }
      }

      // 6. Build camera sources
      const sources: CanonicalEDL['sources'] = {};
      for (const asset of session.assets) {
        const camera = asset.angle;
        sources[camera] = {
          assetId: asset.id,
          proxyUrl: asset.r2_proxy_url || undefined,
          mezzanineUrl: asset.r2_mezzanine_url || undefined,
          offsetMs: syncOffsets[camera] || 0
        };
      }

      // 7. Calculate metrics
      const cutCount = programCuts.length;
      const avgShotLenMs = programCuts.reduce((sum, cut) => sum + (cut.endMs - cut.startMs), 0) / cutCount;
      const speakerSwitchCount = programCuts.filter(cut => cut.reason === 'speaker').length;
      const confidence = programCuts.reduce((sum, cut) => sum + (cut.confidence || 0), 0) / cutCount;

      // 8. Construct Canonical EDL
      const edl: CanonicalEDL = {
        schemaVersion: '1.0',
        sessionId,
        masterCamera: masterCamera as 'A' | 'B' | 'C',
        durationMs,
        fps: undefined, // Optional for now
        tracks: {
          program: programCuts,
          chapters,
          overlays: undefined, // Optional v1
          shorts: undefined // Optional v1
        },
        sources,
        metrics: {
          cutCount,
          avgShotLenMs,
          speakerSwitchCount,
          confidence
        }
      };

      // 9. Validate EDL
      strapi.log.info(`[edl-generator] Validating EDL for session ${sessionId}`);
      const validation = EDLValidator.validateEDL(edl, {
        minShotLengthMs: options?.minShotLengthMs,
        maxShotLengthMs: options?.maxShotLengthMs
      });

      if (!validation.valid) {
        throw new Error(
          `EDL validation failed for session ${sessionId}:\n${validation.errors.join('\n')}`
        );
      }

      if (validation.warnings.length > 0) {
        strapi.log.warn(
          `[edl-generator] EDL validation warnings for session ${sessionId}:\n${validation.warnings.join('\n')}`
        );
      }

      strapi.log.info(
        `[edl-generator] EDL generation complete for session ${sessionId}: ` +
        `${cutCount} cuts, ${chapters?.length || 0} chapters, ${avgShotLenMs.toFixed(0)}ms avg shot length`
      );

      return edl;
    } catch (error) {
      strapi.log.error(
        `[edl-generator] EDL generation failed for session ${sessionId}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }

  /**
   * Validate that session has all required data for EDL generation
   */
  private validatePrerequisites(session: any, sessionId: string): void {
    if (!session.syncOffsets_ms || Object.keys(session.syncOffsets_ms).length === 0) {
      throw new Error(
        `Session ${sessionId} has no sync offsets. Run Phase 9 sync first.`
      );
    }

    if (!session.transcript) {
      throw new Error(
        `Session ${sessionId} has no transcript. Run Phase 10 transcription first.`
      );
    }

    if (!session.transcript.metadata?.masterTranscript) {
      throw new Error(
        `Session ${sessionId} transcript has no aligned segments. Transcript may be incomplete.`
      );
    }

    if (!session.assets || session.assets.length === 0) {
      throw new Error(
        `Session ${sessionId} has no assets. Upload camera footage first.`
      );
    }

    if (!session.duration_ms || session.duration_ms <= 0) {
      throw new Error(
        `Session ${sessionId} has invalid duration: ${session.duration_ms}`
      );
    }
  }
}
