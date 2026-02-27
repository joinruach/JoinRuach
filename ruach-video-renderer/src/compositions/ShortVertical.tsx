import React from "react";
import { AbsoluteFill } from "remotion";
import {
  MultiCamComposition,
  type MultiCamCompositionProps,
} from "./MultiCamComposition";

/**
 * Stage 1: Short Vertical (9:16) Composition
 *
 * Wraps MultiCamComposition in a 1080x1920 viewport with center-crop.
 * Used for Instagram Reels, YouTube Shorts, TikTok.
 */
export const ShortVertical: React.FC<MultiCamCompositionProps> = (props) => {
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: "black",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 1920,
          height: 1080,
          transformOrigin: "center center",
          // Scale 16:9 content to fill 9:16 viewport (crop sides)
          scale: `${1920 / 1080}`,
        }}
      >
        <MultiCamComposition {...props} />
      </div>
    </AbsoluteFill>
  );
};
