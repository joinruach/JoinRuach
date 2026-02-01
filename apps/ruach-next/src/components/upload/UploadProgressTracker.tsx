'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@ruach/utils';

interface UploadJob {
  id: string;
  filename: string;
  status: 'queued' | 'uploading' | 'processing' | 'transcoding' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  fileSize?: number;
  uploadedBytes?: number;
  transcodingProgress?: number;
  qualities?: string[];
  thumbnails?: string[];
}

interface UploadProgressTrackerProps {
  /** Initial jobs to display */
  initialJobs?: UploadJob[];
  /** Callback when a job is cancelled */
  onCancel?: (jobId: string) => void;
  /** Callback when a job is retried */
  onRetry?: (jobId: string) => void;
  /** Poll interval in milliseconds */
  pollInterval?: number;
  /** API endpoint to fetch job status */
  apiEndpoint?: string;
  /** Show completed jobs */
  showCompleted?: boolean;
  /** Maximum jobs to display */
  maxJobs?: number;
  /** Custom class name */
  className?: string;
}

export function UploadProgressTracker({
  initialJobs = [],
  onCancel,
  onRetry,
  pollInterval = 2000,
  apiEndpoint = '/api/upload/status',
  showCompleted = true,
  maxJobs = 10,
  className,
}: UploadProgressTrackerProps) {
  const [jobs, setJobs] = useState<UploadJob[]>(initialJobs);
  const [isPolling, setIsPolling] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Poll for job status updates
  useEffect(() => {
    if (!isPolling || jobs.length === 0) return;

    const activeJobs = jobs.filter(j =>
      j.status !== 'completed' && j.status !== 'failed'
    );

    if (activeJobs.length === 0) {
      setIsPolling(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const jobIds = activeJobs.map(j => j.id).join(',');
        const response = await fetch(`${apiEndpoint}?ids=${jobIds}`);

        if (response.ok) {
          const updatedJobs: UploadJob[] = await response.json();

          setJobs(prev => prev.map(job => {
            const updated = updatedJobs.find(u => u.id === job.id);
            return updated || job;
          }));
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [jobs, isPolling, pollInterval, apiEndpoint]);

  const handleCancel = useCallback(async (jobId: string) => {
    try {
      await fetch(`${apiEndpoint}/${jobId}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== jobId));
      onCancel?.(jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  }, [apiEndpoint, onCancel]);

  const handleRetry = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${apiEndpoint}/${jobId}/retry`, { method: 'POST' });
      if (response.ok) {
        const updatedJob = await response.json();
        setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
        setIsPolling(true);
        onRetry?.(jobId);
      }
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  }, [apiEndpoint, onRetry]);

  const handleClearCompleted = useCallback(() => {
    setJobs(prev => prev.filter(j => j.status !== 'completed'));
  }, []);

  const handleDismiss = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  }, []);

  // Add new job
  const addJob = useCallback((job: UploadJob) => {
    setJobs(prev => [job, ...prev].slice(0, maxJobs));
    setIsPolling(true);
  }, [maxJobs]);

  // Update job progress (for direct upload tracking)
  const updateProgress = useCallback((jobId: string, progress: number, uploadedBytes?: number) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId
        ? { ...job, progress, uploadedBytes, status: 'uploading' as const }
        : job
    ));
  }, []);

  // Expose methods via ref or context if needed
  // For now, we'll use these internally

  const filteredJobs = showCompleted
    ? jobs
    : jobs.filter(j => j.status !== 'completed');

  const activeCount = jobs.filter(j =>
    j.status === 'uploading' || j.status === 'processing' || j.status === 'transcoding'
  ).length;

  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;

  if (filteredJobs.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden',
        isMinimized && 'h-12',
        className
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-medium text-sm text-gray-900 dark:text-white">
            Uploads
          </span>
          {activeCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({activeCount} active)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleClearCompleted(); }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear completed
            </button>
          )}
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            {isMinimized ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Job List */}
      {!isMinimized && (
        <div className="max-h-80 overflow-y-auto">
          {filteredJobs.map((job) => (
            <UploadJobItem
              key={job.id}
              job={job}
              onCancel={() => handleCancel(job.id)}
              onRetry={() => handleRetry(job.id)}
              onDismiss={() => handleDismiss(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UploadJobItemProps {
  job: UploadJob;
  onCancel: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

function UploadJobItem({ job, onCancel, onRetry, onDismiss }: UploadJobItemProps) {
  const statusColors = {
    queued: 'bg-gray-400',
    uploading: 'bg-blue-500',
    processing: 'bg-yellow-500',
    transcoding: 'bg-purple-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  };

  const statusLabels = {
    queued: 'Queued',
    uploading: 'Uploading',
    processing: 'Processing',
    transcoding: 'Transcoding',
    completed: 'Completed',
    failed: 'Failed',
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const progress = job.status === 'transcoding'
    ? job.transcodingProgress ?? 0
    : job.progress;

  return (
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      {/* Filename and Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColors[job.status])} />
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {job.filename}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {job.status === 'failed' && (
            <button
              onClick={onRetry}
              className="p-1 text-blue-500 hover:text-blue-600"
              title="Retry"
            >
              <RetryIcon className="w-4 h-4" />
            </button>
          )}
          {(job.status === 'queued' || job.status === 'uploading') && (
            <button
              onClick={onCancel}
              className="p-1 text-red-500 hover:text-red-600"
              title="Cancel"
            >
              <CancelIcon className="w-4 h-4" />
            </button>
          )}
          {(job.status === 'completed' || job.status === 'failed') && (
            <button
              onClick={onDismiss}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Dismiss"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(job.status === 'uploading' || job.status === 'processing' || job.status === 'transcoding') && (
        <div className="mb-2">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                job.status === 'uploading' && 'bg-blue-500',
                job.status === 'processing' && 'bg-yellow-500',
                job.status === 'transcoding' && 'bg-purple-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status and Details */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{statusLabels[job.status]}</span>
        <div className="flex items-center gap-2">
          {job.status === 'uploading' && job.fileSize && job.uploadedBytes && (
            <span>
              {formatBytes(job.uploadedBytes)} / {formatBytes(job.fileSize)}
            </span>
          )}
          {(job.status === 'uploading' || job.status === 'transcoding') && (
            <span>{Math.round(progress)}%</span>
          )}
          {job.status === 'completed' && job.qualities && (
            <span>{job.qualities.join(', ')}</span>
          )}
          {job.status === 'failed' && job.error && (
            <span className="text-red-500 truncate max-w-32" title={job.error}>
              {job.error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon components
function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function RetryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function CancelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default UploadProgressTracker;
