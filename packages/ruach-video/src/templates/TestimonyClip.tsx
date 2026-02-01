import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  Video,
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
} from "remotion";
import { LowerThird } from "../components/LowerThird";
import { Captions } from "../components/Captions";
import { BrandWatermark } from "../components/BrandWatermark";
import { ProgressBar } from "../components/ProgressBar";
import type { TestimonyClipProps } from "../schemas";

export const TestimonyClip: React.FC<TestimonyClipProps> = ({
  videoUrl,
  speakerName,
  caption,
  startTime = 0,
  endTime = 60,
  showCaptions = true,
  captionStyle = "modern",
  accentColor = "#C4A052",
  captions = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Fade in/out
  const fadeInEnd = 15;
  const fadeOutStart = durationInFrames - 15;

  const containerOpacity = interpolate(
    frame,
    [0, fadeInEnd, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Video offset for trimming
  const videoStartFrame = startTime * fps;

  // Convert captions to match video timing
  const adjustedCaptions = captions.map((cap) => ({
    ...cap,
    startMs: cap.startMs - startTime * 1000,
    endMs: cap.endMs - startTime * 1000,
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", opacity: containerOpacity }}>
      {/* Video Layer */}
      {videoUrl && (
        <OffthreadVideo
          src={videoUrl}
          startFrom={videoStartFrame}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Gradient overlay for text readability */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "50%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
        }}
      />

      {/* Top gradient for branding */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "20%",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
        }}
      />

      {/* Captions */}
      {showCaptions && adjustedCaptions.length > 0 && (
        <Captions
          segments={adjustedCaptions}
          style={captionStyle}
          position="bottom"
          fontSize={height > 1200 ? 42 : 32}
          maxWidth={width - 120}
          accentColor={accentColor}
          highlightCurrentWord
        />
      )}

      {/* Lower Third */}
      {speakerName && (
        <LowerThird
          name={speakerName}
          title={caption}
          style="modern"
          position="bottom-left"
          accentColor={accentColor}
          startFrame={20}
          durationFrames={durationInFrames - 40}
        />
      )}

      {/* Accent border */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          bottom: 20,
          border: `2px solid ${accentColor}20`,
          borderRadius: 8,
          pointerEvents: "none",
        }}
      />

      {/* Watermark */}
      <BrandWatermark text="RUACH" position="top-right" size="small" opacity={0.5} />

      {/* Progress bar */}
      <ProgressBar position="bottom" color={accentColor} style="solid" height={4} />
    </AbsoluteFill>
  );
};
