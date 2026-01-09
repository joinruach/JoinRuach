"use client";

import dynamic from "next/dynamic";
import { useMediaPlayer } from "@/hooks/useMediaPlayer";

const GlobalMediaPlayer = dynamic(
  () => import("./GlobalMediaPlayer").then((m) => m.GlobalMediaPlayer),
  { ssr: false, loading: () => null }
);

/**
 * Loads the (heavy) global player UI only when needed.
 * This prevents shipping player UI JS on first load for users who never play media.
 */
export default function GlobalMediaPlayerGate() {
  const { state } = useMediaPlayer();

  if (!state.currentMedia || state.mode === "hidden") return null;

  return <GlobalMediaPlayer />;
}

