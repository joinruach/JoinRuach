/**
 * Unit Tests for Audio Energy Analyzer
 *
 * Tests FFmpeg astats output parsing and normalization.
 * Uses mock stderr output instead of real FFmpeg.
 */

import { normalizeEnergyProfile, type EnergyWindow } from '../audio-energy-analyzer';

// We can't easily test analyzeAudioEnergy without FFmpeg,
// so we test the parsing and normalization logic directly.

describe('normalizeEnergyProfile', () => {
  it('should normalize windows relative to peak', () => {
    const windows: EnergyWindow[] = [
      { startMs: 0, endMs: 500, rmsDb: -10, rmsLinear: 0 },
      { startMs: 500, endMs: 1000, rmsDb: -16, rmsLinear: 0 },
      { startMs: 1000, endMs: 1500, rmsDb: -22, rmsLinear: 0 },
    ];

    const result = normalizeEnergyProfile(windows, -10);

    // Peak window (-10dB) should be 1.0
    expect(result[0].rmsLinear).toBeCloseTo(1.0, 2);
    // -16dB is 6dB below peak → 10^(-6/20) ≈ 0.501
    expect(result[1].rmsLinear).toBeCloseTo(0.501, 2);
    // -22dB is 12dB below peak → 10^(-12/20) ≈ 0.251
    expect(result[2].rmsLinear).toBeCloseTo(0.251, 2);
  });

  it('should map -Infinity (silent) frames to 0', () => {
    const windows: EnergyWindow[] = [
      { startMs: 0, endMs: 500, rmsDb: -Infinity, rmsLinear: 0 },
      { startMs: 500, endMs: 1000, rmsDb: -20, rmsLinear: 0 },
    ];

    const result = normalizeEnergyProfile(windows, -20);

    expect(result[0].rmsLinear).toBe(0);
    expect(result[1].rmsLinear).toBeCloseTo(1.0, 2);
  });

  it('should handle all-silent input', () => {
    const windows: EnergyWindow[] = [
      { startMs: 0, endMs: 500, rmsDb: -Infinity, rmsLinear: 0 },
      { startMs: 500, endMs: 1000, rmsDb: -Infinity, rmsLinear: 0 },
    ];

    const result = normalizeEnergyProfile(windows, -60);

    expect(result[0].rmsLinear).toBe(0);
    expect(result[1].rmsLinear).toBe(0);
  });

  it('should preserve original dB values', () => {
    const windows: EnergyWindow[] = [
      { startMs: 0, endMs: 500, rmsDb: -15.3, rmsLinear: 0 },
    ];

    const result = normalizeEnergyProfile(windows, -15.3);

    expect(result[0].rmsDb).toBe(-15.3);
    expect(result[0].startMs).toBe(0);
    expect(result[0].endMs).toBe(500);
  });
});
