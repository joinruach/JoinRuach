'use client';

import { useState, useCallback, useRef } from 'react';

interface UploadProgress {
  id: string;
  filename: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  error?: string;
  url?: string;
}

interface UseUploadWithProgressOptions {
  /** Upload endpoint */
  endpoint?: string;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Allowed file types */
  allowedTypes?: string[];
  /** Callback on upload complete */
  onComplete?: (result: UploadProgress) => void;
  /** Callback on upload error */
  onError?: (error: string, file: File) => void;
  /** Callback on progress update */
  onProgress?: (progress: UploadProgress) => void;
  /** Whether to use presigned URLs */
  usePresignedUrls?: boolean;
  /** Presigned URL endpoint */
  presignedUrlEndpoint?: string;
}

interface UseUploadWithProgressReturn {
  /** Current uploads */
  uploads: UploadProgress[];
  /** Upload a file */
  upload: (file: File) => Promise<string | null>;
  /** Upload multiple files */
  uploadMultiple: (files: File[]) => Promise<(string | null)[]>;
  /** Cancel an upload */
  cancel: (id: string) => void;
  /** Clear completed uploads */
  clearCompleted: () => void;
  /** Clear all uploads */
  clearAll: () => void;
  /** Is any upload in progress */
  isUploading: boolean;
  /** Total progress across all uploads */
  totalProgress: number;
}

export function useUploadWithProgress(
  options: UseUploadWithProgressOptions = {}
): UseUploadWithProgressReturn {
  const {
    endpoint = '/api/upload',
    maxFileSize = 500 * 1024 * 1024, // 500MB
    allowedTypes,
    onComplete,
    onError,
    onProgress,
    usePresignedUrls = false,
    presignedUrlEndpoint = '/api/upload/presigned',
  } = options;

  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const generateId = () => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds maximum allowed (${formatBytes(maxFileSize)})`;
    }

    if (allowedTypes && allowedTypes.length > 0) {
      const fileType = file.type || '';
      const extension = file.name.split('.').pop()?.toLowerCase() || '';

      const isAllowed = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return extension === type.slice(1);
        }
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.slice(0, -1));
        }
        return fileType === type;
      });

      if (!isAllowed) {
        return `File type not allowed. Allowed: ${allowedTypes.join(', ')}`;
      }
    }

    return null;
  }, [maxFileSize, allowedTypes]);

  const updateUpload = useCallback((id: string, updates: Partial<UploadProgress>) => {
    setUploads(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...updates } : u);
      const upload = updated.find(u => u.id === id);
      if (upload && onProgress) {
        onProgress(upload);
      }
      return updated;
    });
  }, [onProgress]);

  const getPresignedUrl = async (filename: string, contentType: string): Promise<{ url: string; key: string } | null> => {
    try {
      const response = await fetch(presignedUrlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, contentType }),
      });

      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }

      return await response.json();
    } catch (error) {
      console.error('Presigned URL error:', error);
      return null;
    }
  };

  const upload = useCallback(async (file: File): Promise<string | null> => {
    const id = generateId();
    const abortController = new AbortController();
    abortControllers.current.set(id, abortController);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      onError?.(validationError, file);
      return null;
    }

    // Add to uploads list
    const newUpload: UploadProgress = {
      id,
      filename: file.name,
      status: 'pending',
      progress: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
    };
    setUploads(prev => [...prev, newUpload]);

    try {
      updateUpload(id, { status: 'uploading' });

      let uploadUrl: string;
      let resultUrl: string | undefined;

      if (usePresignedUrls) {
        // Get presigned URL for direct upload to R2/S3
        const presigned = await getPresignedUrl(file.name, file.type);
        if (!presigned) {
          throw new Error('Failed to get upload URL');
        }

        uploadUrl = presigned.url;
        resultUrl = presigned.key;

        // Upload directly to storage
        const response = await uploadWithProgress(
          uploadUrl,
          file,
          abortController.signal,
          (progress, uploaded) => {
            updateUpload(id, { progress, uploadedBytes: uploaded });
          },
          true // PUT request for presigned URLs
        );

        if (!response.ok) {
          throw new Error('Upload failed');
        }
      } else {
        // Upload to our API endpoint
        const formData = new FormData();
        formData.append('file', file);

        const response = await uploadWithProgress(
          endpoint,
          formData,
          abortController.signal,
          (progress, uploaded) => {
            updateUpload(id, { progress, uploadedBytes: uploaded });
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        resultUrl = data.url || data.key;
      }

      updateUpload(id, {
        status: 'completed',
        progress: 100,
        uploadedBytes: file.size,
        url: resultUrl,
      });

      const completedUpload = {
        ...newUpload,
        status: 'completed' as const,
        progress: 100,
        uploadedBytes: file.size,
        url: resultUrl,
      };
      onComplete?.(completedUpload);

      return resultUrl || null;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setUploads(prev => prev.filter(u => u.id !== id));
        return null;
      }

      const errorMessage = error.message || 'Upload failed';
      updateUpload(id, { status: 'failed', error: errorMessage });
      onError?.(errorMessage, file);
      return null;
    } finally {
      abortControllers.current.delete(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validateFile, updateUpload, usePresignedUrls, endpoint, onComplete, onError]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<(string | null)[]> => {
    return Promise.all(files.map(file => upload(file)));
  }, [upload]);

  const cancel = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    // Cancel all active uploads
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
    setUploads([]);
  }, []);

  const isUploading = uploads.some(u => u.status === 'uploading');

  const totalProgress = uploads.length === 0
    ? 0
    : uploads.reduce((sum, u) => sum + u.progress, 0) / uploads.length;

  return {
    uploads,
    upload,
    uploadMultiple,
    cancel,
    clearCompleted,
    clearAll,
    isUploading,
    totalProgress,
  };
}

// Helper function to upload with progress tracking
async function uploadWithProgress(
  url: string,
  body: FormData | File,
  signal: AbortSignal,
  onProgress: (progress: number, uploaded: number) => void,
  usePut = false
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress, event.loaded);
      }
    });

    xhr.addEventListener('load', () => {
      resolve(new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: new Headers({
          'Content-Type': xhr.getResponseHeader('Content-Type') || 'application/json',
        }),
      }));
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new DOMException('Upload aborted', 'AbortError'));
    });

    signal.addEventListener('abort', () => {
      xhr.abort();
    });

    xhr.open(usePut ? 'PUT' : 'POST', url);

    if (body instanceof File) {
      xhr.setRequestHeader('Content-Type', body.type);
      xhr.send(body);
    } else {
      xhr.send(body);
    }
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default useUploadWithProgress;
