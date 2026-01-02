"use client";

import { useState } from "react";
import { useMediaPlayer } from "@/hooks/useMediaPlayer";
import { IframeRenderer } from "./IframeRenderer";
import { getMediaFormat, getEmbedUrl } from "@/lib/media-utils";

/**
 * Mini floating player for YouTube/Vimeo iframes.
 * Smaller, PiP-like experience for embedded videos.
 */
export function MiniDockedPlayer() {
  const { state, actions } = useMediaPlayer();
  const [position, setPosition] = useState({ bottom: 20, right: 20 });

  const { currentMedia } = state;
  if (!currentMedia) return null;

  const format = getMediaFormat(currentMedia);

  const handleExpand = () => {
    actions.setMode("fullscreen");
  };

  const handleClose = () => {
    actions.close();
  };

  const handleMakeLarger = () => {
    // Switch to regular docked mode (larger)
    actions.setMode("docked");
  };

  return (
    <div
      className="fixed z-50 flex flex-col overflow-hidden rounded-lg bg-black shadow-2xl"
      style={{
        bottom: `${position.bottom}px`,
        right: `${position.right}px`,
        width: "320px", // Smaller than regular docked (380px)
      }}
    >
      {/* Video */}
      <div className="aspect-video w-full">
        <IframeRenderer
          embedUrl={getEmbedUrl(currentMedia.source)}
          title={currentMedia.title}
          autoPlay={state.isPlaying}
          className="h-full w-full rounded-t-lg"
        />
      </div>

      {/* Compact Control Bar */}
      <div className="flex items-center justify-between bg-neutral-900 px-2 py-1.5">
        <div className="flex-1 truncate text-xs text-white/80">
          {currentMedia.title}
        </div>
        <div className="flex items-center gap-1">
          {/* Expand to larger docked */}
          <button
            onClick={handleMakeLarger}
            className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Make larger"
            title="Larger player"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
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
            className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close player"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
