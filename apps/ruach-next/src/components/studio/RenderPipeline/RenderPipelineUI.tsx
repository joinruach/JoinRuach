'use client';

import { useState } from 'react';
import { RenderJobTrigger } from './RenderJobTrigger';
import { RenderJobMonitor } from './RenderJobMonitor';
import { SessionRenderJobs } from './SessionRenderJobs';

interface RenderPipelineUIProps {
  sessionId?: string;
}

/**
 * Phase 13: Render Pipeline UI Component
 *
 * Integrates the complete render pipeline into the studio:
 * - Trigger new render jobs
 * - Monitor active renders
 * - View render history
 * - Download completed videos
 */
export function RenderPipelineUI({ sessionId }: RenderPipelineUIProps) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(sessionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Render Pipeline
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create and monitor video renders from your recording sessions
        </p>
      </div>

      {/* Session Selector (if no sessionId provided) */}
      {!sessionId && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Select Recording Session</h2>
            <SessionSelector
              value={selectedSessionId}
              onChange={setSelectedSessionId}
            />
          </div>
        </div>
      )}

      {/* Render Trigger */}
      {selectedSessionId && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Create New Render</h2>
            <RenderJobTrigger
              sessionId={selectedSessionId}
              onJobCreated={(jobId) => {
                setActiveJobId(jobId);
              }}
            />
          </div>
        </div>
      )}

      {/* Active Job Monitor */}
      {activeJobId && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Active Render</h2>
            <RenderJobMonitor
              jobId={activeJobId}
              onComplete={() => {
                // Refresh job list
                setActiveJobId(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Render History */}
      {selectedSessionId && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Render History</h2>
            <SessionRenderJobs
              sessionId={selectedSessionId}
              onSelectJob={setActiveJobId}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Session Selector Component
 * Fetches and displays available recording sessions
 */
function SessionSelector({
  value,
  onChange,
}: {
  value?: string;
  onChange: (sessionId: string) => void;
}) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sessions on mount
  useState(() => {
    fetch('/api/recording-sessions')
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch sessions:', err);
        setLoading(false);
      });
  });

  if (loading) {
    return <div className="loading loading-spinner" />;
  }

  return (
    <select
      className="select select-bordered w-full"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        Select a recording session
      </option>
      {sessions.map((session) => (
        <option key={session.id} value={session.id}>
          {session.title || session.sessionId} - {session.status}
        </option>
      ))}
    </select>
  );
}
