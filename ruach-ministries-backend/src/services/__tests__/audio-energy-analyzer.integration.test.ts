/**
 * Integration Test for Audio Energy Analyzer
 *
 * Runs the actual FFmpeg astats pipeline against a synthetic WAV fixture.
 * Fixture: 2s loud sine (-10dB) + 1s silence + 2s quiet sine (-20dB)
 *
 * Requires FFmpeg installed in the test environment.
 */

import * as path from 'path';
import { analyzeAudioEnergy, buildEnergyProfile } from '../audio-energy-analyzer';

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../__fixtures__/audio/energy-test.wav'
);

describe('Audio Energy Analyzer (integration)', () => {
  it('should produce non-empty windows from real FFmpeg output', async () => {
    const windows = await analyzeAudioEnergy(FIXTURE_PATH);

    // 5s at 500ms windows → expect ~10 windows
    expect(windows.length).toBeGreaterThanOrEqual(9);
    expect(windows.length).toBeLessThanOrEqual(11);

    // Every window should have valid structure
    for (const w of windows) {
      expect(w.startMs).toBeGreaterThanOrEqual(0);
      expect(w.endMs).toBeGreaterThan(w.startMs);
      expect(typeof w.rmsDb).toBe('number');
      expect(Number.isNaN(w.rmsDb)).toBe(false);
    }
  });

  it('should detect loud vs silent vs quiet segments', async () => {
    const windows = await analyzeAudioEnergy(FIXTURE_PATH);

    // First 4 windows (0-2s): loud sine (~-31dB RMS)
    const loudWindows = windows.slice(0, 4);
    for (const w of loudWindows) {
      expect(w.rmsDb).toBeGreaterThan(-35);
      expect(w.rmsDb).not.toBe(-Infinity);
    }

    // Window 4-5 (~2-3s): silence
    const silentWindow = windows[4];
    expect(silentWindow.rmsDb).toBe(-Infinity);

    // Windows 6-9 (3-5s): quiet sine (~-41dB RMS)
    const quietWindows = windows.slice(6, 9);
    for (const w of quietWindows) {
      expect(w.rmsDb).toBeLessThan(loudWindows[0].rmsDb);
      expect(w.rmsDb).not.toBe(-Infinity);
    }
  });

  it('should build a complete energy profile with normalization', async () => {
    const profile = await buildEnergyProfile('A', FIXTURE_PATH);

    expect(profile.camera).toBe('A');
    expect(profile.windowMs).toBe(500);
    expect(profile.windows.length).toBeGreaterThanOrEqual(9);

    // Peak should be from the loud segment (~-31dB)
    expect(profile.peakRmsDb).toBeGreaterThan(-35);

    // Normalized values should be 0-1
    for (const w of profile.windows) {
      expect(w.rmsLinear).toBeGreaterThanOrEqual(0);
      expect(w.rmsLinear).toBeLessThanOrEqual(1.01); // small float tolerance
    }

    // Loudest window should normalize close to 1.0
    const maxLinear = Math.max(...profile.windows.map((w) => w.rmsLinear));
    expect(maxLinear).toBeCloseTo(1.0, 1);
  });
});
