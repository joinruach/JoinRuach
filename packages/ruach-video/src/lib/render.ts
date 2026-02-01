/**
 * Local Rendering Utilities
 * Server-side rendering without Lambda
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { WebpackOverrideFn } from "@remotion/bundler";
import path from "path";
import fs from "fs";

export interface LocalRenderConfig {
  compositionId: string;
  inputProps: Record<string, unknown>;
  outputPath: string;
  codec?: "h264" | "h265" | "vp8" | "vp9";
  quality?: "draft" | "standard" | "high";
  format?: "mp4" | "webm" | "gif";
  onProgress?: (progress: number) => void;
}

export interface LocalRenderResult {
  outputPath: string;
  durationMs: number;
  sizeBytes: number;
}

/**
 * Get quality settings
 */
function getQualitySettings(quality: LocalRenderConfig["quality"]) {
  switch (quality) {
    case "draft":
      return { crf: 28, scale: 0.5, concurrency: 2 };
    case "high":
      return { crf: 18, scale: 1, concurrency: 4 };
    case "standard":
    default:
      return { crf: 23, scale: 1, concurrency: 3 };
  }
}

/**
 * Bundle the Remotion project
 */
export async function bundleVideo(): Promise<string> {
  const entryPoint = path.resolve(__dirname, "../index.ts");

  const bundled = await bundle({
    entryPoint,
    // Webpack override for custom configuration
    webpackOverride: ((config) => config) as WebpackOverrideFn,
  });

  return bundled;
}

/**
 * Render video locally
 */
export async function renderVideoLocally(
  config: LocalRenderConfig
): Promise<LocalRenderResult> {
  const {
    compositionId,
    inputProps,
    outputPath,
    codec = "h264",
    quality = "standard",
    format = "mp4",
    onProgress,
  } = config;

  const startTime = Date.now();
  const qualitySettings = getQualitySettings(quality);

  // Bundle the project
  const bundleLocation = await bundleVideo();

  // Select the composition
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps,
  });

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Render the video
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec,
    outputLocation: outputPath,
    inputProps,
    scale: qualitySettings.scale,
    concurrency: qualitySettings.concurrency,
    onProgress: ({ progress }: { progress: number }) => {
      if (onProgress) {
        onProgress(progress);
      }
    },
  });

  // Get file stats
  const stats = fs.statSync(outputPath);

  return {
    outputPath,
    durationMs: Date.now() - startTime,
    sizeBytes: stats.size,
  };
}

/**
 * Render a still image
 */
export async function renderStillLocally(
  compositionId: string,
  inputProps: Record<string, unknown>,
  outputPath: string,
  frame: number = 0
): Promise<{ outputPath: string }> {
  const { renderStill } = await import("@remotion/renderer");

  const bundleLocation = await bundleVideo();

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps,
  });

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await renderStill({
    composition,
    serveUrl: bundleLocation,
    output: outputPath,
    inputProps,
    frame,
  });

  return { outputPath };
}

/**
 * Get video metadata without rendering
 */
export async function getVideoMetadata(
  compositionId: string,
  inputProps: Record<string, unknown>
): Promise<{
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  durationInSeconds: number;
}> {
  const bundleLocation = await bundleVideo();

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps,
  });

  return {
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
    durationInFrames: composition.durationInFrames,
    durationInSeconds: composition.durationInFrames / composition.fps,
  };
}

/**
 * Batch render multiple videos
 */
export async function batchRender(
  configs: LocalRenderConfig[],
  options: {
    concurrency?: number;
    onVideoComplete?: (index: number, result: LocalRenderResult) => void;
    onVideoError?: (index: number, error: Error) => void;
  } = {}
): Promise<{ results: (LocalRenderResult | null)[]; errors: (Error | null)[] }> {
  const { concurrency = 2, onVideoComplete, onVideoError } = options;

  const results: (LocalRenderResult | null)[] = new Array(configs.length).fill(null);
  const errors: (Error | null)[] = new Array(configs.length).fill(null);

  // Process in batches
  for (let i = 0; i < configs.length; i += concurrency) {
    const batch = configs.slice(i, i + concurrency);
    const batchPromises = batch.map(async (config, batchIndex) => {
      const index = i + batchIndex;
      try {
        const result = await renderVideoLocally(config);
        results[index] = result;
        if (onVideoComplete) {
          onVideoComplete(index, result);
        }
      } catch (error) {
        errors[index] = error as Error;
        if (onVideoError) {
          onVideoError(index, error as Error);
        }
      }
    });

    await Promise.all(batchPromises);
  }

  return { results, errors };
}

/**
 * Clean up temporary files
 */
export function cleanupTempFiles(directory: string): void {
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
