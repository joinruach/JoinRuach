import type { Core } from '@strapi/strapi';
import TranscriptionService from '../../../services/transcription-service';
import TranscriptAlignmentService from '../../../services/transcript-alignment-service';
import SubtitleGenerator from '../../../services/subtitle-generator';

/**
 * Phase 10: Recording Session Transcript Service
 *
 * Strapi service wrapper for transcription workflow
 * Orchestrates transcription, alignment, and subtitle generation
 */

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Trigger transcription for a recording session
   *
   * @param sessionId - Recording session ID
   * @returns Transcription metadata
   */
  async transcribeSession(sessionId: string) {
    try {
      strapi.log.info(`[transcript-service] Starting transcription for session ${sessionId}`);

      // Load session with assets and sync data
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

      if (!session.syncOffsets_ms || Object.keys(session.syncOffsets_ms).length === 0) {
        throw new Error(`Session ${sessionId} has no sync offsets. Run sync first.`);
      }

      // Update status to processing
      await strapi.entityService.update(
        'api::recording-session.recording-session',
        sessionId,
        {
          data: { status: 'synced' } // Keep as synced during transcription
        }
      );

      // Transcribe master camera
      const transcriptionService = new TranscriptionService(process.env.ASSEMBLYAI_API_KEY);
      const transcriptionResult = await transcriptionService.transcribeSession(sessionId, strapi);

      // Apply sync offsets to generate aligned transcripts for all cameras
      const alignedTranscripts = TranscriptAlignmentService.alignTranscripts(
        transcriptionResult.segments,
        session.syncOffsets_ms
      );

      // Create or update library-transcription entity
      let transcriptEntity;
      if (session.transcript) {
        // Update existing transcript
        transcriptEntity = await strapi.entityService.update(
          'api::library-transcription.library-transcription',
          session.transcript.id,
          {
            data: {
              status: 'completed',
              confidence: transcriptionResult.averageConfidence,
              metadata: {
                masterTranscript: alignedTranscripts,
                speakerCount: transcriptionResult.speakerCount,
                lowConfidenceSegments: transcriptionResult.lowConfidenceSegments,
                masterCamera: session.anchorAngle,
                cameras: Object.keys(alignedTranscripts),
                transcribedAt: new Date().toISOString()
              }
            }
          }
        );
      } else {
        // Create new transcript entity
        transcriptEntity = await strapi.entityService.create(
          'api::library-transcription.library-transcription',
          {
            data: {
              transcriptionId: `transcript-${sessionId}`,
              sourceMediaId: session.assets[0]?.id, // Link to first asset as reference
              status: 'completed',
              durationSeconds: Math.floor(session.duration_ms / 1000),
              language: 'en',
              confidence: transcriptionResult.averageConfidence,
              transcriptText: transcriptionResult.segments.map(s => s.text).join(' '),
              metadata: {
                masterTranscript: alignedTranscripts,
                speakerCount: transcriptionResult.speakerCount,
                lowConfidenceSegments: transcriptionResult.lowConfidenceSegments,
                masterCamera: session.anchorAngle,
                cameras: Object.keys(alignedTranscripts),
                transcribedAt: new Date().toISOString()
              }
            }
          }
        ) as any;

        // Link transcript to session
        await strapi.entityService.update(
          'api::recording-session.recording-session',
          sessionId,
          {
            data: { transcript: transcriptEntity.id }
          }
        );
      }

      strapi.log.info(
        `[transcript-service] Transcription complete for session ${sessionId}: ` +
        `${transcriptionResult.speakerCount} speakers, ${Object.keys(alignedTranscripts).length} cameras`
      );

      return {
        sessionId,
        speakerCount: transcriptionResult.speakerCount,
        confidence: transcriptionResult.averageConfidence,
        cameras: Object.keys(alignedTranscripts),
        lowConfidenceSegments: transcriptionResult.lowConfidenceSegments
      };
    } catch (error) {
      strapi.log.error(
        `[transcript-service] Transcription failed for session ${sessionId}:`,
        error instanceof Error ? error.message : error
      );

      // Update session status to indicate failure
      await strapi.entityService.update(
        'api::recording-session.recording-session',
        sessionId,
        {
          data: {
            status: 'synced', // Revert to synced so user can retry
            metadata: {
              transcriptionError: error instanceof Error ? error.message : 'Unknown error',
              transcriptionFailedAt: new Date().toISOString()
            }
          }
        }
      );

      throw error;
    }
  },

  /**
   * Get transcript data for a session
   *
   * @param sessionId - Recording session ID
   * @returns Transcript data with aligned segments per camera
   */
  async getTranscript(sessionId: string) {
    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId,
      {
        populate: ['transcript']
      }
    ) as any;

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.transcript) {
      throw new Error(`Session ${sessionId} has no transcript. Run transcription first.`);
    }

    const transcript = session.transcript;

    return {
      sessionId,
      transcriptId: transcript.transcriptionId,
      status: transcript.status,
      speakerCount: transcript.metadata?.speakerCount || 0,
      confidence: transcript.confidence,
      cameras: transcript.metadata?.cameras || [],
      transcripts: transcript.metadata?.masterTranscript || {},
      lowConfidenceSegments: transcript.metadata?.lowConfidenceSegments || 0,
      transcribedAt: transcript.metadata?.transcribedAt
    };
  },

  /**
   * Get subtitle file (SRT or VTT) for a specific camera
   *
   * @param sessionId - Recording session ID
   * @param camera - Camera angle (e.g., 'A', 'B', 'C')
   * @param format - 'SRT' or 'VTT'
   * @returns Subtitle file content as string
   */
  async getSubtitle(sessionId: string, camera: string, format: 'SRT' | 'VTT'): Promise<string> {
    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId,
      {
        populate: ['transcript']
      }
    ) as any;

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.transcript) {
      throw new Error(`Session ${sessionId} has no transcript. Run transcription first.`);
    }

    const alignedTranscripts = session.transcript.metadata?.masterTranscript;
    if (!alignedTranscripts) {
      throw new Error(`Session ${sessionId} transcript has no aligned data`);
    }

    const cameraSegments = alignedTranscripts[camera];
    if (!cameraSegments) {
      throw new Error(`Camera ${camera} not found in session ${sessionId} transcripts`);
    }

    if (format === 'SRT') {
      return SubtitleGenerator.generateSRT(cameraSegments);
    } else {
      return SubtitleGenerator.generateVTT(cameraSegments);
    }
  }
});
