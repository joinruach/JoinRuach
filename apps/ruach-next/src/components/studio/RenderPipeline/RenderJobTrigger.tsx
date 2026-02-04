'use client';

import { useState } from 'react';

interface RenderJobTriggerProps {
  sessionId: string;
  onJobCreated?: (jobId: string) => void;
}

interface RenderFormat {
  id: string;
  name: string;
  description: string;
  aspectRatio: string;
}

const RENDER_FORMATS: RenderFormat[] = [
  {
    id: 'full_16_9',
    name: '16:9 Full',
    description: 'Standard widescreen format for YouTube, web',
    aspectRatio: '16:9',
  },
  {
    id: 'vertical_9_16',
    name: '9:16 Vertical',
    description: 'Mobile-first format for Instagram, TikTok, Stories',
    aspectRatio: '9:16',
  },
  {
    id: 'square_1_1',
    name: '1:1 Square',
    description: 'Square format for social media posts',
    aspectRatio: '1:1',
  },
];

/**
 * Trigger component for creating new render jobs
 */
export function RenderJobTrigger({ sessionId, onJobCreated }: RenderJobTriggerProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('full_16_9');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTriggerRender = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/render-job/render-jobs/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          format: selectedFormat,
          metadata: {
            triggeredBy: 'studio-ui',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to trigger render');
      }

      const data = await response.json();
      setSuccess(`Render job created: ${data.data.jobId}`);

      if (onJobCreated) {
        onJobCreated(data.data.jobId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Format Selection */}
      <div>
        <label className="label">
          <span className="label-text font-semibold">Select Render Format</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RENDER_FORMATS.map((format) => (
            <div
              key={format.id}
              className={`card cursor-pointer transition-all ${
                selectedFormat === format.id
                  ? 'bg-primary text-primary-content ring-2 ring-primary'
                  : 'bg-base-200 hover:bg-base-300'
              }`}
              onClick={() => setSelectedFormat(format.id)}
            >
              <div className="card-body p-4">
                <h3 className="font-bold">{format.name}</h3>
                <p className="text-sm opacity-80">{format.description}</p>
                <div className="badge badge-sm mt-2">{format.aspectRatio}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger Button */}
      <button
        onClick={handleTriggerRender}
        disabled={loading || !sessionId}
        className="btn btn-primary btn-lg w-full"
      >
        {loading ? (
          <>
            <span className="loading loading-spinner" />
            Creating Render...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
            Start Render
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
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
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
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
          <span>{success}</span>
        </div>
      )}

      {/* Info */}
      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p className="text-sm">
            Render jobs are processed by the background worker. You'll be able to monitor
            progress in real-time once the job starts.
          </p>
        </div>
      </div>
    </div>
  );
}
