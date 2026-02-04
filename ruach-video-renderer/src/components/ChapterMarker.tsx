import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { Chapter } from '../types/edl';

/**
 * Phase 12: Chapter Marker Component
 *
 * Displays chapter title as lower-third graphic with fade animations
 */

export interface ChapterMarkerProps {
  chapter: Chapter;
  currentTimeMs: number;
  displayDurationMs?: number; // Default 3000 (3 seconds)
}

export const ChapterMarker: React.FC<ChapterMarkerProps> = ({
  chapter,
  currentTimeMs,
  displayDurationMs = 3000,
}) => {
  const timeSinceStart = currentTimeMs - chapter.startMs;

  // Only show for first N seconds of chapter
  if (timeSinceStart < 0 || timeSinceStart > displayDurationMs) {
    return null;
  }

  // Fade in/out animation
  const fadeInDuration = 500;
  const fadeOutDuration = 500;
  let opacity = 1;

  if (timeSinceStart < fadeInDuration) {
    // Fade in
    opacity = timeSinceStart / fadeInDuration;
  } else if (timeSinceStart > displayDurationMs - fadeOutDuration) {
    // Fade out
    opacity = (displayDurationMs - timeSinceStart) / fadeOutDuration;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          opacity,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: '24px 48px',
            borderLeft: '6px solid #3b82f6',
            maxWidth: 600,
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: '#93c5fd',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            Chapter
          </div>
          <div
            style={{
              fontSize: 36,
              color: 'white',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {chapter.title}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
