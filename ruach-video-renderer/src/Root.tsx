import React from "react";
import { Composition } from "remotion";
import { MultiCamComposition } from "./compositions/MultiCamComposition";

/**
 * Phase 12: Remotion Root
 * 
 * Registers all video compositions for Remotion Studio
 */

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MultiCam"
        component={MultiCamComposition}
        // Temporary large duration; replace with EDL-based duration once wired
        durationInFrames={30 * 60 * 60} // 60 minutes at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
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
        }}
      />
    </>
  );
};
