import type { Core } from '@strapi/strapi';
import { v4 as uuidv4 } from 'uuid';
import { mockProvider } from '../../../services/transcription/providers/mock-provider';
import { transcriptAlignmentService } from '../../../services/transcription/transcript-alignment-service';
import { subtitleGenerator } from '../../../services/transcription/subtitle-generator';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async transcribeSession(sessionId: string, options: any = {}) {
    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId,
      { populate: ['assets', 'transcript'] }
    );

    if (!session) throw new Error(`Session not found: ${sessionId}`);
    if (session.transcript) throw new Error('Transcript already exists');
    if (session.status !== 'synced' && session.status !== 'editing') {
      throw new Error('Session must be synced before transcription');
    }

    const masterAsset = session.assets?.find((a: any) => a.angle === session.anchorAngle);
    if (!masterAsset) throw new Error(`Master asset not found`);

    const audioUrl = masterAsset.r2_mezzanine_url || masterAsset.r2_original_url;
    const provider = options.provider || 'mock';
    const { providerJobId } = await mockProvider.startJob({
      mediaUrl: audioUrl,
      diarization: options.diarization !== false,
      language: options.language || 'en',
    });

    const transcript = await strapi.entityService.create(
      'api::library-transcription.library-transcription',
      {
        data: {
          transcriptionId: uuidv4(),
          status: 'QUEUED',
          provider,
          providerJobId,
          hasDiarization: true,
          language: 'en',
          sourceAssetId: masterAsset.id,
          syncOffsets_ms: session.syncOffsets_ms || {},
          segments: [],
          durationSeconds: Math.floor((masterAsset.duration_ms || 0) / 1000),
        },
      }
    );

    await strapi.entityService.update(
      'api::recording-session.recording-session',
      sessionId,
      { data: { transcript: transcript.id } }
    );

    // Process synchronously in development
    if (process.env.NODE_ENV === 'development') {
      await this.processTranscriptJob(transcript.id, providerJobId);
    }

    return { transcriptId: transcript.id, status: 'QUEUED' };
  },

  async getTranscript(sessionId: string) {
    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId,
      { populate: ['transcript'] }
    );

    if (!session?.transcript) return null;

    return await strapi.entityService.findOne(
      'api::library-transcription.library-transcription',
      session.transcript.id
    );
  },

  async getSubtitle(sessionId: string, camera: string, format: 'SRT' | 'VTT') {
    const transcript = await this.getTranscript(sessionId);
    if (!transcript) throw new Error('Transcript not found');
    if (transcript.status !== 'ALIGNED') throw new Error('Transcript not aligned yet');

    return subtitleGenerator.generate({
      segments: transcript.segments,
      format: format.toLowerCase() as 'srt' | 'vtt',
    });
  },

  async processTranscriptJob(transcriptId: string, providerJobId: string) {
    try {
      await strapi.entityService.update(
        'api::library-transcription.library-transcription',
        transcriptId,
        { data: { status: 'PROCESSING' } }
      );

      // Poll provider
      for (let i = 0; i < 30; i++) {
        const { status } = await mockProvider.getJobStatus({ providerJobId });
        if (status === 'COMPLETED') break;
        if (status === 'FAILED') throw new Error('Provider job failed');
        await new Promise((r) => setTimeout(r, 2000));
      }

      const result = await mockProvider.fetchResult({ providerJobId });

      await strapi.entityService.update(
        'api::library-transcription.library-transcription',
        transcriptId,
        {
          data: {
            status: 'RAW_READY',
            segments: result.segments,
            words: result.words,
            language: result.language,
          },
        }
      );

      const transcript = await strapi.entityService.findOne(
        'api::library-transcription.library-transcription',
        transcriptId
      );

      // Fetch source asset to get its angle (A/B/C) for offset lookup
      const sourceAsset = await strapi.entityService.findOne(
        'api::media-asset.media-asset',
        transcript.sourceAssetId,
        { fields: ['id', 'angle'] }
      );

      const angleKey = (sourceAsset as any)?.angle;
      const masterOffset = (angleKey && transcript.syncOffsets_ms?.[angleKey])
        ? transcript.syncOffsets_ms[angleKey]
        : 0;

      strapi.log.info(
        `[transcript-service] Applying alignment: angle=${angleKey}, offset=${masterOffset}ms`
      );

      const aligned = transcriptAlignmentService.alignTranscript({
        transcript: { segments: result.segments, words: result.words },
        offsetMs: masterOffset,
      });

      const transcriptText = aligned.segments.map((s) => s.text).join(' ');

      await strapi.entityService.update(
        'api::library-transcription.library-transcription',
        transcriptId,
        {
          data: {
            status: 'ALIGNED',
            segments: aligned.segments,
            words: aligned.words,
            transcriptText,
          },
        }
      );

      strapi.log.info(`[transcript-service] Job ${providerJobId} completed`);
    } catch (error) {
      strapi.log.error('[transcript-service] Job failed:', error);
      await strapi.entityService.update(
        'api::library-transcription.library-transcription',
        transcriptId,
        {
          data: {
            status: 'FAILED',
            metadata: {
              error: {
                code: 'PROCESSING_FAILED',
                message: error instanceof Error ? error.message : 'Unknown',
              },
            },
          },
        }
      );
      throw error;
    }
  },
});
