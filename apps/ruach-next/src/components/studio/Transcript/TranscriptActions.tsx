'use client';

import React, { useState } from 'react';

interface TranscriptActionsProps {
  sessionId: string;
  transcriptStatus: 'pending' | 'processing' | 'completed' | 'approved' | 'error';
  onApprove: () => Promise<void>;
  onRegenerate: () => Promise<void>;
  canApprove?: boolean;
  canRegenerate?: boolean;
}

export function TranscriptActions({
  sessionId,
  transcriptStatus,
  onApprove,
  onRegenerate,
  canApprove = true,
  canRegenerate = true,
}: TranscriptActionsProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!canApprove || transcriptStatus === 'approved') {
      return;
    }

    setIsApproving(true);
    setError(null);

    try {
      await onApprove();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve transcript';
      setError(message);
      console.error('Approve error:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!canRegenerate) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to regenerate the transcript? This will overwrite the current version.'
    );

    if (!confirmed) {
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      await onRegenerate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate transcript';
      setError(message);
      console.error('Regenerate error:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: string }
    > = {
      pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      processing: {
        label: 'Processing',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      },
      completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      approved: {
        label: 'Approved',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
      },
      error: {
        label: 'Error',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
    };

    const config = statusConfig[transcriptStatus] || statusConfig.pending;

    return (
      <div
        className={
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ' +
          config.className
        }
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={config.icon}
          />
        </svg>
        {config.label}
      </div>
    );
  };

  const isApproved = transcriptStatus === 'approved';
  const isProcessing = transcriptStatus === 'processing';
  const canPerformActions = !isProcessing && !isApproving && !isRegenerating;

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Transcript Actions</h3>
          <p className="text-sm text-gray-500 mt-1">Manage transcript approval and regeneration</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex gap-2">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Approve Button */}
        <button
          onClick={handleApprove}
          disabled={!canApprove || !canPerformActions || isApproved}
          className={
            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2 ' +
            (isApproved
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : canPerformActions
              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed')
          }
        >
          {isApproving ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Approving...
            </>
          ) : isApproved ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Approved
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Approve Transcript
            </>
          )}
        </button>

        {/* Regenerate Button */}
        <button
          onClick={handleRegenerate}
          disabled={!canRegenerate || !canPerformActions}
          className={
            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2 ' +
            (canPerformActions
              ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
              : 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed')
          }
        >
          {isRegenerating ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Regenerating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Regenerate Transcript
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-2">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-medium">About Transcript Actions</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>
                <strong>Approve:</strong> Mark transcript as final and ready for export
              </li>
              <li>
                <strong>Regenerate:</strong> Re-run AI transcription (overwrites current version)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
