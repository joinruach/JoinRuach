import type { Core } from '@strapi/strapi';
import type { TranscriptSegment, WordTimestamp } from './transcription-service';

/**
 * Phase 10: Transcript Alignment Service
 *
 * Applies Phase 9 sync offsets to master transcript to generate
 * aligned transcripts for all cameras
 */

export interface AlignedTranscripts {
  [camera: string]: TranscriptSegment[];
}

export default class TranscriptAlignmentService {
  /**
   * Apply sync offsets to master transcript to generate aligned transcripts
   *
   * @param masterSegments - Transcript segments from master camera
   * @param syncOffsets - Camera sync offsets from Phase 9 (in milliseconds)
   * @returns Record of camera -> aligned segments
   */
  static alignTranscripts(
    masterSegments: TranscriptSegment[],
    syncOffsets: Record<string, number>
  ): AlignedTranscripts {
    const aligned: AlignedTranscripts = {};

    for (const [camera, offset] of Object.entries(syncOffsets)) {
      // Apply offset to each segment
      aligned[camera] = masterSegments.map(segment => ({
        speaker: segment.speaker,
        start: Math.max(0, segment.start + offset), // Clamp to prevent negatives
        end: Math.max(0, segment.end + offset),
        text: segment.text,
        words: segment.words.map(word => ({
          word: word.word,
          start: Math.max(0, word.start + offset),
          end: Math.max(0, word.end + offset),
          confidence: word.confidence,
          speaker: word.speaker
        }))
      }));
    }

    return aligned;
  }

  /**
   * Get aligned transcript for a specific camera
   *
   * @param masterSegments - Transcript segments from master camera
   * @param camera - Camera angle (e.g., 'A', 'B', 'C')
   * @param syncOffsets - Camera sync offsets from Phase 9 (in milliseconds)
   * @returns Aligned segments for specified camera
   */
  static getCameraTranscript(
    masterSegments: TranscriptSegment[],
    camera: string,
    syncOffsets: Record<string, number>
  ): TranscriptSegment[] {
    const offset = syncOffsets[camera];
    if (offset === undefined) {
      throw new Error(`No sync offset found for camera ${camera}`);
    }

    return masterSegments.map(segment => ({
      speaker: segment.speaker,
      start: Math.max(0, segment.start + offset),
      end: Math.max(0, segment.end + offset),
      text: segment.text,
      words: segment.words.map(word => ({
        word: word.word,
        start: Math.max(0, word.start + offset),
        end: Math.max(0, word.end + offset),
        confidence: word.confidence,
        speaker: word.speaker
      }))
    }));
  }
}
