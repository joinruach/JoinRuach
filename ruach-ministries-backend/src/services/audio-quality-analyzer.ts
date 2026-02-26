/**
 * Audio Quality Analyzer
 *
 * Uses ffprobe/ffmpeg volumedetect to measure audio metrics per camera.
 * Scores audio quality for master camera selection in the sync engine.
 *
 * @version 1.0.0
 * @date 2026-02-26
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface AudioMetrics {
  rmsLevelDb: number;
  peakLevelDb: number;
  noiseFloorDb: number;
}

/**
 * Analyze audio quality using ffmpeg volumedetect filter.
 *
 * Returns RMS level, peak level, and estimated noise floor.
 * Tries ffprobe first, falls back to ffmpeg for broader compatibility.
 */
export async function analyzeAudioQuality(audioPath: string): Promise<AudioMetrics> {
  const { stderr } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-f', 'lavfi',
    '-i', `amovie=${audioPath},volumedetect`,
    '-show_entries', 'frame=pkt_pts_time',
    '-of', 'default=noprint_wrappers=1',
  ], { maxBuffer: 1024 * 1024 * 5 }).catch(async () => {
    // Fallback: ffmpeg with volumedetect (more widely available)
    const result = await execFileAsync('ffmpeg', [
      '-i', audioPath,
      '-af', 'volumedetect',
      '-f', 'null',
      '-',
    ], { maxBuffer: 1024 * 1024 * 5 });
    return result;
  });

  const meanVolumeMatch = stderr.match(/mean_volume:\s*([-\d.]+)\s*dB/);
  const maxVolumeMatch = stderr.match(/max_volume:\s*([-\d.]+)\s*dB/);

  const rmsLevelDb = meanVolumeMatch ? parseFloat(meanVolumeMatch[1]) : -40;
  const peakLevelDb = maxVolumeMatch ? parseFloat(maxVolumeMatch[1]) : -20;

  // Noise floor heuristic: mean_volume - 20dB (typical speech dynamic range)
  const noiseFloorDb = rmsLevelDb - 20;

  return { rmsLevelDb, peakLevelDb, noiseFloorDb };
}

/**
 * Compute a 0-1 quality score from audio metrics.
 *
 * Weights: RMS loudness (40%), headroom (30%), signal-to-noise (30%)
 *
 * - RMS: ideal is -16dB for speech; scores drop for quieter/louder signals
 * - Headroom: ≥6dB from peak to 0dB is perfect; clipping = 0
 * - SNR: 30dB signal-to-noise = perfect score
 */
export function computeAudioScore(metrics: AudioMetrics): number {
  // RMS: peaks at -16dB, linear falloff across 24dB range
  const rmsIdeal = -16;
  const rmsDiff = Math.abs(metrics.rmsLevelDb - rmsIdeal);
  const rmsScore = Math.max(0, 1 - rmsDiff / 24);

  // Headroom: distance from peak to 0dB
  const headroom = Math.abs(metrics.peakLevelDb);
  const headroomScore = metrics.peakLevelDb >= 0
    ? 0 // Clipping
    : Math.min(1, headroom / 6);

  // SNR: difference between signal and noise floor
  const snr = metrics.rmsLevelDb - metrics.noiseFloorDb;
  const snrScore = Math.min(1, Math.max(0, snr / 30));

  return 0.4 * rmsScore + 0.3 * headroomScore + 0.3 * snrScore;
}
