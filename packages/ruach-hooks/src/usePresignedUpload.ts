import { useState, useCallback } from 'react';

export type UploadStatus = 'idle' | 'generating' | 'uploading' | 'completing' | 'success' | 'error';

export interface UploadConfig {
  file: File;
  onProgress?: (progress: number) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  chunkSize?: number;
  useChunking?: boolean;
  apiUrl?: string;
}

export interface UploadResult {
  key: string;
  publicUrl: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface PresignedUrlResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    key: string;
    publicUrl: string;
    expiresIn: number;
  };
}

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
export function usePresignedUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const generatePresignedUrl = async (file: File, apiUrl: string): Promise<PresignedUrlResponse> => {
    const response = await fetch(`${apiUrl}/api/presigned-upload/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  };

  const uploadToR2 = async (
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progressPercent = Math.round((event.loaded / event.total) * 100);
          setProgress(progressPercent);
          onProgress?.(progressPercent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  const completeUpload = async (
    key: string,
    file: File,
    publicUrl: string,
    apiUrl: string
  ): Promise<CompleteUploadResponse> => {
    const response = await fetch(`${apiUrl}/api/presigned-upload/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  };

  const upload = useCallback(async (config: UploadConfig) => {
    const {
      file,
      onProgress,
      onComplete,
      onError,
      apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
    } = config;

    try {
      setStatus('generating');
      setProgress(0);
      setError(null);
      setResult(null);

      const presignedResponse = await generatePresignedUrl(file, apiUrl);
      const { uploadUrl, key, publicUrl } = presignedResponse.data;

      setStatus('uploading');
      await uploadToR2(file, uploadUrl, onProgress);

      setStatus('completing');
      const completeResponse = await completeUpload(key, file, publicUrl, apiUrl);

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
  }, []);

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
}
