"use client";

import { useCallback, useEffect, useRef } from "react";
import { incrementMediaView } from "@/lib/strapi";

export type MediaPlayerProps = {
  mediaId: number;
  videoUrl?: string;
  isFileVideo: boolean;
  poster?: string;
  title: string;
};

export default function MediaPlayer({ mediaId, videoUrl, isFileVideo, poster, title }: MediaPlayerProps) {
  const hasIncremented = useRef(false);

  const increment = useCallback(() => {
    if (hasIncremented.current || !mediaId) return;
    hasIncremented.current = true;
    void incrementMediaView(mediaId);
  }, [mediaId]);

  useEffect(() => {
    if (!videoUrl) return;
    if (!isFileVideo) {
      increment();
    }
  }, [increment, isFileVideo, videoUrl]);

  if (!videoUrl) {
    return <div className="aspect-video w-full bg-neutral-900" />;
  }

  if (isFileVideo) {
    return (
      <video
        className="h-full w-full"
        controls
        poster={poster}
        onPlay={increment}
      >
        <source src={videoUrl} />
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <iframe
      src={videoUrl}
      className="aspect-video w-full"
      title={title}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
    />
  );
}
