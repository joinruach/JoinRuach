"use client";

import { useRef, useEffect, useState } from "react";
import { useMediaPlayer } from "@/hooks/useMediaPlayer";
import { VideoRenderer, type VideoRendererHandle } from "./VideoRenderer";
import { AudioRenderer, type AudioRendererHandle } from "./AudioRenderer";
import { IframeRenderer } from "./IframeRenderer";
import { getMediaFormat, getMediaUrl, getEmbedUrl } from "@/lib/media-utils";

/**
 * Docked floating player mode.
 * Small video panel in corner, draggable on desktop.
 */
export function DockedPlayer() {
  const { state, actions } = useMediaPlayer();
  const videoRef = useRef<VideoRendererHandle>(null);
  const audioRef = useRef<AudioRendererHandle>(null);
  const [position, setPosition] = useState({ bottom: 20, right: 20 });

  const { currentMedia } = state;
  if (!currentMedia) return null;

  const format = getMediaFormat(currentMedia);
  const isAudio = format === "audio";

  // Sync playback state
  useEffect(() => {
    const ref = isAudio ? audioRef.current : videoRef.current;
    if (!ref) return;

    if (state.isPlaying) {
      ref.play().catch(() => actions.pause());
    } else {
      ref.pause();
    }
  }, [state.isPlaying, isAudio, actions]);

  const handleExpand = () => {
    actions.setMode("fullscreen");
  };

  const handleClose = () => {
    actions.close();
  };

  const renderMedia = () => {
    switch (format) {
      case "audio":
        // Audio uses collapsed bar instead
        return null;

      case "video-iframe":
        return (
          <IframeRenderer
            embedUrl={getEmbedUrl(currentMedia.source)}
            title={currentMedia.title}
            autoPlay={state.isPlaying}
            className="h-full w-full rounded-t-lg"
          />
        );

      case "video-file":
      case "video-portrait":
      case "video-landscape":
      default:
        return (
          <VideoRenderer
            ref={videoRef}
            src={getMediaUrl(currentMedia.source)}
            poster={currentMedia.thumbnail}
            autoPlay={state.isPlaying}
            onPlay={() => actions.play()}
            onPause={() => actions.pause()}
            onTimeUpdate={(time) => actions.setCurrentTime(time)}
            onDurationChange={(duration) => actions.setDuration(duration)}
            className="h-full w-full rounded-t-lg"
          />
        );
    }
  };

  // Audio should use collapsed bar instead
  if (isAudio) {
    actions.setMode("collapsed");
    return null;
  }

  return (
    <div
      className="fixed z-50 flex w-80 flex-col overflow-hidden rounded-lg bg-black shadow-2xl"
      style={{ bottom: `${position.bottom}px`, right: `${position.right}px` }}
    >
      {/* Video */}
      <div className="aspect-video w-full cursor-pointer" onClick={handleExpand}>
        {renderMedia()}
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between bg-neutral-900 px-3 py-2">
        <div className="flex-1 truncate text-sm text-white">
          {currentMedia.title}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExpand}
            className="rounded p-1 text-white hover:bg-white/10"
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
          <button
            onClick={handleClose}
            className="rounded p-1 text-white hover:bg-white/10"
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
    </div>
  );
}
