/**
 * AWS Lambda Rendering Utilities
 * Configure and trigger Remotion Lambda renders
 */

import {
  renderMediaOnLambda,
  getRenderProgress,
  speculateFunctionName,
  getAwsClient,
  AwsRegion,
} from "@remotion/lambda/client";

// Configuration
const REMOTION_APP_REGION: AwsRegion = (process.env.REMOTION_AWS_REGION as AwsRegion) || "us-east-1";
const REMOTION_SERVE_URL = process.env.REMOTION_SERVE_URL || "";
const REMOTION_FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME || "";

export interface RenderConfig {
  compositionId: string;
  inputProps: Record<string, unknown>;
  outName?: string;
  codec?: "h264" | "h265" | "vp8" | "vp9";
  quality?: "draft" | "standard" | "high";
  format?: "mp4" | "webm" | "gif";
}

export interface RenderResult {
  renderId: string;
  bucketName: string;
  estimatedPrice: number;
}

export interface RenderProgress {
  renderId: string;
  done: boolean;
  progress: number;
  outputUrl?: string;
  errors?: string[];
}

/**
 * Get quality settings based on quality level
 */
function getQualitySettings(quality: RenderConfig["quality"]) {
  switch (quality) {
    case "draft":
      return { crf: 28, scale: 0.5 };
    case "high":
      return { crf: 18, scale: 1 };
    case "standard":
    default:
      return { crf: 23, scale: 1 };
  }
}

/**
 * Trigger a Lambda render
 */
export async function triggerLambdaRender(config: RenderConfig): Promise<RenderResult> {
  const { compositionId, inputProps, outName, codec = "h264", quality = "standard", format = "mp4" } = config;

  if (!REMOTION_SERVE_URL || !REMOTION_FUNCTION_NAME) {
    throw new Error("Remotion Lambda not configured. Set REMOTION_SERVE_URL and REMOTION_FUNCTION_NAME");
  }

  const qualitySettings = getQualitySettings(quality);

  const { renderId, bucketName } = await renderMediaOnLambda({
    region: REMOTION_APP_REGION,
    functionName: REMOTION_FUNCTION_NAME,
    serveUrl: REMOTION_SERVE_URL,
    composition: compositionId,
    inputProps,
    codec,
    imageFormat: "jpeg",
    maxRetries: 3,
    privacy: "public",
    outName: outName || `${compositionId}-${Date.now()}.${format}`,
    scale: qualitySettings.scale,
    // Note: CRF is applied differently per codec
  });

  // Get estimated price
  const progress = await getRenderProgress({
    region: REMOTION_APP_REGION,
    functionName: REMOTION_FUNCTION_NAME,
    bucketName,
    renderId,
  });

  return {
    renderId,
    bucketName,
    estimatedPrice: progress.costs?.accruedSoFar ?? 0,
  };
}

/**
 * Check render progress
 */
export async function checkRenderProgress(
  renderId: string,
  bucketName: string
): Promise<RenderProgress> {
  if (!REMOTION_FUNCTION_NAME) {
    throw new Error("REMOTION_FUNCTION_NAME not configured");
  }

  const progress = await getRenderProgress({
    region: REMOTION_APP_REGION,
    functionName: REMOTION_FUNCTION_NAME,
    bucketName,
    renderId,
  });

  return {
    renderId,
    done: progress.done,
    progress: progress.overallProgress,
    outputUrl: progress.outputFile || undefined,
    errors: progress.errors?.map((e: { message: string }) => e.message),
  };
}

/**
 * Wait for render to complete
 */
export async function waitForRender(
  renderId: string,
  bucketName: string,
  options: {
    pollInterval?: number;
    timeout?: number;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<RenderProgress> {
  const { pollInterval = 2000, timeout = 300000, onProgress } = options;
  const startTime = Date.now();

  while (true) {
    const progress = await checkRenderProgress(renderId, bucketName);

    if (onProgress) {
      onProgress(progress.progress);
    }

    if (progress.done) {
      return progress;
    }

    if (progress.errors && progress.errors.length > 0) {
      throw new Error(`Render failed: ${progress.errors.join(", ")}`);
    }

    if (Date.now() - startTime > timeout) {
      throw new Error("Render timeout exceeded");
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

/**
 * Get the Lambda function name (useful for deployment)
 */
export function getLambdaFunctionName(memorySizeInMb: number = 2048): string {
  return speculateFunctionName({
    diskSizeInMb: 2048,
    memorySizeInMb,
    timeoutInSeconds: 240,
  });
}

/**
 * Validate Lambda configuration
 */
export function validateLambdaConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.AWS_ACCESS_KEY_ID) {
    errors.push("AWS_ACCESS_KEY_ID not set");
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    errors.push("AWS_SECRET_ACCESS_KEY not set");
  }
  if (!REMOTION_SERVE_URL) {
    errors.push("REMOTION_SERVE_URL not set");
  }
  if (!REMOTION_FUNCTION_NAME) {
    errors.push("REMOTION_FUNCTION_NAME not set");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Composition IDs for easy reference
 */
export const COMPOSITIONS = {
  SCRIPTURE_OVERLAY: "ScriptureOverlay",
  TESTIMONY_CLIP: "TestimonyClip",
  QUOTE_REEL: "QuoteReel",
  TEACHING_VIDEO: "TeachingVideo",
  PODCAST_ENHANCED: "PodcastEnhanced",
  DECLARATION_VIDEO: "DeclarationVideo",
  DAILY_SCRIPTURE: "DailyScripture",
  SCRIPTURE_THUMBNAIL: "ScriptureThumbnail",
  QUOTE_THUMBNAIL: "QuoteThumbnail",
} as const;

export type CompositionId = (typeof COMPOSITIONS)[keyof typeof COMPOSITIONS];
