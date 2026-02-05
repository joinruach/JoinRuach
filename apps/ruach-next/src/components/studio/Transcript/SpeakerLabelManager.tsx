'use client';

import React, { useState } from 'react';

interface SpeakerLabelManagerProps {
  speakerMap: Record<string, string>;
  onUpdate: (speakerMap: Record<string, string>) => void;
  availableSpeakers: string[];
}

export function SpeakerLabelManager({
  speakerMap,
  onUpdate,
  availableSpeakers,
}: SpeakerLabelManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEditStart = (speakerId: string) => {
    setEditingId(speakerId);
    setEditValue(speakerMap[speakerId] || speakerId);
  };

  const handleEditSave = (speakerId: string) => {
    if (editValue.trim()) {
      const updated = { ...speakerMap, [speakerId]: editValue.trim() };
      onUpdate(updated);
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, speakerId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave(speakerId);
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Speaker Labels</h3>
        <p className="text-sm text-gray-500 mt-1">
          Map speaker IDs to real names for better readability
        </p>
      </div>

      <div className="space-y-3">
        {availableSpeakers.map((speakerId) => (
          <div
            key={speakerId}
            className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Speaker ID Badge */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center">
                {speakerId}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>

            {/* Name Input/Display */}
            <div className="flex-1">
              {editingId === speakerId ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, speakerId)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter speaker name"
                  autoFocus
                />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium">
                    {speakerMap[speakerId] || 'Unnamed Speaker'}
                  </span>
                  <button
                    onClick={() => handleEditStart(speakerId)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Save/Cancel Buttons */}
            {editingId === speakerId && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEditSave(speakerId)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                  disabled={!editValue.trim()}
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
            )}
          </div>
        ))}
      </div>

      {availableSpeakers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No speakers detected in transcript
        </div>
      )}

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
            <p className="font-medium">Tip:</p>
            <p className="mt-1">
              Speaker labels are used in subtitle previews and exports. Set clear, 
              identifiable names for better readability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
