/**
 * Stage 1: Remotion Lambda Runner
 *
 * Renders video via AWS Lambda using @remotion/lambda/client.
 * Replaces the previous CLI-based execFile approach.
 */

import { getPreset, type FormatSlug } from './format-presets';

const REMOTION_FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME || '';
const REMOTION_SERVE_URL = process.env.REMOTION_SERVE_URL || '';
const REMOTION_REGION = process.env.REMOTION_REGION || 'us-east-1';

export interface LambdaRenderOptions {
  sessionId: string;
  formatSlug: FormatSlug;
  inputProps: Record<string, unknown>;
}

export interface LambdaRenderHandle {
  renderId: string;
  bucketName: string;
  region: string;
  functionName: string;
}

export interface LambdaCostData {
  accruedSoFar: number;
  displayCost: string;
  currency: string;
  disclaimer: string;
}

export interface LambdaRenderProgress {
  overallProgress: number;
  framesRendered: number;
  done: boolean;
  outputFile?: string;
  outputSize?: number;
  costs?: LambdaCostData;
  errors: string[];
}

export interface LambdaRenderResult {
  outputUrl: string;
  outputSize?: number;
  costs?: LambdaCostData;
}

export default class RemotionRunner {
  /**
   * Trigger a Lambda render. Returns immediately with a handle for polling.
   */
  static async render(options: LambdaRenderOptions): Promise<LambdaRenderHandle> {
    const { formatSlug, inputProps } = options;
    const preset = getPreset(formatSlug);

    if (!REMOTION_FUNCTION_NAME || !REMOTION_SERVE_URL) {
      throw new Error(
        'Remotion Lambda not configured. Set REMOTION_FUNCTION_NAME and REMOTION_SERVE_URL.'
      );
    }

    if (preset.isStill) {
      return this.renderStill(preset.compositionId, inputProps);
    }

    return this.renderMedia(preset.compositionId, inputProps, preset);
  }

  /**
   * Render a video composition via Lambda.
   */
  private static async renderMedia(
    compositionId: string,
    inputProps: Record<string, unknown>,
    preset: ReturnType<typeof getPreset>
  ): Promise<LambdaRenderHandle> {
    const { renderMediaOnLambda } = await import('@remotion/lambda/client');

    const result = await renderMediaOnLambda({
      region: REMOTION_REGION as Parameters<typeof renderMediaOnLambda>[0]['region'],
      functionName: REMOTION_FUNCTION_NAME,
      serveUrl: REMOTION_SERVE_URL,
      composition: compositionId,
      inputProps,
      codec: preset.codec === 'h264' ? 'h264' : 'h265',
      imageFormat: preset.imageFormat,
      maxRetries: 3,
      privacy: 'public',
    });

    console.log(`[remotion-runner] Lambda render triggered: ${result.renderId}`);

    return {
      renderId: result.renderId,
      bucketName: result.bucketName,
      region: REMOTION_REGION,
      functionName: REMOTION_FUNCTION_NAME,
    };
  }

  /**
   * Render a single still frame via Lambda.
   */
  private static async renderStill(
    compositionId: string,
    inputProps: Record<string, unknown>
  ): Promise<LambdaRenderHandle> {
    const { renderStillOnLambda } = await import('@remotion/lambda/client');

    const result = await renderStillOnLambda({
      region: REMOTION_REGION as Parameters<typeof renderStillOnLambda>[0]['region'],
      functionName: REMOTION_FUNCTION_NAME,
      serveUrl: REMOTION_SERVE_URL,
      composition: compositionId,
      inputProps,
      imageFormat: 'jpeg',
      privacy: 'public',
    });

    console.log(`[remotion-runner] Lambda still rendered: ${result.renderId}`);

    return {
      renderId: result.renderId,
      bucketName: result.bucketName,
      region: REMOTION_REGION,
      functionName: REMOTION_FUNCTION_NAME,
    };
  }

  /**
   * Poll Lambda for render progress.
   */
  static async getProgress(handle: LambdaRenderHandle): Promise<LambdaRenderProgress> {
    const { getRenderProgress } = await import('@remotion/lambda/client');

    const progress = await getRenderProgress({
      region: handle.region as Parameters<typeof getRenderProgress>[0]['region'],
      functionName: handle.functionName,
      bucketName: handle.bucketName,
      renderId: handle.renderId,
    });

    // Cost data only populated when done=true; zeroed during render
    const rawCosts = (progress as any).costs;
    const costs: LambdaCostData | undefined =
      rawCosts && rawCosts.accruedSoFar > 0
        ? {
            accruedSoFar: rawCosts.accruedSoFar,
            displayCost: rawCosts.displayCost,
            currency: rawCosts.currency,
            disclaimer: rawCosts.disclaimer,
          }
        : undefined;

    return {
      overallProgress: progress.overallProgress,
      framesRendered: progress.framesRendered,
      done: progress.done,
      outputFile: progress.outputFile ?? undefined,
      outputSize: progress.renderSize ?? undefined,
      costs,
      errors: (progress.errors ?? []).map((e) => e.message),
    };
  }

  /**
   * Poll until render completes. Returns the output URL.
   * Calls onProgress callback on each poll cycle.
   */
  static async waitForRender(
    handle: LambdaRenderHandle,
    onProgress?: (progress: LambdaRenderProgress) => void | Promise<void>,
    pollIntervalMs = 2000
  ): Promise<LambdaRenderResult> {
    const maxPolls = 900; // 30 minutes at 2s interval
    let polls = 0;

    while (polls < maxPolls) {
      const progress = await this.getProgress(handle);

      if (onProgress) {
        await onProgress(progress);
      }

      if (progress.errors.length > 0) {
        throw new Error(`Lambda render failed: ${progress.errors.join(', ')}`);
      }

      if (progress.done && progress.outputFile) {
        return {
          outputUrl: progress.outputFile,
          outputSize: progress.outputSize,
          costs: progress.costs,
        };
      }

      if (progress.done) {
        throw new Error('Lambda render completed but no output file was produced');
      }

      polls++;
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Lambda render timed out after ${maxPolls * pollIntervalMs / 1000}s`);
  }
}
