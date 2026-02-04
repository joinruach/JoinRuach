/**
 * Phase 13 Plan 2: Render Preflight Validator
 *
 * Validates all prerequisites before starting render
 */

import type { Core } from '@strapi/strapi';

export interface PreflightResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export default class RenderPreflight {
  /**
   * Validate all prerequisites for rendering
   */
  static async validate(
    strapi: Core.Strapi,
    renderJobId: string
  ): Promise<PreflightResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get render job
      const jobs = await strapi.entityService.findMany('api::render-job.render-job', {
        filters: { jobId: renderJobId },
        populate: ['recordingSession', 'edl'] as any,
        limit: 1,
      }) as any[];

      if (!jobs || jobs.length === 0) {
        errors.push(`Render job ${renderJobId} not found`);
        return { valid: false, errors, warnings };
      }

      const job = jobs[0];

      // Validate recording session
      if (!job.recordingSession) {
        errors.push('Recording session not found');
        return { valid: false, errors, warnings };
      }

      const session = job.recordingSession;

      // Validate EDL
      if (!job.edl) {
        errors.push('EDL not found');
      } else if (job.edl.status !== 'locked') {
        errors.push(`EDL status is ${job.edl.status}, must be locked`);
      }

      // Validate assets exist
      const assets = await strapi.entityService.findMany('api::asset.asset' as any, {
        filters: {
          recordingSession: session.id,
        },
      }) as any[];

      if (!assets || assets.length === 0) {
        errors.push('No assets found for session');
      } else {
        // Validate mezzanine URLs exist
        const cameraSources: Record<string, string> = {};
        for (const asset of assets) {
          if (asset.angle && asset.r2_video_prores_url) {
            cameraSources[asset.angle] = asset.r2_video_prores_url;
          }
        }

        if (Object.keys(cameraSources).length === 0) {
          errors.push('No mezzanine URLs found in assets');
        }

        // Check for master camera
        const masterCamera = session.anchorAngle || 'A';
        if (!cameraSources[masterCamera]) {
          errors.push(`Master camera ${masterCamera} mezzanine URL not found`);
        }
      }

      // Validate sync offsets
      if (!session.syncOffsets_ms || Object.keys(session.syncOffsets_ms).length === 0) {
        errors.push('Sync offsets not found');
      }

      // Check for transcript (warning only if missing)
      const transcripts = await strapi.entityService.findMany(
        'api::library-transcription.library-transcription',
        {
          filters: {
            sourceMediaId: { $in: assets.map((a: any) => a.id) } as any,
          },
          limit: 1,
        }
      ) as any[];

      if (!transcripts || transcripts.length === 0) {
        warnings.push('No transcript found - captions will not be rendered');
      }

      // Validate EDL canonical JSON exists
      if (job.edl && !job.edl.canonicalEdl) {
        errors.push('EDL canonical JSON not found');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Preflight validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors, warnings };
    }
  }
}
