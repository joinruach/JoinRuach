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
