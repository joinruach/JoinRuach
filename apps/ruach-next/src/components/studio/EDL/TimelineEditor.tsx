'use client';

import { useState } from 'react';
import { updateEDL, type CanonicalEDL, type Cut } from '@/lib/studio/edl';
import { TimeRuler } from './TimeRuler';
import { CutInspector } from './CutInspector';
import { PlayheadControls } from './PlayheadControls';
import { EventMarkerPanel } from './EventMarkerPanel';
import { EDLActions } from './EDLActions';
import { ReviewToolbar } from './ReviewToolbar';

interface TimelineEditorProps {
  sessionId: string;
  edl: CanonicalEDL;
  authToken: string;
  onUpdate: (edl: CanonicalEDL) => void;
}

export function TimelineEditor({
  sessionId,
  edl,
  authToken,
  onUpdate,
}: TimelineEditorProps) {
  const [cuts, setCuts] = useState<Cut[]>(edl.tracks.program);
  const [selectedCutId, setSelectedCutId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  const selectedCut = cuts.find((c) => c.id === selectedCutId);

  // Update a single cut
  function updateCut(cutId: string, updates: Partial<Cut>) {
    setCuts((prev) =>
      prev.map((cut) => (cut.id === cutId ? { ...cut, ...updates } : cut))
    );
    setHasChanges(true);
  }

  // Nudge cut timing
  function nudgeStart(cutId: string, deltaMs: number) {
    setCuts((prev) =>
      prev.map((cut) => {
        if (cut.id !== cutId) return cut;
        const newStart = Math.max(0, cut.startMs + deltaMs);
        // Ensure end is always after start
        const newEnd = Math.max(newStart + 100, cut.endMs);
        return { ...cut, startMs: newStart, endMs: newEnd };
      })
    );
    setHasChanges(true);
  }

  function nudgeEnd(cutId: string, deltaMs: number) {
    setCuts((prev) =>
      prev.map((cut) => {
        if (cut.id !== cutId) return cut;
        const newEnd = Math.min(edl.durationMs, cut.endMs + deltaMs);
        // Ensure end is always after start
        const clampedEnd = Math.max(cut.startMs + 100, newEnd);
        return { ...cut, endMs: clampedEnd };
      })
    );
    setHasChanges(true);
  }

  // Split cut at playhead
  function splitAtPlayhead(cutId: string) {
    const cut = cuts.find((c) => c.id === cutId);
    if (!cut || currentTime <= cut.startMs || currentTime >= cut.endMs) {
      alert('Playhead must be within the cut boundaries to split');
      return;
    }

    const newCut: Cut = {
      id: `${cut.id}-split-${Date.now()}`,
      startMs: currentTime,
      endMs: cut.endMs,
      camera: cut.camera,
      reason: cut.reason,
      confidence: cut.confidence,
    };

    setCuts((prev) => [
      ...prev.map((c) => (c.id === cutId ? { ...c, endMs: currentTime } : c)),
      newCut,
    ]);
    setHasChanges(true);
  }

  // Delete cut
  function deleteCut(cutId: string) {
    setCuts((prev) => prev.filter((c) => c.id !== cutId));
    setSelectedCutId(null);
    setHasChanges(true);
  }

  // Mark all high-confidence cuts as operator-approved
  function bulkApproveHighConfidence() {
    setCuts((prev) =>
      prev.map((cut) =>
        (cut.confidence ?? 0) >= 0.8
          ? { ...cut, reason: 'operator' as const }
          : cut
      )
    );
    setHasChanges(true);
  }

  // Select next low-confidence cut for review
  function selectNextLowConfidence() {
    const currentIdx = selectedCutId
      ? cuts.findIndex((c) => c.id === selectedCutId)
      : -1;
    const searchStart = currentIdx + 1;
    const lowCut =
      cuts.slice(searchStart).find((c) => (c.confidence ?? 0) < 0.5) ??
      cuts.slice(0, searchStart).find((c) => (c.confidence ?? 0) < 0.5);
    if (lowCut) setSelectedCutId(lowCut.id);
  }

  // Save changes to backend
  async function handleSave() {
    setIsSaving(true);
    try {
      const updatedEDL = await updateEDL(sessionId, cuts, authToken);
      onUpdate(updatedEDL);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save EDL:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  // Reset changes
  function handleReset() {
    if (confirm('Discard all unsaved changes?')) {
      setCuts(edl.tracks.program);
      setHasChanges(false);
      setSelectedCutId(null);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Bar - Playback Controls + Save/Reset */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <PlayheadControls
          currentTime={currentTime}
          duration={edl.durationMs}
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onSeek={setCurrentTime}
        />

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-yellow-400">Unsaved changes</span>
          )}
          <button
            onClick={() => setReviewMode((r) => !r)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              reviewMode
                ? 'bg-ruachGold text-ruachDark'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Review
          </button>
          <button
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Review Toolbar */}
      {reviewMode && (
        <ReviewToolbar
          cuts={cuts}
          onApproveHighConfidence={bulkApproveHighConfidence}
          onSelectNextLowConfidence={selectNextLowConfidence}
        />
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Timeline Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline Ruler */}
          <div className="flex-1 overflow-auto p-6">
            <TimeRuler
              durationMs={edl.durationMs}
              cuts={cuts}
              selectedCutId={selectedCutId}
              currentTime={currentTime}
              onCutClick={setSelectedCutId}
            />
          </div>

          {/* Chapter Markers */}
          <EventMarkerPanel
            chapters={edl.tracks.chapters || []}
            currentTime={currentTime}
            onSeek={setCurrentTime}
          />

          {/* EDL Actions (Approve, Lock, Export) */}
          <EDLActions
            sessionId={sessionId}
            edl={edl}
            authToken={authToken}
            hasUnsavedChanges={hasChanges}
          />
        </div>

        {/* Cut Inspector Sidebar */}
        {selectedCut && (
          <CutInspector
            cut={selectedCut}
            onCameraChange={(camera) => updateCut(selectedCut.id, { camera })}
            onNudgeStart={(deltaMs) => nudgeStart(selectedCut.id, deltaMs)}
            onNudgeEnd={(deltaMs) => nudgeEnd(selectedCut.id, deltaMs)}
            onSplit={() => splitAtPlayhead(selectedCut.id)}
            onDelete={() => deleteCut(selectedCut.id)}
            onClose={() => setSelectedCutId(null)}
          />
        )}
      </div>
    </div>
  );
}
