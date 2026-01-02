"use client";

import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";

// ============================================================================
// Types
// ============================================================================

export type PlayerMode = "fullscreen" | "docked" | "collapsed" | "hidden";

export type MediaFormat = "video-file" | "video-iframe" | "audio" | "video-portrait" | "video-landscape";

export interface VideoSource {
  kind: "youtube" | "vimeo" | "file" | "rumble" | "custom";
  url?: string;
  embedId?: string;
  file?: { url: string };
  startSeconds?: number;
}

export interface Chapter {
  time: number;
  title: string;
  description?: string;
}

export interface Resource {
  title: string;
  url: string;
  type: "pdf" | "link" | "download" | "study-guide" | "worksheet";
  description?: string;
}

export interface ReflectionPrompt {
  question: string;
  category?: string;
}

export interface MediaItem {
  id: string | number;
  title: string;
  source: VideoSource;
  thumbnail?: string;
  format?: MediaFormat;
  orientation?: "portrait" | "landscape" | "square";
  transcript?: string;
  chapters?: Chapter[];
  resources?: Resource[];
  reflectionPrompts?: ReflectionPrompt[];
  durationSec?: number;
}

export interface PlayerState {
  currentMedia: MediaItem | null;
  mode: PlayerMode;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  showDepthPanel: boolean;
}

// ============================================================================
// Actions
// ============================================================================

type PlayerAction =
  | { type: "LOAD_MEDIA"; payload: { media: MediaItem; autoPlay?: boolean } }
  | { type: "SET_MODE"; payload: PlayerMode }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "TOGGLE_PLAY_PAUSE" }
  | { type: "SEEK"; payload: number }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SET_CURRENT_TIME"; payload: number }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "TOGGLE_DEPTH_PANEL" }
  | { type: "CLOSE" };

// ============================================================================
// Reducer
// ============================================================================

const initialState: PlayerState = {
  currentMedia: null,
  mode: "hidden",
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  showDepthPanel: false,
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "LOAD_MEDIA":
      return {
        ...state,
        currentMedia: action.payload.media,
        mode: "fullscreen", // Always start in fullscreen mode
        isPlaying: action.payload.autoPlay ?? true,
        currentTime: 0,
        duration: action.payload.media.durationSec || 0,
        showDepthPanel: false,
      };

    case "SET_MODE":
      return {
        ...state,
        mode: action.payload,
      };

    case "PLAY":
      return {
        ...state,
        isPlaying: true,
      };

    case "PAUSE":
      return {
        ...state,
        isPlaying: false,
      };

    case "TOGGLE_PLAY_PAUSE":
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };

    case "SEEK":
      return {
        ...state,
        currentTime: action.payload,
      };

    case "SET_DURATION":
      return {
        ...state,
        duration: action.payload,
      };

    case "SET_CURRENT_TIME":
      return {
        ...state,
        currentTime: action.payload,
      };

    case "SET_VOLUME":
      return {
        ...state,
        volume: Math.max(0, Math.min(1, action.payload)),
        isMuted: action.payload === 0,
      };

    case "TOGGLE_MUTE":
      return {
        ...state,
        isMuted: !state.isMuted,
      };

    case "TOGGLE_DEPTH_PANEL":
      return {
        ...state,
        showDepthPanel: !state.showDepthPanel,
      };

    case "CLOSE":
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

export interface MediaPlayerContextValue {
  state: PlayerState;
  actions: {
    loadMedia: (media: MediaItem, autoPlay?: boolean) => void;
    setMode: (mode: PlayerMode) => void;
    play: () => void;
    pause: () => void;
    togglePlayPause: () => void;
    seek: (time: number) => void;
    setDuration: (duration: number) => void;
    setCurrentTime: (time: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    toggleDepthPanel: () => void;
    close: () => void;
  };
}

const MediaPlayerContext = createContext<MediaPlayerContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export interface MediaPlayerProviderProps {
  children: ReactNode;
}

export function MediaPlayerProvider({ children }: MediaPlayerProviderProps) {
  const [state, dispatch] = useReducer(playerReducer, initialState);

  // Actions
  const loadMedia = useCallback((media: MediaItem, autoPlay = true) => {
    dispatch({ type: "LOAD_MEDIA", payload: { media, autoPlay } });
  }, []);

  const setMode = useCallback((mode: PlayerMode) => {
    dispatch({ type: "SET_MODE", payload: mode });
  }, []);

  const play = useCallback(() => {
    dispatch({ type: "PLAY" });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: "PAUSE" });
  }, []);

  const togglePlayPause = useCallback(() => {
    dispatch({ type: "TOGGLE_PLAY_PAUSE" });
  }, []);

  const seek = useCallback((time: number) => {
    dispatch({ type: "SEEK", payload: time });
  }, []);

  const setDuration = useCallback((duration: number) => {
    dispatch({ type: "SET_DURATION", payload: duration });
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    dispatch({ type: "SET_CURRENT_TIME", payload: time });
  }, []);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: "SET_VOLUME", payload: volume });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: "TOGGLE_MUTE" });
  }, []);

  const toggleDepthPanel = useCallback(() => {
    dispatch({ type: "TOGGLE_DEPTH_PANEL" });
  }, []);

  const close = useCallback(() => {
    dispatch({ type: "CLOSE" });
  }, []);

  const value: MediaPlayerContextValue = {
    state,
    actions: {
      loadMedia,
      setMode,
      play,
      pause,
      togglePlayPause,
      seek,
      setDuration,
      setCurrentTime,
      setVolume,
      toggleMute,
      toggleDepthPanel,
      close,
    },
  };

  return <MediaPlayerContext.Provider value={value}>{children}</MediaPlayerContext.Provider>;
}

// ============================================================================
// Hook (defined here for convenience, but will also export from hooks/)
// ============================================================================

export function useMediaPlayerContext() {
  const context = useContext(MediaPlayerContext);
  if (!context) {
    throw new Error("useMediaPlayerContext must be used within MediaPlayerProvider");
  }
  return context;
}
