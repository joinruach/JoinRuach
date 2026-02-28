/**
 * Energy Matrix Builder
 *
 * Aligns multiple camera energy profiles into a unified time grid
 * using sync offsets from Phase 9. Pure functions, no I/O.
 */

import type { EnergyProfile } from './audio-energy-analyzer';

export interface EnergyMatrix {
  cameras: string[];
  windowMs: number;
  windowCount: number;
  durationMs: number;
  /** camera → normalized RMS per window index */
  matrix: Record<string, number[]>;
}

const DEFAULT_WINDOW_MS = 500;

/**
 * Build a unified energy matrix from per-camera profiles.
 *
 * Shifts each camera's energy windows by its sync offset to align
 * all cameras to the master timeline. Windows with no data (camera
 * not yet recording or already stopped) default to 0 energy.
 *
 * @param profiles - Energy profiles from buildEnergyProfile()
 * @param syncOffsets - Phase 9 sync offsets in ms (e.g., {A: 0, B: 1830})
 * @param durationMs - Total session duration in ms
 * @param windowMs - Window size (must match profiles)
 */
export function buildEnergyMatrix(
  profiles: EnergyProfile[],
  syncOffsets: Record<string, number>,
  durationMs: number,
  windowMs: number = DEFAULT_WINDOW_MS
): EnergyMatrix {
  const windowCount = Math.ceil(durationMs / windowMs);
  const cameras = profiles.map((p) => p.camera);
  const matrix: Record<string, number[]> = {};

  for (const profile of profiles) {
    const aligned = new Array<number>(windowCount).fill(0);
    const offsetMs = syncOffsets[profile.camera] ?? 0;

    for (const window of profile.windows) {
      // Shift window start by sync offset to master timeline
      const masterStartMs = window.startMs + offsetMs;
      const targetIndex = Math.round(masterStartMs / windowMs);

      if (targetIndex >= 0 && targetIndex < windowCount) {
        aligned[targetIndex] = window.rmsLinear;
      }
    }

    matrix[profile.camera] = aligned;
  }

  return {
    cameras,
    windowMs,
    windowCount,
    durationMs,
    matrix,
  };
}
