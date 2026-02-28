/**
 * D4 Integration Test: Full Energy Pipeline (D1 → D2 → D3)
 *
 * Validates the complete chain: WAV file → energy profiles → aligned matrix →
 * camera cuts → EDLValidator. Uses the real FFmpeg pipeline with synthetic
 * WAV fixtures to prove the wiring is correct end-to-end.
 *
 * Bypasses Strapi since the DB doesn't yet have r2_audio_wav_url populated.
 * When that field is seeded, replace this with a live session test.
 */

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { buildEnergyProfile } from '../audio-energy-analyzer';
import { buildEnergyMatrix } from '../energy-matrix-builder';
import EnergyCameraSwitcher from '../energy-camera-switcher';
import EDLValidator from '../edl-validator';
import type { CanonicalEDL } from '../../types/canonical-edl';

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../__fixtures__/audio/energy-test.wav'
);

// We reuse the same fixture for both "cameras" but with different
// sync offsets to simulate multicam. Camera A starts at 0, camera B
// is offset by 1000ms (as if it started recording 1 second later).
const SYNC_OFFSETS = { A: 0, B: 1000 };
const DURATION_MS = 5000;
const MASTER_CAMERA = 'A';

describe('Energy Pipeline E2E (D1 → D2 → D3 → Validator)', () => {
  let profileA: Awaited<ReturnType<typeof buildEnergyProfile>>;
  let profileB: Awaited<ReturnType<typeof buildEnergyProfile>>;

  beforeAll(async () => {
    // D1: Build energy profiles from real WAV via FFmpeg
    profileA = await buildEnergyProfile('A', FIXTURE_PATH);
    profileB = await buildEnergyProfile('B', FIXTURE_PATH);
  });

  it('D1: produces valid energy profiles from FFmpeg', () => {
    expect(profileA.camera).toBe('A');
    expect(profileB.camera).toBe('B');
    expect(profileA.windows.length).toBeGreaterThanOrEqual(9);
    expect(profileB.windows.length).toBeGreaterThanOrEqual(9);

    // All normalized values should be 0-1
    for (const w of [...profileA.windows, ...profileB.windows]) {
      expect(w.rmsLinear).toBeGreaterThanOrEqual(0);
      expect(w.rmsLinear).toBeLessThanOrEqual(1.01);
    }
  });

  it('D2: builds aligned energy matrix with sync offsets', () => {
    const matrix = buildEnergyMatrix(
      [profileA, profileB],
      SYNC_OFFSETS,
      DURATION_MS
    );

    expect(matrix.cameras).toEqual(['A', 'B']);
    expect(matrix.windowCount).toBe(10); // 5000ms / 500ms
    expect(matrix.matrix['A'].length).toBe(10);
    expect(matrix.matrix['B'].length).toBe(10);

    // Camera B offset by 1000ms → first 2 windows should be 0
    expect(matrix.matrix['B'][0]).toBe(0);
    expect(matrix.matrix['B'][1]).toBe(0);
    // But later windows should have energy
    const bHasEnergy = matrix.matrix['B'].some((v) => v > 0);
    expect(bHasEnergy).toBe(true);
  });

  it('D3: generates non-empty cuts from the energy matrix', () => {
    const matrix = buildEnergyMatrix(
      [profileA, profileB],
      SYNC_OFFSETS,
      DURATION_MS
    );

    const cuts = EnergyCameraSwitcher.generateCuts(
      matrix,
      MASTER_CAMERA
    );

    expect(cuts.length).toBeGreaterThanOrEqual(1);

    // All cuts should have required fields
    for (const cut of cuts) {
      expect(cut.id).toBeTruthy();
      expect(cut.startMs).toBeGreaterThanOrEqual(0);
      expect(cut.endMs).toBeGreaterThan(cut.startMs);
      expect(['A', 'B']).toContain(cut.camera);
      expect(typeof cut.confidence).toBe('number');
      expect(cut.confidence).toBeGreaterThanOrEqual(0);
      expect(cut.confidence).toBeLessThanOrEqual(1);
    }

    // Cuts should be monotonically ordered
    for (let i = 1; i < cuts.length; i++) {
      expect(cuts[i].startMs).toBe(cuts[i - 1].endMs);
    }

    // First cut should start at 0, last should end at total duration
    expect(cuts[0].startMs).toBe(0);
    expect(cuts[cuts.length - 1].endMs).toBe(
      matrix.windowCount * matrix.windowMs
    );
  });

  it('D4: assembled CanonicalEDL passes EDLValidator', () => {
    const matrix = buildEnergyMatrix(
      [profileA, profileB],
      SYNC_OFFSETS,
      DURATION_MS
    );

    const programCuts = EnergyCameraSwitcher.generateCuts(
      matrix,
      MASTER_CAMERA
    );

    const edl: CanonicalEDL = {
      schemaVersion: '1.0',
      sessionId: 'test-session-energy',
      masterCamera: MASTER_CAMERA as 'A' | 'B' | 'C',
      durationMs: DURATION_MS,
      tracks: {
        program: programCuts,
      },
      sources: {
        A: { assetId: 'asset-a', offsetMs: 0 },
        B: { assetId: 'asset-b', offsetMs: 1000 },
      },
      metrics: {
        cutCount: programCuts.length,
        avgShotLenMs:
          programCuts.reduce((s, c) => s + (c.endMs - c.startMs), 0) /
          programCuts.length,
        confidence:
          programCuts.reduce((s, c) => s + (c.confidence || 0), 0) /
          programCuts.length,
      },
    };

    const validation = EDLValidator.validateEDL(edl, {});

    expect(validation.errors).toEqual([]);
    expect(validation.valid).toBe(true);
  });
});
