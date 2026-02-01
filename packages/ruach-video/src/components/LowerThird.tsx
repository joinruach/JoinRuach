import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

interface LowerThirdProps {
  name: string;
  title?: string;
  accentColor?: string;
  style?: "modern" | "classic" | "minimal" | "bold";
  position?: "bottom-left" | "bottom-right" | "bottom-center";
  startFrame?: number;
  durationFrames?: number;
}

export const LowerThird: React.FC<LowerThirdProps> = ({
  name,
  title,
  accentColor = "#C4A052",
  style = "modern",
  position = "bottom-left",
  startFrame = 0,
  durationFrames = 150,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0 || relativeFrame > durationFrames) return null;

  // Animation progress
  const enterProgress = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 200, stiffness: 100 },
  });

  const exitStart = durationFrames - 20;
  const exitProgress =
    relativeFrame > exitStart
      ? interpolate(relativeFrame, [exitStart, durationFrames], [0, 1], {
          extrapolateRight: "clamp",
        })
      : 0;

  const opacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const translateX = interpolate(enterProgress, [0, 1], [-100, 0]);

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case "bottom-left":
        return { left: 60, bottom: 100 };
      case "bottom-right":
        return { right: 60, bottom: 100 };
      case "bottom-center":
        return { left: "50%", transform: "translateX(-50%)", bottom: 100 };
      default:
        return { left: 60, bottom: 100 };
    }
  };

  const renderModern = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        transform: `translateX(${translateX}px)`,
        opacity,
      }}
    >
      <div
        style={{
          width: 4,
          height: 60,
          backgroundColor: accentColor,
          borderRadius: 2,
        }}
      />
      <div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {name}
        </div>
        {title && (
          <div
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: "rgba(255,255,255,0.7)",
              marginTop: 4,
            }}
          >
            {title}
          </div>
        )}
      </div>
    </div>
  );

  const renderClassic = () => (
    <div
      style={{
        backgroundColor: "rgba(0,0,0,0.8)",
        padding: "16px 32px",
        borderLeft: `4px solid ${accentColor}`,
        transform: `translateX(${translateX}px)`,
        opacity,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#FFFFFF",
        }}
      >
        {name}
      </div>
      {title && (
        <div
          style={{
            fontSize: 16,
            color: accentColor,
            marginTop: 4,
          }}
        >
          {title}
        </div>
      )}
    </div>
  );

  const renderMinimal = () => (
    <div
      style={{
        transform: `translateX(${translateX}px)`,
        opacity,
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 500,
          color: "#FFFFFF",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {name}
      </div>
      {title && (
        <div
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
            marginTop: 4,
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </div>
      )}
    </div>
  );

  const renderBold = () => (
    <div
      style={{
        backgroundColor: accentColor,
        padding: "20px 40px",
        clipPath: "polygon(0 0, 100% 0, 95% 100%, 0 100%)",
        transform: `translateX(${translateX}px)`,
        opacity,
      }}
    >
      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: "#000000",
          textTransform: "uppercase",
        }}
      >
        {name}
      </div>
      {title && (
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "rgba(0,0,0,0.7)",
            marginTop: 4,
          }}
        >
          {title}
        </div>
      )}
    </div>
  );

  const getContent = () => {
    switch (style) {
      case "modern":
        return renderModern();
      case "classic":
        return renderClassic();
      case "minimal":
        return renderMinimal();
      case "bold":
        return renderBold();
      default:
        return renderModern();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        ...getPositionStyles(),
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {getContent()}
    </div>
  );
};
