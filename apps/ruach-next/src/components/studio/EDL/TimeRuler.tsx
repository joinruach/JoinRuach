'use client';

import { CutBlock } from './CutBlock';
import type { Cut } from '@/lib/studio/edl';

interface TimeRulerProps {
  durationMs: number;
  cuts: Cut[];
  selectedCutId: string | null;
  currentTime: number;
  onCutClick: (cutId: string) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function TimeRuler({
  durationMs,
  cuts,
  selectedCutId,
  currentTime,
  onCutClick,
}: TimeRulerProps) {
  // Generate time markers every 10 seconds
  const markerCount = Math.ceil(durationMs / 10000) + 1;
  const markers = Array.from({ length: markerCount }, (_, i) => i * 10000);

  return (
    <div className="relative min-h-[200px] bg-gray-800 rounded-lg p-4">
      {/* Time Markers */}
      <div className="absolute top-4 left-4 right-4 h-6 flex justify-between text-xs text-gray-400 pointer-events-none">
        {markers.map((time, i) => (
          <span key={i} className="flex flex-col items-center">
            <span className="text-xs">{formatTime(time)}</span>
            <div className="w-px h-2 bg-gray-600 mt-1" />
          </span>
        ))}
      </div>

      {/* Cut Blocks */}
      <div className="absolute top-16 left-4 right-4 bottom-4">
        {cuts.map((cut) => (
          <CutBlock
            key={cut.id}
            cut={cut}
            durationMs={durationMs}
            isSelected={cut.id === selectedCutId}
            onClick={() => onCutClick(cut.id)}
          />
        ))}
      </div>

      {/* Playhead */}
      <div
        className="absolute top-4 bottom-4 w-0.5 bg-red-500 z-10 pointer-events-none transition-all duration-100"
        style={{ left: `calc(1rem + ${(currentTime / durationMs) * 100}% * (100% - 2rem) / 100%)` }}
      >
        <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
      </div>
    </div>
  );
}
