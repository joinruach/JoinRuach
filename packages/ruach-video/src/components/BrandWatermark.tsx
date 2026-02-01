import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface BrandWatermarkProps {
  text?: string;
  logoUrl?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  opacity?: number;
  size?: "small" | "medium" | "large";
  fadeIn?: boolean;
}

export const BrandWatermark: React.FC<BrandWatermarkProps> = ({
  text = "RUACH",
  logoUrl,
  position = "bottom-right",
  opacity = 0.6,
  size = "small",
  fadeIn = true,
}) => {
  const frame = useCurrentFrame();

  const fadeOpacity = fadeIn
    ? interpolate(frame, [0, 30], [0, opacity], { extrapolateRight: "clamp" })
    : opacity;

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { fontSize: 14, padding: 20 };
      case "medium":
        return { fontSize: 18, padding: 30 };
      case "large":
        return { fontSize: 24, padding: 40 };
      default:
        return { fontSize: 14, padding: 20 };
    }
  };

  const getPositionStyles = (): React.CSSProperties => {
    const { padding } = getSizeStyles();
    switch (position) {
      case "bottom-right":
        return { bottom: padding, right: padding };
      case "bottom-left":
        return { bottom: padding, left: padding };
      case "top-right":
        return { top: padding, right: padding };
      case "top-left":
        return { top: padding, left: padding };
      default:
        return { bottom: padding, right: padding };
    }
  };

  const { fontSize } = getSizeStyles();

  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        gap: 8,
        opacity: fadeOpacity,
        ...getPositionStyles(),
      }}
    >
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          style={{
            width: fontSize * 1.5,
            height: fontSize * 1.5,
            objectFit: "contain",
          }}
        />
      )}
      <span
        style={{
          fontSize,
          fontWeight: 600,
          color: "#FFFFFF",
          letterSpacing: "0.15em",
          fontFamily: "Inter, system-ui, sans-serif",
          textTransform: "uppercase",
        }}
      >
        {text}
      </span>
    </div>
  );
};
