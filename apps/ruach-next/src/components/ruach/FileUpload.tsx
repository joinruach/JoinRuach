'use client';

import React, { useRef, useState } from 'react';
import { usePresignedUpload, UploadResult } from '@/hooks/usePresignedUpload';

interface FileUploadProps {
  /**
   * Accepted file types (MIME types or file extensions)
   * @example ["image/*", "video/*", ".pdf"]
   */
  accept?: string[];

  /**
   * Maximum file size in bytes
   * @default 500MB
   */
  maxSize?: number;

  /**
   * Whether to allow multiple file uploads
   * @default false
   */
  multiple?: boolean;

  /**
   * Callback when upload completes successfully
   */
  onUploadComplete?: (result: UploadResult) => void;

  /**
   * Callback when upload fails
   */
  onUploadError?: (error: Error) => void;

  /**
   * Custom class name for the container
   */
  className?: string;

  /**
   * Whether to show image preview
   * @default true
   */
  showPreview?: boolean;

  /**
   * Custom label text
   */
  label?: string;

  /**
   * Whether upload is disabled
   */
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = ['image/*', 'video/*', 'audio/*', '.pdf'],
  maxSize = 500 * 1024 * 1024, // 500MB default
  multiple = false,
  onUploadComplete,
  onUploadError,
  className = '',
  showPreview = true,
  label = 'Upload File',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { upload, status, progress, error, reset } = usePresignedUpload();

  /**
   * Validate file
   */
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`;
    }

    // Check file type
    if (accept && accept.length > 0) {
      const fileType = file.type;
      const fileName = file.name;

      const isAccepted = accept.some(acceptType => {
        if (acceptType.startsWith('.')) {
          // Extension check
          return fileName.toLowerCase().endsWith(acceptType.toLowerCase());
        } else if (acceptType.endsWith('/*')) {
          // MIME type wildcard (e.g., "image/*")
          const baseType = acceptType.split('/')[0];
          return fileType.startsWith(baseType + '/');
        } else {
          // Exact MIME type
          return fileType === acceptType;
        }
      });

      if (!isAccepted) {
        return `File type not accepted. Allowed types: ${accept.join(', ')}`;
      }
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    // Start upload
    try {
      await upload({
        file,
        onProgress: (progress) => {
          console.log(`Upload progress: ${progress}%`);
        },
        onComplete: (result) => {
          console.log('Upload complete:', result);
          onUploadComplete?.(result);
        },
        onError: (error) => {
          console.error('Upload error:', error);
          onUploadError?.(error);
        },
      });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Handle drag events
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Trigger file input click
   */
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Handle retry
   */
  const handleRetry = () => {
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Get status message
   */
  const getStatusMessage = () => {
    switch (status) {
      case 'generating':
        return 'Preparing upload...';
      case 'uploading':
        return `Uploading... ${progress}%`;
      case 'completing':
        return 'Finalizing upload...';
      case 'success':
        return 'Upload complete!';
      case 'error':
        return `Error: ${error?.message || 'Upload failed'}`;
      default:
        return '';
    }
  };

  return (
    <div className={`file-upload ${className}`}>
      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept.join(',')}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Drop Zone */}
      <div
        className={`
          file-upload-dropzone
          ${isDragging ? 'dragging' : ''}
          ${disabled ? 'disabled' : ''}
          ${status === 'uploading' ? 'uploading' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: isDragging ? '#f0f0f0' : '#fafafa',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Preview */}
        {previewUrl && showPreview && (
          <div style={{ marginBottom: '1rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
            />
          </div>
        )}

        {/* Status */}
        {status !== 'idle' && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {getStatusMessage()}
            </div>

            {/* Progress Bar */}
            {status === 'uploading' && (
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: '#4caf50',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            )}

            {/* Success Icon */}
            {status === 'success' && (
              <div style={{ fontSize: '2rem', color: '#4caf50' }}>✓</div>
            )}

            {/* Error Icon */}
            {status === 'error' && (
              <div>
                <div style={{ fontSize: '2rem', color: '#f44336' }}>✗</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry();
                  }}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selected File Info */}
        {selectedFile && status === 'idle' && (
          <div style={{ marginBottom: '1rem' }}>
            <div>{selectedFile.name}</div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              {formatFileSize(selectedFile.size)}
            </div>
          </div>
        )}

        {/* Default State */}
        {!selectedFile && status === 'idle' && (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{label}</div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              Drag & drop or click to select
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
              Max size: {formatFileSize(maxSize)}
            </div>
          </div>
        )}
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .file-upload-dropzone.dragging {
          border-color: #2196f3;
          background-color: #e3f2fd;
        }

        .file-upload-dropzone.uploading {
          pointer-events: none;
        }

        .file-upload-dropzone.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
