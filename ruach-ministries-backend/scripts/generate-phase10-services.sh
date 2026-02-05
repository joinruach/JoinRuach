#!/bin/bash
# Phase 10 Backend Service Generator
# Generates all transcript services from contracts

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICES_DIR="$BASE_DIR/src/services/transcription"

echo "🚀 Generating Phase 10 Transcript Services..."

# Mock Provider with Fixtures
cat > "$SERVICES_DIR/providers/mock-provider.ts" << 'EOF'
import { v4 as uuidv4 } from 'uuid';
import type {
  TranscriptionProvider,
  TranscriptSegment,
  TranscriptWord,
} from '../../../types/transcript';

/**
 * Mock Transcription Provider
 * Uses synthetic fixtures for testing without API key
 */
export class MockProvider implements TranscriptionProvider {
  private jobs: Map<string, {
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    result?: {
      language: string;
      segments: TranscriptSegment[];
      words?: TranscriptWord[];
      hasDiarization: boolean;
    };
  }> = new Map();

  async startJob(args: {
    mediaUrl: string;
    diarization: boolean;
    language?: string;
  }): Promise<{ providerJobId: string }> {
    const jobId = `mock_${uuidv4()}`;

    // Simulate job creation
    this.jobs.set(jobId, {
      status: 'QUEUED',
    });

    // Simulate async processing (resolve after 100ms)
    setTimeout(() => {
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'PROCESSING';
      }
    }, 100);

    setTimeout(() => {
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'COMPLETED';
        job.result = this.generateMockTranscript(args.diarization, args.language);
      }
    }, 500);

    return { providerJobId: jobId };
  }

  async getJobStatus(args: { providerJobId: string }) {
    const job = this.jobs.get(args.providerJobId);

    if (!job) {
      throw new Error(`Job not found: ${args.providerJobId}`);
    }

    return {
      status: job.status,
      error: undefined,
    };
  }

  async fetchResult(args: { providerJobId: string }) {
    const job = this.jobs.get(args.providerJobId);

    if (!job) {
      throw new Error(`Job not found: ${args.providerJobId}`);
    }

    if (job.status !== 'COMPLETED') {
      throw new Error(`Job not completed: ${job.status}`);
    }

    if (!job.result) {
      throw new Error('Job result not available');
    }

    return job.result;
  }

  private generateMockTranscript(
    diarization: boolean,
    language = 'en'
  ): {
    language: string;
    segments: TranscriptSegment[];
    words?: TranscriptWord[];
    hasDiarization: boolean;
  } {
    // Synthetic transcript with speaker diarization
    const segments: TranscriptSegment[] = [
      {
        id: uuidv4(),
        speaker: diarization ? 'A' : undefined,
        startMs: 1000,
        endMs: 4500,
        text: 'Welcome to today\'s message. We\'re excited to share this time with you.',
        confidence: 0.95,
      },
      {
        id: uuidv4(),
        speaker: diarization ? 'A' : undefined,
        startMs: 4600,
        endMs: 8200,
        text: 'Today we\'ll be discussing the importance of community and fellowship.',
        confidence: 0.92,
      },
      {
        id: uuidv4(),
        speaker: diarization ? 'B' : undefined,
        startMs: 8300,
        endMs: 12100,
        text: 'Thank you. Let\'s open with a word of prayer as we begin.',
        confidence: 0.89,
      },
    ];

    return {
      language,
      segments,
      hasDiarization: diarization,
    };
  }
}

// Export singleton instance
export const mockProvider = new MockProvider();
EOF

# Alignment Service
cat > "$SERVICES_DIR/transcript-alignment-service.ts" << 'EOF'
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
EOF

# Subtitle Generator
cat > "$SERVICES_DIR/subtitle-generator.ts" << 'EOF'
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
  generate(args: { segments: TranscriptSegment[]; format: SubtitleFormat }): string {
    const { segments, format } = args;

    if (format === 'srt') {
      return this.generateSRT(segments);
    } else {
      return this.generateVTT(segments);
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
EOF

echo "✅ Phase 10 services generated successfully!"
echo ""
echo "Generated files:"
echo "  - $SERVICES_DIR/providers/mock-provider.ts"
echo "  - $SERVICES_DIR/transcript-alignment-service.ts"
echo "  - $SERVICES_DIR/subtitle-generator.ts"
echo ""
echo "Next steps:"
echo "  1. Run: chmod +x $BASE_DIR/scripts/generate-phase10-services.sh"
echo "  2. Run: $BASE_DIR/scripts/generate-phase10-services.sh"
echo "  3. Implement API routes and queue worker"
EOF

chmod +x "$BASE_DIR/scripts/generate-phase10-services.sh"
echo "✅ Script created and made executable"
