/**
 * Ruach Video Summarizer Service
 * Generates AI summaries with timestamps from video transcripts
 */

import type { Core } from '@strapi/strapi';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface TimestampedSegment {
  timestamp: string; // HH:MM:SS format
  startSeconds: number;
  endSeconds: number;
  title: string;
  summary: string;
  keyQuotes?: string[];
  scriptureReferences?: string[];
}

interface VideoSummary {
  videoId: string;
  title: string;
  overallSummary: string;
  keyTakeaways: string[];
  segments: TimestampedSegment[];
  scriptureReferences: string[];
  duration: string;
  generatedAt: string;
}

interface TranscriptChunk {
  text: string;
  startTime: number; // seconds
  endTime: number; // seconds
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Generate a comprehensive video summary with timestamps
   */
  async summarizeVideo(options: {
    mediaId: string;
    transcript?: string;
    transcriptChunks?: TranscriptChunk[];
    title?: string;
    segmentCount?: number;
    includeScripture?: boolean;
  }): Promise<VideoSummary> {
    const {
      mediaId,
      transcript,
      transcriptChunks,
      title,
      segmentCount = 5,
      includeScripture = true,
    } = options;

    // Get transcript if not provided
    let fullTranscript = transcript || '';
    let chunks = transcriptChunks || [];

    if (!fullTranscript && !chunks.length) {
      // Try to get transcript from transcription service
      const entityService = strapi.entityService as any;
      const transcriptions = await entityService.findMany('api::library-transcription.library-transcription', {
        filters: {
          sourceMediaId: mediaId,
          status: 'completed',
        },
        sort: { createdAt: 'desc' },
        limit: 1,
      });

      if (transcriptions?.length > 0) {
        fullTranscript = transcriptions[0].transcriptText;
        // Parse VTT if available for timestamps
        if (transcriptions[0].transcriptVTT) {
          chunks = this.parseVTT(transcriptions[0].transcriptVTT);
        }
      }
    }

    if (!fullTranscript && !chunks.length) {
      throw new Error('No transcript available for this video');
    }

    // Build the transcript text from chunks if needed
    if (!fullTranscript && chunks.length > 0) {
      fullTranscript = chunks.map(c => c.text).join(' ');
    }

    // Calculate duration
    const durationSeconds = chunks.length > 0
      ? Math.max(...chunks.map(c => c.endTime))
      : this.estimateDuration(fullTranscript);

    // Generate summary using Claude
    const summary = await this.generateSummaryWithClaude({
      transcript: fullTranscript,
      chunks,
      title: title || 'Untitled Video',
      segmentCount,
      includeScripture,
      durationSeconds,
    });

    // Save summary to database
    const savedSummary = await this.saveSummary(mediaId, summary);

    return savedSummary;
  },

  /**
   * Parse VTT file to extract timestamped chunks
   */
  parseVTT(vttContent: string): TranscriptChunk[] {
    const chunks: TranscriptChunk[] = [];
    const lines = vttContent.split('\n');

    let currentChunk: Partial<TranscriptChunk> | null = null;
    const timeRegex = /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip WEBVTT header and empty lines
      if (trimmedLine === 'WEBVTT' || trimmedLine === '') {
        if (currentChunk?.text) {
          chunks.push(currentChunk as TranscriptChunk);
          currentChunk = null;
        }
        continue;
      }

      // Check for timestamp line
      const timeMatch = trimmedLine.match(timeRegex);
      if (timeMatch) {
        // Save previous chunk
        if (currentChunk?.text) {
          chunks.push(currentChunk as TranscriptChunk);
        }

        // Start new chunk
        const startSeconds =
          parseInt(timeMatch[1]) * 3600 +
          parseInt(timeMatch[2]) * 60 +
          parseInt(timeMatch[3]) +
          parseInt(timeMatch[4]) / 1000;

        const endSeconds =
          parseInt(timeMatch[5]) * 3600 +
          parseInt(timeMatch[6]) * 60 +
          parseInt(timeMatch[7]) +
          parseInt(timeMatch[8]) / 1000;

        currentChunk = {
          startTime: startSeconds,
          endTime: endSeconds,
          text: '',
        };
        continue;
      }

      // Skip cue identifiers (numeric lines)
      if (/^\d+$/.test(trimmedLine)) {
        continue;
      }

      // Append text to current chunk
      if (currentChunk) {
        currentChunk.text = currentChunk.text
          ? `${currentChunk.text} ${trimmedLine}`
          : trimmedLine;
      }
    }

    // Don't forget the last chunk
    if (currentChunk?.text) {
      chunks.push(currentChunk as TranscriptChunk);
    }

    return chunks;
  },

  /**
   * Generate summary using Claude API
   */
  async generateSummaryWithClaude(options: {
    transcript: string;
    chunks: TranscriptChunk[];
    title: string;
    segmentCount: number;
    includeScripture: boolean;
    durationSeconds: number;
  }): Promise<Omit<VideoSummary, 'videoId' | 'generatedAt'>> {
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY not configured');
    }

    const { transcript, chunks, title, segmentCount, includeScripture, durationSeconds } = options;

    // Build timestamp context if we have chunks
    const timestampContext = chunks.length > 0
      ? this.buildTimestampContext(chunks)
      : 'No timestamps available.';

    const systemPrompt = `You are a biblical teaching video summarizer. Your task is to analyze video transcripts and create structured summaries with timestamps.

Guidelines:
1. Identify ${segmentCount} key segments or topics in the video
2. For each segment, provide a timestamp (HH:MM:SS), title, and brief summary
3. Extract 3-5 key takeaways from the entire video
4. ${includeScripture ? 'Identify all scripture references mentioned' : 'Do not extract scripture references'}
5. Write an overall summary of 2-3 paragraphs
6. Quote notable statements when relevant

Output format (JSON):
{
  "title": "Video title or your suggested title",
  "overallSummary": "2-3 paragraph summary",
  "keyTakeaways": ["takeaway 1", "takeaway 2", ...],
  "segments": [
    {
      "timestamp": "00:00:00",
      "startSeconds": 0,
      "endSeconds": 120,
      "title": "Segment title",
      "summary": "Brief segment summary",
      "keyQuotes": ["Notable quote 1"],
      "scriptureReferences": ["John 3:16"]
    }
  ],
  "scriptureReferences": ["All scripture references mentioned"]
}`;

    const userPrompt = `Please summarize this video transcript:

Title: ${title}
Duration: ${this.formatDuration(durationSeconds)}

Timestamp Reference:
${timestampContext}

Transcript:
${transcript.substring(0, 100000)}${transcript.length > 100000 ? '\n\n[Transcript truncated for length]' : ''}`;

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
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

    const generatedText = result.content?.[0]?.text;
    if (!generatedText) {
      throw new Error('Unexpected Claude response');
    }

    // Parse the JSON response
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonText = generatedText;
      const jsonMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonText);

      return {
        title: parsed.title || title,
        overallSummary: parsed.overallSummary || '',
        keyTakeaways: parsed.keyTakeaways || [],
        segments: parsed.segments || [],
        scriptureReferences: parsed.scriptureReferences || [],
        duration: this.formatDuration(durationSeconds),
      };
    } catch (parseError) {
      strapi.log.warn('Failed to parse Claude response as JSON, using fallback');

      // Fallback: use the raw text as summary
      return {
        title,
        overallSummary: generatedText,
        keyTakeaways: [],
        segments: [],
        scriptureReferences: [],
        duration: this.formatDuration(durationSeconds),
      };
    }
  },

  /**
   * Build timestamp context from chunks
   */
  buildTimestampContext(chunks: TranscriptChunk[]): string {
    // Sample chunks at regular intervals
    const sampleCount = Math.min(20, chunks.length);
    const interval = Math.floor(chunks.length / sampleCount);

    const samples: string[] = [];
    for (let i = 0; i < chunks.length; i += interval) {
      const chunk = chunks[i];
      const timestamp = this.formatTimestamp(chunk.startTime);
      samples.push(`[${timestamp}] ${chunk.text.substring(0, 100)}...`);
    }

    return samples.join('\n');
  },

  /**
   * Format seconds as HH:MM:SS
   */
  formatTimestamp(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  /**
   * Format duration as human-readable string
   */
  formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  },

  /**
   * Estimate video duration from transcript length
   * Assumes ~150 words per minute speaking rate
   */
  estimateDuration(transcript: string): number {
    const wordCount = transcript.split(/\s+/).length;
    const minutes = wordCount / 150;
    return Math.ceil(minutes * 60);
  },

  /**
   * Save summary to database
   */
  async saveSummary(mediaId: string, summary: Omit<VideoSummary, 'videoId' | 'generatedAt'>): Promise<VideoSummary> {
    const entityService = strapi.entityService as any;
    const crypto = await import('crypto');

    // Check if summary already exists
    const existing = await entityService.findMany('api::media-summary.media-summary', {
      filters: { mediaId },
      limit: 1,
    });

    const data = {
      mediaId,
      title: summary.title,
      overallSummary: summary.overallSummary,
      keyTakeaways: summary.keyTakeaways,
      segments: summary.segments,
      scriptureReferences: summary.scriptureReferences,
      duration: summary.duration,
      summaryId: crypto.randomUUID(),
    };

    let saved;
    if (existing?.length > 0) {
      // Update existing
      saved = await entityService.update('api::media-summary.media-summary', existing[0].id, { data });
    } else {
      // Create new
      saved = await entityService.create('api::media-summary.media-summary', { data });
    }

    return {
      videoId: mediaId,
      title: saved.title,
      overallSummary: saved.overallSummary,
      keyTakeaways: saved.keyTakeaways,
      segments: saved.segments,
      scriptureReferences: saved.scriptureReferences,
      duration: saved.duration,
      generatedAt: saved.updatedAt || saved.createdAt,
    };
  },

  /**
   * Get summary for a video
   */
  async getSummary(mediaId: string): Promise<VideoSummary | null> {
    const entityService = strapi.entityService as any;

    const summaries = await entityService.findMany('api::media-summary.media-summary', {
      filters: { mediaId },
      limit: 1,
    });

    if (!summaries?.length) {
      return null;
    }

    const summary = summaries[0];
    return {
      videoId: mediaId,
      title: summary.title,
      overallSummary: summary.overallSummary,
      keyTakeaways: summary.keyTakeaways,
      segments: summary.segments,
      scriptureReferences: summary.scriptureReferences,
      duration: summary.duration,
      generatedAt: summary.updatedAt || summary.createdAt,
    };
  },

  /**
   * Generate chapter markers for video player
   */
  async generateChapterMarkers(mediaId: string): Promise<{ time: number; title: string }[]> {
    const summary = await this.getSummary(mediaId);
    if (!summary) {
      return [];
    }

    return summary.segments.map(segment => ({
      time: segment.startSeconds,
      title: segment.title,
    }));
  },

  /**
   * Search within video summary
   */
  async searchInSummary(mediaId: string, query: string): Promise<TimestampedSegment[]> {
    const summary = await this.getSummary(mediaId);
    if (!summary) {
      return [];
    }

    const queryLower = query.toLowerCase();

    return summary.segments.filter(segment => {
      const searchableText = [
        segment.title,
        segment.summary,
        ...(segment.keyQuotes || []),
        ...(segment.scriptureReferences || []),
      ].join(' ').toLowerCase();

      return searchableText.includes(queryLower);
    });
  },
});
