import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface Speaker {
  name: string;
  role?: string;
  imageUrl?: string;
}

interface SpeakerCardProps {
  speakers: Speaker[];
  layout?: "horizontal" | "vertical" | "grid";
  accentColor?: string;
  startFrame?: number;
}

export const SpeakerCard: React.FC<SpeakerCardProps> = ({
  speakers,
  layout = "horizontal",
  accentColor = "#C4A052",
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) return null;

  const getLayoutStyles = (): React.CSSProperties => {
    switch (layout) {
      case "horizontal":
        return {
          display: "flex",
          flexDirection: "row",
          gap: 40,
          justifyContent: "center",
        };
      case "vertical":
        return {
          display: "flex",
          flexDirection: "column",
          gap: 24,
          alignItems: "flex-start",
        };
      case "grid":
        return {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 30,
        };
      default:
        return {};
    }
  };

  return (
    <div
      style={{
        ...getLayoutStyles(),
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {speakers.map((speaker, index) => {
        const delay = index * 10;
        const progress = spring({
          frame: relativeFrame - delay,
          fps,
          config: { damping: 200, stiffness: 100 },
        });

        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const scale = interpolate(progress, [0, 1], [0.9, 1]);

        return (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              opacity,
              transform: `scale(${scale})`,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: speaker.imageUrl ? "transparent" : accentColor,
                border: `2px solid ${accentColor}`,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {speaker.imageUrl ? (
                <img
                  src={speaker.imageUrl}
                  alt={speaker.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#000000",
                  }}
                >
                  {speaker.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#FFFFFF",
                }}
              >
                {speaker.name}
              </div>
              {speaker.role && (
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.6)",
                    marginTop: 2,
                  }}
                >
                  {speaker.role}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
