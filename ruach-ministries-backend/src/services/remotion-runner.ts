/**
 * Phase 13 Plan 2: Remotion Runner
 *
 * Executes Remotion renders via CLI
 * Security: Uses execFile() to prevent command injection (V3/V23 fix)
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { validatePath } from './safe-path';

const execFileAsync = promisify(execFile);

export interface RemotionRenderOptions {
  sessionId: string;
  cameraSources: Record<string, string>;
  outputPath: string;
  compositionId?: string;
  showCaptions?: boolean;
  showChapters?: boolean;
  showSpeakerLabels?: boolean;
  onProgress?: (progress: number) => void;
}

export interface RemotionRenderResult {
  success: boolean;
  outputPath?: string;
  durationMs?: number;
  error?: string;
  logs?: string;
}

export default class RemotionRunner {
  private static readonly RENDERER_DIR = path.join(
    process.cwd(),
    '..',
    'ruach-video-renderer'
  );

  /**
   * Render video using Remotion CLI
   */
  static async render(options: RemotionRenderOptions): Promise<RemotionRenderResult> {
    const {
      sessionId,
      cameraSources,
      outputPath,
      compositionId = 'MultiCam',
      showCaptions = true,
      showChapters = true,
      showSpeakerLabels = true,
    } = options;

    const startTime = Date.now();

    try {
      // Validate output path stays within sandbox
      validatePath(outputPath, 'Remotion render outputPath');

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Build Remotion props
      const props = {
        sessionId,
        cameraSources,
        showCaptions,
        showChapters,
        showSpeakerLabels,
        debug: false,
      };

      const propsJson = JSON.stringify(props);

      console.log('[remotion-runner] Executing render command');
      console.log(`[remotion-runner] Output: ${outputPath}`);

      const { stdout, stderr } = await execFileAsync(
        'pnpm',
        ['remotion', 'render', compositionId, outputPath, `--props=${propsJson}`, '--overwrite'],
        {
          cwd: this.RENDERER_DIR,
          maxBuffer: 10 * 1024 * 1024,
          timeout: 30 * 60 * 1000,
        }
      );

      const durationMs = Date.now() - startTime;

      console.log('[remotion-runner] Render completed');
      console.log(`[remotion-runner] Duration: ${durationMs}ms`);

      // Check if output file exists
      try {
        await fs.access(outputPath);
      } catch {
        return {
          success: false,
          error: 'Output file not created',
          logs: stdout + '\n' + stderr,
        };
      }

      return {
        success: true,
        outputPath,
        durationMs,
        logs: stdout,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      console.error('[remotion-runner] Render failed:', error);

      return {
        success: false,
        error: error.message || 'Unknown render error',
        durationMs,
        logs: error.stdout || error.stderr || '',
      };
    }
  }

  /**
   * Check if Remotion is installed and accessible
   */
  static async checkInstallation(): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync('pnpm', ['remotion', '--version'], {
        cwd: this.RENDERER_DIR,
      });
      console.log('[remotion-runner] Remotion version:', stdout.trim());
      return true;
    } catch (error) {
      console.error('[remotion-runner] Remotion not accessible:', error);
      return false;
    }
  }
}
