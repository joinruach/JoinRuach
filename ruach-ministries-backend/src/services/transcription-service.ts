import { AssemblyAI } from 'assemblyai';
import type { Core } from '@strapi/strapi';

/**
 * Phase 10: Transcription Service
 *
 * Integrates with AssemblyAI to transcribe master camera audio
 * with speaker diarization and word-level timestamps
 */

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface TranscriptSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
  words: WordTimestamp[];
}

export interface TranscriptionResult {
  segments: TranscriptSegment[];
  speakerCount: number;
  averageConfidence: number;
  lowConfidenceSegments: number;
}

export default class TranscriptionService {
  private client: AssemblyAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ASSEMBLYAI_API_KEY;
    if (!key) {
      throw new Error('AssemblyAI API key is required. Set ASSEMBLYAI_API_KEY environment variable.');
    }
    this.client = new AssemblyAI({ apiKey: key });
  }

  /**
   * Transcribe a recording session's master camera audio
   *
   * @param sessionId - Recording session ID
   * @param strapi - Strapi instance
   * @returns Transcription result with segments and metadata
   */
  async transcribeSession(sessionId: string, strapi: Core.Strapi): Promise<TranscriptionResult> {
    try {
      strapi.log.info(`[transcription-service] Starting transcription for session ${sessionId}`);

      // Load session with assets
      const session = await strapi.entityService.findOne(
        'api::recording-session.recording-session',
        sessionId,
        {
          populate: ['assets']
        }
      ) as any;

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (!session.assets || session.assets.length === 0) {
        throw new Error(`Session ${sessionId} has no assets`);
      }

      // Get master camera audio URL
      const masterCamera = session.anchorAngle || 'A';
      const masterAsset = session.assets.find((asset: any) => asset.angle === masterCamera);

      if (!masterAsset) {
        throw new Error(`Master camera ${masterCamera} asset not found for session ${sessionId}`);
      }

      if (!masterAsset.r2_audio_wav_url) {
        throw new Error(`Master camera ${masterCamera} has no audio WAV URL`);
      }

      const audioUrl = masterAsset.r2_audio_wav_url;
      strapi.log.info(`[transcription-service] Transcribing audio from ${audioUrl}`);

      // Call AssemblyAI API
      const transcript = await this.client.transcripts.transcribe({
        audio_url: audioUrl,
        speaker_labels: true,
        language_code: 'en'
      });

      // Check for errors
      if (transcript.status === 'error') {
        throw new Error(`AssemblyAI transcription failed: ${transcript.error}`);
      }

      if (!transcript.words || transcript.words.length === 0) {
        throw new Error('No words found in transcript');
      }

      // Group words into segments by speaker
      const segments: TranscriptSegment[] = [];
      let currentSegment: TranscriptSegment | null = null;

      for (const word of transcript.words) {
        const wordData: WordTimestamp = {
          word: word.text,
          start: word.start,
          end: word.end,
          confidence: word.confidence,
          speaker: word.speaker || undefined
        };

        // Start new segment if speaker changes or first word
        if (!currentSegment || currentSegment.speaker !== (word.speaker || 'Unknown')) {
          if (currentSegment) {
            segments.push(currentSegment);
          }

          currentSegment = {
            speaker: word.speaker || 'Unknown',
            start: word.start,
            end: word.end,
            text: word.text,
            words: [wordData]
          };
        } else {
          // Add word to current segment
          currentSegment.end = word.end;
          currentSegment.text += ' ' + word.text;
          currentSegment.words.push(wordData);
        }
      }

      // Push final segment
      if (currentSegment) {
        segments.push(currentSegment);
      }

      // Calculate metadata
      const uniqueSpeakers = new Set(segments.map(s => s.speaker));
      const speakerCount = uniqueSpeakers.size;

      const allWords = segments.flatMap(s => s.words);
      const averageConfidence = allWords.reduce((sum, w) => sum + w.confidence, 0) / allWords.length;

      const lowConfidenceSegments = segments.filter(s => {
        const segmentAvgConfidence = s.words.reduce((sum, w) => sum + w.confidence, 0) / s.words.length;
        return segmentAvgConfidence < 0.7;
      }).length;

      strapi.log.info(
        `[transcription-service] Transcription complete for session ${sessionId}: ` +
        `${segments.length} segments, ${speakerCount} speakers, ${averageConfidence.toFixed(2)} avg confidence`
      );

      return {
        segments,
        speakerCount,
        averageConfidence,
        lowConfidenceSegments
      };
    } catch (error) {
      strapi.log.error(
        `[transcription-service] Transcription failed for session ${sessionId}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }
}
