"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export interface VideoRendererProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  className?: string;
}

export interface VideoRendererHandle {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  requestPictureInPicture: () => Promise<void>;
  exitPictureInPicture: () => Promise<void>;
}

/**
 * Native HTML5 video player for file-based videos (MP4, WebM, MOV, etc.)
 */
export const VideoRenderer = forwardRef<VideoRendererHandle, VideoRendererProps>(
  function VideoRenderer(
    { src, poster, autoPlay, onPlay, onPause, onTimeUpdate, onDurationChange, onEnded, className },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
      play: async () => {
        if (videoRef.current) {
          await videoRef.current.play();
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      seek: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      setVolume: (volume: number) => {
        if (videoRef.current) {
          videoRef.current.volume = volume;
        }
      },
      setMuted: (muted: boolean) => {
        if (videoRef.current) {
          videoRef.current.muted = muted;
        }
      },
      getCurrentTime: () => {
        return videoRef.current?.currentTime || 0;
      },
      getDuration: () => {
        return videoRef.current?.duration || 0;
      },
      requestPictureInPicture: async () => {
        if (!videoRef.current) return;

        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          }
          await videoRef.current.requestPictureInPicture();
        } catch (error) {
          console.error("Failed to enter Picture-in-Picture:", error);
          throw error;
        }
      },
      exitPictureInPicture: async () => {
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          }
        } catch (error) {
          console.error("Failed to exit Picture-in-Picture:", error);
          throw error;
        }
      },
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handlePlay = () => onPlay?.();
      const handlePause = () => onPause?.();
      const handleTimeUpdate = () => onTimeUpdate?.(video.currentTime);
      const handleDurationChange = () => onDurationChange?.(video.duration);
      const handleEnded = () => onEnded?.();

      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("durationchange", handleDurationChange);
      video.addEventListener("ended", handleEnded);

      return () => {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("durationchange", handleDurationChange);
        video.removeEventListener("ended", handleEnded);
      };
    }, [onPlay, onPause, onTimeUpdate, onDurationChange, onEnded]);

    return (
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        controls
        playsInline
        className={className || "h-full w-full"}
      >
        Your browser does not support the video tag.
      </video>
    );
  }
);
