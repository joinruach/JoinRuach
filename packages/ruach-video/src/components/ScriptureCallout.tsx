import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface ScriptureCalloutProps {
  reference: string;
  text: string;
  position?: "left" | "right" | "center" | "fullscreen";
  style?: "card" | "overlay" | "minimal" | "dramatic";
  accentColor?: string;
  startFrame?: number;
  durationFrames?: number;
}

export const ScriptureCallout: React.FC<ScriptureCalloutProps> = ({
  reference,
  text,
  position = "right",
  style = "card",
  accentColor = "#C4A052",
  startFrame = 0,
  durationFrames = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0 || relativeFrame > durationFrames) return null;

  const enterProgress = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 200, stiffness: 80 },
  });

  const exitStart = durationFrames - 20;
  const exitProgress =
    relativeFrame > exitStart
      ? interpolate(relativeFrame, [exitStart, durationFrames], [0, 1], {
          extrapolateRight: "clamp",
        })
      : 0;

  const opacity = interpolate(exitProgress, [0, 1], [1, 0]);

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case "left":
        return {
          left: 60,
          top: "50%",
          transform: `translateY(-50%) translateX(${interpolate(enterProgress, [0, 1], [-100, 0])}px)`,
        };
      case "right":
        return {
          right: 60,
          top: "50%",
          transform: `translateY(-50%) translateX(${interpolate(enterProgress, [0, 1], [100, 0])}px)`,
        };
      case "center":
        return {
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${enterProgress})`,
        };
      case "fullscreen":
        return {
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        };
      default:
        return {};
    }
  };

  const renderCard = () => (
    <div
      style={{
        backgroundColor: "rgba(0,0,0,0.9)",
        padding: 40,
        borderRadius: 16,
        borderLeft: `4px solid ${accentColor}`,
        maxWidth: 500,
        backdropFilter: "blur(20px)",
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: accentColor,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          marginBottom: 16,
        }}
      >
        {reference}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 400,
          color: "#FFFFFF",
          lineHeight: 1.6,
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
        }}
      >
        "{text}"
      </div>
    </div>
  );

  const renderOverlay = () => (
    <div
      style={{
        backgroundColor: `${accentColor}F0`,
        padding: "30px 50px",
        maxWidth: 600,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#000000",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginBottom: 12,
        }}
      >
        {reference}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: "#000000",
          lineHeight: 1.5,
        }}
      >
        {text}
      </div>
    </div>
  );

  const renderMinimal = () => (
    <div style={{ maxWidth: 450, textAlign: position === "center" ? "center" : "left" }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: accentColor,
          marginBottom: 12,
          letterSpacing: "0.1em",
        }}
      >
        {reference}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 300,
          color: "#FFFFFF",
          lineHeight: 1.7,
          textShadow: "0 2px 20px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
    </div>
  );

  const renderDramatic = () => (
    <div
      style={{
        textAlign: "center",
        maxWidth: 800,
        padding: 60,
      }}
    >
      {/* Decorative line */}
      <div
        style={{
          width: 60,
          height: 2,
          backgroundColor: accentColor,
          margin: "0 auto 30px",
          transform: `scaleX(${enterProgress})`,
        }}
      />
      <div
        style={{
          fontSize: 36,
          fontWeight: 300,
          color: "#FFFFFF",
          lineHeight: 1.6,
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          marginBottom: 30,
        }}
      >
        "{text}"
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: accentColor,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
        }}
      >
        — {reference}
      </div>
      {/* Decorative line */}
      <div
        style={{
          width: 60,
          height: 2,
          backgroundColor: accentColor,
          margin: "30px auto 0",
          transform: `scaleX(${enterProgress})`,
        }}
      />
    </div>
  );

  const getContent = () => {
    switch (style) {
      case "card":
        return renderCard();
      case "overlay":
        return renderOverlay();
      case "minimal":
        return renderMinimal();
      case "dramatic":
        return renderDramatic();
      default:
        return renderCard();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        opacity,
        fontFamily: "Inter, system-ui, sans-serif",
        ...getPositionStyles(),
      }}
    >
      {getContent()}
    </div>
  );
};
