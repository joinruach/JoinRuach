"use client";

import { useEffect, useState } from "react";

export interface IframeRendererProps {
  embedUrl: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Iframe renderer for YouTube, Vimeo, and other embedded videos.
 * Note: Limited control compared to native video - relies on embed player controls.
 */
export function IframeRenderer({ embedUrl, title, autoPlay, className }: IframeRendererProps) {
  const [finalUrl, setFinalUrl] = useState(embedUrl);

  useEffect(() => {
    // Add autoplay parameter if needed
    if (autoPlay && !embedUrl.includes("autoplay=")) {
      const separator = embedUrl.includes("?") ? "&" : "?";
      setFinalUrl(`${embedUrl}${separator}autoplay=1`);
    } else {
      setFinalUrl(embedUrl);
    }
  }, [embedUrl, autoPlay]);

  return (
    <iframe
      src={finalUrl}
      title={title || "Video player"}
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowFullScreen
      className={className || "aspect-video h-full w-full"}
    />
  );
}
