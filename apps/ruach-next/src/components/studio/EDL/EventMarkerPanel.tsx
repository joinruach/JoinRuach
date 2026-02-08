'use client';

import type { ChapterMarker } from '@/lib/studio/edl';

interface EventMarkerPanelProps {
  chapters: ChapterMarker[];
  currentTime: number;
  onSeek: (time: number) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function EventMarkerPanel({
  chapters,
  currentTime,
  onSeek,
}: EventMarkerPanelProps) {
  if (chapters.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-700 bg-gray-800 p-4">
      <h4 className="text-sm font-medium text-gray-300 mb-3">Chapter Markers</h4>
      <div className="flex gap-2 overflow-x-auto">
        {chapters.map((chapter) => {
          const isActive =
            currentTime >= chapter.timeMs &&
            (chapters.find((c) => c.timeMs > currentTime)?.timeMs ?? Infinity) >
              currentTime;

          return (
            <button
              key={chapter.id}
              onClick={() => onSeek(chapter.timeMs)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-lg transition-all text-left
                ${
                  isActive
                    ? 'bg-ruachGold text-ruachDark'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              <div className="text-xs opacity-75 mb-1">
                {formatTime(chapter.timeMs)}
              </div>
              <div className="text-sm font-medium">{chapter.title}</div>
              {chapter.description && (
                <div className="text-xs opacity-75 mt-1 line-clamp-2">
                  {chapter.description}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
