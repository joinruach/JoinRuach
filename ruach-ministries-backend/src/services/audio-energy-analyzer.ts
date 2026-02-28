/**
 * Audio Energy Analyzer
 *
 * Extracts per-window RMS energy from WAV files using FFmpeg astats.
 * Used by the energy-based camera switcher for speaker detection
 * without requiring transcription.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

// Safe: execFile passes args as array, no shell interpolation
const execFileAsync = promisify(execFile);

export interface EnergyWindow {
  startMs: number;
  endMs: number;
  rmsDb: number;
  rmsLinear: number;
}

export interface EnergyProfile {
  camera: string;
  windowMs: number;
  windows: EnergyWindow[];
  peakRmsDb: number;
  meanRmsDb: number;
}

const DEFAULT_WINDOW_MS = 500;
const SAMPLES_PER_MS_48K = 48; // 48kHz → 48 samples per ms

/**
 * Extract per-window RMS energy from a WAV file via FFmpeg astats.
 *
 * Runs FFmpeg with asetnsamples to chunk audio into fixed windows,
 * then parses RMS_level from stderr metadata lines.
 */
export async function analyzeAudioEnergy(
  audioPath: string,
  windowMs: number = DEFAULT_WINDOW_MS
): Promise<EnergyWindow[]> {
  const samplesPerWindow = windowMs * SAMPLES_PER_MS_48K;

  const { stderr } = await execFileAsync('ffmpeg', [
    '-i', audioPath,
    '-af', `asetnsamples=n=${samplesPerWindow},astats=metadata=1:reset=1,ametadata=print`,
    '-f', 'null',
    '-',
  ], { maxBuffer: 1024 * 1024 * 50 });

  return parseAstatsOutput(stderr, windowMs);
}

/**
 * Parse FFmpeg astats stderr output into EnergyWindow array.
 *
 * Looks for lines matching: lavfi.astats.Overall.RMS_level=<dB>
 * Each occurrence corresponds to one audio frame (window).
 */
function parseAstatsOutput(stderr: string, windowMs: number): EnergyWindow[] {
  const windows: EnergyWindow[] = [];
  const rmsPattern = /lavfi\.astats\.Overall\.RMS_level=([-\d.inf]+)/g;

  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = rmsPattern.exec(stderr)) !== null) {
    const rawValue = match[1];
    // astats outputs "-inf" for silent frames
    const rmsDb = rawValue === '-inf' ? -Infinity : parseFloat(rawValue);

    windows.push({
      startMs: index * windowMs,
      endMs: (index + 1) * windowMs,
      rmsDb,
      rmsLinear: 0, // Populated by normalizeEnergyProfile
    });

    index++;
  }

  return windows;
}

/**
 * Normalize energy windows to 0-1 linear scale relative to peak.
 *
 * Maps dB values to linear using: linear = 10^((rmsDb - peakRmsDb) / 20)
 * Silent frames (-inf dB) map to 0.
 */
export function normalizeEnergyProfile(
  windows: EnergyWindow[],
  peakRmsDb: number
): EnergyWindow[] {
  return windows.map((w) => ({
    ...w,
    rmsLinear: w.rmsDb === -Infinity
      ? 0
      : Math.pow(10, (w.rmsDb - peakRmsDb) / 20),
  }));
}

/**
 * Build a complete energy profile for a single camera.
 *
 * Convenience wrapper: analyzes audio → computes stats → normalizes.
 */
export async function buildEnergyProfile(
  camera: string,
  audioPath: string,
  windowMs: number = DEFAULT_WINDOW_MS
): Promise<EnergyProfile> {
  const rawWindows = await analyzeAudioEnergy(audioPath, windowMs);

  const finiteWindows = rawWindows.filter((w) => w.rmsDb !== -Infinity);
  const peakRmsDb = finiteWindows.length > 0
    ? Math.max(...finiteWindows.map((w) => w.rmsDb))
    : -60;
  const meanRmsDb = finiteWindows.length > 0
    ? finiteWindows.reduce((sum, w) => sum + w.rmsDb, 0) / finiteWindows.length
    : -60;

  const windows = normalizeEnergyProfile(rawWindows, peakRmsDb);

  return {
    camera,
    windowMs,
    windows,
    peakRmsDb,
    meanRmsDb,
  };
}
