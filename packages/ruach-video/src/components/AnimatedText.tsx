import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

interface AnimatedTextProps {
  text: string;
  style?: "typewriter" | "fade" | "slide" | "reveal" | "kinetic" | "word-by-word";
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  maxWidth?: number;
  startFrame?: number;
  durationFrames?: number;
  emphasis?: string[]; // Words to emphasize
  emphasisColor?: string;
  emphasisScale?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  style = "fade",
  fontSize = 48,
  fontWeight = 600,
  fontFamily = "Inter, system-ui, sans-serif",
  color = "#FFFFFF",
  align = "center",
  lineHeight = 1.4,
  maxWidth = 900,
  startFrame = 0,
  durationFrames,
  emphasis = [],
  emphasisColor = "#C4A052",
  emphasisScale = 1.1,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const duration = durationFrames || durationInFrames - startFrame;
  const relativeFrame = frame - startFrame;

  // Don't render before start frame
  if (relativeFrame < 0) return null;

  const words = text.split(" ");
  const chars = text.split("");

  const renderTypewriter = () => {
    const charsToShow = Math.floor(
      interpolate(relativeFrame, [0, duration * 0.7], [0, chars.length], {
        extrapolateRight: "clamp",
      })
    );

    return (
      <span style={{ fontFamily }}>
        {chars.slice(0, charsToShow).join("")}
        {relativeFrame < duration * 0.7 && (
          <span
            style={{
              opacity: Math.sin(relativeFrame * 0.3) > 0 ? 1 : 0,
              marginLeft: 2,
            }}
          >
            |
          </span>
        )}
      </span>
    );
  };

  const renderFade = () => {
    const opacity = interpolate(relativeFrame, [0, 20], [0, 1], {
      extrapolateRight: "clamp",
    });

    const fadeOutStart = duration - 30;
    const fadeOutOpacity =
      relativeFrame > fadeOutStart
        ? interpolate(relativeFrame, [fadeOutStart, duration], [1, 0], {
            extrapolateRight: "clamp",
          })
        : 1;

    return <span style={{ opacity: opacity * fadeOutOpacity }}>{text}</span>;
  };

  const renderSlide = () => {
    const progress = spring({
      frame: relativeFrame,
      fps,
      config: { damping: 200 },
    });

    const translateY = interpolate(progress, [0, 1], [50, 0]);
    const opacity = interpolate(progress, [0, 1], [0, 1]);

    return (
      <span
        style={{
          display: "inline-block",
          transform: `translateY(${translateY}px)`,
          opacity,
        }}
      >
        {text}
      </span>
    );
  };

  const renderReveal = () => {
    const clipProgress = interpolate(relativeFrame, [0, 40], [0, 100], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    return (
      <span
        style={{
          display: "inline-block",
          clipPath: `inset(0 ${100 - clipProgress}% 0 0)`,
        }}
      >
        {text}
      </span>
    );
  };

  const renderWordByWord = () => {
    const wordsPerSecond = 3;
    const framesPerWord = fps / wordsPerSecond;

    return (
      <span>
        {words.map((word, index) => {
          const wordStartFrame = index * framesPerWord;
          const progress = spring({
            frame: relativeFrame - wordStartFrame,
            fps,
            config: { damping: 200, stiffness: 100 },
          });

          const opacity = relativeFrame >= wordStartFrame ? progress : 0;
          const scale = interpolate(progress, [0, 1], [0.8, 1]);
          const isEmphasis = emphasis.some((e) =>
            word.toLowerCase().includes(e.toLowerCase())
          );

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                opacity,
                transform: `scale(${isEmphasis ? scale * emphasisScale : scale})`,
                color: isEmphasis ? emphasisColor : color,
                fontWeight: isEmphasis ? 800 : fontWeight,
                marginRight: "0.25em",
                transition: "color 0.2s",
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  };

  const renderKinetic = () => {
    // Kinetic typography - words pop in with dramatic timing
    const framesPerWord = 8;
    const holdFrames = 4;

    return (
      <span>
        {words.map((word, index) => {
          const wordStartFrame = index * (framesPerWord + holdFrames);
          const localFrame = relativeFrame - wordStartFrame;

          const scale = spring({
            frame: localFrame,
            fps,
            config: { damping: 10, stiffness: 200 },
          });

          const opacity = localFrame >= 0 ? Math.min(localFrame / 5, 1) : 0;
          const isEmphasis = emphasis.some((e) =>
            word.toLowerCase().includes(e.toLowerCase())
          );

          // Emphasis words get extra pop
          const emphasisMultiplier = isEmphasis
            ? interpolate(scale, [0, 1], [1, emphasisScale])
            : 1;

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                opacity,
                transform: `scale(${scale * emphasisMultiplier})`,
                color: isEmphasis ? emphasisColor : color,
                fontWeight: isEmphasis ? 900 : fontWeight,
                marginRight: "0.3em",
                textShadow: isEmphasis
                  ? `0 0 20px ${emphasisColor}40`
                  : "none",
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  };

  const getContent = () => {
    switch (style) {
      case "typewriter":
        return renderTypewriter();
      case "fade":
        return renderFade();
      case "slide":
        return renderSlide();
      case "reveal":
        return renderReveal();
      case "word-by-word":
        return renderWordByWord();
      case "kinetic":
        return renderKinetic();
      default:
        return <span>{text}</span>;
    }
  };

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        fontFamily,
        color,
        textAlign: align,
        lineHeight,
        maxWidth,
        margin: "0 auto",
        padding: "0 40px",
      }}
    >
      {getContent()}
    </div>
  );
};
