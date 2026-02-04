import React, { useEffect, useState } from 'react';
import { AbsoluteFill } from 'remotion';
import type { TranscriptResponse, CaptionSegment } from '../types/transcript';
import { fetchTranscript, getCaptionAtTime } from '../utils/caption-loader';

/**
 * Phase 12: Captions Layer Component
 *
 * Renders synced caption overlays with speaker labels
 */

export interface CaptionStyle {
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  backgroundColor?: string;
  padding?: string;
  borderRadius?: number;
  textShadow?: string;
  speakerColor?: string;
}

export interface CaptionsLayerProps {
  sessionId: string;
  currentCamera: string;
  currentTimeMs: number;
  showSpeaker?: boolean;
  style?: CaptionStyle;
  apiBaseUrl?: string;
}

const DEFAULT_STYLE: CaptionStyle = {
  fontSize: 48,
  fontWeight: 600,
  color: 'white',
  backgroundColor: 'rgba(0,0,0,0.7)',
  padding: '16px 32px',
  borderRadius: 8,
  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
  speakerColor: '#fbbf24', // Amber color
};

export const CaptionsLayer: React.FC<CaptionsLayerProps> = ({
  sessionId,
  currentCamera,
  currentTimeMs,
  showSpeaker = true,
  style = {},
  apiBaseUrl = 'http://localhost:1337',
}) => {
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Merge custom style with defaults
  const finalStyle = { ...DEFAULT_STYLE, ...style };

  // Fetch transcript on mount
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await fetchTranscript(sessionId, apiBaseUrl);
        if (mounted) {
          setTranscript(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load transcript');
          console.error('[CaptionsLayer] Failed to fetch transcript:', err);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sessionId, apiBaseUrl]);

  // Get current caption
  const caption = getCaptionAtTime(transcript, currentCamera, currentTimeMs);

  // Don't render if no caption or error
  if (error) {
    // Silently fail - don't show error overlay to viewer
    return null;
  }

  if (!caption) {
    return null;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          right: '10%',
          textAlign: 'center',
          fontSize: finalStyle.fontSize,
          fontWeight: finalStyle.fontWeight,
          color: finalStyle.color,
          textShadow: finalStyle.textShadow,
          backgroundColor: finalStyle.backgroundColor,
          padding: finalStyle.padding,
          borderRadius: finalStyle.borderRadius,
        }}
      >
        {showSpeaker && (
          <span style={{ color: finalStyle.speakerColor }}>
            {formatSpeakerLabel(caption.speaker)}:{' '}
          </span>
        )}
        {caption.text}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Format speaker label for display
 *
 * Converts "SPEAKER_00" -> "Speaker A"
 * Converts "SPEAKER_01" -> "Speaker B"
 */
function formatSpeakerLabel(speaker: string): string {
  const match = speaker.match(/SPEAKER_(\d+)/);
  if (!match) {
    return speaker;
  }

  const speakerIndex = parseInt(match[1], 10);
  const speakerLetter = String.fromCharCode(65 + speakerIndex); // 65 = 'A'

  return `Speaker ${speakerLetter}`;
}
