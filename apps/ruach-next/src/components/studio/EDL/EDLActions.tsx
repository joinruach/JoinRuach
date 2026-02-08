'use client';

import { useState } from 'react';
import { approveEDL, lockEDL, exportEDL, type CanonicalEDL } from '@/lib/studio/edl';

interface EDLActionsProps {
  sessionId: string;
  edl: CanonicalEDL;
  authToken: string;
  hasUnsavedChanges: boolean;
}

export function EDLActions({
  sessionId,
  edl,
  authToken,
  hasUnsavedChanges,
}: EDLActionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  async function handleApprove() {
    if (hasUnsavedChanges) {
      alert('Please save your changes before approving');
      return;
    }

    if (!confirm('Approve this EDL? This will mark it as ready for rendering.')) {
      return;
    }

    try {
      await approveEDL(sessionId, authToken);
      window.location.reload();
    } catch (error) {
      console.error('Failed to approve EDL:', error);
      alert('Failed to approve EDL. Please try again.');
    }
  }

  async function handleLock() {
    if (hasUnsavedChanges) {
      alert('Please save your changes before locking');
      return;
    }

    if (
      !confirm(
        'Lock this EDL? This will prevent further editing and prepare it for rendering.'
      )
    ) {
      return;
    }

    try {
      await lockEDL(sessionId, authToken);
      window.location.reload();
    } catch (error) {
      console.error('Failed to lock EDL:', error);
      alert('Failed to lock EDL. Please try again.');
    }
  }

  async function handleExport(
    format: 'json' | 'fcpxml' | 'premiere' | 'resolve'
  ) {
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const blob = await exportEDL(sessionId, format, authToken);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}.${format === 'fcpxml' ? 'fcpxml' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export EDL:', error);
      alert('Failed to export EDL. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="border-t border-gray-700 bg-gray-800 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* EDL Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Status:</span>
          <span
            className={`
              px-2.5 py-0.5 rounded-full text-xs font-medium
              ${
                edl.status === 'draft'
                  ? 'bg-gray-700 text-gray-300'
                  : edl.status === 'approved'
                    ? 'bg-green-900 text-green-300'
                    : 'bg-blue-900 text-blue-300'
              }
            `}
          >
            {edl.status.charAt(0).toUpperCase() + edl.status.slice(1)}
          </span>
        </div>

        {/* EDL Metrics */}
        <div className="text-sm text-gray-400">
          <span>{edl.metrics.totalCuts} cuts</span>
          <span className="mx-2">•</span>
          <span>Avg {Math.round(edl.metrics.avgShotLength / 1000)}s per shot</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {/* Export Button */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>

          {showExportMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[200px]">
              <button
                onClick={() => handleExport('json')}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Canonical JSON
              </button>
              <button
                onClick={() => handleExport('fcpxml')}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Final Cut Pro XML
              </button>
              <button
                onClick={() => handleExport('premiere')}
                disabled
                className="w-full px-4 py-2 text-left text-sm text-gray-500 cursor-not-allowed"
                title="Coming soon"
              >
                Premiere (Coming Soon)
              </button>
              <button
                onClick={() => handleExport('resolve')}
                disabled
                className="w-full px-4 py-2 text-left text-sm text-gray-500 cursor-not-allowed"
                title="Coming soon"
              >
                DaVinci Resolve (Coming Soon)
              </button>
            </div>
          )}
        </div>

        {/* Approve Button */}
        {edl.status === 'draft' && (
          <button
            onClick={handleApprove}
            disabled={hasUnsavedChanges}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approve EDL
          </button>
        )}

        {/* Lock Button */}
        {edl.status === 'approved' && (
          <button
            onClick={handleLock}
            disabled={hasUnsavedChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lock EDL
          </button>
        )}
      </div>
    </div>
  );
}
