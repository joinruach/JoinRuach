import { useState, useEffect, useCallback } from 'react';

export type RenderJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface RenderJob {
  jobId: string;
  status: RenderJobStatus;
  progress: number;
  format: string;
  sessionId?: string;
  edlId?: string;
  edlVersion?: number;

  // Outputs
  outputVideoUrl?: string;
  outputThumbnailUrl?: string;
  outputChaptersUrl?: string;
  outputSubtitlesUrl?: string;

  // Metadata
  durationMs?: number;
  fileSizeBytes?: number;
  resolution?: string;
  fps?: number;

  // Error
  errorMessage?: string;

  // Timing
  renderStartedAt?: string;
  renderCompletedAt?: string;
  renderDurationMs?: number;
  createdAt: string;
  updatedAt: string;

  // Advanced
  bullmqJobId?: string;
  metadata?: Record<string, any>;
}

interface UseRenderJobOptions {
  pollInterval?: number; // milliseconds (default: 2000)
  enabled?: boolean; // enable/disable polling (default: true)
}

interface UseRenderJobReturn {
  job: RenderJob | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and monitoring render job status
 * Automatically polls the job until it reaches a terminal state
 */
export function useRenderJob(
  jobId: string,
  options: UseRenderJobOptions = {}
): UseRenderJobReturn {
  const { pollInterval = 2000, enabled = true } = options;

  const [job, setJob] = useState<RenderJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldPoll, setShouldPoll] = useState(true);

  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/render-job/render-jobs/${jobId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch render job: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch render job');
      }

      setJob(data.data);
      setError(null);

      // Stop polling if job is in terminal state
      const isTerminal = ['completed', 'failed', 'cancelled'].includes(
        data.data.status
      );

      if (isTerminal) {
        setShouldPoll(false);
      }

      return isTerminal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setShouldPoll(false); // Stop polling on error
      return true;
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!enabled) return;
    if (!shouldPoll) return;

    // Initial fetch
    fetchJob();

    // Set up polling
    const intervalId = setInterval(async () => {
      const shouldStop = await fetchJob();
      if (shouldStop) {
        clearInterval(intervalId);
      }
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [jobId, pollInterval, enabled, shouldPoll, fetchJob]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShouldPoll(true);
    await fetchJob();
  }, [fetchJob]);

  return { job, loading, error, refetch };
}
