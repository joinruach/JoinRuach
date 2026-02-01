import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface WaveformProps {
  style?: "bars" | "wave" | "circle" | "minimal";
  color?: string;
  secondaryColor?: string;
  intensity?: number;
  barCount?: number;
  position?: "bottom" | "center" | "background";
}

export const Waveform: React.FC<WaveformProps> = ({
  style = "bars",
  color = "#C4A052",
  secondaryColor = "rgba(196, 160, 82, 0.3)",
  intensity = 1,
  barCount = 40,
  position = "bottom",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Generate pseudo-random heights based on frame
  const getBarHeight = (index: number, frame: number): number => {
    const seed = Math.sin(index * 12.9898 + frame * 0.05) * 43758.5453;
    const random = seed - Math.floor(seed);
    const baseHeight = 0.3 + random * 0.7;
    const pulse = Math.sin(frame * 0.1 + index * 0.3) * 0.2 + 0.8;
    return baseHeight * pulse * intensity;
  };

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case "bottom":
        return {
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 200,
        };
      case "center":
        return {
          position: "absolute",
          top: "50%",
          left: 0,
          width: "100%",
          height: 300,
          transform: "translateY(-50%)",
        };
      case "background":
        return {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.15,
        };
      default:
        return {};
    }
  };

  const renderBars = () => {
    const bars = [];
    const barWidth = (width - 100) / barCount;
    const maxHeight = position === "background" ? height * 0.8 : 180;

    for (let i = 0; i < barCount; i++) {
      const barHeight = getBarHeight(i, frame) * maxHeight;

      bars.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: 50 + i * barWidth,
            bottom: position === "background" ? "10%" : 20,
            width: barWidth * 0.6,
            height: barHeight,
            backgroundColor: i % 3 === 0 ? color : secondaryColor,
            borderRadius: 4,
            transition: "height 0.05s ease-out",
          }}
        />
      );
    }

    return bars;
  };

  const renderWave = () => {
    const points = [];
    const segments = 100;
    const maxHeight = position === "background" ? height * 0.3 : 80;

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const waveHeight =
        Math.sin(i * 0.2 + frame * 0.08) * maxHeight * intensity +
        Math.sin(i * 0.1 + frame * 0.05) * maxHeight * 0.5 * intensity;
      points.push(`${x},${maxHeight + waveHeight}`);
    }

    const pathD = `M0,${maxHeight * 2} L${points.join(" L")} L${width},${maxHeight * 2} Z`;

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${maxHeight * 2}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d={pathD} fill="url(#waveGradient)" />
      </svg>
    );
  };

  const renderCircle = () => {
    const centerX = width / 2;
    const centerY = position === "center" ? 150 : height / 2;
    const baseRadius = 100;
    const segments = 60;

    const points = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const radiusOffset = getBarHeight(i, frame) * 50 * intensity;
      const radius = baseRadius + radiusOffset;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      points.push(`${x},${y}`);
    }

    return (
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          <radialGradient id="circleGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </radialGradient>
        </defs>
        <polygon points={points.join(" ")} fill="url(#circleGradient)" />
      </svg>
    );
  };

  const renderMinimal = () => {
    const dotCount = 5;
    const dots = [];

    for (let i = 0; i < dotCount; i++) {
      const scale = getBarHeight(i, frame);
      dots.push(
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: color,
            transform: `scale(${0.5 + scale})`,
            transition: "transform 0.1s ease-out",
          }}
        />
      );
    }

    return (
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        {dots}
      </div>
    );
  };

  const getContent = () => {
    switch (style) {
      case "bars":
        return renderBars();
      case "wave":
        return renderWave();
      case "circle":
        return renderCircle();
      case "minimal":
        return renderMinimal();
      default:
        return renderBars();
    }
  };

  return <div style={getPositionStyles()}>{getContent()}</div>;
};
