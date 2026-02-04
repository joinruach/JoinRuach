import { randomUUID } from 'crypto';
import type { Cut, EDLGenerationOptions } from '../types/canonical-edl';
import type { TranscriptSegment } from './transcription-service';

/**
 * Phase 11: Camera Switcher
 *
 * Rules-based camera selection with timing constraints
 */

export default class CameraSwitcher {
  /**
   * Generate camera cuts from aligned transcripts
   *
   * @param alignedTranscripts - Transcript segments per camera
   * @param sessionId - Session identifier
   * @param masterCamera - Master camera (time=0 reference)
   * @param durationMs - Total session duration
   * @param options - Generation options
   * @returns Array of cuts for program track
   */
  static generateCuts(
    alignedTranscripts: Record<string, TranscriptSegment[]>,
    sessionId: string,
    masterCamera: string,
    durationMs: number,
    options?: Partial<EDLGenerationOptions>
  ): Cut[] {
    const minShotLengthMs = options?.minShotLengthMs || 2000;
    const maxShotLengthMs = options?.maxShotLengthMs || 15000;
    const switchCooldownMs = options?.switchCooldownMs || 1500;

    const cuts: Cut[] = [];
    let currentCamera: 'A' | 'B' | 'C' = masterCamera as 'A' | 'B' | 'C';
    let currentCutStart = 0;
    let lastSwitchTime = 0;

    // Get master transcript for timeline reference
    const masterTranscript = alignedTranscripts[masterCamera];
    if (!masterTranscript || masterTranscript.length === 0) {
      // No transcript, create single cut on master camera
      return [{
        id: randomUUID(),
        startMs: 0,
        endMs: durationMs,
        camera: currentCamera,
        reason: 'operator',
        confidence: 0.5
      }];
    }

    // Process transcript chronologically
    for (let i = 0; i < masterTranscript.length; i++) {
      const segment = masterTranscript[i];
      const segmentStart = segment.start;
      const segmentEnd = segment.end;

      // Determine preferred camera for this segment
      const preferredCamera = this.selectCameraForSegment(segment);

      // Check if we should switch cameras
      const shouldSwitch = this.shouldSwitchCamera(
        currentCamera,
        preferredCamera,
        segmentStart,
        currentCutStart,
        lastSwitchTime,
        minShotLengthMs,
        maxShotLengthMs,
        switchCooldownMs
      );

      if (shouldSwitch && segmentStart > currentCutStart) {
        // Close current cut
        cuts.push({
          id: randomUUID(),
          startMs: currentCutStart,
          endMs: segmentStart,
          camera: currentCamera,
          reason: this.getCutReason(currentCamera, segment),
          confidence: this.calculateCutConfidence(segment)
        });

        // Start new cut
        currentCamera = preferredCamera;
        currentCutStart = segmentStart;
        lastSwitchTime = segmentStart;
      }

      // Check if current cut exceeds max length
      const currentCutLength = segmentEnd - currentCutStart;
      if (currentCutLength > maxShotLengthMs && segmentEnd < durationMs) {
        // Force switch at segment boundary
        cuts.push({
          id: randomUUID(),
          startMs: currentCutStart,
          endMs: segmentEnd,
          camera: currentCamera,
          reason: 'emphasis',
          confidence: 0.8
        });

        // Switch to different camera
        currentCamera = this.getNextCamera(currentCamera);
        currentCutStart = segmentEnd;
        lastSwitchTime = segmentEnd;
      }
    }

    // Close final cut
    if (currentCutStart < durationMs) {
      cuts.push({
        id: randomUUID(),
        startMs: currentCutStart,
        endMs: durationMs,
        camera: currentCamera,
        reason: 'operator',
        confidence: 0.9
      });
    }

    return cuts;
  }

  /**
   * Select camera for a transcript segment based on speaker
   *
   * Simple v1 mapping:
   * - Speaker A → Camera A
   * - Speaker B → Camera B
   * - Speaker C or Unknown → Camera C (wide)
   */
  private static selectCameraForSegment(segment: TranscriptSegment): 'A' | 'B' | 'C' {
    const speaker = segment.speaker?.toUpperCase();

    if (speaker === 'SPEAKER A' || speaker === 'A') {
      return 'A';
    } else if (speaker === 'SPEAKER B' || speaker === 'B') {
      return 'B';
    } else {
      // Unknown speaker or Speaker C → wide shot
      return 'C';
    }
  }

  /**
   * Determine if camera should switch based on timing constraints
   */
  private static shouldSwitchCamera(
    currentCamera: 'A' | 'B' | 'C',
    preferredCamera: 'A' | 'B' | 'C',
    segmentStart: number,
    currentCutStart: number,
    lastSwitchTime: number,
    minShotLengthMs: number,
    maxShotLengthMs: number,
    switchCooldownMs: number
  ): boolean {
    // Don't switch if already on preferred camera
    if (currentCamera === preferredCamera) {
      return false;
    }

    // Don't switch if within cooldown period
    const timeSinceLastSwitch = segmentStart - lastSwitchTime;
    if (timeSinceLastSwitch < switchCooldownMs) {
      return false;
    }

    // Don't switch if current shot is too short
    const currentShotLength = segmentStart - currentCutStart;
    if (currentShotLength < minShotLengthMs) {
      return false;
    }

    // Force switch if current shot exceeds max length
    if (currentShotLength >= maxShotLengthMs) {
      return true;
    }

    // Switch if different speaker and timing constraints met
    return true;
  }

  /**
   * Get the next camera in rotation (for forced switches)
   */
  private static getNextCamera(currentCamera: 'A' | 'B' | 'C'): 'A' | 'B' | 'C' {
    if (currentCamera === 'A') return 'B';
    if (currentCamera === 'B') return 'C';
    return 'A';
  }

  /**
   * Determine cut reason based on camera and segment
   */
  private static getCutReason(
    camera: 'A' | 'B' | 'C',
    segment: TranscriptSegment
  ): 'speaker' | 'reaction' | 'wide' | 'emphasis' | 'operator' {
    const speaker = segment.speaker?.toUpperCase();

    if (camera === 'C') {
      return 'wide';
    }

    if (speaker === `SPEAKER ${camera}` || speaker === camera) {
      return 'speaker';
    }

    return 'reaction';
  }

  /**
   * Calculate confidence for a cut based on transcript confidence
   */
  private static calculateCutConfidence(segment: TranscriptSegment): number {
    if (!segment.words || segment.words.length === 0) {
      return 0.5;
    }

    // Average word confidence
    const avgConfidence = segment.words.reduce((sum, word) => sum + word.confidence, 0) / segment.words.length;

    // Boost confidence if segment has clear boundaries (longer duration)
    const duration = segment.end - segment.start;
    const durationBoost = Math.min(duration / 5000, 0.2); // Max 0.2 boost for 5+ second segments

    return Math.min(avgConfidence + durationBoost, 1.0);
  }
}
