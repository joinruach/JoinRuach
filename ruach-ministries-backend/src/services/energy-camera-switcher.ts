/**
 * Energy-Based Camera Switcher
 *
 * Selects camera angles from an energy matrix using audio dominance
 * rules. Alternative to the transcript-based CameraSwitcher for
 * faster turnaround when transcription is unavailable.
 */

import { randomUUID } from 'crypto';
import type { Cut } from '../types/canonical-edl';
import type { EnergyMatrix } from './energy-matrix-builder';

export interface EnergySwitchOptions {
  minShotLengthMs: number;
  maxShotLengthMs: number;
  switchCooldownMs: number;
  /** dB lead required to trigger switch (default 6) */
  leadThresholdDb: number;
  /** dB below which all cameras are "silent" (default -40) */
  silenceThresholdDb: number;
  /** Camera to use during silence (default 'C') */
  wideCamera: string;
}

const DEFAULT_OPTIONS: EnergySwitchOptions = {
  minShotLengthMs: 2000,
  maxShotLengthMs: 15000,
  switchCooldownMs: 1500,
  leadThresholdDb: 6,
  silenceThresholdDb: -40,
  wideCamera: 'C',
};

/**
 * Convert normalized linear RMS (0-1) back to approximate dB
 * relative to peak. Used for threshold comparisons.
 */
function linearToDb(linear: number): number {
  if (linear <= 0) return -Infinity;
  return 20 * Math.log10(linear);
}

export default class EnergyCameraSwitcher {
  /**
   * Generate camera cuts from an energy matrix.
   *
   * Scans window-by-window, selecting the loudest camera when
   * the energy lead exceeds the threshold. Applies the same timing
   * constraints as the transcript-based CameraSwitcher.
   */
  static generateCuts(
    matrix: EnergyMatrix,
    masterCamera: string,
    options?: Partial<EnergySwitchOptions>
  ): Cut[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { windowMs, windowCount, cameras } = matrix;

    if (cameras.length === 0 || windowCount === 0) {
      return [];
    }

    const cuts: Cut[] = [];
    let currentCamera = masterCamera as 'A' | 'B' | 'C';
    let currentCutStart = 0;
    let lastSwitchTime = 0;

    for (let t = 0; t < windowCount; t++) {
      const timeMs = t * windowMs;
      const decision = this.selectCamera(
        matrix, t, cameras, opts
      );

      const preferredCamera = decision.camera as 'A' | 'B' | 'C';
      const currentShotLength = timeMs - currentCutStart;
      const timeSinceLastSwitch = timeMs - lastSwitchTime;

      // Check if we should force-switch due to max shot length
      if (currentShotLength >= opts.maxShotLengthMs) {
        const nextCamera = this.getNextCamera(currentCamera, cameras);
        if (nextCamera !== currentCamera && timeMs > currentCutStart) {
          cuts.push({
            id: randomUUID(),
            startMs: currentCutStart,
            endMs: timeMs,
            camera: currentCamera,
            reason: 'emphasis',
            confidence: 0.6,
          });
          currentCamera = nextCamera as 'A' | 'B' | 'C';
          currentCutStart = timeMs;
          lastSwitchTime = timeMs;
          continue;
        }
      }

      // Skip switch if same camera
      if (preferredCamera === currentCamera) continue;

      // Skip if timing constraints not met
      if (currentShotLength < opts.minShotLengthMs) continue;
      if (timeSinceLastSwitch < opts.switchCooldownMs) continue;

      // Switch cameras
      if (timeMs > currentCutStart) {
        cuts.push({
          id: randomUUID(),
          startMs: currentCutStart,
          endMs: timeMs,
          camera: currentCamera,
          reason: decision.reason as Cut['reason'],
          confidence: decision.confidence,
        });
        currentCamera = preferredCamera;
        currentCutStart = timeMs;
        lastSwitchTime = timeMs;
      }
    }

    // Close final cut
    const endMs = windowCount * windowMs;
    if (currentCutStart < endMs) {
      cuts.push({
        id: randomUUID(),
        startMs: currentCutStart,
        endMs,
        camera: currentCamera,
        reason: 'operator',
        confidence: 0.9,
      });
    }

    return cuts;
  }

  /**
   * Select preferred camera for a single time window.
   *
   * Returns the camera, reason, and confidence based on
   * energy analysis of that window.
   */
  private static selectCamera(
    matrix: EnergyMatrix,
    windowIndex: number,
    cameras: string[],
    opts: EnergySwitchOptions
  ): { camera: string; reason: string; confidence: number } {
    // Get energy values for this window
    const energies = cameras.map((cam) => ({
      camera: cam,
      linear: matrix.matrix[cam]?.[windowIndex] ?? 0,
      db: linearToDb(matrix.matrix[cam]?.[windowIndex] ?? 0),
    }));

    // Sort by energy descending
    energies.sort((a, b) => b.linear - a.linear);

    const loudest = energies[0];
    const secondLoudest = energies.length > 1 ? energies[1] : null;

    // Check if all cameras are silent
    const allSilent = energies.every(
      (e) => e.db === -Infinity || e.db < opts.silenceThresholdDb
    );

    if (allSilent) {
      return {
        camera: opts.wideCamera,
        reason: 'wide',
        confidence: 0.9,
      };
    }

    // Check energy lead
    if (secondLoudest) {
      const lead = loudest.db - secondLoudest.db;

      if (lead >= opts.leadThresholdDb) {
        return {
          camera: loudest.camera,
          reason: 'speaker',
          confidence: Math.min(1.0, Math.max(0.5, lead / 12)),
        };
      }
    }

    // Ambiguous — stay on current (caller handles this)
    return {
      camera: loudest.camera,
      reason: 'emphasis',
      confidence: 0.5,
    };
  }

  /** Rotate to next camera in the available set */
  private static getNextCamera(
    current: string,
    cameras: string[]
  ): string {
    const idx = cameras.indexOf(current);
    if (idx === -1) return cameras[0];
    return cameras[(idx + 1) % cameras.length];
  }
}
