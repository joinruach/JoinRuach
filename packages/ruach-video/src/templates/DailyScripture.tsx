import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  Audio,
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
import type { DailyScriptureProps } from "../schemas";

export const DailyScripture: React.FC<DailyScriptureProps> = ({
  date,
  reference,
  text,
  reflection,
  theme = "morning",
  backgroundUrl,
  musicUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

  // Parse date
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Animation timing
  const dateStart = 20;
  const referenceStart = 40;
  const textStart = 70;
  const reflectionStart = durationInFrames * 0.7;

  // Container fade
  const containerOpacity = interpolate(
    frame,
    [0, 20, durationInFrames - 30, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Element animations
  const dateProgress = spring({
    frame: frame - dateStart,
    fps,
    config: { damping: 200, stiffness: 100 },
  });

  const referenceProgress = spring({
    frame: frame - referenceStart,
    fps,
    config: { damping: 200, stiffness: 80 },
  });

  const reflectionProgress = spring({
    frame: frame - reflectionStart,
    fps,
    config: { damping: 200, stiffness: 80 },
  });

  const getThemeStyles = () => {
    switch (theme) {
      case "morning":
        return {
          gradientTheme: "morning" as const,
          accentColor: "#C4A052",
          textColor: "#FFFFFF",
          subtitleColor: "rgba(255,255,255,0.7)",
        };
      case "evening":
        return {
          gradientTheme: "evening" as const,
          accentColor: "#9B8AC4",
          textColor: "#FFFFFF",
          subtitleColor: "rgba(255,255,255,0.6)",
        };
      case "sabbath":
        return {
          gradientTheme: "sabbath" as const,
          accentColor: "#C4A052",
          textColor: "#FFFFFF",
          subtitleColor: "rgba(196, 160, 82, 0.8)",
        };
      case "worship":
        return {
          gradientTheme: "gold" as const,
          accentColor: "#C4A052",
          textColor: "#FFFFFF",
          subtitleColor: "rgba(255,255,255,0.8)",
        };
      default:
        return {
          gradientTheme: "dark" as const,
          accentColor: "#C4A052",
          textColor: "#FFFFFF",
          subtitleColor: "rgba(255,255,255,0.7)",
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <AbsoluteFill style={{ opacity: containerOpacity }}>
      {/* Background */}
      {backgroundUrl ? (
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
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          />
        </>
      ) : (
        <>
          <GradientBackground theme={themeStyles.gradientTheme} animated />
          <ParticleBackground
            style={theme === "evening" ? "stars" : "dust"}
            color={themeStyles.accentColor}
            count={20}
            speed={0.3}
          />
        </>
      )}

      {/* Content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        {/* Date badge */}
        <div
          style={{
            opacity: dateProgress,
            transform: `translateY(${interpolate(dateProgress, [0, 1], [-20, 0])}px)`,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: themeStyles.accentColor,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Daily Scripture
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: themeStyles.subtitleColor,
              marginTop: 8,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {formattedDate}
          </div>
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: 60,
            height: 2,
            backgroundColor: themeStyles.accentColor,
            marginBottom: 30,
            transform: `scaleX(${dateProgress})`,
          }}
        />

        {/* Reference */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: themeStyles.accentColor,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: 30,
            opacity: referenceProgress,
            transform: `translateY(${interpolate(referenceProgress, [0, 1], [20, 0])}px)`,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {reference}
        </div>

        {/* Scripture text */}
        <div style={{ maxWidth: 900, textAlign: "center" }}>
          <AnimatedText
            text={`"${text}"`}
            style="word-by-word"
            fontSize={width > 1200 ? 42 : 32}
            fontWeight={400}
            fontFamily="Georgia, serif"
            color={themeStyles.textColor}
            lineHeight={1.6}
            startFrame={textStart}
            durationFrames={durationInFrames - textStart - 90}
          />
        </div>

        {/* Reflection */}
        {reflection && (
          <div
            style={{
              marginTop: 50,
              maxWidth: 700,
              textAlign: "center",
              opacity: reflectionProgress,
              transform: `translateY(${interpolate(reflectionProgress, [0, 1], [20, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 1,
                backgroundColor: themeStyles.accentColor,
                margin: "0 auto 20px",
                opacity: 0.5,
              }}
            />
            <div
              style={{
                fontSize: 18,
                fontWeight: 400,
                color: themeStyles.subtitleColor,
                lineHeight: 1.7,
                fontStyle: "italic",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {reflection}
            </div>
          </div>
        )}
      </AbsoluteFill>

      {/* Watermark */}
      <BrandWatermark text="RUACH" position="bottom-right" size="small" />

      {/* Progress bar */}
      <ProgressBar position="bottom" color={themeStyles.accentColor} style="glow" height={3} />

      {/* Background music */}
      {musicUrl && <Audio src={musicUrl} volume={0.2} />}
    </AbsoluteFill>
  );
};
