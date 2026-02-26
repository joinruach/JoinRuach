import type { Core } from "@strapi/strapi";
import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execFileAsync = promisify(execFile);

import {
  analyzeAudioQuality,
  computeAudioScore,
  type AudioMetrics,
} from './audio-quality-analyzer';

/**
 * Phase 9: Auto-Sync Engine
 *
 * Uses BBC audio-offset-finder to detect time offsets between cameras.
 * Source: Phase 9 RESEARCH.md - Audio Correlation Pattern
 */

interface SyncResult {
  camera: string;
  offsetMs: number;
  confidence: number;
  classification: 'looks-good' | 'review-suggested' | 'needs-manual-nudge';
}

interface SyncEngineResult {
  sessionId: string;
  masterCamera: string;
  offsets: Record<string, number>;
  confidence: Record<string, number>;
  results: SyncResult[];
  allReliable: boolean;
}

export default {
  /**
   * Detect sync offsets for all cameras in a session
   *
   * @param sessionId - Recording session ID
   * @param strapi - Strapi instance
   * @param masterCamera - Optional master camera (defaults to anchorAngle or 'A')
   * @returns Sync results with offsets and confidence scores
   */
  async detectSync(
    sessionId: string,
    strapi: Core.Strapi,
    masterCamera?: string
  ): Promise<SyncEngineResult> {
    const tempDir = path.join(os.tmpdir(), `sync-${sessionId}-${Date.now()}`);

    try {
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 1. Load session with assets
      const session = await strapi.entityService.findOne(
        'api::recording-session.recording-session',
        sessionId,
        { populate: ['assets'] }
      ) as any;

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (!session.assets || session.assets.length < 2) {
        throw new Error(`Session ${sessionId} has fewer than 2 assets - sync requires multiple cameras`);
      }

      // 2. Determine master camera
      const master = masterCamera || session.anchorAngle || 'A';
      const masterAsset = session.assets.find((a: any) => a.angle === master);

      if (!masterAsset) {
        throw new Error(`Master camera ${master} not found in session assets`);
      }

      strapi.log.info(`[sync-engine] Session ${sessionId}: Master camera = ${master}`);

      // 3. Check if master has audio WAV
      if (!masterAsset.r2_audio_wav_url && !masterAsset.r2_original_url) {
        throw new Error(`Master camera ${master} has no audio URL`);
      }

      // Download master audio
      const masterAudioPath = await this._downloadAudio(
        masterAsset.r2_audio_wav_url || masterAsset.r2_original_url,
        tempDir,
        `master-${master}.wav`,
        strapi
      );

      // 4. Run correlation for each non-master camera
      const results: SyncResult[] = [];

      for (const asset of session.assets) {
        if (asset.angle === master) {
          // Master camera has offset = 0
          results.push({
            camera: asset.angle,
            offsetMs: 0,
            confidence: 100,
            classification: 'looks-good'
          });
          continue;
        }

        try {
          // Download comparison audio
          const comparisonAudioPath = await this._downloadAudio(
            asset.r2_audio_wav_url || asset.r2_original_url,
            tempDir,
            `camera-${asset.angle}.wav`,
            strapi
          );

          // Run audio-offset-finder
          strapi.log.info(`[sync-engine] Running correlation for camera ${asset.angle}`);

          const syncResult = await this._runAudioOffsetFinder(
            masterAudioPath,
            comparisonAudioPath,
            asset.angle,
            strapi
          );

          results.push(syncResult);

          strapi.log.info(
            `[sync-engine] Camera ${asset.angle}: offset=${syncResult.offsetMs}ms, confidence=${syncResult.confidence.toFixed(2)}, classification=${syncResult.classification}`
          );
        } catch (error) {
          // Camera sync failed - log but continue
          strapi.log.error(
            `[sync-engine] Failed to sync camera ${asset.angle}:`,
            error instanceof Error ? error.message : error
          );

          results.push({
            camera: asset.angle,
            offsetMs: 0,
            confidence: 0,
            classification: 'needs-manual-nudge'
          });
        }
      }

      // 5. Build offsets and confidence objects
      const offsets: Record<string, number> = {};
      const confidence: Record<string, number> = {};

      for (const result of results) {
        offsets[result.camera] = result.offsetMs;
        confidence[result.camera] = result.confidence;
      }

      // 6. Update session
      const allReliable = results.every(r => r.confidence >= 5); // All cameras above minimum threshold

      await strapi.entityService.update(
        'api::recording-session.recording-session',
        sessionId,
        {
          data: {
            syncOffsets_ms: offsets,
            syncConfidence: confidence,
            anchorAngle: master,
            status: 'needs-review',
            operatorStatus: 'pending'
          }
        }
      );

      strapi.log.info(
        `[sync-engine] Session ${sessionId} sync complete. Status: needs-review, All reliable: ${allReliable}`
      );

      return {
        sessionId,
        masterCamera: master,
        offsets,
        confidence,
        results,
        allReliable
      };

    } finally {
      // Cleanup temp directory
      if (fs.existsSync(tempDir)) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          strapi.log.warn(`[sync-engine] Failed to cleanup temp directory: ${tempDir}`);
        }
      }
    }
  },

  /**
   * Download audio file from R2 to temp location
   */
  async _downloadAudio(
    this: any,
    url: string,
    tempDir: string,
    fileName: string,
    strapi: Core.Strapi
  ): Promise<string> {
    const filePath = path.join(tempDir, fileName);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));

      return filePath;
    } catch (error) {
      throw new Error(
        `Failed to download audio from ${url}: ${error instanceof Error ? error.message : error}`
      );
    }
  },

  /**
   * Run BBC audio-offset-finder to detect time offset
   * Source: Phase 9 RESEARCH.md - Audio Correlation Pattern
   */
  async _runAudioOffsetFinder(
    this: any,
    masterAudioPath: string,
    comparisonAudioPath: string,
    cameraAngle: string,
    strapi: Core.Strapi
  ): Promise<SyncResult> {
    try {
      // Run audio-offset-finder with JSON output
      // Source: Phase 9 RESEARCH.md - BBC audio-offset-finder example
      const { stdout } = await execFileAsync('audio-offset-finder', [
        '--find-offset-of', comparisonAudioPath,
        '--within', masterAudioPath,
        '--json'
      ], {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for JSON output
      });

      const result = JSON.parse(stdout);

      // result.offset: time offset in seconds (can be negative)
      // result.standard_score: confidence (>10 = reliable, <5 = unreliable)

      const offsetMs = Math.round(result.offset * 1000); // Convert to milliseconds
      const confidence = result.standard_score;
      const classification = this._classifyConfidence(confidence);

      return {
        camera: cameraAngle,
        offsetMs,
        confidence,
        classification
      };
    } catch (error) {
      strapi.log.error(
        `[sync-engine] audio-offset-finder failed for camera ${cameraAngle}:`,
        error
      );

      // Check if audio-offset-finder is installed
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error(
          'audio-offset-finder not found. Install with: pip install audio-offset-finder'
        );
      }

      throw error;
    }
  },

  /**
   * Classify confidence score into operator action categories
   * Source: Phase 9 DECISIONS.md - D-09-006
   */
  _classifyConfidence(
    this: any,
    score: number
  ): 'looks-good' | 'review-suggested' | 'needs-manual-nudge' {
    if (score >= 10) return 'looks-good';
    if (score >= 5) return 'review-suggested';
    return 'needs-manual-nudge';
  },

  /**
   * Select master camera based on audio quality analysis via ffprobe.
   *
   * Scores each camera on: RMS loudness, peak level, noise floor.
   * Falls back to anchorAngle if analysis fails or scores are ambiguous.
   */
  async selectMasterCamera(
    this: any,
    sessionId: string,
    strapi: Core.Strapi
  ): Promise<string> {
    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId,
      { populate: ['assets'] }
    ) as any;

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const assets = session.assets || [];
    if (assets.length === 0) {
      return session.anchorAngle || 'A';
    }

    const tempDir = path.join(os.tmpdir(), `audio-quality-${sessionId}-${Date.now()}`);

    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const scores: Array<{ camera: string; score: number; metrics: AudioMetrics }> = [];

      for (const asset of assets) {
        const audioUrl = asset.r2_audio_wav_url || asset.r2_original_url;
        if (!audioUrl) {
          strapi.log.warn(`[sync-engine] Camera ${asset.angle} has no audio URL, skipping quality check`);
          continue;
        }

        try {
          const audioPath = await this._downloadAudio(audioUrl, tempDir, `quality-${asset.angle}.wav`, strapi);
          const metrics = await analyzeAudioQuality(audioPath);
          const score = computeAudioScore(metrics);

          scores.push({ camera: asset.angle, score, metrics });

          strapi.log.info(
            `[sync-engine] Camera ${asset.angle} audio score=${score.toFixed(2)} ` +
            `(rms=${metrics.rmsLevelDb.toFixed(1)}dB, peak=${metrics.peakLevelDb.toFixed(1)}dB, noise=${metrics.noiseFloorDb.toFixed(1)}dB)`
          );
        } catch (error) {
          strapi.log.warn(
            `[sync-engine] Audio quality analysis failed for camera ${asset.angle}:`,
            error instanceof Error ? error.message : error
          );
        }
      }

      if (scores.length === 0) {
        strapi.log.info(`[sync-engine] No audio scores available, falling back to anchorAngle`);
        return session.anchorAngle || 'A';
      }

      scores.sort((a, b) => b.score - a.score);
      const best = scores[0];
      const second = scores[1];

      // If top two scores are within 5% of each other, prefer the anchor angle for stability
      if (second && (best.score - second.score) / best.score < 0.05) {
        const anchorCamera = scores.find(s => s.camera === (session.anchorAngle || 'A'));
        if (anchorCamera) {
          strapi.log.info(
            `[sync-engine] Scores ambiguous (${best.camera}=${best.score.toFixed(2)} vs ${second.camera}=${second.score.toFixed(2)}), ` +
            `preferring anchor camera ${anchorCamera.camera}`
          );
          return anchorCamera.camera;
        }
      }

      strapi.log.info(`[sync-engine] Selected master camera: ${best.camera} (score=${best.score.toFixed(2)})`);
      return best.camera;
    } finally {
      if (fs.existsSync(tempDir)) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          strapi.log.warn(`[sync-engine] Failed to cleanup temp directory: ${tempDir}`);
        }
      }
    }
  }
};
