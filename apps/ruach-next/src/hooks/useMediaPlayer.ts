import { useMediaPlayerContext } from "@/contexts/MediaPlayerContext";

/**
 * Hook to access the media player context.
 * Must be used within MediaPlayerProvider.
 *
 * @example
 * ```tsx
 * const { state, actions } = useMediaPlayer();
 *
 * // Load a media item
 * actions.loadMedia(mediaItem, true);
 *
 * // Control playback
 * actions.play();
 * actions.pause();
 * actions.seek(120); // seek to 2 minutes
 * ```
 */
export function useMediaPlayer() {
  return useMediaPlayerContext();
}
