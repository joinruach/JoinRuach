"use client";

import { useRef } from "react";
import { incrementMediaView } from "@/lib/strapi";

type AudioPlayerProps = {
  mediaId: number;
  src: string;
  title: string;
};

export default function AudioPlayer({ mediaId, src, title }: AudioPlayerProps) {
  const hasIncremented = useRef(false);

  function handlePlay() {
    if (hasIncremented.current || !mediaId) return;
    hasIncremented.current = true;
    void incrementMediaView(mediaId);
  }

  return (
    <audio
      controls
      className="w-full"
      onPlay={handlePlay}
    >
      <source src={src} />
      {`Your browser does not support the audio element required to play "${title}".`}
    </audio>
  );
}
