import type { Core } from "@strapi/strapi";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { Job } from "bullmq";
import type {
  TranscodingJobData,
  TranscodingJobProgress,
} from "./media-transcoding-queue";

const execAsync = promisify(exec);

interface TranscodeResult {
  transcodes?: Array<{
    resolution: string;
    outputUrl: string;
    fileSize: number;
    duration: number;
  }>;
  thumbnails?: Array<{
    timestamp: number;
    outputUrl: string;
    fileSize: number;
  }>;
  audio?: {
    outputUrl: string;
    fileSize: number;
    duration: number;
  };
  proxy?: {
    outputUrl: string;
    fileSize: number;
    duration: number;
    resolution: string;
  };
  mezzanine?: {
    outputUrl: string;
    fileSize: number;
    duration: number;
    codec: string;
  };
  audioWav?: {
    outputUrl: string;
    fileSize: number;
    duration: number;
    sampleRate: number;
    channels: number;
  };
  vfrDetected?: boolean;
  vfrConverted?: boolean;
}

export default {
  async processTranscodingJob(
    this: any,
    job: Job<TranscodingJobData>,
    updateProgress: (progress: number, task: string) => Promise<void>,
    strapi?: Core.Strapi
  ): Promise<TranscodeResult> {
    const data = job.data;
    const tempDir = path.join(os.tmpdir(), `transcode-${job.id}`);

    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Download source file from R2
      await updateProgress(10, "Downloading source file from R2");
      const sourceFile = await this._downloadFromR2(
        data.sourceFileUrl,
        tempDir,
        data.sourceFileName
      );

      // Get video metadata
      await updateProgress(15, "Analyzing video metadata");
      const metadata = await this._getVideoMetadata(sourceFile);

      // Process based on job type
      const results: TranscodeResult = {};

      // Detect VFR and convert to CFR if needed (Phase 9)
      const isVFR = await this._detectVFR(sourceFile);
      results.vfrDetected = isVFR;

      let processFile = sourceFile;
      if (isVFR && (data.type === "proxy" || data.type === "mezzanine" || data.type === "extract-audio-wav")) {
        await updateProgress(18, "Converting VFR to CFR for sync compatibility");
        processFile = await this._convertToCFR(sourceFile, tempDir, updateProgress);
        results.vfrConverted = true;
      }

      if (data.type === "transcode" && data.resolutions) {
        results.transcodes = await this._processTranscodes(
          processFile,
          data,
          metadata,
          tempDir,
          updateProgress
        );
      } else if (data.type === "thumbnail" && data.thumbnailTimestamps) {
        results.thumbnails = await this._processThumbnails(
          processFile,
          data,
          metadata,
          tempDir,
          updateProgress
        );
      } else if (data.type === "extract-audio") {
        results.audio = await this._processAudioExtraction(
          processFile,
          data,
          metadata,
          tempDir,
          updateProgress
        );
      } else if (data.type === "proxy") {
        // Phase 9: Generate proxy optimized for web scrubbing
        results.proxy = await this._processProxy(
          processFile,
          data,
          metadata,
          tempDir,
          updateProgress,
          strapi
        );
      } else if (data.type === "mezzanine") {
        // Phase 9: Generate ProRes mezzanine for Remotion rendering
        results.mezzanine = await this._processMezzanine(
          processFile,
          data,
          metadata,
          tempDir,
          updateProgress,
          strapi
        );
      } else if (data.type === "extract-audio-wav") {
        // Phase 9: Extract uncompressed WAV for audio-offset-finder
        results.audioWav = await this._extractAudioForSync(
          processFile,
          data,
          metadata,
          tempDir,
          updateProgress,
          strapi
        );
      }

      await updateProgress(95, "Uploading results to R2");

      // Return results
      return results;
    } catch (error) {
      strapi?.log?.error(
        `[transcode-worker] Error processing job ${job.id}:`,
        error
      );
      throw error;
    } finally {
      // Cleanup temp directory
      if (fs.existsSync(tempDir)) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          strapi?.log?.warn(`Failed to cleanup temp directory: ${tempDir}`);
        }
      }
    }
  },

  async _downloadFromR2(
    this: any,
    url: string,
    tempDir: string,
    fileName: string
  ): Promise<string> {
    const filePath = path.join(tempDir, fileName);

    // Download file using fetch
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    return filePath;
  },

  async _uploadToR2(
    this: any,
    filePath: string,
    r2Path: string,
    bucketName: string,
    strapi?: Core.Strapi
  ): Promise<{ url: string; fileSize: number }> {
    // Use the strapi upload provider (AWS S3 compatible)
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    try {
      // Get the upload provider
      const uploadPlugin = strapi?.plugin("upload");
      if (!uploadPlugin) {
        throw new Error("Upload plugin not available");
      }

      // For Cloudflare R2, we'll use direct S3 SDK
      const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

      const s3Client = new S3Client({
        region: process.env.R2_REGION || "auto",
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
        endpoint: process.env.R2_ENDPOINT,
      });

      const key = `${r2Path}/${fileName}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: this._getContentType(fileName),
        })
      );

      const url = `${process.env.R2_PUBLIC_URL}/${key}`;

      return {
        url,
        fileSize: fileBuffer.length,
      };
    } catch (error) {
      strapi?.log?.error(`[transcode-worker] Failed to upload to R2:`, error);
      throw error;
    }
  },

  async _getVideoMetadata(
    this: any,
    filePath: string
  ): Promise<{ duration: number; width: number; height: number }> {
    const ffprobeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 -show_entries stream=width,height "${filePath}"`;

    try {
      const { stdout } = await execAsync(ffprobeCmd);
      const lines = stdout.trim().split("\n");

      // Parse duration, width, height from ffprobe output
      let duration = 0;
      let width = 0;
      let height = 0;

      for (const line of lines) {
        const parts = line.split("=");
        if (parts.length === 2) {
          const key = parts[0].trim();
          const value = parseFloat(parts[1].trim());

          if (key === "duration") duration = value;
          if (key === "width") width = Math.floor(value);
          if (key === "height") height = Math.floor(value);
        }
      }

      // If still no values, try alternative format
      if (duration === 0 || width === 0 || height === 0) {
        const fullCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=duration,width,height -of csv=p=0 "${filePath}"`;
        const { stdout: fullOutput } = await execAsync(fullCmd);
        const [dur, w, h] = fullOutput.trim().split(",");
        if (dur) duration = parseFloat(dur);
        if (w) width = parseInt(w, 10);
        if (h) height = parseInt(h, 10);
      }

      return {
        duration: Math.round(duration),
        width,
        height,
      };
    } catch (error) {
      throw new Error(`Failed to get video metadata: ${error}`);
    }
  },

  async _processTranscodes(
    this: any,
    sourceFile: string,
    data: TranscodingJobData,
    metadata: { duration: number; width: number; height: number },
    tempDir: string,
    updateProgress: (progress: number, task: string) => Promise<void>
  ): Promise<
    Array<{
      resolution: string;
      outputUrl: string;
      fileSize: number;
      duration: number;
    }>
  > {
    const results = [];
    const resolutions = data.resolutions || [];

    for (let i = 0; i < resolutions.length; i++) {
      const res = resolutions[i];
      await updateProgress(
        20 + (60 * i) / resolutions.length,
        `Transcoding to ${res.label}`
      );

      const outputFile = path.join(tempDir, `output-${res.label}.mp4`);

      // FFmpeg command for H.264 encoding
      const ffmpegCmd = `ffmpeg -i "${sourceFile}" -vf "scale=${res.width}:${res.height}" -c:v libx264 -preset medium -b:v ${res.bitrate} -c:a aac -b:a 128k "${outputFile}" -y`;

      try {
        await execAsync(ffmpegCmd, { maxBuffer: 1024 * 1024 * 100 });

        // Upload to R2
        const uploadResult = await this._uploadToR2(
          outputFile,
          `${data.r2OutputPath}/transcodes`,
          data.r2BucketName
        );

        results.push({
          resolution: res.label,
          outputUrl: uploadResult.url,
          fileSize: uploadResult.fileSize,
          duration: metadata.duration,
        });

        // Cleanup
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      } catch (error) {
        throw new Error(
          `Failed to transcode to ${res.label}: ${error instanceof Error ? error.message : error}`
        );
      }
    }

    return results;
  },

  async _processThumbnails(
    this: any,
    sourceFile: string,
    data: TranscodingJobData,
    metadata: { duration: number; width: number; height: number },
    tempDir: string,
    updateProgress: (progress: number, task: string) => Promise<void>
  ): Promise<
    Array<{
      timestamp: number;
      outputUrl: string;
      fileSize: number;
    }>
  > {
    const results = [];
    const timestamps = data.thumbnailTimestamps || [];

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const percentLabel = Math.round((timestamp / metadata.duration) * 100);

      await updateProgress(
        20 + (60 * i) / timestamps.length,
        `Generating thumbnail at ${percentLabel}%`
      );

      const outputFile = path.join(tempDir, `thumbnail-${percentLabel}p.jpg`);

      // FFmpeg command for thumbnail
      const ffmpegCmd = `ffmpeg -ss ${timestamp} -i "${sourceFile}" -vf "scale=320:180" -vframes 1 "${outputFile}" -y`;

      try {
        await execAsync(ffmpegCmd);

        // Upload to R2
        const uploadResult = await this._uploadToR2(
          outputFile,
          `${data.r2OutputPath}/thumbnails`,
          data.r2BucketName
        );

        results.push({
          timestamp,
          outputUrl: uploadResult.url,
          fileSize: uploadResult.fileSize,
        });

        // Cleanup
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      } catch (error) {
        throw new Error(
          `Failed to generate thumbnail at ${timestamp}s: ${error instanceof Error ? error.message : error}`
        );
      }
    }

    return results;
  },

  async _processAudioExtraction(
    this: any,
    sourceFile: string,
    data: TranscodingJobData,
    metadata: { duration: number; width: number; height: number },
    tempDir: string,
    updateProgress: (progress: number, task: string) => Promise<void>
  ): Promise<{
    outputUrl: string;
    fileSize: number;
    duration: number;
  }> {
    await updateProgress(25, "Extracting audio track");

    const audioFormat = data.audioFormat || "mp3";
    const outputFile = path.join(tempDir, `audio.${audioFormat}`);

    // FFmpeg command for audio extraction
    let ffmpegCmd: string;
    if (audioFormat === "mp3") {
      ffmpegCmd = `ffmpeg -i "${sourceFile}" -q:a 0 -map a "${outputFile}" -y`;
    } else if (audioFormat === "aac") {
      ffmpegCmd = `ffmpeg -i "${sourceFile}" -c:a aac -b:a 192k "${outputFile}" -y`;
    } else {
      ffmpegCmd = `ffmpeg -i "${sourceFile}" -c:a libvorbis -q:a 4 "${outputFile}" -y`;
    }

    try {
      await execAsync(ffmpegCmd, { maxBuffer: 1024 * 1024 * 100 });

      // Upload to R2
      const uploadResult = await this._uploadToR2(
        outputFile,
        `${data.r2OutputPath}/audio`,
        data.r2BucketName
      );

      return {
        outputUrl: uploadResult.url,
        fileSize: uploadResult.fileSize,
        duration: metadata.duration,
      };
    } catch (error) {
      throw new Error(
        `Failed to extract audio: ${error instanceof Error ? error.message : error}`
      );
    }
  },

  _getContentType(this: any, fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mkv": "video/x-matroska",
      ".mov": "video/quicktime",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".mp3": "audio/mpeg",
      ".aac": "audio/aac",
      ".m4a": "audio/mp4",
      ".ogg": "audio/ogg",
      ".wav": "audio/wav",
    };
    return mimeTypes[ext] || "application/octet-stream";
  },

  // ========================================
  // Phase 9: Media Ingestion & Sync Methods
  // ========================================

  /**
   * Detect if video has variable frame rate (VFR)
   * VFR causes audio drift over time, must convert to CFR before sync
   * Source: Phase 9 RESEARCH.md - Pitfall #6
   */
  async _detectVFR(this: any, filePath: string): Promise<boolean> {
    try {
      const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate,avg_frame_rate -of json "${filePath}"`;
      const { stdout } = await execAsync(cmd);
      const data = JSON.parse(stdout);

      if (!data.streams || data.streams.length === 0) {
        return false; // No video stream, not VFR
      }

      const stream = data.streams[0];
      const rFrameRate = stream.r_frame_rate; // Declared frame rate
      const avgFrameRate = stream.avg_frame_rate; // Actual average

      // VFR if declared != actual
      return rFrameRate !== avgFrameRate;
    } catch (error) {
      // If detection fails, assume CFR to avoid unnecessary conversion
      return false;
    }
  },

  /**
   * Convert variable frame rate (VFR) to constant frame rate (CFR)
   * Prevents audio drift during sync analysis
   * Source: Phase 9 DECISIONS.md - D-09-005
   */
  async _convertToCFR(
    this: any,
    sourceFile: string,
    tempDir: string,
    updateProgress: (progress: number, task: string) => Promise<void>
  ): Promise<string> {
    const outputFile = path.join(tempDir, "cfr-converted.mp4");

    try {
      // Convert to 30fps CFR with high quality (-crf 18)
      const cmd = `ffmpeg -i "${sourceFile}" -vsync cfr -r 30 -c:v libx264 -crf 18 -c:a copy "${outputFile}" -y`;

      await execAsync(cmd, { maxBuffer: 1024 * 1024 * 100 });

      return outputFile;
    } catch (error) {
      throw new Error(
        `Failed to convert VFR to CFR: ${error instanceof Error ? error.message : error}`
      );
    }
  },

  /**
   * Generate proxy optimized for smooth web scrubbing
   * Key: -g 2 (keyframe every 2 frames) balances scrubbing smoothness vs file size
   * Source: Phase 9 RESEARCH.md - Proxy Generation Pattern, DECISIONS.md - D-09-004
   */
  async _processProxy(
    this: any,
    sourceFile: string,
    data: TranscodingJobData,
    metadata: { duration: number; width: number; height: number },
    tempDir: string,
    updateProgress: (progress: number, task: string) => Promise<void>,
    strapi?: Core.Strapi
  ): Promise<{
    outputUrl: string;
    fileSize: number;
    duration: number;
    resolution: string;
  }> {
    await updateProgress(30, "Generating proxy for web scrubbing");

    const outputFile = path.join(tempDir, "proxy-720p.mp4");

    try {
      // FFmpeg command from Phase 9 RESEARCH.md - Code Examples
      const cmd = `ffmpeg -i "${sourceFile}" \\
        -vcodec libx264 \\
        -pix_fmt yuv420p \\
        -profile:v baseline \\
        -level 3.0 \\
        -g 2 \\
        -preset fast \\
        -crf 23 \\
        -vf "scale=-2:720" \\
        -movflags +faststart \\
        -an \\
        "${outputFile}" -y`.replace(/\\\n\s+/g, ' ');

      await execAsync(cmd, { maxBuffer: 1024 * 1024 * 100 });

      // Upload to R2
      const uploadResult = await this._uploadToR2(
        outputFile,
        `${data.r2OutputPath}/proxies`,
        data.r2BucketName,
        strapi
      );

      return {
        outputUrl: uploadResult.url,
        fileSize: uploadResult.fileSize,
        duration: metadata.duration,
        resolution: "1280x720",
      };
    } catch (error) {
      throw new Error(
        `Failed to generate proxy: ${error instanceof Error ? error.message : error}`
      );
    }
  },

  /**
   * Generate ProRes mezzanine for Remotion rendering
   * ProRes Standard (profile 2) sufficient for web workflows
   * Source: Phase 9 RESEARCH.md - Mezzanine Generation Pattern, DECISIONS.md - D-09-002
   */
  async _processMezzanine(
    this: any,
    sourceFile: string,
    data: TranscodingJobData,
    metadata: { duration: number; width: number; height: number },
    tempDir: string,
    updateProgress: (progress: number, task: string) => Promise<void>,
    strapi?: Core.Strapi
  ): Promise<{
    outputUrl: string;
    fileSize: number;
    duration: number;
    codec: string;
  }> {
    await updateProgress(40, "Generating ProRes mezzanine");

    const outputFile = path.join(tempDir, "mezzanine.mov");

    try {
      // FFmpeg command from Phase 9 RESEARCH.md - Code Examples
      const cmd = `ffmpeg -i "${sourceFile}" \\
        -c:v prores_ks \\
        -profile:v 2 \\
        -vendor apl0 \\
        -pix_fmt yuv422p10le \\
        -r 30 \\
        -c:a pcm_s24le \\
        -ar 48000 \\
        -ac 2 \\
        "${outputFile}" -y`.replace(/\\\n\s+/g, ' ');

      await execAsync(cmd, { maxBuffer: 1024 * 1024 * 200 }); // Larger buffer for ProRes

      // Upload to R2
      const uploadResult = await this._uploadToR2(
        outputFile,
        `${data.r2OutputPath}/mezzanines`,
        data.r2BucketName,
        strapi
      );

      return {
        outputUrl: uploadResult.url,
        fileSize: uploadResult.fileSize,
        duration: metadata.duration,
        codec: "ProRes Standard (profile 2)",
      };
    } catch (error) {
      throw new Error(
        `Failed to generate mezzanine: ${error instanceof Error ? error.message : error}`
      );
    }
  },

  /**
   * Extract uncompressed WAV audio for audio-offset-finder sync analysis
   * CRITICAL: Must be uncompressed PCM WAV at consistent sample rate
   * Source: Phase 9 RESEARCH.md - Audio Extraction Pattern, Common Pitfalls #5
   */
  async _extractAudioForSync(
    this: any,
    sourceFile: string,
    data: TranscodingJobData,
    metadata: { duration: number; width: number; height: number },
    tempDir: string,
    updateProgress: (progress: number, task: string) => Promise<void>,
    strapi?: Core.Strapi
  ): Promise<{
    outputUrl: string;
    fileSize: number;
    duration: number;
    sampleRate: number;
    channels: number;
  }> {
    await updateProgress(50, "Extracting audio for sync analysis");

    const outputFile = path.join(tempDir, "audio-sync.wav");

    try {
      // Uncompressed PCM WAV from Phase 9 RESEARCH.md - Code Examples
      const cmd = `ffmpeg -i "${sourceFile}" \\
        -vn \\
        -acodec pcm_s16le \\
        -ar 48000 \\
        -ac 2 \\
        "${outputFile}" -y`.replace(/\\\n\s+/g, ' ');

      await execAsync(cmd, { maxBuffer: 1024 * 1024 * 150 }); // WAV files are large

      // Upload to R2
      const uploadResult = await this._uploadToR2(
        outputFile,
        `${data.r2OutputPath}/audio-wav`,
        data.r2BucketName,
        strapi
      );

      return {
        outputUrl: uploadResult.url,
        fileSize: uploadResult.fileSize,
        duration: metadata.duration,
        sampleRate: 48000,
        channels: 2,
      };
    } catch (error) {
      throw new Error(
        `Failed to extract audio for sync: ${error instanceof Error ? error.message : error}`
      );
    }
  },
};
