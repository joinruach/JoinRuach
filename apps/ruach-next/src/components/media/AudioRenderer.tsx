"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export interface AudioRendererProps {
  src: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  className?: string;
}

export interface AudioRendererHandle {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

/**
 * Native HTML5 audio player for audio files (MP3, WAV, M4A, OGG, etc.)
 */
export const AudioRenderer = forwardRef<AudioRendererHandle, AudioRendererProps>(
  function AudioRenderer(
    { src, autoPlay, onPlay, onPause, onTimeUpdate, onDurationChange, onEnded, className },
    ref
  ) {
    const audioRef = useRef<HTMLAudioElement>(null);

    useImperativeHandle(ref, () => ({
      play: async () => {
        if (audioRef.current) {
          await audioRef.current.play();
        }
      },
      pause: () => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      },
      seek: (time: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = time;
        }
      },
      setVolume: (volume: number) => {
        if (audioRef.current) {
          audioRef.current.volume = volume;
        }
      },
      setMuted: (muted: boolean) => {
        if (audioRef.current) {
          audioRef.current.muted = muted;
        }
      },
      getCurrentTime: () => {
        return audioRef.current?.currentTime || 0;
      },
      getDuration: () => {
        return audioRef.current?.duration || 0;
      },
    }));

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handlePlay = () => onPlay?.();
      const handlePause = () => onPause?.();
      const handleTimeUpdate = () => onTimeUpdate?.(audio.currentTime);
      const handleDurationChange = () => onDurationChange?.(audio.duration);
      const handleEnded = () => onEnded?.();

      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("durationchange", handleDurationChange);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("durationchange", handleDurationChange);
        audio.removeEventListener("ended", handleEnded);
      };
    }, [onPlay, onPause, onTimeUpdate, onDurationChange, onEnded]);

    return (
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        controls
        className={className || "w-full"}
      >
        Your browser does not support the audio tag.
      </audio>
    );
  }
);
