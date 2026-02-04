import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  Video,
  staticFile,
  useVideoConfig,
  useCurrentFrame,
} from "remotion";

import type { CanonicalEDL, Cut } from "../types/edl";
import {
  fetchEDL,
  getCutAtTime,
  msToFrames,
  framesToMs,
  calculateCameraTime,
  validateEDL,
  getCameraAtTime,
  getChapterAtTime,
} from "../utils/edl-loader";
import { CaptionsLayer } from "../components/CaptionsLayer";
import { ChapterMarker } from "../components/ChapterMarker";

/**
 * Phase 12: Multi-Camera Composition
 * 
 * Props expected by Remotion composition registration.
 */
export type MultiCamCompositionProps = {
  sessionId: string;
  /**
   * Map of cameraId -> mezzanine/proxy path.
   * Example: { "A": "https://r2.../camA.mov", "B": "https://r2.../camB.mov" }
   */
  cameraSources: Record<string, string>;
  /**
   * Optional debug overlay
   */
  debug?: boolean;
  /**
   * Show captions overlay (default: true)
   */
  showCaptions?: boolean;
  /**
   * Show chapter markers (default: true)
   */
  showChapters?: boolean;
  /**
   * Show speaker labels in captions (default: true)
   */
  showSpeakerLabels?: boolean;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; edl: CanonicalEDL };

function resolveVideoSrc(pathOrUrl: string) {
  // If it looks like an absolute URL, use it directly.
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  // Otherwise treat as a Remotion static asset path.
  return staticFile(pathOrUrl);
}

/**
 * Baseline approach:
 * - Build sequences per cut
 * - For each cut, render only the selected camera video for that cut duration
 * - Apply camera-time offset by seeking via startFrom (frames)
 *
 * Notes:
 * - This assumes your mezzanine files are aligned to a common start reference
 *   and camera offsets are used to seek into each camera.
 * - If your camera offsets are the opposite sign, flip in calculateCameraTime().
 */
export const MultiCamComposition: React.FC<MultiCamCompositionProps> = ({
  sessionId,
  cameraSources,
  debug = false,
  showCaptions = true,
  showChapters = true,
  showSpeakerLabels = true,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const edl = await fetchEDL(sessionId);
        validateEDL(edl);

        if (mounted) setState({ status: "ready", edl });
      } catch (err: any) {
        if (mounted)
          setState({
            status: "error",
            error: err?.message ?? "Unknown error loading EDL",
          });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  if (state.status === "loading") {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontSize: 40,
          backgroundColor: "black",
          color: "white",
        }}
      >
        Loading EDL…
      </AbsoluteFill>
    );
  }

  if (state.status === "error") {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontSize: 28,
          backgroundColor: "black",
          color: "white",
          padding: 40,
          textAlign: "center",
        }}
      >
        Failed to load EDL: {state.error}
      </AbsoluteFill>
    );
  }

  const edl = state.edl;
  const cuts = edl.tracks.program;

  const sequences = useMemo(() => {
    return cuts.map((cut, idx) => {
      const cutStartMs = cut.startMs;
      const cutEndMs = cut.endMs;
      const cameraId = cut.camera;

      const durationMs = Math.max(0, cutEndMs - cutStartMs);
      const durationFrames = Math.max(1, msToFrames(durationMs, fps));

      const fromFrames = Math.max(0, msToFrames(cutStartMs, fps));

      // Get camera offset from sources
      const cameraOffset = edl.sources[cameraId]?.offsetMs || 0;
      
      // Compute what time we should be at in the camera file for this global time.
      const cameraTimeMs = calculateCameraTime(cutStartMs, cameraOffset);
      const startFrom = Math.max(0, msToFrames(cameraTimeMs, fps));

      const src = cameraSources[cameraId];

      // If we don't have a source for this camera, show a placeholder frame.
      if (!src) {
        return {
          key: `cut-${idx}`,
          from: fromFrames,
          durationInFrames: durationFrames,
          node: (
            <AbsoluteFill
              style={{
                backgroundColor: "black",
                color: "white",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 36,
              }}
            >
              Missing source for camera: {cameraId}
            </AbsoluteFill>
          ),
        };
      }

      return {
        key: `cut-${idx}`,
        from: fromFrames,
        durationInFrames: durationFrames,
        node: (
          <AbsoluteFill>
            <Video
              src={resolveVideoSrc(src)}
              startFrom={startFrom}
              endAt={startFrom + durationFrames}
              volume={cameraId === edl.masterCamera ? 1 : 0}
            />

            {debug ? (
              <AbsoluteFill
                style={{
                  pointerEvents: "none",
                  padding: 24,
                  color: "white",
                  fontSize: 22,
                  textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                }}
              >
                <div>Cut #{idx + 1}</div>
                <div>Camera: {cameraId}</div>
                <div>
                  Global: {cutStartMs}ms → {cutEndMs}ms
                </div>
                <div>Camera seek: {cameraTimeMs}ms</div>
                <div>
                  Frames: from {fromFrames} for {durationFrames}
                </div>
                <div>startFrom: {startFrom}</div>
              </AbsoluteFill>
            ) : null}
          </AbsoluteFill>
        ),
      };
    });
  }, [cuts, edl, cameraSources, fps, debug]);

  // Extra safety: if cuts array is empty, fall back.
  if (!cuts.length) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontSize: 28,
          backgroundColor: "black",
          color: "white",
          padding: 40,
          textAlign: "center",
        }}
      >
        EDL loaded, but no cuts found.
      </AbsoluteFill>
    );
  }

  // Calculate current time for overlays
  const currentTimeMs = framesToMs(frame, fps);
  const currentCamera = getCameraAtTime(edl, currentTimeMs);
  const currentChapter = getChapterAtTime(edl, currentTimeMs);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Video sequences (camera cuts) */}
      {sequences.map((s) => (
        <Sequence
          key={s.key}
          from={s.from}
          durationInFrames={s.durationInFrames}
        >
          {s.node}
        </Sequence>
      ))}

      {/* Caption overlay */}
      {showCaptions && (
        <CaptionsLayer
          sessionId={sessionId}
          currentCamera={currentCamera}
          currentTimeMs={currentTimeMs}
          showSpeaker={showSpeakerLabels}
        />
      )}

      {/* Chapter markers */}
      {showChapters && currentChapter && (
        <ChapterMarker
          chapter={currentChapter}
          currentTimeMs={currentTimeMs}
          displayDurationMs={3000}
        />
      )}
    </AbsoluteFill>
  );
};
