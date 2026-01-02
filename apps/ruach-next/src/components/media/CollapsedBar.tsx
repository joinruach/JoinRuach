"use client";

import { useRef, useEffect } from "react";
import { useMediaPlayer } from "@/hooks/useMediaPlayer";
import { AudioRenderer, type AudioRendererHandle } from "./AudioRenderer";
import { getMediaUrl, formatTime } from "@/lib/media-utils";

/**
 * Collapsed bottom bar player mode.
 * Audio-friendly minimal bar with play/pause and scrub controls.
 */
export function CollapsedBar() {
  const { state, actions } = useMediaPlayer();
  const audioRef = useRef<AudioRendererHandle>(null);

  const { currentMedia } = state;
  if (!currentMedia) return null;

  // Sync playback state
  useEffect(() => {
    const ref = audioRef.current;
    if (!ref) return;

    if (state.isPlaying) {
      ref.play().catch(() => actions.pause());
    } else {
      ref.pause();
    }
  }, [state.isPlaying, actions]);

  const handleExpand = () => {
    actions.setMode("fullscreen");
  };

  const handleClose = () => {
    actions.close();
  };

  const handlePlayPause = () => {
    actions.togglePlayPause();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    actions.seek(time);
    if (audioRef.current) {
      audioRef.current.seek(time);
    }
  };

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 shadow-2xl">
      {/* Hidden audio element */}
      <div className="sr-only">
        <AudioRenderer
          ref={audioRef}
          src={getMediaUrl(currentMedia.source)}
          autoPlay={state.isPlaying}
          onPlay={() => actions.play()}
          onPause={() => actions.pause()}
          onTimeUpdate={(time) => actions.setCurrentTime(time)}
          onDurationChange={(duration) => actions.setDuration(duration)}
        />
      </div>

      {/* Progress Bar */}
      <div className="relative h-1 bg-neutral-700">
        <div
          className="absolute left-0 top-0 h-full bg-amber-500 transition-all"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min="0"
          max={state.duration || 0}
          value={state.currentTime}
          onChange={handleSeek}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Thumbnail */}
        {currentMedia.thumbnail && (
          <div className="flex-shrink-0">
            <img
              src={currentMedia.thumbnail}
              alt={currentMedia.title}
              className="h-12 w-12 rounded object-cover"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0" onClick={handleExpand} role="button" tabIndex={0}>
          <div className="truncate text-sm font-medium text-white">{currentMedia.title}</div>
          <div className="text-xs text-neutral-400">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </div>
        </div>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className="flex-shrink-0 rounded-full bg-amber-500 p-2 text-white hover:bg-amber-600"
          aria-label={state.isPlaying ? "Pause" : "Play"}
        >
          {state.isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Expand */}
        <button
          onClick={handleExpand}
          className="flex-shrink-0 rounded p-2 text-white hover:bg-white/10"
          aria-label="Expand to fullscreen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 rounded p-2 text-white hover:bg-white/10"
          aria-label="Close player"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
