import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Video,
  Img,
  AbsoluteFill,
  interpolate,
  spring,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { ParticleBackground } from "../components/ParticleBackground";
import { AnimatedText } from "../components/AnimatedText";
import { BrandWatermark } from "../components/BrandWatermark";
import { ProgressBar } from "../components/ProgressBar";
import type { ScriptureOverlayProps } from "../schemas";

export const ScriptureOverlay: React.FC<ScriptureOverlayProps> = ({
  reference,
  text,
  translation = "NIV",
  theme = "dark",
  animationStyle = "typewriter",
  backgroundType = "gradient",
  backgroundUrl,
  musicUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Animation timing
  const fadeInEnd = 30;
  const textStart = 45;
  const fadeOutStart = durationInFrames - 45;

  const containerOpacity = interpolate(
    frame,
    [0, fadeInEnd, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Reference animation
  const referenceProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 200, stiffness: 80 },
  });

  // Decorative line animation
  const lineScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200, stiffness: 100 },
  });

  // Translation badge animation
  const badgeProgress = spring({
    frame: frame - textStart - 60,
    fps,
    config: { damping: 200, stiffness: 100 },
  });

  return (
    <AbsoluteFill style={{ opacity: containerOpacity }}>
      {/* Background */}
      {backgroundType === "gradient" && (
        <GradientBackground theme={theme} animated />
      )}

      {backgroundType === "image" && backgroundUrl && (
        <>
          <Img
            src={backgroundUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
          />
        </>
      )}

      {backgroundType === "video" && backgroundUrl && (
        <>
          <Video
            src={backgroundUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            volume={0}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          />
        </>
      )}

      {backgroundType === "particles" && (
        <>
          <GradientBackground theme={theme} animated={false} />
          <ParticleBackground style="ascending" color="#C4A052" count={30} />
        </>
      )}

      {/* Content Container */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        {/* Top decorative line */}
        <div
          style={{
            width: 80,
            height: 2,
            backgroundColor: "#C4A052",
            marginBottom: 40,
            transform: `scaleX(${lineScale})`,
          }}
        />

        {/* Scripture Reference */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#C4A052",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            marginBottom: 30,
            opacity: referenceProgress,
            transform: `translateY(${interpolate(referenceProgress, [0, 1], [20, 0])}px)`,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {reference}
        </div>

        {/* Scripture Text */}
        <div style={{ maxWidth: 900, textAlign: "center" }}>
          <AnimatedText
            text={`"${text}"`}
            style={animationStyle === "typewriter" ? "typewriter" : animationStyle}
            fontSize={width > 1200 ? 48 : 36}
            fontWeight={400}
            fontFamily="Georgia, serif"
            color="#FFFFFF"
            lineHeight={1.6}
            startFrame={textStart}
            durationFrames={durationInFrames - textStart - 60}
          />
        </div>

        {/* Translation Badge */}
        <div
          style={{
            marginTop: 40,
            padding: "8px 20px",
            backgroundColor: "rgba(196, 160, 82, 0.15)",
            borderRadius: 20,
            border: "1px solid rgba(196, 160, 82, 0.3)",
            opacity: badgeProgress,
            transform: `translateY(${interpolate(badgeProgress, [0, 1], [10, 0])}px)`,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#C4A052",
              letterSpacing: "0.1em",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {translation}
          </span>
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            width: 80,
            height: 2,
            backgroundColor: "#C4A052",
            marginTop: 40,
            transform: `scaleX(${lineScale})`,
          }}
        />
      </AbsoluteFill>

      {/* Watermark */}
      <BrandWatermark text="RUACH" position="bottom-right" size="small" />

      {/* Progress bar */}
      <ProgressBar position="bottom" color="#C4A052" style="glow" height={3} />

      {/* Background music */}
      {musicUrl && <Audio src={musicUrl} volume={0.3} />}
    </AbsoluteFill>
  );
};
