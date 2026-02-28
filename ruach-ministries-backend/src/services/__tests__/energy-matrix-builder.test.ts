/**
 * Unit Tests for Energy Matrix Builder
 *
 * Verifies sync offset alignment and unified grid construction.
 */

import { buildEnergyMatrix, type EnergyMatrix } from '../energy-matrix-builder';
import type { EnergyProfile } from '../audio-energy-analyzer';

function makeProfile(
  camera: string,
  energies: number[],
  windowMs = 500
): EnergyProfile {
  return {
    camera,
    windowMs,
    windows: energies.map((rmsLinear, i) => ({
      startMs: i * windowMs,
      endMs: (i + 1) * windowMs,
      rmsDb: rmsLinear > 0 ? 20 * Math.log10(rmsLinear) : -Infinity,
      rmsLinear,
    })),
    peakRmsDb: -10,
    meanRmsDb: -20,
  };
}

describe('buildEnergyMatrix', () => {
  it('should build matrix with zero offsets', () => {
    const profiles = [
      makeProfile('A', [0.8, 0.5, 0.3]),
      makeProfile('B', [0.2, 0.9, 0.1]),
    ];

    const matrix = buildEnergyMatrix(
      profiles,
      { A: 0, B: 0 },
      1500
    );

    expect(matrix.cameras).toEqual(['A', 'B']);
    expect(matrix.windowCount).toBe(3);
    expect(matrix.matrix['A']).toEqual([0.8, 0.5, 0.3]);
    expect(matrix.matrix['B']).toEqual([0.2, 0.9, 0.1]);
  });

  it('should shift windows by positive sync offset', () => {
    // Camera B started 500ms later → offset = 500
    const profiles = [
      makeProfile('A', [0.8, 0.5, 0.3]),
      makeProfile('B', [0.9, 0.7]),
    ];

    const matrix = buildEnergyMatrix(
      profiles,
      { A: 0, B: 500 },
      1500
    );

    // B's window 0 (0-500ms local) → 500-1000ms master → index 1
    // B's window 1 (500-1000ms local) → 1000-1500ms master → index 2
    expect(matrix.matrix['A']).toEqual([0.8, 0.5, 0.3]);
    expect(matrix.matrix['B']).toEqual([0, 0.9, 0.7]);
  });

  it('should shift windows by negative sync offset', () => {
    // Camera C started 500ms earlier → offset = -500
    const profiles = [
      makeProfile('A', [0.8, 0.5]),
      makeProfile('C', [0.1, 0.9, 0.7]),
    ];

    const matrix = buildEnergyMatrix(
      profiles,
      { A: 0, C: -500 },
      1000
    );

    // C's window 0 (0-500ms local) → -500ms master → index -1 → out of bounds
    // C's window 1 (500-1000ms local) → 0ms master → index 0
    // C's window 2 (1000-1500ms local) → 500ms master → index 1
    expect(matrix.matrix['A']).toEqual([0.8, 0.5]);
    expect(matrix.matrix['C']).toEqual([0.9, 0.7]);
  });

  it('should fill missing windows with 0', () => {
    const profiles = [makeProfile('A', [0.5])];

    const matrix = buildEnergyMatrix(
      profiles,
      { A: 0 },
      2000 // 4 windows but only 1 in profile
    );

    expect(matrix.windowCount).toBe(4);
    expect(matrix.matrix['A']).toEqual([0.5, 0, 0, 0]);
  });

  it('should handle empty profiles', () => {
    const matrix = buildEnergyMatrix([], {}, 1000);

    expect(matrix.cameras).toEqual([]);
    expect(matrix.windowCount).toBe(2);
  });
});
