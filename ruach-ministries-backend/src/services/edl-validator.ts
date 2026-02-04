import type { CanonicalEDL, EDLValidationResult } from '../types/canonical-edl';

/**
 * Phase 11: EDL Validator
 *
 * Validates Canonical EDL structure and timing constraints
 */

export default class EDLValidator {
  /**
   * Validate a Canonical EDL
   *
   * @param edl - The EDL to validate
   * @param options - Validation options
   * @returns Validation result with errors and warnings
   */
  static validateEDL(
    edl: CanonicalEDL,
    options?: { minShotLengthMs?: number; maxShotLengthMs?: number }
  ): EDLValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const minShotLength = options?.minShotLengthMs || 2000;
    const maxShotLength = options?.maxShotLengthMs || 15000;

    // 1. Schema version check
    if (edl.schemaVersion !== '1.0') {
      errors.push(`Invalid schema version: ${edl.schemaVersion}. Expected "1.0".`);
    }

    // 2. Program track required
    if (!edl.tracks.program || edl.tracks.program.length === 0) {
      errors.push('Program track is required and must have at least one cut.');
    }

    // 3. Validate cuts
    if (edl.tracks.program && edl.tracks.program.length > 0) {
      const cuts = edl.tracks.program;
      const cutIds = new Set<string>();
      const validCameras = new Set(['A', 'B', 'C']);
      const cameraUsage = { A: 0, B: 0, C: 0 };

      for (let i = 0; i < cuts.length; i++) {
        const cut = cuts[i];

        // 3a. Valid camera
        if (!validCameras.has(cut.camera)) {
          errors.push(`Cut ${cut.id} has invalid camera: ${cut.camera}`);
        } else {
          cameraUsage[cut.camera as 'A' | 'B' | 'C']++;
        }

        // 3b. Unique ID
        if (cutIds.has(cut.id)) {
          errors.push(`Duplicate cut ID: ${cut.id}`);
        }
        cutIds.add(cut.id);

        // 3c. Valid timing
        if (cut.startMs < 0) {
          errors.push(`Cut ${cut.id} has negative start time: ${cut.startMs}`);
        }
        if (cut.endMs <= cut.startMs) {
          errors.push(`Cut ${cut.id} has invalid timing: end (${cut.endMs}) <= start (${cut.startMs})`);
        }
        if (cut.endMs > edl.durationMs) {
          errors.push(`Cut ${cut.id} extends beyond session duration: ${cut.endMs} > ${edl.durationMs}`);
        }

        // 3d. Shot length constraints
        const shotLength = cut.endMs - cut.startMs;
        if (shotLength < minShotLength) {
          warnings.push(`Cut ${cut.id} is very short (${shotLength}ms < ${minShotLength}ms)`);
        }
        if (shotLength > maxShotLength * 1.5) {
          warnings.push(`Cut ${cut.id} is very long (${shotLength}ms > ${maxShotLength * 1.5}ms)`);
        }

        // 3e. Sequential and non-overlapping
        if (i > 0) {
          const prevCut = cuts[i - 1];
          if (cut.startMs < prevCut.endMs) {
            errors.push(`Cut ${cut.id} overlaps with previous cut: starts at ${cut.startMs} before ${prevCut.id} ends at ${prevCut.endMs}`);
          }
          // Check for gaps (allow small gaps for trimming)
          const gap = cut.startMs - prevCut.endMs;
          if (gap > 1000) {
            warnings.push(`Large gap (${gap}ms) between cut ${prevCut.id} and ${cut.id}`);
          }
        }
      }

      // 3f. Camera usage warnings
      if (cameraUsage.A === 0) warnings.push('Camera A is never used');
      if (cameraUsage.B === 0) warnings.push('Camera B is never used');
      if (cameraUsage.C === 0) warnings.push('Camera C is never used');

      // 3g. High frequency switching detection
      const switchesPerMinute = cuts.length / (edl.durationMs / 60000);
      if (switchesPerMinute > 15) {
        warnings.push(`High frequency switching detected: ${switchesPerMinute.toFixed(1)} cuts per minute`);
      }
    }

    // 4. Validate sources
    if (!edl.sources || Object.keys(edl.sources).length === 0) {
      errors.push('Sources must contain at least one camera');
    } else {
      // Check all referenced cameras have sources
      const programCameras = new Set(edl.tracks.program.map(c => c.camera));
      programCameras.forEach(camera => {
        if (!edl.sources[camera]) {
          errors.push(`Camera ${camera} is used in program but not defined in sources`);
        }
      });

      // Validate source structure
      Object.entries(edl.sources).forEach(([camera, source]) => {
        if (typeof source.offsetMs !== 'number') {
          errors.push(`Source ${camera} has invalid offsetMs: ${source.offsetMs}`);
        }
        if (!source.assetId) {
          errors.push(`Source ${camera} is missing assetId`);
        }
      });
    }

    // 5. Validate chapters (if present)
    if (edl.tracks.chapters && edl.tracks.chapters.length > 0) {
      edl.tracks.chapters.forEach((chapter, i) => {
        if (chapter.startMs < 0 || chapter.startMs > edl.durationMs) {
          errors.push(`Chapter "${chapter.title}" has invalid start time: ${chapter.startMs}`);
        }
        if (!chapter.title || chapter.title.trim() === '') {
          errors.push(`Chapter at ${chapter.startMs}ms has empty title`);
        }
        // Check sequential order
        if (i > 0 && chapter.startMs < edl.tracks.chapters![i - 1].startMs) {
          warnings.push(`Chapter "${chapter.title}" is not in chronological order`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
