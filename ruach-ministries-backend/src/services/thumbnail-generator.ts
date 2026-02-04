/**
 * Phase 13 Plan 3: Thumbnail Generator
 *
 * Extracts thumbnail from rendered video using ffmpeg
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface ThumbnailResult {
  success: boolean;
  thumbnailPath?: string;
  error?: string;
}

export default class ThumbnailGenerator {
  /**
   * Generate thumbnail from video
   *
   * @param videoPath - Path to video file
   * @param outputPath - Path for thumbnail (optional, defaults to same dir as video)
   * @param timeOffset - Time offset in seconds to extract frame (default: 3)
   * @returns Thumbnail generation result
   */
  static async generateThumbnail(
    videoPath: string,
    outputPath?: string,
    timeOffset: number = 3
  ): Promise<ThumbnailResult> {
    try {
      // Generate output path if not provided
      if (!outputPath) {
        const dir = path.dirname(videoPath);
        const basename = path.basename(videoPath, path.extname(videoPath));
        outputPath = path.join(dir, `${basename}-thumb.jpg`);
      }

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Extract frame using ffmpeg
      // -ss: seek to time offset
      // -i: input file
      // -vframes 1: extract one frame
      // -q:v 2: high quality JPEG (1-31, lower is better)
      const command = `ffmpeg -ss ${timeOffset} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}" -y`;

      console.log('[thumbnail-generator] Extracting thumbnail from video');

      await execAsync(command, {
        timeout: 30000, // 30 second timeout
      });

      // Verify thumbnail exists
      try {
        await fs.access(outputPath);
      } catch {
        return {
          success: false,
          error: 'Thumbnail file not created',
        };
      }

      console.log(`[thumbnail-generator] Thumbnail created: ${outputPath}`);

      return {
        success: true,
        thumbnailPath: outputPath,
      };
    } catch (error: any) {
      console.error('[thumbnail-generator] Thumbnail generation failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check if ffmpeg is installed
   */
  static async checkInstallation(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch {
      console.error('[thumbnail-generator] ffmpeg not found');
      return false;
    }
  }
}
