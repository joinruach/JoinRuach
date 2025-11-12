'use client';

import { useState, useCallback } from 'react';

/**
 * Upload status states
 */
export type UploadStatus = 'idle' | 'generating' | 'uploading' | 'completing' | 'success' | 'error';

/**
 * Upload configuration
 */
export interface UploadConfig {
  file: File;
  onProgress?: (progress: number) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  chunkSize?: number; // Size of each chunk in bytes (default: 5MB)
  useChunking?: boolean; // Whether to use chunked uploads (default: true for files > 10MB)
}

/**
 * Upload result
 */
export interface UploadResult {
  key: string;
  publicUrl: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Presigned URL response
 */
interface PresignedUrlResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    key: string;
    publicUrl: string;
    expiresIn: number;
  };
}

/**
 * Complete upload response
 */
interface CompleteUploadResponse {
  success: boolean;
  data: {
    id: number;
    key: string;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  };
}

/**
 * Hook for uploading files directly to R2 using presigned URLs
 */
export const usePresignedUpload = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

  /**
   * Generate presigned URL from Strapi
   */
  const generatePresignedUrl = useCallback(async (file: File): Promise<PresignedUrlResponse> => {
    const response = await fetch(`${API_URL}/api/presigned-upload/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        type: file.type,
        size: file.size,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to generate presigned URL');
    }

    return response.json();
  }, [API_URL]);

  /**
   * Upload file to R2 using presigned URL (single request)
   */
  const uploadToR2 = useCallback(async (file: File, uploadUrl: string, onProgress?: (progress: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progressPercent = Math.round((event.loaded / event.total) * 100);
          setProgress(progressPercent);
          onProgress?.(progressPercent);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      // Send the file
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }, []);

  /**
   * Upload file in chunks (for large files)
   */
  const uploadToR2Chunked = useCallback(async (
    file: File,
    uploadUrl: string,
    chunkSize: number,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedBytes = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      // Upload chunk
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
        },
        body: chunk,
      });

      if (!response.ok) {
        throw new Error(`Chunk upload failed: ${response.statusText}`);
      }

      // Update progress
      uploadedBytes += chunk.size;
      const progressPercent = Math.round((uploadedBytes / file.size) * 100);
      setProgress(progressPercent);
      onProgress?.(progressPercent);
    }
  }, []);

  /**
   * Complete the upload by saving metadata to Strapi
   */
  const completeUpload = useCallback(async (key: string, file: File, publicUrl: string): Promise<CompleteUploadResponse> => {
    const response = await fetch(`${API_URL}/api/presigned-upload/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        filename: file.name,
        type: file.type,
        size: file.size,
        title: file.name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to complete upload');
    }

    return response.json();
  }, [API_URL]);

  /**
   * Upload a file
   */
  const upload = useCallback(async (config: UploadConfig) => {
    const { file, onProgress, onComplete, onError, chunkSize = 5 * 1024 * 1024, useChunking } = config;

    try {
      setStatus('generating');
      setProgress(0);
      setError(null);
      setResult(null);

      // Step 1: Generate presigned URL
      const presignedResponse = await generatePresignedUrl(file);
      const { uploadUrl, key, publicUrl } = presignedResponse.data;

      // Step 2: Upload to R2
      setStatus('uploading');

      const shouldUseChunking = useChunking !== undefined ? useChunking : file.size > 10 * 1024 * 1024; // Default: chunk if > 10MB

      if (shouldUseChunking) {
        await uploadToR2Chunked(file, uploadUrl, chunkSize, onProgress);
      } else {
        await uploadToR2(file, uploadUrl, onProgress);
      }

      // Step 3: Complete upload (save metadata)
      setStatus('completing');
      const completeResponse = await completeUpload(key, file, publicUrl);

      // Success!
      const uploadResult: UploadResult = {
        key: completeResponse.data.key,
        publicUrl: completeResponse.data.url,
        filename: completeResponse.data.filename,
        size: completeResponse.data.size,
        mimeType: completeResponse.data.mimeType,
      };

      setResult(uploadResult);
      setStatus('success');
      onComplete?.(uploadResult);

      return uploadResult;
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error('Upload failed');
      setError(uploadError);
      setStatus('error');
      onError?.(uploadError);
      throw uploadError;
    }
  }, [completeUpload, generatePresignedUrl, uploadToR2, uploadToR2Chunked]);

  /**
   * Reset the upload state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    upload,
    reset,
    status,
    progress,
    error,
    result,
    isUploading: status === 'uploading',
    isGenerating: status === 'generating',
    isCompleting: status === 'completing',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',
  };
};
