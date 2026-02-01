import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Img,
  interpolate,
  spring,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { AnimatedText } from "../components/AnimatedText";
import { BrandWatermark } from "../components/BrandWatermark";
import { ProgressBar } from "../components/ProgressBar";
import type { QuoteReelProps } from "../schemas";

export const QuoteReel: React.FC<QuoteReelProps> = ({
  quote,
  author,
  source,
  backgroundUrl,
  theme = "elegant",
  animationType = "fade",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

  // Animation timing
  const fadeInEnd = 20;
  const quoteStart = 30;
  const authorStart = durationInFrames * 0.6;
  const fadeOutStart = durationInFrames - 30;

  const containerOpacity = interpolate(
    frame,
    [0, fadeInEnd, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Author animation
  const authorProgress = spring({
    frame: frame - authorStart,
    fps,
    config: { damping: 200, stiffness: 80 },
  });

  // Decorative elements
  const decorProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200, stiffness: 100 },
  });

  const getThemeStyles = () => {
    switch (theme) {
      case "elegant":
        return {
          quoteColor: "#FFFFFF",
          authorColor: "#C4A052",
          accentColor: "#C4A052",
          fontFamily: "Georgia, serif",
        };
      case "bold":
        return {
          quoteColor: "#FFFFFF",
          authorColor: "#FFFFFF",
          accentColor: "#C4A052",
          fontFamily: "Inter, system-ui, sans-serif",
        };
      case "minimal":
        return {
          quoteColor: "#FFFFFF",
          authorColor: "rgba(255,255,255,0.6)",
          accentColor: "#FFFFFF",
          fontFamily: "Inter, system-ui, sans-serif",
        };
      case "dramatic":
        return {
          quoteColor: "#FFFFFF",
          authorColor: "#C4A052",
          accentColor: "#C4A052",
          fontFamily: "Georgia, serif",
        };
      default:
        return {
          quoteColor: "#FFFFFF",
          authorColor: "#C4A052",
          accentColor: "#C4A052",
          fontFamily: "Georgia, serif",
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
              backgroundColor: "rgba(0,0,0,0.65)",
            }}
          />
        </>
      ) : (
        <GradientBackground theme="gold" animated />
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
        {/* Opening quote mark */}
        <div
          style={{
            fontSize: width > 1200 ? 120 : 80,
            fontFamily: "Georgia, serif",
            color: themeStyles.accentColor,
            opacity: 0.3,
            marginBottom: -40,
            transform: `scale(${decorProgress})`,
          }}
        >
          "
        </div>

        {/* Quote */}
        <div style={{ maxWidth: 900, textAlign: "center" }}>
          <AnimatedText
            text={quote}
            style={animationType === "static" ? "fade" : animationType}
            fontSize={width > 1200 ? 42 : 32}
            fontWeight={theme === "bold" ? 700 : 400}
            fontFamily={themeStyles.fontFamily}
            color={themeStyles.quoteColor}
            lineHeight={1.5}
            startFrame={quoteStart}
            durationFrames={durationInFrames - quoteStart - 60}
          />
        </div>

        {/* Author attribution */}
        <div
          style={{
            marginTop: 50,
            opacity: authorProgress,
            transform: `translateY(${interpolate(authorProgress, [0, 1], [20, 0])}px)`,
            textAlign: "center",
          }}
        >
          {/* Decorative line */}
          <div
            style={{
              width: 60,
              height: 2,
              backgroundColor: themeStyles.accentColor,
              margin: "0 auto 20px",
              transform: `scaleX(${authorProgress})`,
            }}
          />

          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: themeStyles.authorColor,
              fontFamily: "Inter, system-ui, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            — {author}
          </div>

          {source && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 400,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "Inter, system-ui, sans-serif",
                marginTop: 8,
                fontStyle: "italic",
              }}
            >
              {source}
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* Watermark */}
      <BrandWatermark text="RUACH" position="bottom-right" size="small" />

      {/* Progress bar */}
      <ProgressBar position="bottom" color={themeStyles.accentColor} style="solid" height={3} />
    </AbsoluteFill>
  );
};
