/**
 * Phase 12: Transcript types for caption rendering
 *
 * These types match Phase 10 transcript API structure
 */

export interface WordTimestamp {
  word: string;
  start: number;  // milliseconds
  end: number;    // milliseconds
  confidence: number;
  speaker?: string;
}

export interface TranscriptSegment {
  speaker: string;
  start: number;  // milliseconds
  end: number;    // milliseconds
  text: string;
  words: WordTimestamp[];
}

export interface TranscriptResponse {
  sessionId: string;
  transcriptId: string;
  status: string;
  speakerCount: number;
  confidence: number;
  cameras: string[];
  transcripts: Record<string, TranscriptSegment[]>;  // camera -> segments
  lowConfidenceSegments: number;
  transcribedAt: string;
}

export interface CaptionSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}
