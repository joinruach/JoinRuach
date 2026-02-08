'use client';

import { useState } from 'react';
import { generateEDL, type CanonicalEDL } from '@/lib/studio/edl';
import type { Session } from '@/lib/studio/api';
import { TimelineEditor } from './TimelineEditor';

interface EDLEditorPageProps {
  sessionId: string;
  session: Session;
  initialEDL: CanonicalEDL | null;
  authToken: string;
  locale: string;
}

export function EDLEditorPage({
  sessionId,
  session,
  initialEDL,
  authToken,
  locale,
}: EDLEditorPageProps) {
  const [edl, setEdl] = useState<CanonicalEDL | null>(initialEDL);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateEDL() {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateEDL(sessionId, authToken, {
        minShotLength: 2000,
        maxShotLength: 15000,
        switchCooldown: 1500,
      });

      // Poll for EDL generation completion
      // For now, show success message and reload
      alert('EDL generation started. Refreshing page...');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate EDL');
    } finally {
      setIsGenerating(false);
    }
  }

  // No EDL yet - show generate button
  if (!edl) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md text-center space-y-6">
          <div className="text-6xl">🎬</div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No EDL Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate an automated edit decision list based on transcript speakers
              and camera angles.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerateEDL}
            disabled={isGenerating}
            className="px-6 py-3 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate EDL'}
          </button>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            This will analyze the transcript and create camera cuts automatically.
            You can edit the timeline after generation.
          </p>
        </div>
      </div>
    );
  }

  // EDL exists - show timeline editor
  return (
    <TimelineEditor
      sessionId={sessionId}
      edl={edl}
      authToken={authToken}
      onUpdate={setEdl}
    />
  );
}
