'use client';

import { useState, useEffect } from 'react';

interface SessionRenderJobsProps {
  sessionId: string;
  onSelectJob?: (jobId: string) => void;
}

interface RenderJobSummary {
  jobId: string;
  status: string;
  progress: number;
  format: string;
  outputVideoUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Display list of all render jobs for a session
 */
export function SessionRenderJobs({ sessionId, onSelectJob }: SessionRenderJobsProps) {
  const [jobs, setJobs] = useState<RenderJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch jobs on mount and when sessionId changes
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/render-job/render-jobs/session/${sessionId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch render jobs');
        }

        const data = await response.json();
        setJobs(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    // Refresh every 10 seconds to catch new jobs
    const intervalId = setInterval(fetchJobs, 10000);
    return () => clearInterval(intervalId);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mx-auto text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          No render jobs yet for this session
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Create your first render to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div
          key={job.jobId}
          className={`card bg-base-200 hover:bg-base-300 transition-all ${
            onSelectJob ? 'cursor-pointer' : ''
          }`}
          onClick={() => onSelectJob?.(job.jobId)}
        >
          <div className="card-body p-4">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status Icon */}
                <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`} />

                {/* Job Info */}
                <div>
                  <p className="font-mono text-sm font-semibold">{job.jobId}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {job.format} · {formatDate(job.createdAt)}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`badge ${getStatusBadgeClass(job.status)}`}>
                {job.status}
              </div>
            </div>

            {/* Progress Bar (if processing) */}
            {job.status === 'processing' && (
              <progress
                className="progress progress-primary w-full"
                value={job.progress}
                max="100"
              />
            )}

            {/* Error Message (if failed) */}
            {job.status === 'failed' && job.errorMessage && (
              <p className="text-xs text-error mt-2">{job.errorMessage}</p>
            )}

            {/* Action Button (if completed) */}
            {job.status === 'completed' && job.outputVideoUrl && (
              <div className="card-actions justify-end mt-2">
                <a
                  href={job.outputVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  View Video
                </a>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper Functions

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-success';
    case 'processing':
      return 'bg-info animate-pulse';
    case 'failed':
      return 'bg-error';
    case 'cancelled':
      return 'bg-warning';
    case 'queued':
      return 'bg-gray-400 animate-pulse';
    default:
      return 'bg-gray-400';
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'badge-success';
    case 'processing':
      return 'badge-info';
    case 'failed':
      return 'badge-error';
    case 'cancelled':
      return 'badge-warning';
    case 'queued':
      return 'badge-ghost';
    default:
      return 'badge-ghost';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
