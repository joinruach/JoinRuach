"use client";

import { useMediaPlayer } from "@/hooks/useMediaPlayer";
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

  // Don't render anything if no media is loaded
  if (!state.currentMedia || state.mode === "hidden") {
    return null;
  }

  // Auto-switch to collapsed mode for audio when in docked mode
  const format = getMediaFormat(state.currentMedia);
  if (format === "audio" && (state.mode === "docked" || state.mode === "mini")) {
    // Audio should use collapsed bar instead of docked/mini
    actions.setMode("collapsed");
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
