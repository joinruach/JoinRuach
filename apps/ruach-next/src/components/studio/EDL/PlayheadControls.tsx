'use client';

interface PlayheadControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PlayheadControls({
  currentTime,
  duration,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
}: PlayheadControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Play/Pause Button */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="w-10 h-10 flex items-center justify-center bg-ruachGold text-ruachDark rounded-full hover:bg-opacity-90 transition-colors"
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 4h3v12H6V4zm5 0h3v12h-3V4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 4.1c-.3-.2-.7 0-.7.4v11c0 .4.4.6.7.4l9-5.5c.3-.2.3-.6 0-.8l-9-5.5z" />
          </svg>
        )}
      </button>

      {/* Time Display */}
      <div className="flex items-center gap-2 text-sm text-gray-300 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span className="text-gray-600">/</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Seek Bar */}
      <div className="flex-1 max-w-md">
        <input
          type="range"
          min={0}
          max={duration}
          step={100}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #D4B58A 0%, #D4B58A ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`,
          }}
        />
      </div>

      {/* Quick Jump Buttons */}
      <div className="flex gap-1">
        <button
          onClick={() => onSeek(Math.max(0, currentTime - 5000))}
          className="px-3 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          -5s
        </button>
        <button
          onClick={() => onSeek(Math.min(duration, currentTime + 5000))}
          className="px-3 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          +5s
        </button>
      </div>
    </div>
  );
}
