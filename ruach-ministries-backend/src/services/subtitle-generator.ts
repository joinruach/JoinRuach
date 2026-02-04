import type { TranscriptSegment } from './transcription-service';

/**
 * Phase 10: Subtitle Generator Service
 *
 * Converts JSON transcript segments to SRT/VTT formats using subtitle.js
 */

export default class SubtitleGenerator {
  private static formatTime(ms: number, forVtt = false): string {
    const totalMs = Math.max(0, Math.floor(ms));
    const hours = Math.floor(totalMs / 3_600_000);
    const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
    const seconds = Math.floor((totalMs % 60_000) / 1_000);
    const millis = totalMs % 1_000;
    const sep = forVtt ? '.' : ',';
    const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${sep}${pad(millis, 3)}`;
  }

  /**
   * Generate SRT subtitle file from transcript segments
   *
   * @param segments - Transcript segments for a single camera
   * @returns SRT formatted subtitle string
   */
  static generateSRT(segments: TranscriptSegment[]): string {
    return segments
      .map((segment, index) => {
        const start = this.formatTime(segment.start);
        const end = this.formatTime(segment.end);
        const text = `[${segment.speaker}] ${segment.text}`;
        return `${index + 1}\n${start} --> ${end}\n${text}`;
      })
      .join('\n\n');
  }

  /**
   * Generate VTT subtitle file from transcript segments
   *
   * @param segments - Transcript segments for a single camera
   * @returns WebVTT formatted subtitle string
   */
  static generateVTT(segments: TranscriptSegment[]): string {
    const body = segments
      .map(segment => {
        const start = this.formatTime(segment.start, true);
        const end = this.formatTime(segment.end, true);
        const text = `<v ${segment.speaker}>${segment.text}</v>`;
        return `${start} --> ${end}\n${text}`;
      })
      .join('\n\n');

    return `WEBVTT\n\n${body}`;
  }
}
