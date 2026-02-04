import type { CanonicalEDL, Cut, Chapter } from '../types/edl';

/**
 * Phase 12: EDL Loader Utilities
 *
 * Functions for loading and working with CanonicalEDL in Remotion compositions
 */

/**
 * Fetch EDL from Strapi API
 *
 * @param sessionId - Recording session ID
 * @param apiBaseUrl - Strapi API base URL (default: http://localhost:1337)
 * @returns CanonicalEDL JSON
 */
export async function fetchEDL(
  sessionId: string,
  apiBaseUrl = 'http://localhost:1337'
): Promise<CanonicalEDL> {
  const url = `${apiBaseUrl}/api/recording-sessions/${sessionId}/edl`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch EDL: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success || !data.data.canonicalEdl) {
    throw new Error('Invalid EDL response format');
  }

  return data.data.canonicalEdl as CanonicalEDL;
}

/**
 * Get the active camera for a specific time in the timeline
 *
 * @param edl - CanonicalEDL
 * @param timeMs - Time in master timeline (milliseconds)
 * @returns Active camera ID ('A', 'B', or 'C')
 */
export function getCameraAtTime(edl: CanonicalEDL, timeMs: number): 'A' | 'B' | 'C' {
  const cut = edl.tracks.program.find(
    c => timeMs >= c.startMs && timeMs < c.endMs
  );

  return cut ? cut.camera : edl.masterCamera as 'A' | 'B' | 'C';
}

/**
 * Get the current cut for a specific time
 *
 * @param edl - CanonicalEDL
 * @param timeMs - Time in master timeline (milliseconds)
 * @returns Current cut or undefined
 */
export function getCutAtTime(edl: CanonicalEDL, timeMs: number): Cut | undefined {
  return edl.tracks.program.find(
    c => timeMs >= c.startMs && timeMs < c.endMs
  );
}

/**
 * Get the current chapter for a specific time
 *
 * @param edl - CanonicalEDL
 * @param timeMs - Time in master timeline (milliseconds)
 * @returns Current chapter or undefined
 */
export function getChapterAtTime(edl: CanonicalEDL, timeMs: number): Chapter | undefined {
  if (!edl.tracks.chapters || edl.tracks.chapters.length === 0) {
    return undefined;
  }

  // Find the last chapter that started before or at current time
  const chapters = [...edl.tracks.chapters].sort((a, b) => a.startMs - b.startMs);
  
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (timeMs >= chapters[i].startMs) {
      return chapters[i];
    }
  }

  return undefined;
}

/**
 * Calculate camera-specific time by applying offset
 *
 * @param masterTimeMs - Time in master timeline (milliseconds)
 * @param cameraOffsetMs - Camera offset from sources (Phase 9)
 * @returns Camera-specific time in milliseconds
 */
export function calculateCameraTime(masterTimeMs: number, cameraOffsetMs: number): number {
  // Apply offset and clamp to 0 (same logic as Phase 10)
  return Math.max(0, masterTimeMs + cameraOffsetMs);
}

/**
 * Get video URL for a camera source
 *
 * @param source - CameraSource from EDL
 * @param preferProxy - Use proxy instead of mezzanine for preview
 * @returns Video URL
 */
export function getVideoUrl(source: any, preferProxy = false): string {
  if (preferProxy && source.proxyUrl) {
    return source.proxyUrl;
  }
  return source.mezzanineUrl || source.proxyUrl || '';
}

/**
 * Convert milliseconds to frames
 *
 * @param timeMs - Time in milliseconds
 * @param fps - Frames per second
 * @returns Frame number
 */
export function msToFrames(timeMs: number, fps: number): number {
  return Math.floor((timeMs / 1000) * fps);
}

/**
 * Convert frames to milliseconds
 *
 * @param frames - Frame number
 * @param fps - Frames per second
 * @returns Time in milliseconds
 */
export function framesToMs(frames: number, fps: number): number {
  return (frames / fps) * 1000;
}

/**
 * Validate EDL structure (basic runtime checks)
 *
 * @param edl - CanonicalEDL to validate
 * @returns True if valid, throws error otherwise
 */
export function validateEDL(edl: CanonicalEDL): boolean {
  if (edl.schemaVersion !== '1.0') {
    throw new Error(`Unsupported EDL schema version: ${edl.schemaVersion}`);
  }

  if (!edl.tracks.program || edl.tracks.program.length === 0) {
    throw new Error('EDL has no program track');
  }

  if (!edl.sources || Object.keys(edl.sources).length === 0) {
    throw new Error('EDL has no camera sources');
  }

  return true;
}
