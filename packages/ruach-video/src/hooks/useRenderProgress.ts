/**
 * Hook for tracking render progress
 */

import { useState, useEffect, useCallback } from "react";

export interface RenderJob {
  id: string;
  compositionId: string;
  status: "queued" | "rendering" | "completed" | "failed";
  progress: number;
  outputUrl?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface UseRenderProgressOptions {
  pollInterval?: number;
  onComplete?: (job: RenderJob) => void;
  onError?: (job: RenderJob, error: string) => void;
}

export function useRenderProgress(
  renderId: string | null,
  options: UseRenderProgressOptions = {}
) {
  const { pollInterval = 2000, onComplete, onError } = options;

  const [job, setJob] = useState<RenderJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!renderId) return;

    try {
      const response = await fetch(`/api/video/render/${renderId}/status`);
      if (!response.ok) {
        throw new Error("Failed to fetch render status");
      }

      const data = await response.json();
      const updatedJob: RenderJob = {
        id: renderId,
        compositionId: data.compositionId,
        status: data.status,
        progress: data.progress || 0,
        outputUrl: data.outputUrl,
        error: data.error,
        startedAt: new Date(data.startedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      };

      setJob(updatedJob);

      if (updatedJob.status === "completed" && onComplete) {
        onComplete(updatedJob);
      }

      if (updatedJob.status === "failed" && onError) {
        onError(updatedJob, updatedJob.error || "Unknown error");
      }

      return updatedJob;
    } catch (error) {
      console.error("Error fetching render progress:", error);
      return null;
    }
  }, [renderId, onComplete, onError]);

  // Start polling when renderId is set
  useEffect(() => {
    if (!renderId) {
      setJob(null);
      return;
    }

    setIsPolling(true);
    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      const updatedJob = await fetchProgress();
      if (
        updatedJob &&
        (updatedJob.status === "completed" || updatedJob.status === "failed")
      ) {
        setIsPolling(false);
        clearInterval(intervalId);
      }
    };

    // Initial fetch
    poll();

    // Set up polling
    intervalId = setInterval(poll, pollInterval);

    return () => {
      clearInterval(intervalId);
      setIsPolling(false);
    };
  }, [renderId, pollInterval, fetchProgress]);

  const cancel = useCallback(async () => {
    if (!renderId) return;

    try {
      await fetch(`/api/video/render/${renderId}/cancel`, {
        method: "POST",
      });
      setJob((prev) =>
        prev ? { ...prev, status: "failed", error: "Cancelled by user" } : null
      );
    } catch (error) {
      console.error("Error cancelling render:", error);
    }
  }, [renderId]);

  return {
    job,
    isPolling,
    progress: job?.progress || 0,
    status: job?.status || "queued",
    outputUrl: job?.outputUrl,
    error: job?.error,
    cancel,
    refetch: fetchProgress,
  };
}
