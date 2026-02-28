/**
 * Unit Tests for Energy Camera Switcher
 *
 * Verifies cut generation from energy matrices including
 * speaker dominance, silence detection, and timing constraints.
 */

import EnergyCameraSwitcher from '../energy-camera-switcher';
import type { EnergyMatrix } from '../energy-matrix-builder';

function makeMatrix(
  cameras: string[],
  data: Record<string, number[]>,
  windowMs = 500
): EnergyMatrix {
  const firstCam = cameras[0];
  const windowCount = data[firstCam]?.length ?? 0;
  return {
    cameras,
    windowMs,
    windowCount,
    durationMs: windowCount * windowMs,
    matrix: data,
  };
}

// Helper: create linear values from dB (relative to 0 dB peak)
function dbToLinear(db: number): number {
  if (db === -Infinity) return 0;
  return Math.pow(10, db / 20);
}

describe('EnergyCameraSwitcher', () => {
  describe('speaker dominance', () => {
    it('should switch to loudest camera when lead >= threshold', () => {
      // Camera A is 10dB louder than B for the entire duration
      // 12 windows = 6000ms (enough for minShotLength of 2000ms)
      const aEnergy = dbToLinear(-10);
      const bEnergy = dbToLinear(-20);

      const matrix = makeMatrix(
        ['A', 'B'],
        {
          A: new Array(12).fill(aEnergy),
          B: new Array(12).fill(bEnergy),
        }
      );

      const cuts = EnergyCameraSwitcher.generateCuts(matrix, 'B');

      // Should switch from B to A. The closing B cut gets 'speaker' reason
      // (why we left B), and then A is the active camera.
      expect(cuts.length).toBeGreaterThanOrEqual(2);
      const bCut = cuts.find((c) => c.camera === 'B');
      expect(bCut).toBeDefined();
      expect(bCut?.reason).toBe('speaker');
      // Verify A is now active
      const aCut = cuts.find((c) => c.camera === 'A');
      expect(aCut).toBeDefined();
    });

    it('should stay on current camera when lead < threshold', () => {
      // Camera A is only 3dB louder (below 6dB threshold)
      const aEnergy = dbToLinear(-10);
      const bEnergy = dbToLinear(-13);

      const matrix = makeMatrix(
        ['A', 'B'],
        {
          A: new Array(12).fill(aEnergy),
          B: new Array(12).fill(bEnergy),
        }
      );

      const cuts = EnergyCameraSwitcher.generateCuts(matrix, 'A');

      // Should stay on A — ambiguous situation
      expect(cuts.length).toBe(1);
      expect(cuts[0].camera).toBe('A');
    });
  });

  describe('silence detection', () => {
    it('should switch to wide camera during silence', () => {
      // First 6 windows: A is loud, then 6 windows: all silent
      const loud = dbToLinear(-10);
      const silent = dbToLinear(-50); // below -40dB threshold

      const matrix = makeMatrix(
        ['A', 'B', 'C'],
        {
          A: [...new Array(6).fill(loud), ...new Array(6).fill(silent)],
          B: new Array(12).fill(silent),
          C: new Array(12).fill(silent),
        }
      );

      const cuts = EnergyCameraSwitcher.generateCuts(matrix, 'A');

      // When silence starts, the closing A cut gets 'wide' reason
      // and then C becomes the active camera for the final cut
      const wideCut = cuts.find((c) => c.reason === 'wide');
      expect(wideCut).toBeDefined();
      // C should appear in the cuts (either as mid-cut or final)
      const cCut = cuts.find((c) => c.camera === 'C');
      expect(cCut).toBeDefined();
    });
  });

  describe('timing constraints', () => {
    it('should respect minimum shot length', () => {
      // Alternating energy every 500ms — too fast for 2000ms min shot
      const matrix = makeMatrix(
        ['A', 'B'],
        {
          A: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
          B: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        }
      );

      const cuts = EnergyCameraSwitcher.generateCuts(matrix, 'A', {
        minShotLengthMs: 2000,
      });

      // No cut should be shorter than 2000ms
      for (const cut of cuts) {
        expect(cut.endMs - cut.startMs).toBeGreaterThanOrEqual(2000);
      }
    });

    it('should force switch at max shot length', () => {
      // Single camera loud for 20 seconds (40 windows)
      const matrix = makeMatrix(
        ['A', 'B'],
        {
          A: new Array(40).fill(1),
          B: new Array(40).fill(0),
        }
      );

      const cuts = EnergyCameraSwitcher.generateCuts(matrix, 'A', {
        maxShotLengthMs: 15000,
      });

      // Should force a switch around 15 seconds
      expect(cuts.length).toBeGreaterThan(1);
      const firstCut = cuts[0];
      expect(firstCut.endMs).toBeLessThanOrEqual(15500); // within one window
    });
  });

  describe('confidence values', () => {
    it('should assign higher confidence for larger energy lead', () => {
      // 12dB lead → confidence = clamp(12/12, 0.5, 1.0) = 1.0
      const aEnergy = dbToLinear(-10);
      const bEnergy = dbToLinear(-22);

      const matrix = makeMatrix(
        ['A', 'B'],
        {
          A: new Array(12).fill(aEnergy),
          B: new Array(12).fill(bEnergy),
        }
      );

      const cuts = EnergyCameraSwitcher.generateCuts(matrix, 'B');
      const speakerCut = cuts.find((c) => c.reason === 'speaker');

      expect(speakerCut).toBeDefined();
      expect(speakerCut!.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should assign 0.6 confidence for forced max-length switches', () => {
      const matrix = makeMatrix(
        ['A', 'B'],
        {
          A: new Array(40).fill(1),
          B: new Array(40).fill(0),
        }
      );

      const cuts = EnergyCameraSwitcher.generateCuts(matrix, 'A', {
        maxShotLengthMs: 15000,
      });

      const forcedCut = cuts.find((c) => c.reason === 'emphasis');
      expect(forcedCut).toBeDefined();
      expect(forcedCut!.confidence).toBe(0.6);
    });
  });

  describe('edge cases', () => {
    it('should handle empty matrix', () => {
      const matrix = makeMatrix([], {});
      const cuts = EnergyCameraSwitcher.generateCuts(matrix, 'A');
      expect(cuts).toEqual([]);
    });

    it('should handle single-camera matrix', () => {
      const matrix = makeMatrix(
        ['A'],
        { A: [0.5, 0.5, 0.5, 0.5] }
      );

      const cuts = EnergyCameraSwitcher.generateCuts(matrix, 'A');
      expect(cuts.length).toBe(1);
      expect(cuts[0].camera).toBe('A');
    });
  });
});
