import { Config } from "@remotion/cli/config";

/**
 * Phase 12: Remotion Configuration
 *
 * Optimized for ProRes mezzanine rendering
 */

// Image format for video frames
Config.setVideoImageFormat("jpeg");

// Overwrite output files
Config.setOverwriteOutput(true);

// Concurrency for rendering
Config.setConcurrency(4);

// Enable browser logs for debugging
Config.setChromiumOpenGlRenderer("angle");
