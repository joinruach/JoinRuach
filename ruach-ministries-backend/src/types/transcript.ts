/**
 * Phase 10: Transcript Domain Types
 *
 * Complete type definitions for transcription pipeline
 */

// ==========================================
// Status & Provider Enums
// ==========================================

export type TranscriptStatus =
  | 'QUEUED'       // Job created, waiting for worker
  | 'PROCESSING'   // Provider is transcribing
  | 'RAW_READY'    // Provider completed, before alignment
  | 'ALIGNED'      // Sync offsets applied, ready for use
  | 'FAILED';      // Unrecoverable error

export type TranscriptProvider =
  | 'assemblyai'
  | 'mock'
  | 'whisper';

// ==========================================
// Core Domain Models
// ==========================================

/**
 * Transcript Segment (utterance-level)
 * Represents a single speaking turn with speaker, timing, and text
 */
export interface TranscriptSegment {
  id: string;              // Stable UUID
  speaker?: string;        // "A", "B", "C" or "Speaker 1" (depends on diarization)
  startMs: number;         // Inclusive (session timeline after alignment)
  endMs: number;           // Exclusive (session timeline after alignment)
  text: string;            // Transcribed text
  confidence?: number;     // 0-1, provider-specific
}

/**
 * Transcript Word (for future word-level features)
 * Granular timestamps for each word
 */
export interface TranscriptWord {
  text: string;
  startMs: number;         // Session timeline after alignment
  endMs: number;           // Session timeline after alignment
  confidence?: number;     // 0-1
}

/**
 * Complete Transcript Document
 * Full transcript with metadata, status, and aligned content
 */
export interface TranscriptDoc {
  id: string;
  documentId?: string;     // Strapi v5 documentId
  sessionId: string;

  // Provider metadata
  provider: TranscriptProvider;
  providerJobId?: string;  // External provider's job ID

  // Status
  status: TranscriptStatus;

  // Language & features
  language?: string;       // ISO 639-1 code (e.g., "en", "es")
  hasDiarization: boolean; // Speaker identification enabled

  // Source tracking
  sourceAssetId: string;   // Which media-asset's audio was transcribed
  syncOffsets_ms: Record<string, number>; // Offsets used for alignment

  // Transcript content
  segments: TranscriptSegment[];
  words?: TranscriptWord[]; // Optional, for future use

  // Legacy fields (backward compatibility)
  transcriptText?: string;  // Flat text version
  transcriptVTT?: string;   // VTT subtitle format
  transcriptSRT?: string;   // SRT subtitle format

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  // Error handling
  error?: {
    code: string;
    message: string;
    providerError?: unknown;
  };

  // Additional metadata
  metadata?: Record<string, unknown>;
}

// ==========================================
// Service Interfaces
// ==========================================

/**
 * Transcription Provider Interface
 * Abstract provider (AssemblyAI, Whisper, etc.) behind common interface
 */
export interface TranscriptionProvider {
  /**
   * Start transcription job with provider
   * @returns Job ID for polling
   */
  startJob(args: {
    mediaUrl: string;       // Signed R2 URL or internal proxy
    diarization: boolean;   // Enable speaker identification
    language?: string;      // Target language (optional, auto-detect)
  }): Promise<{
    providerJobId: string;
  }>;

  /**
   * Poll job status
   */
  getJobStatus(args: {
    providerJobId: string;
  }): Promise<{
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    error?: { code: string; message: string };
  }>;

  /**
   * Fetch completed transcript
   */
  fetchResult(args: {
    providerJobId: string;
  }): Promise<{
    language?: string;
    segments: TranscriptSegment[];
    words?: TranscriptWord[];
    hasDiarization: boolean;
  }>;
}

/**
 * Transcript Alignment Service
 * Apply sync offsets to transcript timestamps
 */
export interface TranscriptAlignmentService {
  /**
   * Align transcript to session timeline
   *
   * @param transcript - Raw transcript from provider
   * @param offsetMs - Sync offset to apply (from Phase 9)
   * @returns Aligned transcript with corrected timestamps
   *
   * @example
   * // Master audio has +120ms offset from session timeline
   * alignTranscript({
   *   transcript: { segments: [{ startMs: 1000, endMs: 2000, ... }] },
   *   offsetMs: 120
   * })
   * // Returns: { segments: [{ startMs: 1120, endMs: 2120, ... }] }
   */
  alignTranscript(args: {
    transcript: Pick<TranscriptDoc, 'segments' | 'words'>;
    offsetMs: number;
  }): Pick<TranscriptDoc, 'segments' | 'words'>;
}

// ==========================================
// Subtitle Generation
// ==========================================

export type SubtitleFormat = 'srt' | 'vtt';

export interface SubtitleGenerator {
  /**
   * Generate subtitle file content
   *
   * @param segments - Transcript segments (already aligned)
   * @param format - Output format (SRT or VTT)
   * @returns File content as string
   */
  generate(args: {
    segments: TranscriptSegment[];
    format: SubtitleFormat;
  }): string;
}

// ==========================================
// API Request/Response Types
// ==========================================

export interface StartTranscriptionJobRequest {
  provider: TranscriptProvider;
  diarization: boolean;
  language?: string;
}

export interface StartTranscriptionJobResponse {
  transcriptId: string;
  status: TranscriptStatus;
}

export interface GetTranscriptResponse {
  transcript: TranscriptDoc;
}

// ==========================================
// Queue Job Types
// ==========================================

export interface TranscriptCreateJobPayload {
  sessionId: string;
  provider: TranscriptProvider;
  diarization: boolean;
  language?: string;
}

export interface TranscriptCreateJobResult {
  transcriptId: string;
  status: TranscriptStatus;
  error?: {
    code: string;
    message: string;
  };
}
