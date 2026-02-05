import { z } from 'zod';
import { apiFetch } from './api';

// ==========================================
// Zod Schemas
// ==========================================

export const TranscriptSegmentSchema = z.object({
  id: z.string(),
  speaker: z.string().optional(),
  startMs: z.number(),
  endMs: z.number(),
  text: z.string(),
  confidence: z.number().optional(),
});

export const TranscriptWordSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  confidence: z.number().optional(),
});

export const TranscriptSchema = z.object({
  id: z.number(),
  transcriptionId: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'QUEUED', 'PROCESSING', 'RAW_READY', 'ALIGNED', 'FAILED']),
  provider: z.enum(['assemblyai', 'mock', 'whisper']),
  providerJobId: z.string().optional(),
  hasDiarization: z.boolean(),
  language: z.string().optional(),
  sourceAssetId: z.number(),
  syncOffsets_ms: z.record(z.number()),
  segments: z.array(TranscriptSegmentSchema),
  words: z.array(TranscriptWordSchema).optional(),
  transcriptText: z.string().optional(),
  durationSeconds: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const StartTranscriptionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    transcriptId: z.number(),
    status: z.enum(['QUEUED', 'PROCESSING', 'RAW_READY', 'ALIGNED', 'FAILED']),
  }),
});

export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;
export type TranscriptWord = z.infer<typeof TranscriptWordSchema>;
export type Transcript = z.infer<typeof TranscriptSchema>;
export type StartTranscriptionResponse = z.infer<typeof StartTranscriptionResponseSchema>;

// ==========================================
// API Functions
// ==========================================

export interface StartTranscriptionOptions {
  provider?: 'assemblyai' | 'mock' | 'whisper';
  diarization?: boolean;
  language?: string;
}

export async function startTranscription(
  sessionId: string,
  authToken: string,
  options: StartTranscriptionOptions = {}
): Promise<StartTranscriptionResponse> {
  const raw = await apiFetch('/api/recording-sessions/' + sessionId + '/transcript/compute', {
    method: 'POST',
    authToken,
    body: JSON.stringify({
      provider: options.provider || 'mock',
      diarization: options.diarization !== false,
      language: options.language || 'en',
    }),
  });

  // Validate response shape
  return StartTranscriptionResponseSchema.parse(raw);
}

export async function getTranscript(
  sessionId: string,
  authToken: string
): Promise<Transcript | null> {
  const response = await apiFetch<{ data: { transcript: Transcript | null } }>(
    '/api/recording-sessions/' + sessionId + '/transcript',
    {
      method: 'GET',
      authToken,
    }
  );
  return response.data?.transcript || null;
}

export async function updateTranscriptSegments(
  transcriptId: string,
  segments: TranscriptSegment[],
  authToken: string
) {
  // Send complete updated segments array to prevent corruption
  return apiFetch('/api/library-transcription/library-transcriptions/' + transcriptId, {
    method: 'PUT',
    authToken,
    body: JSON.stringify({
      data: {
        segments,
        transcriptText: segments.map(s => s.text).join(' '),
      },
    }),
  });
}

export async function getSubtitleFile(
  sessionId: string,
  camera: string,
  format: 'srt' | 'vtt',
  authToken: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || '';
  const response = await fetch(
    baseUrl + '/api/recording-sessions/' + sessionId + '/transcript/' + format + '/' + camera,
    {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + authToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch ' + format.toUpperCase() + ' file');
  }

  return await response.text();
}

// ==========================================
// Utility Functions
// ==========================================

export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;

  if (hours > 0) {
    return hours + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(milliseconds).padStart(3, '0');
  }
  return minutes + ':' + String(seconds).padStart(2, '0') + '.' + String(milliseconds).padStart(3, '0');
}

export function parseTimestamp(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    // HH:MM:SS.mmm
    const [hours, minutes, secondsMs] = parts;
    const [seconds, ms] = secondsMs.split('.');
    return (
      parseInt(hours) * 3600000 +
      parseInt(minutes) * 60000 +
      parseInt(seconds) * 1000 +
      parseInt(ms || '0')
    );
  } else if (parts.length === 2) {
    // MM:SS.mmm
    const [minutes, secondsMs] = parts;
    const [seconds, ms] = secondsMs.split('.');
    return parseInt(minutes) * 60000 + parseInt(seconds) * 1000 + parseInt(ms || '0');
  }
  return 0;
}

function validateAndClampSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
  // Sort by start time (defensive)
  const sorted = [...segments].sort((a, b) => a.startMs - b.startMs);

  return sorted.map((seg, i, arr) => {
    // Clamp start to 0 (no negative times)
    const start = Math.max(0, Math.floor(seg.startMs));
    const rawEnd = Math.floor(seg.endMs);

    // Enforce minimum duration of 100ms
    const minEnd = start + 100;

    // Clamp to next segment's start to prevent overlaps
    const nextStart = arr[i + 1]?.startMs ?? Number.POSITIVE_INFINITY;
    const clampedEnd = Math.max(minEnd, Math.min(rawEnd, nextStart));

    return { ...seg, startMs: start, endMs: clampedEnd };
  });
}

export function generateSRT(segments: TranscriptSegment[]): string {
  const safeSegments = validateAndClampSegments(segments);
  let srt = '';
  safeSegments.forEach((segment, index) => {
    const start = formatSRTTimecode(segment.startMs);
    const end = formatSRTTimecode(segment.endMs);
    srt += (index + 1) + '\n';
    srt += start + ' --> ' + end + '\n';
    srt += segment.text + '\n\n';
  });
  return srt.trim();
}

export function generateVTT(segments: TranscriptSegment[]): string {
  const safeSegments = validateAndClampSegments(segments);
  let vtt = 'WEBVTT\n\n';
  safeSegments.forEach((segment, index) => {
    const start = formatVTTTimecode(segment.startMs);
    const end = formatVTTTimecode(segment.endMs);
    vtt += (index + 1) + '\n';
    vtt += start + ' --> ' + end + '\n';
    vtt += segment.text + '\n\n';
  });
  return vtt.trim();
}

function formatSRTTimecode(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + ',' + String(milliseconds).padStart(3, '0');
}

function formatVTTTimecode(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(milliseconds).padStart(3, '0');
}

export function getConfidenceColor(confidence?: number): string {
  if (!confidence) return 'bg-gray-300';
  if (confidence >= 0.9) return 'bg-green-500';
  if (confidence >= 0.7) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getConfidenceLabel(confidence?: number): string {
  if (!confidence) return 'Unknown';
  if (confidence >= 0.9) return 'High';
  if (confidence >= 0.7) return 'Medium';
  return 'Low';
}
