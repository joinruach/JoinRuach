import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface GradientBackgroundProps {
  theme?: "dark" | "light" | "gold" | "nature" | "cosmic" | "morning" | "evening" | "sabbath";
  animated?: boolean;
  overlay?: boolean;
  overlayOpacity?: number;
}

const GRADIENTS = {
  dark: {
    colors: ["#0a0a0a", "#1a1a2e", "#16213e"],
    angle: 135,
  },
  light: {
    colors: ["#f8f9fa", "#e9ecef", "#dee2e6"],
    angle: 180,
  },
  gold: {
    colors: ["#1a1a1a", "#2d2418", "#1a1a1a"],
    accent: "#C4A052",
    angle: 135,
  },
  nature: {
    colors: ["#0d1b0f", "#1a3a1f", "#0d1b0f"],
    angle: 180,
  },
  cosmic: {
    colors: ["#0f0c29", "#302b63", "#24243e"],
    angle: 135,
  },
  morning: {
    colors: ["#2c1810", "#4a3728", "#c9a86c"],
    angle: 180,
  },
  evening: {
    colors: ["#1a0a2e", "#2d1b4e", "#0f0520"],
    angle: 135,
  },
  sabbath: {
    colors: ["#0a0a1a", "#1a1a3a", "#0a0a1a"],
    accent: "#C4A052",
    angle: 180,
  },
};

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  theme = "dark",
  animated = true,
  overlay = true,
  overlayOpacity = 0.3,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const gradient = GRADIENTS[theme];
  const animationOffset = animated
    ? interpolate(frame, [0, 300], [0, 20], {
        extrapolateRight: "extend",
      })
    : 0;

  const gradientString = `linear-gradient(${gradient.angle}deg, ${gradient.colors.join(", ")})`;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        background: gradientString,
      }}
    >
      {/* Animated gradient overlay */}
      {animated && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "200%",
            height: "200%",
            background: `radial-gradient(circle at ${50 + animationOffset}% ${50 + Math.sin(frame * 0.02) * 10}%, ${gradient.colors[1]}40 0%, transparent 50%)`,
            transform: `translate(-25%, -25%)`,
          }}
        />
      )}

      {/* Noise texture overlay */}
      {overlay && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: overlayOpacity,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            mixBlendMode: "overlay",
          }}
        />
      )}

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Accent glow for gold/sabbath themes */}
      {(theme === "gold" || theme === "sabbath") && (
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            width: 600,
            height: 600,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${GRADIENTS[theme].accent}15 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
      )}
    </div>
  );
};
