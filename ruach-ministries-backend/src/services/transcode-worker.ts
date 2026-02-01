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

      if (data.type === "transcode" && data.resolutions) {
        results.transcodes = await this._processTranscodes(
          sourceFile,
          data,
          metadata,
          tempDir,
          updateProgress
        );
      } else if (data.type === "thumbnail" && data.thumbnailTimestamps) {
        results.thumbnails = await this._processThumbnails(
          sourceFile,
          data,
          metadata,
          tempDir,
          updateProgress
        );
      } else if (data.type === "extract-audio") {
        results.audio = await this._processAudioExtraction(
          sourceFile,
          data,
          metadata,
          tempDir,
          updateProgress
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
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".mp3": "audio/mpeg",
      ".aac": "audio/aac",
      ".m4a": "audio/mp4",
      ".ogg": "audio/ogg",
    };
    return mimeTypes[ext] || "application/octet-stream";
  },
};
