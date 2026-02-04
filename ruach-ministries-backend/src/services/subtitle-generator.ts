import { stringify } from 'subtitle';
import type { TranscriptSegment } from './transcription-service';

/**
 * Phase 10: Subtitle Generator Service
 *
 * Converts JSON transcript segments to SRT/VTT formats using subtitle.js
 */

export default class SubtitleGenerator {
  /**
   * Generate SRT subtitle file from transcript segments
   *
   * @param segments - Transcript segments for a single camera
   * @returns SRT formatted subtitle string
   */
  static generateSRT(segments: TranscriptSegment[]): string {
    const cues = segments.map(segment => ({
      type: 'cue' as const,
      data: {
        start: segment.start,
        end: segment.end,
        text: `[${segment.speaker}] ${segment.text}`
      }
    }));

    return stringify(cues, { format: 'SRT' });
  }

  /**
   * Generate VTT subtitle file from transcript segments
   *
   * @param segments - Transcript segments for a single camera
   * @returns WebVTT formatted subtitle string
   */
  static generateVTT(segments: TranscriptSegment[]): string {
    const cues = segments.map(segment => ({
      type: 'cue' as const,
      data: {
        start: segment.start,
        end: segment.end,
        text: `<v ${segment.speaker}>${segment.text}</v>`
      }
    }));

    return stringify(cues, { format: 'WebVTT' });
  }
}
