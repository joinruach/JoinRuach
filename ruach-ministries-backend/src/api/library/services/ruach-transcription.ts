/**
 * Ruach Transcription Service
 * OpenAI Whisper API integration with job queuing, subtitle generation, and GPT-4 summarization
 * Pattern: Queue → Transcribe → Generate Subtitles → Summarize → Store
 */

import type { Core } from '@strapi/strapi';
import { Queue, Worker } from 'bullmq';
import { redisClient } from '../../../services/redis-client';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';
const OPENAI_GPT_URL = 'https://api.openai.com/v1/chat/completions';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface TranscriptionJob {
  id: string;
  sourceMediaId: string;
  mediaUrl?: string;
  audioBase64?: string;
  language?: string;
  timestamp?: number;
}

interface TranscriptionResult {
  text: string;
  duration: number;
  language: string;
  confidence?: number;
}

interface KeyMoment {
  timestamp: number;
  endTimestamp?: number;
  description: string;
  confidence?: number;
}

interface Segment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export default ({ strapi }: { strapi: Core.Strapi }) => {
  let transcriptionQueue: Queue | null = null;
  let worker: Worker | null = null;

  /**
   * Initialize the transcription queue and worker
   */
  async function initializeQueue() {
    if (transcriptionQueue) {
      return;
    }

    // Ensure Redis is connected
    const redisConnected = await redisClient.connect();

    if (!redisConnected && !redisClient.useUpstash) {
      strapi.log.warn('[Transcription] Redis not available, using in-memory queue');
      // Fall back to immediate processing
      return;
    }

    try {
      const connection = redisClient.client || undefined;

      transcriptionQueue = new Queue('transcription', {
        connection: connection as any,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 3600, // Remove completed jobs after 1 hour
          },
        },
      });

      // Create worker to process jobs
      worker = new Worker('transcription', transcriptionProcessHandler, {
        connection: connection as any,
        concurrency: 3, // Process up to 3 transcriptions concurrently
      });

      worker.on('completed', async (job) => {
        strapi.log.info(`[Transcription] Job ${job.id} completed`);
      });

      worker.on('failed', async (job, err) => {
        strapi.log.error(`[Transcription] Job ${job.id} failed:`, err);
        // Update transcription status in database
        if (job?.data?.sourceMediaId) {
          await updateTranscriptionStatus(job.data.sourceMediaId, 'failed', {
            error: err.message,
          });
        }
      });

      strapi.log.info('[Transcription] Queue and worker initialized');
    } catch (error) {
      strapi.log.error('[Transcription] Failed to initialize queue:', error);
    }
  }

  /**
   * Worker handler for processing transcription jobs
   */
  const transcriptionProcessHandler = async (job: any) => {
    const { sourceMediaId, mediaUrl, audioBase64, language = 'en' } = job.data;

    strapi.log.info(`[Transcription] Processing job ${job.id} for media ${sourceMediaId}`);

    try {
      // Update status to processing
      await updateTranscriptionStatus(sourceMediaId, 'processing');

      // 1. Transcribe audio using Whisper
      const transcriptionResult = await transcribeAudio(mediaUrl || audioBase64, language);

      // 2. Generate subtitle files (SRT and VTT)
      const subtitles = await generateSubtitles(transcriptionResult);

      // 3. Extract key moments from transcript
      const keyMoments = await extractKeyMoments(
        transcriptionResult.text,
        transcriptionResult.segments || []
      );

      // 4. Generate summary using Claude
      const summary = await generateSummary(transcriptionResult.text);

      // 5. Save transcription results
      const transcriptionRecord = await saveTranscription({
        sourceMediaId,
        transcriptText: transcriptionResult.text,
        transcriptVTT: subtitles.vtt,
        transcriptSRT: subtitles.srt,
        durationSeconds: transcriptionResult.duration,
        language: transcriptionResult.language,
        confidence: transcriptionResult.confidence,
        keyMoments,
        summary,
        status: 'completed',
      });

      return {
        transcriptionId: transcriptionRecord.transcriptionId,
        status: 'completed',
        durationSeconds: transcriptionResult.duration,
        summary,
        keyMomentCount: keyMoments.length,
      };
    } catch (error: any) {
      strapi.log.error(`[Transcription] Job ${job.id} error:`, error);
      await updateTranscriptionStatus(sourceMediaId, 'failed', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  };

  /**
   * Queue a new transcription job
   */
  async function queueTranscription(request: {
    sourceMediaId: string;
    mediaUrl?: string;
    audioBase64?: string;
    language?: string;
  }): Promise<string> {
    // Initialize queue if needed
    await initializeQueue();

    const entityService = strapi.entityService as any;
    const crypto = await import('crypto');
    const transcriptionId = crypto.randomUUID();

    // Create pending transcription record
    const transcription = await entityService.create('api::library-transcription.library-transcription', {
      data: {
        transcriptionId,
        sourceMediaId: request.sourceMediaId,
        status: 'pending',
        durationSeconds: 0,
        language: request.language || 'en',
      },
    });

    // Add to queue or process immediately if no queue
    if (transcriptionQueue) {
      const job = await transcriptionQueue.add('transcribe', {
        sourceMediaId: request.sourceMediaId,
        mediaUrl: request.mediaUrl,
        audioBase64: request.audioBase64,
        language: request.language || 'en',
        transcriptionId,
      });

      strapi.log.info(`[Transcription] Queued job ${job.id} for media ${request.sourceMediaId}`);
    } else {
      // Process immediately if no queue available
      strapi.log.info(`[Transcription] Processing immediately for media ${request.sourceMediaId}`);
      transcriptionProcessHandler({
        id: transcriptionId,
        data: {
          sourceMediaId: request.sourceMediaId,
          mediaUrl: request.mediaUrl,
          audioBase64: request.audioBase64,
          language: request.language || 'en',
        },
      }).catch((error) => {
        strapi.log.error('[Transcription] Immediate processing failed:', error);
      });
    }

    return transcriptionId;
  }

  /**
   * Get transcription status and results
   */
  async function getTranscription(transcriptionId: string) {
    const entityService = strapi.entityService as any;

    const transcriptions = await entityService.findMany('api::library-transcription.library-transcription', {
      filters: { transcriptionId },
      populate: ['sourceMediaId'],
    });

    const transcription = transcriptions?.[0];

    if (!transcription) {
      throw new Error(`Transcription ${transcriptionId} not found`);
    }

    return {
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
      sourceMedia: transcription.sourceMediaId,
    };
  }

  /**
   * Generate summary from transcript using Claude
   */
  async function generateSummary(transcript: string): Promise<string> {
    if (!CLAUDE_API_KEY) {
      strapi.log.warn('[Transcription] Claude API key not configured, skipping summary');
      return '';
    }

    try {
      // Limit transcript to avoid token limits
      const truncatedTranscript = transcript.substring(0, 8000);

      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-20250805',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `Please provide a concise 2-3 paragraph summary of the following transcript:

${truncatedTranscript}

Focus on the main themes, key points, and spiritual significance.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} ${errorText}`);
      }

      const result = (await response.json()) as {
        content?: Array<{ text?: string }>;
      };

      return result.content?.[0]?.text || '';
    } catch (error) {
      strapi.log.error('[Transcription] Summary generation failed:', error);
      return '';
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  async function transcribeAudio(
    input: string,
    language: string
  ): Promise<TranscriptionResult & { segments?: Segment[] }> {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    try {
      // Prepare form data
      const formData = new (await import('form-data')).default();

      if (input.startsWith('http')) {
        // Download file from URL
        const response = await fetch(input);
        const buffer = await response.arrayBuffer();
        formData.append('file', Buffer.from(buffer), 'audio.mp4');
      } else {
        // Use base64 audio
        const buffer = Buffer.from(input, 'base64');
        formData.append('file', buffer, 'audio.mp3');
      }

      formData.append('model', 'whisper-1');
      formData.append('language', language);
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities', 'segment');

      const response = await fetch(OPENAI_WHISPER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API error: ${response.status} ${errorText}`);
      }

      const result = (await response.json()) as {
        text: string;
        duration: number;
        language: string;
        segments?: Segment[];
      };

      return {
        text: result.text,
        duration: result.duration || 0,
        language: result.language || language,
        segments: result.segments || [],
        confidence: 0.95, // Whisper doesn't provide overall confidence
      };
    } catch (error) {
      strapi.log.error('[Transcription] Whisper transcription failed:', error);
      throw error;
    }
  }

  /**
   * Generate VTT and SRT subtitle files
   */
  async function generateSubtitles(
    result: TranscriptionResult & { segments?: Segment[] }
  ): Promise<{ vtt: string; srt: string }> {
    const segments = result.segments || [];

    if (segments.length === 0) {
      return { vtt: '', srt: '' };
    }

    // Generate VTT format
    let vttContent = 'WEBVTT\n\n';
    // Generate SRT format
    let srtContent = '';

    segments.forEach((segment, index) => {
      const startTime = formatTimestamp(segment.start, 'vtt');
      const endTime = formatTimestamp(segment.end, 'vtt');
      const startTimeSRT = formatTimestamp(segment.start, 'srt');
      const endTimeSRT = formatTimestamp(segment.end, 'srt');
      const text = segment.text.trim();

      // VTT format
      vttContent += `${startTime} --> ${endTime}\n${text}\n\n`;

      // SRT format
      srtContent += `${index + 1}\n${startTimeSRT} --> ${endTimeSRT}\n${text}\n\n`;
    });

    return { vtt: vttContent, srt: srtContent };
  }

  /**
   * Format timestamp for subtitle files
   */
  function formatTimestamp(seconds: number, format: 'vtt' | 'srt'): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.round((seconds % 1) * 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const padMs = (n: number) => n.toString().padStart(3, '0');

    if (format === 'vtt') {
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${padMs(milliseconds)}`;
    } else {
      // SRT format uses commas for milliseconds
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${padMs(milliseconds)}`;
    }
  }

  /**
   * Extract key moments from transcript
   */
  async function extractKeyMoments(
    transcript: string,
    segments: Segment[]
  ): Promise<KeyMoment[]> {
    if (!CLAUDE_API_KEY || !segments.length) {
      return [];
    }

    try {
      // Limit transcript to avoid token limits
      const truncatedTranscript = transcript.substring(0, 6000);

      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-20250805',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Analyze the following transcript and identify 3-5 key moments or important segments. For each moment, provide:
1. The start time in seconds
2. A brief description (1-2 sentences) of why this moment is significant

Return as JSON array with objects containing: {"timestamp": number, "endTimestamp": number, "description": string, "confidence": number}

Transcript:
${truncatedTranscript}

Focus on moments that are theologically significant, contain important teachings, or are particularly relevant to spiritual growth.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const result = (await response.json()) as {
        content?: Array<{ text?: string }>;
      };

      const content = result.content?.[0]?.text || '[]';

      // Parse JSON from Claude response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const moments = JSON.parse(jsonMatch[0]) as KeyMoment[];
        return moments.slice(0, 5); // Limit to 5 key moments
      }

      return [];
    } catch (error) {
      strapi.log.warn('[Transcription] Key moment extraction failed:', error);
      return [];
    }
  }

  /**
   * Update transcription status
   */
  async function updateTranscriptionStatus(
    sourceMediaId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    metadata?: Record<string, any>
  ) {
    const entityService = strapi.entityService as any;

    const transcriptions = await entityService.findMany('api::library-transcription.library-transcription', {
      filters: { sourceMediaId },
    });

    if (transcriptions?.[0]) {
      await entityService.update(
        'api::library-transcription.library-transcription',
        transcriptions[0].id,
        {
          data: {
            status,
            ...(metadata && { metadata }),
          },
        }
      );
    }
  }

  /**
   * Save transcription record to database
   */
  async function saveTranscription(data: {
    sourceMediaId: string;
    transcriptText: string;
    transcriptVTT: string;
    transcriptSRT: string;
    durationSeconds: number;
    language: string;
    confidence?: number;
    keyMoments: KeyMoment[];
    summary: string;
    status: string;
  }) {
    const entityService = strapi.entityService as any;

    const transcriptions = await entityService.findMany('api::library-transcription.library-transcription', {
      filters: { sourceMediaId: data.sourceMediaId },
    });

    if (transcriptions?.[0]) {
      const updated = await entityService.update(
        'api::library-transcription.library-transcription',
        transcriptions[0].id,
        {
          data: {
            transcriptText: data.transcriptText,
            transcriptVTT: data.transcriptVTT,
            transcriptSRT: data.transcriptSRT,
            summary: data.summary,
            keyMoments: data.keyMoments,
            durationSeconds: data.durationSeconds,
            language: data.language,
            confidence: data.confidence || 0.95,
            status: data.status,
          },
        }
      );

      return updated;
    }

    // Create new transcription if not found
    const created = await entityService.create('api::library-transcription.library-transcription', {
      data: {
        transcriptionId: (await import('crypto')).randomUUID(),
        sourceMediaId: data.sourceMediaId,
        transcriptText: data.transcriptText,
        transcriptVTT: data.transcriptVTT,
        transcriptSRT: data.transcriptSRT,
        summary: data.summary,
        keyMoments: data.keyMoments,
        durationSeconds: data.durationSeconds,
        language: data.language,
        confidence: data.confidence || 0.95,
        status: data.status,
      },
    });

    return created;
  }

  /**
   * Regenerate summary for existing transcription
   */
  async function regenerateSummary(transcriptionId: string): Promise<string> {
    const entityService = strapi.entityService as any;

    const transcriptions = await entityService.findMany('api::library-transcription.library-transcription', {
      filters: { transcriptionId },
    });

    if (!transcriptions?.[0]) {
      throw new Error(`Transcription ${transcriptionId} not found`);
    }

    const transcription = transcriptions[0];

    if (!transcription.transcriptText) {
      throw new Error('No transcript available for summarization');
    }

    const summary = await generateSummary(transcription.transcriptText);

    await entityService.update('api::library-transcription.library-transcription', transcription.id, {
      data: { summary },
    });

    return summary;
  }

  /**
   * Cleanup and shutdown
   */
  async function shutdown() {
    if (worker) {
      await worker.close();
    }
    if (transcriptionQueue) {
      await transcriptionQueue.close();
    }
  }

  // Initialize queue on startup
  initializeQueue().catch((error) => {
    strapi.log.warn('[Transcription] Failed to initialize queue on startup:', error);
  });

  return {
    queueTranscription,
    getTranscription,
    generateSummary,
    regenerateSummary,
    shutdown,
  };
};
