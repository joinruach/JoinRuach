import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

/**
 * Stage 1: Thumbnail Still Composition
 *
 * Renders a single still frame for use as a video thumbnail.
 * Accepts a thumbnail image URL or falls back to a branded placeholder.
 */
export type ThumbnailStillProps = {
  sessionId: string;
  /** Direct URL to thumbnail image (e.g., extracted frame from R2) */
  thumbnailUrl?: string;
  /** Title text overlay */
  title?: string;
  /** Subtitle text overlay */
  subtitle?: string;
};

export const ThumbnailStill: React.FC<ThumbnailStillProps> = ({
  sessionId,
  thumbnailUrl,
  title,
  subtitle,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {thumbnailUrl ? (
        <Img
          src={thumbnailUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        />
      )}

      {/* Text overlay */}
      {(title || subtitle) && (
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            padding: 80,
            background:
              "linear-gradient(transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        >
          {title && (
            <div
              style={{
                color: "white",
                fontSize: 64,
                fontWeight: 700,
                lineHeight: 1.2,
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                marginBottom: subtitle ? 16 : 0,
              }}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <div
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 36,
                fontWeight: 400,
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              }}
            >
              {subtitle}
            </div>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
