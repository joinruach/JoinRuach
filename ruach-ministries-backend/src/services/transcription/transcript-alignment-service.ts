import type {
  TranscriptAlignmentService,
  TranscriptDoc,
  TranscriptSegment,
  TranscriptWord,
} from '../../types/transcript';

/**
 * Transcript Alignment Service
 * Applies sync offsets to transcript timestamps
 */
class AlignmentService implements TranscriptAlignmentService {
  alignTranscript(args: {
    transcript: Pick<TranscriptDoc, 'segments' | 'words'>;
    offsetMs: number;
  }): Pick<TranscriptDoc, 'segments' | 'words'> {
    const { transcript, offsetMs } = args;

    // Align segments
    const alignedSegments: TranscriptSegment[] = transcript.segments.map(segment => ({
      ...segment,
      startMs: segment.startMs + offsetMs,
      endMs: segment.endMs + offsetMs,
    }));

    // Align words (if present)
    const alignedWords: TranscriptWord[] | undefined = transcript.words?.map(word => ({
      ...word,
      startMs: word.startMs + offsetMs,
      endMs: word.endMs + offsetMs,
    }));

    return {
      segments: alignedSegments,
      words: alignedWords,
    };
  }
}

export const transcriptAlignmentService = new AlignmentService();
