'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRenderJob } from '@/hooks/useRenderJob';

interface RenderJobMonitorProps {
  jobId: string;
  onComplete?: () => void;
}

/**
 * Real-time monitor for render job progress
 * Polls every 2 seconds and displays status, progress, and outputs
 */
export function RenderJobMonitor({ jobId, onComplete }: RenderJobMonitorProps) {
  const { job, loading, error, refetch } = useRenderJob(jobId, {
    pollInterval: 2000,
    enabled: true,
  });

  // Call onComplete when job reaches terminal state
  useEffect(() => {
    if (job && ['completed', 'failed', 'cancelled'].includes(job.status)) {
      onComplete?.();
    }
  }, [job?.status, onComplete]);

  if (loading && !job) {
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
        <button onClick={refetch} className="btn btn-sm">
          Retry
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="alert alert-warning">
        <span>Render job not found</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Job: {job.jobId}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Format: {job.format}
          </p>
        </div>
        <div className={`badge badge-lg ${getStatusBadgeClass(job.status)}`}>
          {job.status.toUpperCase()}
        </div>
      </div>

      {/* Progress Bar (for processing status) */}
      {job.status === 'processing' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Processing</span>
            <span>{job.progress}%</span>
          </div>
          <progress
            className="progress progress-primary w-full h-4"
            value={job.progress}
            max="100"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {getProgressMessage(job.progress)}
          </p>
        </div>
      )}

      {/* Queued Status */}
      {job.status === 'queued' && (
        <div className="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-info shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Your render job is queued and will start processing soon...</span>
          <div className="loading loading-dots" />
        </div>
      )}

      {/* Error Message */}
      {job.status === 'failed' && job.errorMessage && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-bold">Render Failed</p>
            <p className="text-sm">{job.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Completed Video */}
      {job.status === 'completed' && job.outputVideoUrl && (
        <div className="space-y-4">
          {/* Success Message */}
          <div className="alert alert-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Render completed successfully!</span>
            {job.renderDurationMs && (
              <span className="text-sm">
                ({(job.renderDurationMs / 1000).toFixed(1)}s)
              </span>
            )}
          </div>

          {/* Video Player */}
          <div className="card bg-base-200">
            <div className="card-body p-0">
              <video
                controls
                className="w-full rounded-lg"
                poster={job.outputThumbnailUrl}
              >
                <source src={job.outputVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Download Actions */}
          <div className="flex flex-wrap gap-2">
            <a
              href={job.outputVideoUrl}
              download
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Video
            </a>

            {job.outputThumbnailUrl && (
              <a
                href={job.outputThumbnailUrl}
                download
                className="btn btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Thumbnail
              </a>
            )}

            {job.outputSubtitlesUrl && (
              <a
                href={job.outputSubtitlesUrl}
                download
                className="btn btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Subtitles
              </a>
            )}
          </div>

          {/* Video Metadata */}
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            {job.durationMs && (
              <div className="stat">
                <div className="stat-title">Duration</div>
                <div className="stat-value text-2xl">
                  {formatDuration(job.durationMs)}
                </div>
              </div>
            )}

            {job.fileSizeBytes && (
              <div className="stat">
                <div className="stat-title">File Size</div>
                <div className="stat-value text-2xl">
                  {formatFileSize(job.fileSizeBytes)}
                </div>
              </div>
            )}

            {job.resolution && (
              <div className="stat">
                <div className="stat-title">Resolution</div>
                <div className="stat-value text-2xl">{job.resolution}</div>
              </div>
            )}

            {job.fps && (
              <div className="stat">
                <div className="stat-title">Frame Rate</div>
                <div className="stat-value text-2xl">{job.fps} FPS</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {job.status === 'failed' && (
          <button
            onClick={async () => {
              await fetch(`/api/render-job/render-jobs/${jobId}/retry`, {
                method: 'POST',
              });
              refetch();
            }}
            className="btn btn-warning"
          >
            Retry Render
          </button>
        )}

        {['queued', 'processing'].includes(job.status) && (
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to cancel this render?')) {
                await fetch(`/api/render-job/render-jobs/${jobId}/cancel`, {
                  method: 'POST',
                });
                refetch();
              }
            }}
            className="btn btn-error"
          >
            Cancel Render
          </button>
        )}
      </div>
    </div>
  );
}

// Helper Functions

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

function getProgressMessage(progress: number): string {
  if (progress < 10) return 'Initializing render...';
  if (progress < 30) return 'Processing video assets...';
  if (progress < 60) return 'Rendering video frames...';
  if (progress < 90) return 'Encoding final output...';
  return 'Finalizing and uploading...';
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}
