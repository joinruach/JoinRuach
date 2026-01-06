"use client";

import { useMediaPlayer } from "@/hooks/useMediaPlayer";
import { useEffect } from "react";
import { FullscreenPlayer } from "./FullscreenPlayer";
import { DockedPlayer } from "./DockedPlayer";
import { CollapsedBar } from "./CollapsedBar";
import { MiniDockedPlayer } from "./MiniDockedPlayer";
import { getMediaFormat } from "@/lib/media-utils";

/**
 * Global persistent media player that renders across all pages.
 * Automatically switches between player modes based on state.
 *
 * Modes:
 * - hidden: No player visible
 * - fullscreen: Takes over entire viewport (immersive)
 * - docked: Floating panel in corner
 * - mini: Smaller floating panel (PiP-style for iframes)
 * - collapsed: Bottom bar (audio-friendly)
 */
export function GlobalMediaPlayer() {
  const { state, actions } = useMediaPlayer();

  const format = state.currentMedia ? getMediaFormat(state.currentMedia) : null;
  // Auto-switch to collapsed mode for audio when in docked/mini mode.
  // Important: do this in an effect to avoid state updates during render.
  useEffect(() => {
    if (!state.currentMedia) return;
    if (format === "audio" && (state.mode === "docked" || state.mode === "mini")) {
      actions.setMode("collapsed");
    }
  }, [actions, format, state.currentMedia, state.mode]);

  // Don't render anything if no media is loaded
  if (!state.currentMedia || state.mode === "hidden") {
    return null;
  }

  // Render the appropriate player mode
  switch (state.mode) {
    case "fullscreen":
      return <FullscreenPlayer />;

    case "docked":
      return <DockedPlayer />;

    case "mini":
      return <MiniDockedPlayer />;

    case "collapsed":
      return <CollapsedBar />;

    default:
      return null;
  }
}
