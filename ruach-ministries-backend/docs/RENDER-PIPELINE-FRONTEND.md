# Phase 13 Render Pipeline - Frontend Integration Guide

## Overview

This guide shows how to integrate the Phase 13 render pipeline into your Next.js frontend application.

---

## API Endpoints

All endpoints are prefixed with `/api/render-job/`

### Base URL
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const RENDER_API = `${API_BASE}/api/render-job`;
```

---

## 1. Trigger Render Job

**POST** `/api/render-job/render-jobs/trigger`

Create and queue a new render job for a recording session.

### Request Body
```typescript
{
  sessionId: string;        // Recording session ID (required)
  format?: string;          // Render format (default: "full_16_9")
  metadata?: object;        // Optional metadata
}
```

### Response
```typescript
{
  success: boolean;
  data: {
    jobId: string;          // Unique job identifier
    status: string;         // "queued"
    format: string;         // "full_16_9"
    sessionId: string;      // Recording session ID
    progress: number;       // 0-100
    createdAt: string;      // ISO timestamp
  }
}
```

### Example: React Component
```typescript
'use client';

import { useState } from 'react';

interface TriggerRenderResponse {
  success: boolean;
  data: {
    jobId: string;
    status: string;
    format: string;
    sessionId: string;
    progress: number;
    createdAt: string;
  };
}

export function RenderTrigger({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerRender = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/render-job/render-jobs/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication if required
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          format: 'full_16_9',
          metadata: { triggeredBy: 'user' }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger render');
      }

      const data: TriggerRenderResponse = await response.json();
      setJobId(data.data.jobId);

      // Redirect to monitoring page or start polling
      // router.push(`/render-jobs/${data.data.jobId}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={triggerRender}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Starting Render...' : 'Render Video'}
      </button>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {jobId && (
        <div className="alert alert-success">
          Render job created: {jobId}
        </div>
      )}
    </div>
  );
}
```

---

## 2. Get Render Job Status

**GET** `/api/render-job/render-jobs/:jobId`

Get detailed status and progress of a render job.

### Response
```typescript
{
  success: boolean;
  data: {
    jobId: string;
    status: "queued" | "processing" | "completed" | "failed" | "cancelled";
    progress: number;                    // 0-100
    format: string;
    sessionId: string;
    edlId: string;
    edlVersion: number;

    // Outputs (available when status === "completed")
    outputVideoUrl?: string;             // R2 video URL
    outputThumbnailUrl?: string;         // R2 thumbnail URL
    outputChaptersUrl?: string;          // R2 chapters URL
    outputSubtitlesUrl?: string;         // R2 subtitles URL

    // Video metadata
    durationMs?: number;
    fileSizeBytes?: number;
    resolution?: string;
    fps?: number;

    // Error handling
    errorMessage?: string;               // Available when status === "failed"

    // Timing
    renderStartedAt?: string;
    renderCompletedAt?: string;
    renderDurationMs?: number;           // Time taken to render
    createdAt: string;
    updatedAt: string;

    // Advanced
    bullmqJobId?: string;
    metadata?: object;
  }
}
```

### Example: Real-time Status Polling Hook
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

interface RenderJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  outputVideoUrl?: string;
  outputThumbnailUrl?: string;
  errorMessage?: string;
  renderDurationMs?: number;
}

interface UseRenderJobOptions {
  pollInterval?: number;  // milliseconds (default: 2000)
  enabled?: boolean;      // enable/disable polling
}

export function useRenderJob(jobId: string, options: UseRenderJobOptions = {}) {
  const { pollInterval = 2000, enabled = true } = options;

  const [job, setJob] = useState<RenderJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/render-job/render-jobs/${jobId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch render job');
      }

      const data = await response.json();
      setJob(data.data);
      setError(null);

      // Stop polling if job is in terminal state
      const isTerminal = ['completed', 'failed', 'cancelled'].includes(
        data.data.status
      );

      return isTerminal;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return true; // Stop polling on error
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!enabled) return;

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
  }, [jobId, pollInterval, enabled, fetchJob]);

  return { job, loading, error, refetch: fetchJob };
}
```

### Example: Status Monitor Component
```typescript
'use client';

export function RenderJobMonitor({ jobId }: { jobId: string }) {
  const { job, loading, error } = useRenderJob(jobId);

  if (loading && !job) {
    return <div>Loading render job...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!job) {
    return <div>Render job not found</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Render Job: {job.jobId}</h2>

        {/* Status Badge */}
        <div className={`badge badge-${getStatusColor(job.status)}`}>
          {job.status.toUpperCase()}
        </div>

        {/* Progress Bar */}
        {job.status === 'processing' && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <progress
              className="progress progress-primary w-full"
              value={job.progress}
              max="100"
            />
          </div>
        )}

        {/* Error Message */}
        {job.status === 'failed' && job.errorMessage && (
          <div className="alert alert-error mt-4">
            <span>Error: {job.errorMessage}</span>
          </div>
        )}

        {/* Outputs */}
        {job.status === 'completed' && (
          <div className="mt-4 space-y-2">
            {job.outputVideoUrl && (
              <div>
                <a
                  href={job.outputVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Download Video
                </a>
              </div>
            )}

            {job.outputThumbnailUrl && (
              <div className="mt-4">
                <img
                  src={job.outputThumbnailUrl}
                  alt="Video thumbnail"
                  className="rounded-lg shadow-lg max-w-md"
                />
              </div>
            )}

            {job.renderDurationMs && (
              <p className="text-sm text-gray-600">
                Rendered in {(job.renderDurationMs / 1000).toFixed(1)}s
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'success';
    case 'processing': return 'info';
    case 'failed': return 'error';
    case 'cancelled': return 'warning';
    default: return 'ghost';
  }
}
```

---

## 3. Get All Jobs for Session

**GET** `/api/render-job/render-jobs/session/:sessionId`

Get all render jobs for a specific recording session.

### Response
```typescript
{
  success: boolean;
  data: Array<{
    jobId: string;
    status: string;
    progress: number;
    format: string;
    outputVideoUrl?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
  }>
}
```

### Example: Session Jobs List
```typescript
'use client';

import { useState, useEffect } from 'react';

export function SessionRenderJobs({ sessionId }: { sessionId: string }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(
          `/api/render-job/render-jobs/session/${sessionId}`
        );
        const data = await response.json();
        setJobs(data.data);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [sessionId]);

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Render Jobs</h3>

      {jobs.length === 0 ? (
        <p className="text-gray-500">No render jobs yet</p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.jobId} className="card bg-base-200">
              <div className="card-body">
                <div className="flex justify-between">
                  <span className="font-mono text-sm">{job.jobId}</span>
                  <span className={`badge badge-${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                {job.status === 'processing' && (
                  <progress
                    className="progress progress-primary"
                    value={job.progress}
                    max="100"
                  />
                )}

                {job.outputVideoUrl && (
                  <a
                    href={job.outputVideoUrl}
                    className="btn btn-sm btn-primary"
                  >
                    View Video
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 4. Retry Failed Job

**POST** `/api/render-job/render-jobs/:jobId/retry`

Retry a failed render job.

### Response
```typescript
{
  success: boolean;
  data: {
    jobId: string;
    status: string;    // Reset to "queued"
    progress: number;  // Reset to 0
  }
}
```

### Example
```typescript
async function retryRender(jobId: string) {
  const response = await fetch(
    `/api/render-job/render-jobs/${jobId}/retry`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error('Failed to retry render');
  }

  return response.json();
}
```

---

## 5. Cancel Active Job

**POST** `/api/render-job/render-jobs/:jobId/cancel`

Cancel an active render job.

### Response
```typescript
{
  success: boolean;
  data: {
    jobId: string;
    status: string;    // "cancelled"
  }
}
```

### Example
```typescript
async function cancelRender(jobId: string) {
  const response = await fetch(
    `/api/render-job/render-jobs/${jobId}/cancel`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error('Failed to cancel render');
  }

  return response.json();
}
```

---

## Complete Example: Render Job Page

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useRenderJob } from '@/hooks/useRenderJob';

export default function RenderJobPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const { job, loading, error, refetch } = useRenderJob(jobId);

  const handleRetry = async () => {
    try {
      await fetch(`/api/render-job/render-jobs/${jobId}/retry`, {
        method: 'POST',
      });
      refetch();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this render?')) return;

    try {
      await fetch(`/api/render-job/render-jobs/${jobId}/cancel`, {
        method: 'POST',
      });
      refetch();
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  if (loading && !job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  if (!job) {
    return <div>Render job not found</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Render Job</h1>

      <div className="card bg-base-200">
        <div className="card-body">
          {/* Job ID */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{job.jobId}</span>
            <div className={`badge badge-${getStatusColor(job.status)}`}>
              {job.status}
            </div>
          </div>

          {/* Progress Bar */}
          {job.status === 'processing' && (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Processing</span>
                <span>{job.progress}%</span>
              </div>
              <progress
                className="progress progress-primary w-full h-4"
                value={job.progress}
                max="100"
              />
            </div>
          )}

          {/* Error Message */}
          {job.status === 'failed' && (
            <div className="alert alert-error mt-4">
              <span>{job.errorMessage || 'Render failed'}</span>
            </div>
          )}

          {/* Video Player */}
          {job.status === 'completed' && job.outputVideoUrl && (
            <div className="mt-6">
              <video
                controls
                className="w-full rounded-lg shadow-lg"
                poster={job.outputThumbnailUrl}
              >
                <source src={job.outputVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              <div className="mt-4 flex gap-4">
                <a
                  href={job.outputVideoUrl}
                  download
                  className="btn btn-primary"
                >
                  Download Video
                </a>

                {job.outputSubtitlesUrl && (
                  <a
                    href={job.outputSubtitlesUrl}
                    download
                    className="btn btn-secondary"
                  >
                    Download Subtitles
                  </a>
                )}
              </div>

              {job.renderDurationMs && (
                <p className="text-sm text-gray-600 mt-2">
                  Rendered in {(job.renderDurationMs / 1000).toFixed(1)} seconds
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="card-actions justify-end mt-6">
            {job.status === 'failed' && (
              <button onClick={handleRetry} className="btn btn-warning">
                Retry
              </button>
            )}

            {['queued', 'processing'].includes(job.status) && (
              <button onClick={handleCancel} className="btn btn-error">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## TypeScript Types

Create a `types/render-job.ts` file:

```typescript
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
  sessionId: string;
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

export interface TriggerRenderRequest {
  sessionId: string;
  format?: string;
  metadata?: Record<string, any>;
}

export interface TriggerRenderResponse {
  success: boolean;
  data: {
    jobId: string;
    status: RenderJobStatus;
    format: string;
    sessionId: string;
    progress: number;
    createdAt: string;
  };
}

export interface GetRenderJobResponse {
  success: boolean;
  data: RenderJob;
}

export interface GetSessionJobsResponse {
  success: boolean;
  data: RenderJob[];
}
```

---

## Error Handling

```typescript
export class RenderJobError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'RenderJobError';
  }
}

export async function fetchRenderJob(
  jobId: string
): Promise<RenderJob> {
  const response = await fetch(`/api/render-job/render-jobs/${jobId}`);

  if (!response.ok) {
    const text = await response.text();
    throw new RenderJobError(
      text || 'Failed to fetch render job',
      response.status
    );
  }

  const data = await response.json();
  return data.data;
}
```

---

## Best Practices

### 1. **Polling Strategy**
- Poll every 2-3 seconds during processing
- Stop polling when status is terminal (completed/failed/cancelled)
- Use exponential backoff on errors
- Show clear loading states

### 2. **Error Handling**
- Display user-friendly error messages
- Provide retry options for failed jobs
- Log errors for debugging
- Handle network errors gracefully

### 3. **Performance**
- Only poll active jobs
- Cache completed job data
- Use React Query or SWR for caching
- Debounce user actions

### 4. **UX**
- Show progress visually (progress bars)
- Display estimated time remaining
- Provide cancel/retry options
- Show video preview on completion
- Enable direct download

### 5. **Authentication**
- Add JWT tokens to requests if required
- Handle 401/403 errors
- Refresh tokens as needed

---

## Next Steps

1. Copy the example hooks and components to your frontend
2. Adjust styling to match your design system
3. Add authentication headers if needed
4. Test with real recording sessions
5. Monitor performance and adjust polling intervals

---

## Questions?

See:
- Backend API: `src/api/render-job/controllers/render-job-controller.ts`
- Routes: `src/api/render-job/routes/render-job.ts`
- Service: `src/api/render-job/services/render-job-service.ts`
