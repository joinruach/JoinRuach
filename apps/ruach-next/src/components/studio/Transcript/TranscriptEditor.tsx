'use client';

import React, { useState } from 'react';
import type { TranscriptSegment } from '@/lib/studio';
import { updateTranscriptSegments } from '@/lib/studio';

interface TranscriptEditorProps {
  transcriptId: string;
  segments: TranscriptSegment[];
  onUpdate: (segments: TranscriptSegment[]) => void;
  authToken: string;
  speakerMap?: Record<string, string>;
}

export function TranscriptEditor({
  transcriptId,
  segments: initialSegments,
  onUpdate,
  authToken,
  speakerMap = {}
}: TranscriptEditorProps) {
  const [segments, setSegments] = useState(initialSegments);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleEditStart = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditValue(currentText);
  };

  const handleEditSave = (index: number) => {
    if (editingIndex === index) {
      const updated = [...segments];
      updated[index] = { ...updated[index], text: editValue };
      setSegments(updated);
      setHasChanges(true);
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleSpeakerChange = (index: number, newSpeaker: string) => {
    const updated = [...segments];
    updated[index] = { ...updated[index], speaker: newSpeaker };
    setSegments(updated);
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await updateTranscriptSegments(transcriptId, segments, authToken);
      onUpdate(segments); // Notify parent
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save segments:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSegments(initialSegments);
    setHasChanges(false);
    setEditingIndex(null);
    setEditValue('');
  };

  const handleTimestampChange = (
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const updated = [...segments];
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      updated[index] = { ...updated[index], [field]: numValue };
      onUpdate(updated);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0') + '.' + ms.toString().padStart(3, '0');
  };

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const mins = parseInt(parts[0], 10);
    const secParts = parts[1].split('.');
    const secs = parseInt(secParts[0], 10);
    const ms = secParts.length > 1 ? parseInt(secParts[1], 10) : 0;
    return mins * 60 + secs + ms / 1000;
  };

  const getSpeakerDisplay = (speakerId: string): string => {
    return speakerMap[speakerId] || speakerId;
  };

  return (
    <div className="space-y-4 p-6">
      {/* Save bar */}
      {hasChanges && (
        <div className="sticky top-0 z-10 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You have unsaved changes
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-ruachGold rounded-lg hover:bg-opacity-90 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transcript Segments</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{segments.length} segments</p>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {segments.map((segment, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Speaker Selection */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Speaker
                </label>
                <select
                  value={segment.speaker}
                  onChange={(e) => handleSpeakerChange(index, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="A">{getSpeakerDisplay('A')}</option>
                  <option value="B">{getSpeakerDisplay('B')}</option>
                  <option value="C">{getSpeakerDisplay('C')}</option>
                  <option value="D">{getSpeakerDisplay('D')}</option>
                  <option value="E">{getSpeakerDisplay('E')}</option>
                </select>
              </div>

              {/* Timestamps */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  value={formatTime(segment.startMs)}
                  onChange={(e) => {
                    const parsed = parseTime(e.target.value);
                    handleTimestampChange(index, 'start', parsed.toString());
                  }}
                  className="text-sm border border-gray-300 rounded px-2 py-1 w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="00:00.000"
                />
              </div>

              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="text"
                  value={formatTime(segment.endMs)}
                  onChange={(e) => {
                    const parsed = parseTime(e.target.value);
                    handleTimestampChange(index, 'end', parsed.toString());
                  }}
                  className="text-sm border border-gray-300 rounded px-2 py-1 w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="00:00.000"
                />
              </div>

              {/* Text Content */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Text
                </label>
                {editingIndex === index ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(index)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleEditStart(index, segment.text)}
                    className="text-sm text-gray-900 cursor-pointer hover:bg-blue-50 rounded px-3 py-2 border border-transparent hover:border-blue-200 transition-colors"
                  >
                    {segment.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {segments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No transcript segments available
        </div>
      )}
    </div>
  );
}
