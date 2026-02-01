import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  Audio,
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { ParticleBackground } from "../components/ParticleBackground";
import { AnimatedText } from "../components/AnimatedText";
import { BrandWatermark } from "../components/BrandWatermark";
import type { DeclarationVideoProps } from "../schemas";

interface Declaration {
  text: string;
  emphasis?: string[];
  pauseAfter?: number;
  style?: "normal" | "emphasized" | "whispered" | "crescendo";
}

export const DeclarationVideo: React.FC<DeclarationVideoProps> = ({
  declarations = [],
  audioUrl,
  style = "prophetic",
  paceMode = "rhythmic",
  typography = "bold",
  backgroundUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Calculate timing for each declaration
  const getDeclarationTiming = () => {
    const baseDuration = paceMode === "slow" ? 4 : paceMode === "staccato" ? 2 : 3;
    let currentFrame = 30; // Start after initial fade

    return declarations.map((decl) => {
      const duration = (baseDuration + (decl.pauseAfter || 0)) * fps;
      const start = currentFrame;
      currentFrame += duration;
      return { ...decl, startFrame: start, durationFrames: duration };
    });
  };

  const timedDeclarations = getDeclarationTiming();

  // Find current declaration
  const currentDecl = timedDeclarations.find(
    (d) => frame >= d.startFrame && frame < d.startFrame + d.durationFrames
  );

  // Container fade
  const containerOpacity = interpolate(
    frame,
    [0, 30, durationInFrames - 30, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const getTypographyStyles = () => {
    switch (typography) {
      case "bold":
        return {
          fontSize: width > 1200 ? 56 : 42,
          fontWeight: 800,
          fontFamily: "Inter, system-ui, sans-serif",
          letterSpacing: "0.02em",
          textTransform: "uppercase" as const,
        };
      case "elegant":
        return {
          fontSize: width > 1200 ? 48 : 36,
          fontWeight: 400,
          fontFamily: "Georgia, serif",
          letterSpacing: "0.01em",
          textTransform: "none" as const,
          fontStyle: "italic" as const,
        };
      case "minimal":
        return {
          fontSize: width > 1200 ? 40 : 32,
          fontWeight: 300,
          fontFamily: "Inter, system-ui, sans-serif",
          letterSpacing: "0.05em",
          textTransform: "none" as const,
        };
      case "dramatic":
        return {
          fontSize: width > 1200 ? 64 : 48,
          fontWeight: 900,
          fontFamily: "Inter, system-ui, sans-serif",
          letterSpacing: "-0.02em",
          textTransform: "uppercase" as const,
        };
      default:
        return {
          fontSize: 48,
          fontWeight: 600,
          fontFamily: "Inter, system-ui, sans-serif",
        };
    }
  };

  const getStyleTheme = () => {
    switch (style) {
      case "prophetic":
        return { theme: "gold" as const, particleStyle: "ascending" as const };
      case "prayerful":
        return { theme: "dark" as const, particleStyle: "dust" as const };
      case "meditative":
        return { theme: "cosmic" as const, particleStyle: "stars" as const };
      case "bold":
        return { theme: "dark" as const, particleStyle: "orbs" as const };
      default:
        return { theme: "gold" as const, particleStyle: "ascending" as const };
    }
  };

  const typographyStyles = getTypographyStyles();
  const styleTheme = getStyleTheme();

  const renderDeclaration = (decl: Declaration & { startFrame: number; durationFrames: number }) => {
    const localFrame = frame - decl.startFrame;

    // Animation based on declaration style
    const enterProgress = spring({
      frame: localFrame,
      fps,
      config: {
        damping: decl.style === "crescendo" ? 100 : 200,
        stiffness: paceMode === "staccato" ? 200 : 80,
      },
    });

    const exitStart = decl.durationFrames - 30;
    const exitProgress =
      localFrame > exitStart
        ? interpolate(localFrame, [exitStart, decl.durationFrames], [0, 1], {
            extrapolateRight: "clamp",
          })
        : 0;

    const opacity = interpolate(exitProgress, [0, 1], [1, 0]);

    // Scale for crescendo
    const scale =
      decl.style === "crescendo"
        ? interpolate(localFrame, [0, decl.durationFrames * 0.7], [0.9, 1.1], {
            extrapolateRight: "clamp",
          })
        : 1;

    // Opacity for whispered
    const textOpacity = decl.style === "whispered" ? 0.6 : 1;

    return (
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          opacity: opacity * enterProgress,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            textAlign: "center",
            transform: `scale(${scale})`,
            opacity: textOpacity,
          }}
        >
          {/* Main text */}
          <div
            style={{
              ...typographyStyles,
              color: "#FFFFFF",
              lineHeight: 1.4,
              textShadow:
                decl.style === "emphasized"
                  ? "0 0 40px rgba(196, 160, 82, 0.5)"
                  : "none",
            }}
          >
            {decl.text.split(" ").map((word, i) => {
              const isEmphasis = decl.emphasis?.some((e) =>
                word.toLowerCase().includes(e.toLowerCase())
              );

              return (
                <span
                  key={i}
                  style={{
                    color: isEmphasis ? "#C4A052" : "#FFFFFF",
                    fontWeight: isEmphasis
                      ? typographyStyles.fontWeight + 200
                      : typographyStyles.fontWeight,
                  }}
                >
                  {word}{" "}
                </span>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    );
  };

  return (
    <AbsoluteFill style={{ opacity: containerOpacity }}>
      {/* Background */}
      <GradientBackground theme={styleTheme.theme} animated />
      <ParticleBackground
        style={styleTheme.particleStyle}
        color="#C4A052"
        count={25}
        speed={0.5}
      />

      {/* Declaration content */}
      {currentDecl && renderDeclaration(currentDecl)}

      {/* Decorative elements */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 60,
          height: 2,
          backgroundColor: "rgba(196, 160, 82, 0.5)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 60,
          height: 2,
          backgroundColor: "rgba(196, 160, 82, 0.5)",
        }}
      />

      {/* Watermark */}
      <BrandWatermark text="RUACH" position="bottom-right" size="small" opacity={0.4} />

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};
