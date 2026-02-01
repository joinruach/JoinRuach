import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface CaptionSegment {
  text: string;
  startMs: number;
  endMs: number;
  speaker?: string;
}

interface CaptionsProps {
  segments: CaptionSegment[];
  style?: "modern" | "classic" | "minimal" | "bold" | "karaoke";
  position?: "bottom" | "center" | "top";
  fontSize?: number;
  maxWidth?: number;
  accentColor?: string;
  backgroundColor?: string;
  highlightCurrentWord?: boolean;
}

export const Captions: React.FC<CaptionsProps> = ({
  segments,
  style = "modern",
  position = "bottom",
  fontSize = 42,
  maxWidth = 900,
  accentColor = "#C4A052",
  backgroundColor = "rgba(0,0,0,0.7)",
  highlightCurrentWord = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  // Find current segment
  const currentSegment = segments.find(
    (seg) => currentTimeMs >= seg.startMs && currentTimeMs <= seg.endMs
  );

  if (!currentSegment) return null;

  const segmentProgress = interpolate(
    currentTimeMs,
    [currentSegment.startMs, currentSegment.endMs],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case "top":
        return { top: 120 };
      case "center":
        return { top: "50%", transform: "translateY(-50%)" };
      case "bottom":
      default:
        return { bottom: 150 };
    }
  };

  const renderWords = (text: string) => {
    if (!highlightCurrentWord) return text;

    const words = text.split(" ");
    const currentWordIndex = Math.floor(segmentProgress * words.length);

    return (
      <>
        {words.map((word, index) => (
          <span
            key={index}
            style={{
              color: index === currentWordIndex ? accentColor : "#FFFFFF",
              fontWeight: index === currentWordIndex ? 700 : 500,
              transition: "color 0.1s, font-weight 0.1s",
            }}
          >
            {word}{" "}
          </span>
        ))}
      </>
    );
  };

  const renderModern = () => (
    <div
      style={{
        backgroundColor,
        padding: "16px 32px",
        borderRadius: 8,
        backdropFilter: "blur(10px)",
      }}
    >
      {currentSegment.speaker && (
        <div
          style={{
            fontSize: fontSize * 0.5,
            color: accentColor,
            marginBottom: 8,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {currentSegment.speaker}
        </div>
      )}
      <div
        style={{
          fontSize,
          fontWeight: 500,
          color: "#FFFFFF",
          lineHeight: 1.4,
        }}
      >
        {renderWords(currentSegment.text)}
      </div>
    </div>
  );

  const renderClassic = () => (
    <div
      style={{
        backgroundColor: "rgba(0,0,0,0.85)",
        padding: "12px 24px",
        border: `2px solid ${accentColor}`,
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight: 400,
          color: "#FFFFFF",
          lineHeight: 1.3,
          fontFamily: "Georgia, serif",
        }}
      >
        {currentSegment.text}
      </div>
    </div>
  );

  const renderMinimal = () => (
    <div
      style={{
        textShadow: "0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight: 600,
          color: "#FFFFFF",
          lineHeight: 1.4,
        }}
      >
        {currentSegment.text}
      </div>
    </div>
  );

  const renderBold = () => (
    <div
      style={{
        backgroundColor: accentColor,
        padding: "20px 40px",
        clipPath: "polygon(2% 0, 100% 0, 98% 100%, 0 100%)",
      }}
    >
      <div
        style={{
          fontSize: fontSize * 1.1,
          fontWeight: 900,
          color: "#000000",
          lineHeight: 1.2,
          textTransform: "uppercase",
        }}
      >
        {currentSegment.text}
      </div>
    </div>
  );

  const renderKaraoke = () => {
    const words = currentSegment.text.split(" ");
    const wordsShown = Math.ceil(segmentProgress * words.length);

    return (
      <div
        style={{
          backgroundColor,
          padding: "20px 40px",
          borderRadius: 12,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          {words.map((word, index) => (
            <span
              key={index}
              style={{
                color: index < wordsShown ? accentColor : "rgba(255,255,255,0.3)",
                transition: "color 0.15s ease-out",
                marginRight: "0.25em",
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    );
  };

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
      case "karaoke":
        return renderKaraoke();
      default:
        return renderModern();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth,
        textAlign: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        ...getPositionStyles(),
      }}
    >
      {getContent()}
    </div>
  );
};
