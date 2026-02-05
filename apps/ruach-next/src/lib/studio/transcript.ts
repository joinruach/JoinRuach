import { apiFetch } from './api';

// ==========================================
// Transcript Types
// ==========================================

export interface TranscriptSegment {
  speaker: string; // 'Speaker A', 'Speaker B', etc.
  start: number; // Milliseconds
  end: number; // Milliseconds
  text: string;
  words: WordTimestamp[];
  confidence?: number;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number; // 0-1
  speaker?: string;
}

export interface Transcript {
  id: number;
  sessionId: string;
  segments: TranscriptSegment[];
  speakerMapping: Record<string, string>; // Map speaker IDs to real names
  language: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Transcript API Methods (Phase 10)
// ==========================================

/**
 * Trigger transcript generation for a session
 * ⚠️ Backend implementation pending (Phase 10)
 */
export async function generateTranscript(
  sessionId: string,
  authToken: string,
  options?: {
    language?: string;
    speakerCount?: number;
  }
): Promise<{
  jobId: string;
  message: string;
}> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/transcript/generate`,
    {
      method: 'POST',
      authToken,
      body: JSON.stringify(options || {}),
    }
  );

  return response as { jobId: string; message: string };
}

/**
 * Get transcript for a session
 * ⚠️ Backend implementation pending (Phase 10)
 */
export async function getTranscript(
  sessionId: string,
  authToken: string
): Promise<Transcript | null> {
  try {
    const response = await apiFetch(
      `/api/recording-sessions/${sessionId}/transcript`,
      {
        method: 'GET',
        authToken,
      }
    );

    return response as Transcript;
  } catch (error) {
    // Transcript not found
    return null;
  }
}

/**
 * Update transcript segments
 * ⚠️ Backend implementation pending (Phase 10)
 */
export async function updateTranscript(
  sessionId: string,
  segments: TranscriptSegment[],
  authToken: string
): Promise<Transcript> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/transcript`,
    {
      method: 'PUT',
      authToken,
      body: JSON.stringify({ segments }),
    }
  );

  return response as Transcript;
}

/**
 * Update speaker mapping
 * ⚠️ Backend implementation pending (Phase 10)
 */
export async function updateSpeakerMapping(
  sessionId: string,
  speakerMapping: Record<string, string>,
  authToken: string
): Promise<Transcript> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/transcript/speakers`,
    {
      method: 'PUT',
      authToken,
      body: JSON.stringify({ speakerMapping }),
    }
  );

  return response as Transcript;
}

/**
 * Generate subtitle file (SRT/VTT)
 * ⚠️ Backend implementation pending (Phase 10)
 */
export async function generateSubtitles(
  sessionId: string,
  format: 'srt' | 'vtt',
  authToken: string,
  camera?: string
): Promise<string> {
  const params = new URLSearchParams({ format });
  if (camera) params.append('camera', camera);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/recording-sessions/${sessionId}/transcript/subtitles?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to generate subtitles: ${response.statusText}`);
  }

  return response.text();
}
