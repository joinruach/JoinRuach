import React from "react";
import { Composition, Still } from "remotion";
import { MultiCamComposition } from "./compositions/MultiCamComposition";
import { ShortVertical } from "./compositions/ShortVertical";
import { SquareClip } from "./compositions/SquareClip";
import { ThumbnailStill } from "./compositions/ThumbnailStill";

/**
 * Remotion Root
 *
 * Registers all video compositions for Remotion Studio and Lambda rendering.
 * Composition IDs must match FORMAT_PRESETS.compositionId in the backend.
 */

const DEFAULT_MULTI_CAM_PROPS = {
  sessionId: "YOUR_SESSION_ID",
  cameraSources: {
    A: "https://example.com/mezzanine/camA.mov",
    B: "https://example.com/mezzanine/camB.mov",
    C: "https://example.com/mezzanine/camC.mov",
  },
  debug: true,
  showCaptions: true,
  showChapters: true,
  showSpeakerLabels: true,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full episode – 16:9 landscape */}
      <Composition
        id="MultiCam"
        component={MultiCamComposition}
        durationInFrames={30 * 60 * 60}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_MULTI_CAM_PROPS}
      />

      {/* Short vertical – 9:16 for Reels/Shorts */}
      <Composition
        id="ShortVertical"
        component={ShortVertical}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={DEFAULT_MULTI_CAM_PROPS}
      />

      {/* Square clip – 1:1 for social feeds */}
      <Composition
        id="SquareClip"
        component={SquareClip}
        durationInFrames={30 * 60 * 60}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={DEFAULT_MULTI_CAM_PROPS}
      />

      {/* Thumbnail – single frame still */}
      <Still
        id="ThumbnailStill"
        component={ThumbnailStill}
        width={1920}
        height={1080}
        defaultProps={{
          sessionId: "YOUR_SESSION_ID",
          title: "Episode Title",
          subtitle: "Ruach Studios",
        }}
      />
    </>
  );
};
