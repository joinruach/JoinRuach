"use client";

import { useRef, useEffect } from "react";
import { useMediaPlayer } from "@/hooks/useMediaPlayer";
import { VideoRenderer, type VideoRendererHandle } from "./VideoRenderer";
import { AudioRenderer, type AudioRendererHandle } from "./AudioRenderer";
import { IframeRenderer } from "./IframeRenderer";
import { getMediaFormat, getMediaUrl, getEmbedUrl } from "@/lib/media-utils";
import type { MediaFormat } from "@/contexts/MediaPlayerContext";

/**
 * Fullscreen immersive player mode.
 * Takes over the entire viewport with minimal UI overlay.
 */
export function FullscreenPlayer() {
  const { state, actions } = useMediaPlayer();
  const videoRef = useRef<VideoRendererHandle>(null);
  const audioRef = useRef<AudioRendererHandle>(null);

  const { currentMedia } = state;
  if (!currentMedia) return null;

  const format = getMediaFormat(currentMedia);
  const isAudio = format === "audio";

  // Sync player ref actions with context state
  useEffect(() => {
    const ref = isAudio ? audioRef.current : videoRef.current;
    if (!ref) return;

    if (state.isPlaying) {
      ref.play().catch(() => {
        // Auto-play blocked, user needs to interact first
        actions.pause();
      });
    } else {
      ref.pause();
    }
  }, [state.isPlaying, isAudio, actions]);

  const handleTimeUpdate = (time: number) => {
    actions.setCurrentTime(time);
  };

  const handleDurationChange = (duration: number) => {
    actions.setDuration(duration);
  };

  const handlePlay = () => {
    actions.play();
  };

  const handlePause = () => {
    actions.pause();
  };

  const handleMinimize = () => {
    actions.setMode("docked");
  };

  const handleClose = () => {
    actions.close();
  };

  const renderMedia = () => {
    switch (format) {
      case "audio":
        return (
          <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-2xl">
              {currentMedia.thumbnail && (
                <img
                  src={currentMedia.thumbnail}
                  alt={currentMedia.title}
                  className="mb-8 aspect-square w-full rounded-lg object-cover shadow-2xl"
                />
              )}
              <AudioRenderer
                ref={audioRef}
                src={getMediaUrl(currentMedia.source)}
                autoPlay={state.isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
                className="w-full"
              />
            </div>
          </div>
        );

      case "video-iframe":
        return (
          <IframeRenderer
            embedUrl={getEmbedUrl(currentMedia.source)}
            title={currentMedia.title}
            autoPlay={state.isPlaying}
            className="h-full w-full"
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
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            className="h-full w-full"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Media Content */}
      <div className="relative h-full w-full">{renderMedia()}</div>

      {/* Overlay Controls */}
      <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{currentMedia.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimize Button */}
            <button
              onClick={handleMinimize}
              className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Minimize player"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              </svg>
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Close player"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
