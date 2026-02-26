/**
 * Tests for Audio Quality Analyzer Service
 *
 * Tests computeAudioScore (pure function) and analyzeAudioQuality (with mocked exec).
 */

import { computeAudioScore, analyzeAudioQuality, AudioMetrics } from '../../src/services/audio-quality-analyzer';

// Mock child_process so promisify(execFile) returns our controlled values
jest.mock('child_process', () => ({
  execFile: jest.fn(),
}));

import { execFile } from 'child_process';

/**
 * Helper: make the mocked execFile invoke its callback with given stdout/stderr.
 * promisify(execFile) wraps the callback-based function into a promise,
 * so we simulate the callback signature: (cmd, args, opts, cb) => cb(err, {stdout, stderr})
 */
function mockExecFileResult(stderr: string, stdout = '') {
  (execFile as unknown as jest.Mock).mockImplementation(
    (_cmd: string, _args: string[], _opts: unknown, cb?: (err: Error | null, result: { stdout: string; stderr: string }) => void) => {
      // promisify passes (cmd, args, opts, cb) — 4 args
      if (typeof cb === 'function') {
        cb(null, { stdout, stderr });
      }
      // If called with 3 args (no opts), the third arg is the callback
      if (typeof _opts === 'function') {
        (_opts as unknown as (err: Error | null, result: { stdout: string; stderr: string }) => void)(null, { stdout, stderr });
      }
    },
  );
}

function mockExecFileError() {
  (execFile as unknown as jest.Mock).mockImplementation(
    (_cmd: string, _args: string[], _opts: unknown, cb?: (err: Error | null, result: { stdout: string; stderr: string }) => void) => {
      const err = new Error('Command failed');
      if (typeof cb === 'function') {
        cb(err, { stdout: '', stderr: '' });
      }
      if (typeof _opts === 'function') {
        (_opts as unknown as (err: Error | null, result: { stdout: string; stderr: string }) => void)(err, { stdout: '', stderr: '' });
      }
    },
  );
}

describe('Audio Quality Analyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── computeAudioScore (pure function) ───────────────────────────

  describe('computeAudioScore', () => {
    it('should give a high score (>0.8) for perfect speech signal', () => {
      const metrics: AudioMetrics = {
        rmsLevelDb: -16,
        peakLevelDb: -6,
        noiseFloorDb: -36,
      };

      const score = computeAudioScore(metrics);

      expect(score).toBeGreaterThan(0.8);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should give a low headroom score for clipped audio (0dB peak)', () => {
      const metrics: AudioMetrics = {
        rmsLevelDb: -16,
        peakLevelDb: 0,
        noiseFloorDb: -36,
      };

      const score = computeAudioScore(metrics);

      // Headroom component is 0 when peak >= 0dB
      // Score = 0.4 * rmsScore + 0.3 * 0 + 0.3 * snrScore
      // rmsScore = 1.0 (perfect -16dB), snrScore = min(1, 20/30) = 0.667
      // Expected ≈ 0.4 + 0.2 = 0.6
      expect(score).toBeLessThan(0.7);
    });

    it('should give a low RMS score for very quiet audio (-40dB)', () => {
      const metrics: AudioMetrics = {
        rmsLevelDb: -40,
        peakLevelDb: -20,
        noiseFloorDb: -60,
      };

      const score = computeAudioScore(metrics);

      // rmsDiff = |(-40) - (-16)| = 24, rmsScore = max(0, 1 - 24/24) = 0
      // headroomScore = min(1, 20/6) = 1
      // snrScore = min(1, 20/30) = 0.667
      // Expected ≈ 0 + 0.3 + 0.2 = 0.5
      expect(score).toBeLessThan(0.6);
    });

    it('should give a low SNR score for noisy audio', () => {
      const metrics: AudioMetrics = {
        rmsLevelDb: -16,
        peakLevelDb: -6,
        noiseFloorDb: -21, // Only 5dB between signal and noise
      };

      const score = computeAudioScore(metrics);

      // snrScore = min(1, max(0, 5/30)) = 0.167
      // rmsScore = 1.0, headroomScore = 1.0
      // Expected ≈ 0.4 + 0.3 + 0.05 = 0.75
      expect(score).toBeLessThan(0.8);
    });

    it('should order scores: clean > noisy > quiet > clipped', () => {
      const clean: AudioMetrics = { rmsLevelDb: -16, peakLevelDb: -6, noiseFloorDb: -36 };
      const noisy: AudioMetrics = { rmsLevelDb: -16, peakLevelDb: -6, noiseFloorDb: -21 };
      const quiet: AudioMetrics = { rmsLevelDb: -40, peakLevelDb: -20, noiseFloorDb: -60 };
      const clipped: AudioMetrics = { rmsLevelDb: -6, peakLevelDb: 0, noiseFloorDb: -16 };

      const cleanScore = computeAudioScore(clean);
      const noisyScore = computeAudioScore(noisy);
      const quietScore = computeAudioScore(quiet);
      const clippedScore = computeAudioScore(clipped);

      expect(cleanScore).toBeGreaterThan(noisyScore);
      expect(noisyScore).toBeGreaterThan(quietScore);
      expect(quietScore).toBeGreaterThan(clippedScore);
    });

    it('should return a value between 0 and 1', () => {
      const extreme: AudioMetrics = { rmsLevelDb: -80, peakLevelDb: 10, noiseFloorDb: -80 };
      const score = computeAudioScore(extreme);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  // ─── analyzeAudioQuality (async, mocked exec) ───────────────────

  describe('analyzeAudioQuality', () => {
    it('should parse ffprobe volumedetect output correctly', async () => {
      const ffprobeOutput = [
        '[Parsed_volumedetect_0 @ 0x1234] n_samples: 441000',
        '[Parsed_volumedetect_0 @ 0x1234] mean_volume: -18.5 dB',
        '[Parsed_volumedetect_0 @ 0x1234] max_volume: -3.2 dB',
      ].join('\n');

      mockExecFileResult(ffprobeOutput);

      const result = await analyzeAudioQuality('/tmp/test.wav');

      expect(result.rmsLevelDb).toBeCloseTo(-18.5);
      expect(result.peakLevelDb).toBeCloseTo(-3.2);
      // Noise floor heuristic: rms - 20
      expect(result.noiseFloorDb).toBeCloseTo(-38.5);
    });

    it('should fall back to ffmpeg when ffprobe fails', async () => {
      const ffmpegOutput = [
        '[Parsed_volumedetect_0 @ 0x5678] mean_volume: -22.0 dB',
        '[Parsed_volumedetect_0 @ 0x5678] max_volume: -8.0 dB',
      ].join('\n');

      let callCount = 0;
      (execFile as unknown as jest.Mock).mockImplementation(
        (cmd: string, _args: string[], _opts: unknown, cb?: (err: Error | null, result: { stdout: string; stderr: string }) => void) => {
          callCount++;
          const callback = typeof _opts === 'function'
            ? _opts as unknown as (err: Error | null, result: { stdout: string; stderr: string }) => void
            : cb;

          if (cmd === 'ffprobe') {
            // ffprobe fails
            callback!(new Error('ffprobe not found'), { stdout: '', stderr: '' });
          } else {
            // ffmpeg succeeds
            callback!(null, { stdout: '', stderr: ffmpegOutput });
          }
        },
      );

      const result = await analyzeAudioQuality('/tmp/test.wav');

      expect(result.rmsLevelDb).toBeCloseTo(-22.0);
      expect(result.peakLevelDb).toBeCloseTo(-8.0);
      expect(result.noiseFloorDb).toBeCloseTo(-42.0);
      // Both ffprobe and ffmpeg should have been called
      expect(callCount).toBe(2);
    });

    it('should return defaults when no volume data found in output', async () => {
      mockExecFileResult('some unrelated output with no volume info');

      const result = await analyzeAudioQuality('/tmp/test.wav');

      // Defaults per source: rmsLevelDb = -40, peakLevelDb = -20
      expect(result.rmsLevelDb).toBe(-40);
      expect(result.peakLevelDb).toBe(-20);
      expect(result.noiseFloorDb).toBe(-60); // -40 - 20
    });
  });
});
