/**
 * Transcript Utility Tests
 *
 * Unit tests for timestamp formatting/parsing, SRT/VTT generation,
 * and confidence classification helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  formatTimestamp,
  parseTimestamp,
  generateSRT,
  generateVTT,
  getConfidenceColor,
  getConfidenceLabel,
  type TranscriptSegment,
} from '../transcript';

// ==========================================
// formatTimestamp
// ==========================================
describe('formatTimestamp', () => {
  it('should format zero milliseconds', () => {
    expect(formatTimestamp(0)).toBe('0:00.000');
  });

  it('should format sub-minute timestamps', () => {
    expect(formatTimestamp(5000)).toBe('0:05.000');
    expect(formatTimestamp(59999)).toBe('0:59.999');
  });

  it('should format multi-minute timestamps', () => {
    expect(formatTimestamp(60000)).toBe('1:00.000');
    expect(formatTimestamp(125500)).toBe('2:05.500');
  });

  it('should include hours when >= 3600s', () => {
    expect(formatTimestamp(3600000)).toBe('1:00:00.000');
    expect(formatTimestamp(7261500)).toBe('2:01:01.500');
  });

  it('should handle millisecond precision', () => {
    expect(formatTimestamp(1)).toBe('0:00.001');
    expect(formatTimestamp(10)).toBe('0:00.010');
    expect(formatTimestamp(100)).toBe('0:00.100');
  });
});

// ==========================================
// parseTimestamp
// ==========================================
describe('parseTimestamp', () => {
  it('should parse MM:SS.mmm format', () => {
    expect(parseTimestamp('0:05.000')).toBe(5000);
    expect(parseTimestamp('2:05.500')).toBe(125500);
  });

  it('should parse HH:MM:SS.mmm format', () => {
    expect(parseTimestamp('1:00:00.000')).toBe(3600000);
    expect(parseTimestamp('2:01:01.500')).toBe(7261500);
  });

  it('should handle missing milliseconds', () => {
    expect(parseTimestamp('1:30')).toBe(90000);
  });

  it('should return 0 for invalid format', () => {
    expect(parseTimestamp('invalid')).toBe(0);
  });

  it('should roundtrip with formatTimestamp for sub-hour', () => {
    const ms = 125500;
    expect(parseTimestamp(formatTimestamp(ms))).toBe(ms);
  });

  it('should roundtrip with formatTimestamp for multi-hour', () => {
    const ms = 7261500;
    expect(parseTimestamp(formatTimestamp(ms))).toBe(ms);
  });
});

// ==========================================
// generateSRT
// ==========================================
describe('generateSRT', () => {
  const segments: TranscriptSegment[] = [
    { id: '1', speaker: 'A', startMs: 0, endMs: 5000, text: 'Hello world' },
    { id: '2', speaker: 'B', startMs: 5000, endMs: 10000, text: 'Good morning' },
  ];

  it('should generate valid SRT format', () => {
    const srt = generateSRT(segments);
    const lines = srt.split('\n');

    // First subtitle block
    expect(lines[0]).toBe('1');
    expect(lines[1]).toBe('00:00:00,000 --> 00:00:05,000');
    expect(lines[2]).toBe('Hello world');
    expect(lines[3]).toBe('');

    // Second subtitle block
    expect(lines[4]).toBe('2');
    expect(lines[5]).toBe('00:00:05,000 --> 00:00:10,000');
    expect(lines[6]).toBe('Good morning');
  });

  it('should use comma separator for SRT timecodes', () => {
    const srt = generateSRT(segments);
    expect(srt).toContain(',000');
    expect(srt).not.toContain('.000');
  });

  it('should handle empty segments', () => {
    const srt = generateSRT([]);
    expect(srt).toBe('');
  });

  it('should handle single segment', () => {
    const srt = generateSRT([segments[0]]);
    expect(srt).toContain('1\n');
    expect(srt).toContain('Hello world');
  });

  it('should sort segments by start time', () => {
    const unordered: TranscriptSegment[] = [
      { id: '2', startMs: 5000, endMs: 10000, text: 'Second' },
      { id: '1', startMs: 0, endMs: 5000, text: 'First' },
    ];
    const srt = generateSRT(unordered);
    const lines = srt.split('\n');
    expect(lines[2]).toBe('First');
  });

  it('should clamp overlapping segments', () => {
    const overlapping: TranscriptSegment[] = [
      { id: '1', startMs: 0, endMs: 8000, text: 'First' },
      { id: '2', startMs: 5000, endMs: 10000, text: 'Second' },
    ];
    const srt = generateSRT(overlapping);
    // First segment end should be clamped to second segment start
    expect(srt).toContain('00:00:00,000 --> 00:00:05,000');
  });

  it('should enforce minimum 100ms duration', () => {
    const short: TranscriptSegment[] = [
      { id: '1', startMs: 1000, endMs: 1010, text: 'Too short' },
    ];
    const srt = generateSRT(short);
    // Should enforce at least 100ms
    expect(srt).toContain('00:00:01,000 --> 00:00:01,100');
  });

  it('should handle hour-long content', () => {
    const hourMark: TranscriptSegment[] = [
      { id: '1', startMs: 3600000, endMs: 3605000, text: 'One hour in' },
    ];
    const srt = generateSRT(hourMark);
    expect(srt).toContain('01:00:00,000 --> 01:00:05,000');
  });
});

// ==========================================
// generateVTT
// ==========================================
describe('generateVTT', () => {
  const segments: TranscriptSegment[] = [
    { id: '1', speaker: 'A', startMs: 0, endMs: 5000, text: 'Hello world' },
    { id: '2', speaker: 'B', startMs: 5000, endMs: 10000, text: 'Good morning' },
  ];

  it('should start with WEBVTT header', () => {
    const vtt = generateVTT(segments);
    expect(vtt.startsWith('WEBVTT')).toBe(true);
  });

  it('should use dot separator for VTT timecodes', () => {
    const vtt = generateVTT(segments);
    // VTT uses dots, not commas
    expect(vtt).toContain('00:00:00.000 --> 00:00:05.000');
  });

  it('should generate valid VTT cues', () => {
    const vtt = generateVTT(segments);
    const lines = vtt.split('\n');

    expect(lines[0]).toBe('WEBVTT');
    expect(lines[1]).toBe('');
    expect(lines[2]).toBe('1');
    expect(lines[3]).toBe('00:00:00.000 --> 00:00:05.000');
    expect(lines[4]).toBe('Hello world');
  });

  it('should handle empty segments', () => {
    const vtt = generateVTT([]);
    expect(vtt).toBe('WEBVTT');
  });
});

// ==========================================
// getConfidenceColor
// ==========================================
describe('getConfidenceColor', () => {
  it('should return green for high confidence (>= 0.9)', () => {
    expect(getConfidenceColor(0.95)).toBe('bg-green-500');
    expect(getConfidenceColor(0.9)).toBe('bg-green-500');
    expect(getConfidenceColor(1.0)).toBe('bg-green-500');
  });

  it('should return yellow for medium confidence (>= 0.7)', () => {
    expect(getConfidenceColor(0.8)).toBe('bg-yellow-500');
    expect(getConfidenceColor(0.7)).toBe('bg-yellow-500');
  });

  it('should return red for low confidence (< 0.7)', () => {
    expect(getConfidenceColor(0.5)).toBe('bg-red-500');
    expect(getConfidenceColor(0.1)).toBe('bg-red-500');
  });

  it('should return gray for undefined confidence', () => {
    expect(getConfidenceColor(undefined)).toBe('bg-gray-300');
  });

  it('should return gray for zero confidence', () => {
    expect(getConfidenceColor(0)).toBe('bg-gray-300');
  });
});

// ==========================================
// getConfidenceLabel
// ==========================================
describe('getConfidenceLabel', () => {
  it('should return "High" for >= 0.9', () => {
    expect(getConfidenceLabel(0.95)).toBe('High');
    expect(getConfidenceLabel(0.9)).toBe('High');
  });

  it('should return "Medium" for >= 0.7', () => {
    expect(getConfidenceLabel(0.8)).toBe('Medium');
    expect(getConfidenceLabel(0.7)).toBe('Medium');
  });

  it('should return "Low" for < 0.7', () => {
    expect(getConfidenceLabel(0.5)).toBe('Low');
  });

  it('should return "Unknown" for undefined', () => {
    expect(getConfidenceLabel(undefined)).toBe('Unknown');
  });
});
