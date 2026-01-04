"use client";

import { useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useMediaPlayer } from "@/hooks/useMediaPlayer";
import { incrementMediaView } from "@/lib/strapi";
import type { MediaItem, VideoSource } from "@/contexts/MediaPlayerContext";

interface MediaDetailPlayerProps {
  mediaId: number | string;
  title: string;
  videoSource: VideoSource;
  thumbnail?: string;
  durationSec?: number;
  autoPlay?: boolean;
}

/**
 * Media player integration for detail pages.
 * Auto-loads media into the global persistent player.
 */
export function MediaDetailPlayer({
  mediaId,
  title,
  videoSource,
  thumbnail,
  durationSec,
  autoPlay = true,
}: MediaDetailPlayerProps) {
  const { actions } = useMediaPlayer();
  const hasLoadedRef = useRef(false);
  const hasIncrementedRef = useRef(false);

  const incrementView = useCallback(() => {
    if (hasIncrementedRef.current) return;
    hasIncrementedRef.current = true;
    void incrementMediaView(Number(mediaId));
  }, [mediaId]);

  // Auto-load media into global player on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    if (!videoSource?.kind) return;

    hasLoadedRef.current = true;

    const mediaItem: MediaItem = {
      id: mediaId,
      title,
      source: videoSource,
      thumbnail,
      durationSec,
    };

    // Load into global player and open in fullscreen
    actions.loadMedia(mediaItem, autoPlay);

    // Increment view count
    incrementView();
  }, [mediaId, title, videoSource, thumbnail, durationSec, autoPlay, actions, incrementView]);

  // Render placeholder that shows while player is loading
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-900">
      {/* Thumbnail placeholder */}
      {thumbnail && (
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="100vw"
          className="object-cover opacity-50"
        />
      )}

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <svg
              className="h-12 w-12 animate-pulse text-amber-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
              />
            </svg>
          </div>
          <p className="text-sm text-white/80">Loading player...</p>
          <p className="mt-1 text-xs text-white/60">Video will open in fullscreen</p>
        </div>
      </div>
    </div>
  );
}
