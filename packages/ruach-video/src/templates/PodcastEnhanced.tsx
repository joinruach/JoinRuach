import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  Audio,
  AbsoluteFill,
  interpolate,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { Waveform } from "../components/Waveform";
import { SpeakerCard } from "../components/SpeakerCard";
import { ChapterMarker } from "../components/ChapterMarker";
import { BrandWatermark } from "../components/BrandWatermark";
import { ProgressBar } from "../components/ProgressBar";
import type { PodcastEnhancedProps } from "../schemas";

export const PodcastEnhanced: React.FC<PodcastEnhancedProps> = ({
  audioUrl,
  title,
  episodeNumber,
  speakers = [],
  chapters = [],
  highlights = [],
  showWaveform = true,
  showChapterMarkers = true,
  backgroundStyle = "minimal",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentTimeSeconds = frame / fps;

  // Find current highlight
  const currentHighlight = highlights?.find(
    (h) =>
      currentTimeSeconds >= h.startTime &&
      currentTimeSeconds < h.startTime + h.duration
  );

  // Fade in/out
  const containerOpacity = interpolate(
    frame,
    [0, 30, durationInFrames - 30, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const getBackgroundStyle = () => {
    switch (backgroundStyle) {
      case "minimal":
        return <GradientBackground theme="dark" animated={false} />;
      case "gradient":
        return <GradientBackground theme="cosmic" animated />;
      case "animated":
        return (
          <>
            <GradientBackground theme="dark" animated />
            <Waveform
              style="circle"
              color="#C4A052"
              position="background"
              intensity={0.5}
            />
          </>
        );
      case "studio":
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
            }}
          />
        );
      default:
        return <GradientBackground theme="dark" animated={false} />;
    }
  };

  return (
    <AbsoluteFill style={{ opacity: containerOpacity }}>
      {/* Background */}
      {getBackgroundStyle()}

      {/* Title and Episode */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          width: "100%",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {episodeNumber && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#C4A052",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: 12,
            }}
          >
            Episode {episodeNumber}
          </div>
        )}
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#FFFFFF",
            maxWidth: 800,
            margin: "0 auto",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
      </div>

      {/* Speakers */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <SpeakerCard
          speakers={speakers}
          layout={speakers.length > 2 ? "grid" : "horizontal"}
          accentColor="#C4A052"
          startFrame={45}
        />
      </div>

      {/* Waveform */}
      {showWaveform && (
        <Waveform
          style="bars"
          color="#C4A052"
          position="bottom"
          intensity={0.8}
          barCount={50}
        />
      )}

      {/* Chapter markers */}
      {showChapterMarkers && chapters.length > 0 && (
        <ChapterMarker chapters={chapters} accentColor="#C4A052" position="top" />
      )}

      {/* Highlights overlay */}
      {currentHighlight && (
        <div
          style={{
            position: "absolute",
            bottom: 220,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: 700,
            padding: "20px 40px",
            backgroundColor: "rgba(196, 160, 82, 0.15)",
            borderRadius: 12,
            border: "1px solid rgba(196, 160, 82, 0.3)",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: "#FFFFFF",
              textAlign: "center",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            "{currentHighlight.text}"
          </div>
        </div>
      )}

      {/* Watermark */}
      <BrandWatermark text="RUACH" position="top-right" size="small" />

      {/* Progress bar */}
      <ProgressBar position="bottom" color="#C4A052" style="solid" height={4} />

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};
