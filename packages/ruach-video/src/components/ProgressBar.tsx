import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface ProgressBarProps {
  position?: "top" | "bottom";
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: "solid" | "gradient" | "glow";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  position = "bottom",
  height = 4,
  color = "#C4A052",
  backgroundColor = "rgba(255,255,255,0.1)",
  style = "solid",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  const getBarStyle = (): React.CSSProperties => {
    switch (style) {
      case "gradient":
        return {
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
        };
      case "glow":
        return {
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}, 0 0 20px ${color}50`,
        };
      case "solid":
      default:
        return {
          backgroundColor: color,
        };
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: "100%",
        height,
        backgroundColor,
        ...(position === "top" ? { top: 0 } : { bottom: 0 }),
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          transition: "width 0.1s linear",
          ...getBarStyle(),
        }}
      />
    </div>
  );
};
