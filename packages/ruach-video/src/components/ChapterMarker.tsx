import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
}

interface ChapterMarkerProps {
  chapters: Chapter[];
  accentColor?: string;
  position?: "top" | "bottom";
}

export const ChapterMarker: React.FC<ChapterMarkerProps> = ({
  chapters,
  accentColor = "#C4A052",
  position = "top",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentTimeSeconds = frame / fps;

  // Find current chapter
  const currentChapter = chapters.find(
    (ch) => currentTimeSeconds >= ch.startTime && currentTimeSeconds < ch.endTime
  );

  if (!currentChapter) return null;

  const chapterIndex = chapters.indexOf(currentChapter);
  const chapterStartFrame = currentChapter.startTime * fps;
  const relativeFrame = frame - chapterStartFrame;

  const enterProgress = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 200, stiffness: 100 },
  });

  const opacity = interpolate(enterProgress, [0, 1], [0, 1]);
  const translateY = interpolate(enterProgress, [0, 1], [position === "top" ? -20 : 20, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        ...(position === "top" ? { top: 60 } : { bottom: 60 }),
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Chapter number */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: accentColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 700,
          color: "#000000",
        }}
      >
        {chapterIndex + 1}
      </div>

      {/* Chapter title */}
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 4,
          }}
        >
          Chapter {chapterIndex + 1} of {chapters.length}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#FFFFFF",
          }}
        >
          {currentChapter.title}
        </div>
      </div>
    </div>
  );
};
