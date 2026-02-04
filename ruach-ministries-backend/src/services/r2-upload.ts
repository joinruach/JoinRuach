/**
 * Phase 13 Plan 3: R2 Upload Service
 *
 * Handles artifact uploads to Cloudflare R2 storage
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export default class R2Upload {
  private static client: S3Client | null = null;

  /**
   * Initialize R2 client
   */
  private static getClient(): S3Client {
    if (this.client) {
      return this.client;
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('R2 credentials not configured');
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return this.client;
  }

  /**
   * Upload file to R2
   *
   * @param localPath - Local file path
   * @param r2Key - R2 object key (path in bucket)
   * @param contentType - MIME type
   * @returns Upload result with public URL
   */
  static async uploadFile(
    localPath: string,
    r2Key: string,
    contentType: string
  ): Promise<UploadResult> {
    try {
      const client = this.getClient();
      const bucketName = process.env.R2_BUCKET_NAME;
      const publicDomain = process.env.R2_PUBLIC_DOMAIN;

      if (!bucketName) {
        throw new Error('R2_BUCKET_NAME not configured');
      }

      // Read file
      const fileBuffer = await fs.readFile(localPath);

      // Upload to R2
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );

      // Build public URL
      const url = publicDomain
        ? `https://${publicDomain}/${r2Key}`
        : `https://${bucketName}.r2.cloudflarestorage.com/${r2Key}`;

      console.log(`[r2-upload] Uploaded ${r2Key} (${fileBuffer.length} bytes)`);

      return {
        success: true,
        url,
      };
    } catch (error: any) {
      console.error('[r2-upload] Upload failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown upload error',
      };
    }
  }

  /**
   * Upload video render artifacts
   *
   * @param jobId - Render job ID
   * @param sessionId - Recording session ID
   * @param localVideoPath - Local video file path
   * @returns Object with R2 URLs for all artifacts
   */
  static async uploadRenderArtifacts(
    jobId: string,
    sessionId: string,
    localVideoPath: string
  ): Promise<{
    videoUrl?: string;
    thumbnailUrl?: string;
    error?: string;
  }> {
    try {
      // Upload video
      const videoKey = `renders/${sessionId}/${jobId}.mp4`;
      const videoResult = await this.uploadFile(localVideoPath, videoKey, 'video/mp4');

      if (!videoResult.success) {
        throw new Error(`Video upload failed: ${videoResult.error}`);
      }

      console.log(`[r2-upload] Render artifacts uploaded for job ${jobId}`);

      return {
        videoUrl: videoResult.url,
      };
    } catch (error: any) {
      console.error('[r2-upload] Artifact upload failed:', error);
      return {
        error: error.message || 'Unknown error',
      };
    }
  }
}
