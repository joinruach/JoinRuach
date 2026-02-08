/**
 * Sync Utility Tests
 *
 * Unit tests for sync confidence classification and UI helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  classifySyncConfidence,
  getSyncConfidenceLabel,
  getSyncConfidenceColor,
} from '../sync';

// ==========================================
// classifySyncConfidence
// ==========================================
describe('classifySyncConfidence', () => {
  it('should classify >= 10 as looks-good', () => {
    expect(classifySyncConfidence(10)).toBe('looks-good');
    expect(classifySyncConfidence(15)).toBe('looks-good');
    expect(classifySyncConfidence(100)).toBe('looks-good');
  });

  it('should classify >= 5 and < 10 as review-suggested', () => {
    expect(classifySyncConfidence(5)).toBe('review-suggested');
    expect(classifySyncConfidence(7)).toBe('review-suggested');
    expect(classifySyncConfidence(9.99)).toBe('review-suggested');
  });

  it('should classify < 5 as needs-manual-nudge', () => {
    expect(classifySyncConfidence(4.99)).toBe('needs-manual-nudge');
    expect(classifySyncConfidence(0)).toBe('needs-manual-nudge');
    expect(classifySyncConfidence(-1)).toBe('needs-manual-nudge');
  });

  it('should handle exact boundary values', () => {
    expect(classifySyncConfidence(10)).toBe('looks-good');
    expect(classifySyncConfidence(5)).toBe('review-suggested');
    expect(classifySyncConfidence(4.999)).toBe('needs-manual-nudge');
  });
});

// ==========================================
// getSyncConfidenceLabel
// ==========================================
describe('getSyncConfidenceLabel', () => {
  it('should return correct label for looks-good', () => {
    expect(getSyncConfidenceLabel('looks-good')).toContain('Looks Good');
  });

  it('should return correct label for review-suggested', () => {
    expect(getSyncConfidenceLabel('review-suggested')).toContain('Review Suggested');
  });

  it('should return correct label for needs-manual-nudge', () => {
    expect(getSyncConfidenceLabel('needs-manual-nudge')).toContain('Manual Nudge');
  });
});

// ==========================================
// getSyncConfidenceColor
// ==========================================
describe('getSyncConfidenceColor', () => {
  it('should return green classes for looks-good', () => {
    const color = getSyncConfidenceColor('looks-good');
    expect(color).toContain('green');
  });

  it('should return yellow classes for review-suggested', () => {
    const color = getSyncConfidenceColor('review-suggested');
    expect(color).toContain('yellow');
  });

  it('should return red classes for needs-manual-nudge', () => {
    const color = getSyncConfidenceColor('needs-manual-nudge');
    expect(color).toContain('red');
  });

  it('should include dark mode variants', () => {
    const color = getSyncConfidenceColor('looks-good');
    expect(color).toContain('dark:');
  });
});
