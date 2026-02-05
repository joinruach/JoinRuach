'use client';

import { useState } from 'react';
import type { Transcript } from '@/lib/studio';
import { startTranscription, getTranscript } from '@/lib/studio';
import { TranscriptEditor } from './TranscriptEditor';
import { SpeakerLabelManager } from './SpeakerLabelManager';
import { SubtitlePreview } from './SubtitlePreview';
import { TranscriptActions } from './TranscriptActions';

interface TranscriptViewerPageProps {
  sessionId: string;
  transcript: Transcript | null;
  authToken: string;
  locale: string;
}

const TERMINAL_STATES = new Set(['ALIGNED', 'FAILED', 'completed', 'failed']);

export default function TranscriptViewerPage({
  sessionId,
  transcript: initialTranscript,
  authToken,
  locale,
}: TranscriptViewerPageProps) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'speakers' | 'subtitles'>('editor');

  async function pollTranscript() {
    const maxAttempts = 60; // ~2 mins @ 2s base cadence
    for (let i = 0; i < maxAttempts; i++) {
      const t = await getTranscript(sessionId, authToken);
      if (!t) {
        // Still null, continue polling
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (TERMINAL_STATES.has(t.status)) {
        return t;
      }

      // Update status for progress indication
      setTranscript(t);

      // Exponential backoff up to 8s
      const delay = Math.min(1000 * (2 + i), 8000);
      await new Promise(r => setTimeout(r, delay));
    }
    throw new Error('Transcript polling timed out');
  }

  async function handleGenerateTranscript() {
    setIsGenerating(true);
    try {
      const res = await startTranscription(sessionId, authToken, {
        provider: 'mock',
        diarization: true,
        language: 'en',
      });

      // Optimistic update - show QUEUED state immediately
      setTranscript({
        id: res.data.transcriptId,
        transcriptionId: sessionId,
        status: res.data.status,
        provider: 'mock',
        hasDiarization: true,
        language: 'en',
        sourceAssetId: 0,
        syncOffsets_ms: {},
        segments: [],
        durationSeconds: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Poll until terminal state
      const finalTranscript = await pollTranscript();
      setTranscript(finalTranscript);
    } catch (error) {
      console.error('Failed to generate transcript:', error);
      alert('Failed to generate transcript. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  // No transcript yet
  if (!transcript) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            No Transcript Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Generate a transcript to view and edit the spoken content from this session.
          </p>
          <button
            onClick={handleGenerateTranscript}
            disabled={isGenerating}
            className="px-6 py-3 bg-ruachGold text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Transcript'}
          </button>
        </div>
      </div>
    );
  }

  // Transcript exists but not aligned yet
  if (transcript.status !== 'ALIGNED' && transcript.status !== 'completed') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ruachGold mx-auto"></div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Processing Transcript
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Status: {transcript.status}
          </p>
        </div>
      </div>
    );
  }

  const tabButtonClass = (isActive: boolean) =>
    'px-4 py-2 text-sm font-medium rounded-lg ' +
    (isActive
      ? 'bg-ruachGold text-white'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Transcript
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {transcript.segments.length} segments • {transcript.hasDiarization ? 'Speaker identification enabled' : 'No speaker identification'}
              </p>
            </div>
            <TranscriptActions
              sessionId={sessionId}
              transcriptStatus={transcript.status === 'ALIGNED' || transcript.status === 'completed' ? 'completed' : 'processing'}
              onApprove={async () => {
                // Handle approval
                alert('Transcript approved');
              }}
              onRegenerate={async () => {
                if (confirm('Are you sure you want to regenerate the transcript?')) {
                  handleGenerateTranscript();
                }
              }}
            />
          </div>

          {/* Tab navigation */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('editor')}
              className={tabButtonClass(activeTab === 'editor')}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('speakers')}
              className={tabButtonClass(activeTab === 'speakers')}
            >
              Speakers
            </button>
            <button
              onClick={() => setActiveTab('subtitles')}
              className={tabButtonClass(activeTab === 'subtitles')}
            >
              Subtitles
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'editor' && (
          <TranscriptEditor
            transcriptId={String(transcript.id)}
            segments={transcript.segments}
            onUpdate={(segments) => setTranscript({ ...transcript, segments })}
            authToken={authToken}
            speakerMap={(transcript.metadata?.speakerMapping as Record<string, string>) || {}}
          />
        )}
        {activeTab === 'speakers' && (
          <SpeakerLabelManager
            speakerMap={(transcript.metadata?.speakerMapping as Record<string, string>) || {}}
            availableSpeakers={Array.from(new Set(transcript.segments.map(s => s.speaker).filter((s): s is string => Boolean(s))))}
            onUpdate={(speakerMap) => {
              // Store speaker mapping in metadata
              setTranscript({
                ...transcript,
                metadata: { ...transcript.metadata, speakerMapping: speakerMap }
              });
            }}
          />
        )}
        {activeTab === 'subtitles' && (
          <SubtitlePreview
            segments={transcript.segments}
            speakerMap={{}}
          />
        )}
      </div>
    </div>
  );
}
