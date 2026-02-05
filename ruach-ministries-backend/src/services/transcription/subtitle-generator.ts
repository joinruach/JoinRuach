import type {
  SubtitleGenerator,
  SubtitleFormat,
  TranscriptSegment,
} from '../../types/transcript';

/**
 * Subtitle Generator Service
 * Generates SRT and VTT from transcript segments
 */
class SubtitleGeneratorService implements SubtitleGenerator {
  /**
   * Validate and clamp segment timestamps to prevent malformed subtitles
   */
  private validateAndClampSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
    // Sort by start time first (defensive)
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

  generate(args: { segments: TranscriptSegment[]; format: SubtitleFormat }): string {
    const { segments, format } = args;

    // Validate and clamp segments before generating
    const safeSegments = this.validateAndClampSegments(segments);

    if (format === 'srt') {
      return this.generateSRT(safeSegments);
    } else {
      return this.generateVTT(safeSegments);
    }
  }

  private generateSRT(segments: TranscriptSegment[]): string {
    let srt = '';

    segments.forEach((segment, index) => {
      const startTime = this.formatSRTTimecode(segment.startMs);
      const endTime = this.formatSRTTimecode(segment.endMs);

      srt += `${index + 1}\n`;
      srt += `${startTime} --> ${endTime}\n`;
      srt += `${segment.text}\n\n`;
    });

    return srt.trim();
  }

  private generateVTT(segments: TranscriptSegment[]): string {
    let vtt = 'WEBVTT\n\n';

    segments.forEach((segment, index) => {
      const startTime = this.formatVTTTimecode(segment.startMs);
      const endTime = this.formatVTTTimecode(segment.endMs);

      vtt += `${index + 1}\n`;
      vtt += `${startTime} --> ${endTime}\n`;
      vtt += `${segment.text}\n\n`;
    });

    return vtt.trim();
  }

  private formatSRTTimecode(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  }

  private formatVTTTimecode(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }
}

export const subtitleGenerator = new SubtitleGeneratorService();
