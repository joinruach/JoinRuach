'use client';

import type { Cut } from '@/lib/studio/edl';

interface CutBlockProps {
  cut: Cut;
  durationMs: number;
  isSelected: boolean;
  onClick: () => void;
}

const CAMERA_COLORS = {
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-purple-500',
} as const;

function getConfidenceColor(confidence?: number): string {
  if (confidence === undefined) return 'bg-gray-400';
  if (confidence >= 0.8) return 'bg-green-400';
  if (confidence >= 0.5) return 'bg-yellow-400';
  return 'bg-red-400';
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

export function CutBlock({ cut, durationMs, isSelected, onClick }: CutBlockProps) {
  const left = (cut.startMs / durationMs) * 100;
  const width = ((cut.endMs - cut.startMs) / durationMs) * 100;
  const color = CAMERA_COLORS[cut.camera];

  return (
    <div
      className={`
        absolute h-16 rounded cursor-pointer transition-all
        ${color}
        ${
          isSelected
            ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 opacity-100 scale-105'
            : 'opacity-80 hover:opacity-100 hover:scale-102'
        }
      `}
      style={{ left: `${left}%`, width: `${width}%` }}
      onClick={onClick}
    >
      <div className="p-2 h-full flex flex-col justify-between text-white">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Camera {cut.camera}</span>
          {cut.reason && (
            <span className="text-xs opacity-75 capitalize">{cut.reason}</span>
          )}
        </div>
        <div className="text-xs opacity-90">
          {formatDuration(cut.endMs - cut.startMs)}
        </div>
      </div>
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 ${getConfidenceColor(cut.confidence)} rounded-b`}
      />
    </div>
  );
}
