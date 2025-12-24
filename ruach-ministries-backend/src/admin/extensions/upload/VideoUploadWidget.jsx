/**
 * Video Upload Widget
 *
 * Custom Strapi admin component for large video uploads with progress and resumption
 */

import React, { useState, useRef } from 'react';
import { Box, Button, Flex, Progress, Typography, Alert } from '@strapi/design-system';
import { Play, Pause, Cross, Upload } from '@strapi/icons';
import R2MultipartUploader from './r2-multipart-uploader';

const VideoUploadWidget = ({ value, onChange, name, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const uploaderRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    // Validate file size (max 10GB)
    const maxSize = 10 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 10GB limit');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setProgress(0);
    setUploadedBytes(0);
    setTotalBytes(file.size);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setPaused(false);

    const uploader = new R2MultipartUploader(selectedFile, {
      onProgress: (progressData) => {
        setProgress(progressData.progress);
        setUploadedBytes(progressData.uploadedBytes);
      },
      onComplete: (result) => {
        setUploading(false);
        setProgress(100);

        // Update form value with uploaded video URL
        onChange({
          target: {
            name,
            value: result.url,
            type: 'text',
          },
        });

        // Reset state
        setSelectedFile(null);
        setProgress(0);
        setUploadedBytes(0);
        setTotalBytes(0);

        alert(`Upload complete! URL: ${result.url}`);
      },
      onError: (err) => {
        setUploading(false);
        setPaused(false);
        setError(err.message);
      },
    });

    uploaderRef.current = uploader;

    try {
      await uploader.start();
    } catch (err) {
      // Error already handled in onError callback
      console.error('Upload error:', err);
    }
  };

  const handlePause = () => {
    if (uploaderRef.current) {
      uploaderRef.current.pause();
      setPaused(true);
    }
  };

  const handleResume = () => {
    if (uploaderRef.current) {
      uploaderRef.current.resume();
      setPaused(false);
    }
  };

  const handleCancel = async () => {
    if (uploaderRef.current) {
      await uploaderRef.current.abort();
      setUploading(false);
      setPaused(false);
      setProgress(0);
      setUploadedBytes(0);
      setSelectedFile(null);
      setError(null);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box padding={4} background="neutral100" borderRadius="4px">
      <Typography variant="omega" fontWeight="semiBold" marginBottom={2}>
        Large Video Upload (Resumable)
      </Typography>

      {error && (
        <Alert
          closeLabel="Close"
          title="Upload Error"
          variant="danger"
          onClose={() => setError(null)}
          marginBottom={2}
        >
          {error}
        </Alert>
      )}

      {value && !uploading && (
        <Box marginBottom={2} padding={2} background="success100" borderRadius="4px">
          <Typography variant="omega" fontWeight="semiBold">
            Current Video URL:
          </Typography>
          <Typography variant="omega" textColor="success700">
            {value}
          </Typography>
        </Box>
      )}

      <Flex direction="column" gap={2}>
        {!uploading && !selectedFile && (
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={disabled}
            />
            <Button
              startIcon={<Upload />}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              fullWidth
            >
              Select Large Video File (Up to 10GB)
            </Button>
          </Box>
        )}

        {selectedFile && !uploading && (
          <Box padding={2} background="neutral200" borderRadius="4px">
            <Typography variant="omega">
              <strong>Selected:</strong> {selectedFile.name}
            </Typography>
            <Typography variant="omega">
              <strong>Size:</strong> {formatBytes(selectedFile.size)}
            </Typography>
            <Typography variant="omega">
              <strong>Type:</strong> {selectedFile.type}
            </Typography>

            <Flex gap={2} marginTop={2}>
              <Button startIcon={<Upload />} onClick={handleUpload} fullWidth>
                Start Upload
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedFile(null)}
                fullWidth
              >
                Cancel
              </Button>
            </Flex>
          </Box>
        )}

        {uploading && (
          <Box>
            <Flex justifyContent="space-between" marginBottom={2}>
              <Typography variant="omega">
                Uploading: {progress.toFixed(1)}%
              </Typography>
              <Typography variant="omega">
                {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
              </Typography>
            </Flex>

            <Progress value={progress} max={100} />

            <Flex gap={2} marginTop={2}>
              {!paused ? (
                <Button
                  variant="secondary"
                  startIcon={<Pause />}
                  onClick={handlePause}
                  size="S"
                >
                  Pause
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  startIcon={<Play />}
                  onClick={handleResume}
                  size="S"
                >
                  Resume
                </Button>
              )}

              <Button
                variant="danger"
                startIcon={<Cross />}
                onClick={handleCancel}
                size="S"
              >
                Cancel
              </Button>
            </Flex>

            {paused && (
              <Alert
                closeLabel="Close"
                title="Upload Paused"
                variant="default"
                marginTop={2}
              >
                You can safely close this page. The upload will resume from where it left off when you return.
              </Alert>
            )}
          </Box>
        )}

        <Typography variant="pi" textColor="neutral600">
          💡 <strong>Tip:</strong> This uploader supports resumption. If your upload is interrupted,
          selecting the same file again will resume from where it stopped.
        </Typography>

        <Typography variant="pi" textColor="neutral600">
          📹 <strong>For videos &lt;2GB:</strong> Use the standard upload field below for faster uploads.
        </Typography>
      </Flex>
    </Box>
  );
};

export default VideoUploadWidget;
