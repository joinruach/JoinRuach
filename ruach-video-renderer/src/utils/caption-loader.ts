import type { TranscriptResponse, TranscriptSegment, CaptionSegment } from '../types/transcript';

/**
 * Phase 12: Caption Loader Utilities
 *
 * Utilities to fetch and process transcript data for caption overlays
 */

/**
 * Fetch transcript data from Phase 10 API
 *
 * @param sessionId - Recording session ID
 * @param apiBaseUrl - Strapi API base URL (default: http://localhost:1337)
 * @returns Transcript data with aligned segments per camera
 */
export async function fetchTranscript(
  sessionId: string,
  apiBaseUrl = 'http://localhost:1337'
): Promise<TranscriptResponse> {
  const url = `${apiBaseUrl}/api/recording-sessions/${sessionId}/transcript`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch transcript: ${response.statusText}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error('API returned unsuccessful response');
  }

  return json.data as TranscriptResponse;
}

/**
 * Get caption text for current time
 *
 * Finds the transcript segment that contains the given timestamp
 *
 * @param transcript - Full transcript response
 * @param camera - Camera ID (e.g., 'A', 'B', 'C')
 * @param timeMs - Current time in milliseconds
 * @returns Caption segment if found, null otherwise
 */
export function getCaptionAtTime(
  transcript: TranscriptResponse | null,
  camera: string,
  timeMs: number
): CaptionSegment | null {
  if (!transcript || !transcript.transcripts) {
    return null;
  }

  const cameraSegments = transcript.transcripts[camera];
  if (!cameraSegments || cameraSegments.length === 0) {
    return null;
  }

  // Find segment that contains current time
  const segment = cameraSegments.find(
    (seg) => timeMs >= seg.start && timeMs <= seg.end
  );

  if (!segment) {
    return null;
  }

  return {
    speaker: segment.speaker,
    text: segment.text,
    start: segment.start,
    end: segment.end
  };
}

/**
 * Format caption with speaker label
 *
 * @param segment - Caption segment
 * @param showSpeaker - Whether to show speaker label
 * @returns Formatted caption text
 */
export function formatCaption(segment: CaptionSegment, showSpeaker: boolean): string {
  if (!showSpeaker) {
    return segment.text;
  }

  // Convert SPEAKER_00 -> Speaker A, SPEAKER_01 -> Speaker B, etc.
  const speakerLabel = formatSpeakerLabel(segment.speaker);
  return `${speakerLabel}: ${segment.text}`;
}

/**
 * Format speaker label for display
 *
 * Converts "SPEAKER_00" -> "Speaker A"
 * Converts "SPEAKER_01" -> "Speaker B"
 * Falls back to original if format doesn't match
 *
 * @param speaker - Speaker ID from transcript (e.g., "SPEAKER_00")
 * @returns Human-readable speaker label
 */
function formatSpeakerLabel(speaker: string): string {
  const match = speaker.match(/SPEAKER_(\d+)/);
  if (!match) {
    return speaker;
  }

  const speakerIndex = parseInt(match[1], 10);
  const speakerLetter = String.fromCharCode(65 + speakerIndex); // 65 = 'A'

  return `Speaker ${speakerLetter}`;
}
