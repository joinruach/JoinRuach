'use client';

import type { Cut } from '@/lib/studio/edl';
import type { CameraAngle } from '@/lib/studio/api';

interface CutInspectorProps {
  cut: Cut;
  onCameraChange: (camera: CameraAngle) => void;
  onNudgeStart: (deltaMs: number) => void;
  onNudgeEnd: (deltaMs: number) => void;
  onSplit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function getConfidenceBadge(confidence: number): { color: string; label: string } {
  if (confidence >= 0.8) return { color: 'bg-green-500/20 text-green-400', label: 'High' };
  if (confidence >= 0.5) return { color: 'bg-yellow-500/20 text-yellow-400', label: 'Medium' };
  return { color: 'bg-red-500/20 text-red-400', label: 'Low' };
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

export function CutInspector({
  cut,
  onCameraChange,
  onNudgeStart,
  onNudgeEnd,
  onSplit,
  onDelete,
  onClose,
}: CutInspectorProps) {
  const nudgeButtons = [
    { label: '-1s', value: -1000 },
    { label: '-500ms', value: -500 },
    { label: '-100ms', value: -100 },
    { label: '+100ms', value: 100 },
    { label: '+500ms', value: 500 },
    { label: '+1s', value: 1000 },
  ];

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Edit Cut</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Cut Info */}
      <div className="p-3 bg-gray-900 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Duration</span>
          <span className="text-white font-medium">
            {formatTime(cut.endMs - cut.startMs)}
          </span>
        </div>
        {cut.reason && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Reason</span>
            <span className="text-white capitalize">{cut.reason}</span>
          </div>
        )}
        {cut.confidence !== undefined && (() => {
          const badge = getConfidenceBadge(cut.confidence);
          return (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Confidence</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
                {badge.label} · {(cut.confidence * 100).toFixed(0)}%
              </span>
            </div>
          );
        })()}
      </div>

      {/* Camera Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Camera
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['A', 'B', 'C'] as CameraAngle[]).map((camera) => (
            <button
              key={camera}
              onClick={() => onCameraChange(camera)}
              className={`
                px-3 py-2 rounded font-medium transition-all
                ${
                  cut.camera === camera
                    ? 'bg-ruachGold text-ruachDark'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {camera}
            </button>
          ))}
        </div>
      </div>

      {/* Start Time Nudge */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Start Time: {formatTime(cut.startMs)}
        </label>
        <div className="grid grid-cols-3 gap-1">
          {nudgeButtons.map(({ label, value }) => (
            <button
              key={`start-${value}`}
              onClick={() => onNudgeStart(value)}
              className="px-2 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* End Time Nudge */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          End Time: {formatTime(cut.endMs)}
        </label>
        <div className="grid grid-cols-3 gap-1">
          {nudgeButtons.map(({ label, value }) => (
            <button
              key={`end-${value}`}
              onClick={() => onNudgeEnd(value)}
              className="px-2 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-4 border-t border-gray-700">
        <button
          onClick={onSplit}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Split at Playhead
        </button>
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Delete Cut
        </button>
      </div>
    </div>
  );
}
