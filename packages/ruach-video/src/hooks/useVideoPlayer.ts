/**
 * Hook for controlling Remotion Player
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { PlayerRef } from "@remotion/player";

export interface VideoPlayerState {
  playing: boolean;
  currentFrame: number;
  durationInFrames: number;
  volume: number;
  muted: boolean;
  loop: boolean;
}

export interface VideoPlayerControls {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (frame: number) => void;
  seekToPercent: (percent: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setLoop: (loop: boolean) => void;
}

export function useVideoPlayer(durationInFrames: number) {
  const playerRef = useRef<PlayerRef>(null);

  const [state, setState] = useState<VideoPlayerState>({
    playing: false,
    currentFrame: 0,
    durationInFrames,
    volume: 1,
    muted: false,
    loop: false,
  });

  // Update frame on playback
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleFrameUpdate = () => {
      setState((prev) => ({
        ...prev,
        currentFrame: player.getCurrentFrame(),
      }));
    };

    const handlePlay = () => {
      setState((prev) => ({ ...prev, playing: true }));
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, playing: false }));
    };

    const handleEnded = () => {
      setState((prev) => ({ ...prev, playing: false, currentFrame: 0 }));
    };

    player.addEventListener("frameupdate", handleFrameUpdate);
    player.addEventListener("play", handlePlay);
    player.addEventListener("pause", handlePause);
    player.addEventListener("ended", handleEnded);

    return () => {
      player.removeEventListener("frameupdate", handleFrameUpdate);
      player.removeEventListener("play", handlePlay);
      player.removeEventListener("pause", handlePause);
      player.removeEventListener("ended", handleEnded);
    };
  }, []);

  const controls: VideoPlayerControls = {
    play: useCallback(() => {
      playerRef.current?.play();
    }, []),

    pause: useCallback(() => {
      playerRef.current?.pause();
    }, []),

    toggle: useCallback(() => {
      if (state.playing) {
        playerRef.current?.pause();
      } else {
        playerRef.current?.play();
      }
    }, [state.playing]),

    seekTo: useCallback((frame: number) => {
      playerRef.current?.seekTo(frame);
      setState((prev) => ({ ...prev, currentFrame: frame }));
    }, []),

    seekToPercent: useCallback(
      (percent: number) => {
        const frame = Math.floor((percent / 100) * durationInFrames);
        playerRef.current?.seekTo(frame);
        setState((prev) => ({ ...prev, currentFrame: frame }));
      },
      [durationInFrames]
    ),

    setVolume: useCallback((volume: number) => {
      setState((prev) => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
    }, []),

    toggleMute: useCallback(() => {
      setState((prev) => ({ ...prev, muted: !prev.muted }));
    }, []),

    setLoop: useCallback((loop: boolean) => {
      setState((prev) => ({ ...prev, loop }));
    }, []),
  };

  // Calculate progress percentage
  const progress = (state.currentFrame / state.durationInFrames) * 100;

  return {
    playerRef,
    state,
    controls,
    progress,
  };
}
