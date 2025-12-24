/**
 * R2 Multipart Uploader
 *
 * Client-side library for resumable multipart uploads with progress tracking
 */

class R2MultipartUploader {
  constructor(file, options = {}) {
    this.file = file;
    this.apiBase = options.apiBase || '/api/upload/r2-direct';
    this.partSize = 5 * 1024 * 1024; // 5MB
    this.concurrency = options.concurrency || 3; // Upload 3 parts concurrently
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});

    this.uploadId = null;
    this.key = null;
    this.totalParts = 0;
    this.uploadedParts = new Set();
    this.uploadedETags = new Map();
    this.isPaused = false;
    this.isAborted = false;
  }

  /**
   * Start or resume upload
   */
  async start() {
    try {
      // Try to resume existing upload
      const resumed = await this.tryResume();

      if (!resumed) {
        // Initiate new upload
        await this.initiate();
      }

      // Upload all parts
      await this.uploadParts();

      // Complete upload
      const result = await this.complete();

      this.onComplete(result);
      this.clearState();

      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      this.onError(error);
      throw error;
    }
  }

  /**
   * Try to resume an existing upload from localStorage
   */
  async tryResume() {
    const storageKey = this.getStorageKey();
    const savedState = localStorage.getItem(storageKey);

    if (!savedState) {
      return false;
    }

    try {
      const state = JSON.parse(savedState);

      // Verify upload session still exists
      const response = await fetch(`${this.apiBase}/status/${state.uploadId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // Session expired, start fresh
        localStorage.removeItem(storageKey);
        return false;
      }

      const status = await response.json();

      this.uploadId = state.uploadId;
      this.key = state.key;
      this.totalParts = state.totalParts;

      // Mark already-uploaded parts
      for (const partNumber of status.completedPartNumbers) {
        this.uploadedParts.add(partNumber);
      }

      console.log(`Resuming upload: ${status.completedParts}/${this.totalParts} parts complete`);

      return true;
    } catch (error) {
      console.warn('Failed to resume upload:', error);
      localStorage.removeItem(storageKey);
      return false;
    }
  }

  /**
   * Initiate multipart upload
   */
  async initiate() {
    const response = await fetch(`${this.apiBase}/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        filename: this.file.name,
        contentType: this.file.type,
        fileSize: this.file.size,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initiate upload');
    }

    const data = await response.json();

    this.uploadId = data.uploadId;
    this.key = data.key;
    this.totalParts = data.totalParts;
    this.partSize = data.partSize;

    // Save state for resumption
    this.saveState();

    console.log(`Upload initiated: ${this.totalParts} parts`);
  }

  /**
   * Upload all parts with concurrency control
   */
  async uploadParts() {
    const partsToUpload = [];

    for (let partNumber = 1; partNumber <= this.totalParts; partNumber++) {
      if (!this.uploadedParts.has(partNumber)) {
        partsToUpload.push(partNumber);
      }
    }

    // Upload parts with concurrency limit
    const queue = [...partsToUpload];
    const activeUploads = [];

    while (queue.length > 0 || activeUploads.length > 0) {
      // Check if paused or aborted
      if (this.isPaused) {
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!this.isPaused || this.isAborted) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
      }

      if (this.isAborted) {
        throw new Error('Upload aborted');
      }

      // Fill up to concurrency limit
      while (activeUploads.length < this.concurrency && queue.length > 0) {
        const partNumber = queue.shift();
        const uploadPromise = this.uploadPart(partNumber)
          .then(() => {
            const index = activeUploads.indexOf(uploadPromise);
            if (index > -1) {
              activeUploads.splice(index, 1);
            }
          })
          .catch((error) => {
            // Put failed part back in queue for retry
            console.error(`Part ${partNumber} failed, retrying...`, error);
            queue.push(partNumber);

            const index = activeUploads.indexOf(uploadPromise);
            if (index > -1) {
              activeUploads.splice(index, 1);
            }
          });

        activeUploads.push(uploadPromise);
      }

      // Wait for at least one upload to complete
      if (activeUploads.length > 0) {
        await Promise.race(activeUploads);
      }
    }
  }

  /**
   * Upload a single part
   */
  async uploadPart(partNumber) {
    // Get presigned URL
    const urlResponse = await fetch(`${this.apiBase}/part-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        uploadId: this.uploadId,
        partNumber,
      }),
    });

    if (!urlResponse.ok) {
      throw new Error(`Failed to get upload URL for part ${partNumber}`);
    }

    const { uploadUrl } = await urlResponse.json();

    // Calculate part boundaries
    const start = (partNumber - 1) * this.partSize;
    const end = Math.min(start + this.partSize, this.file.size);
    const partBlob = this.file.slice(start, end);

    // Upload part
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: partBlob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload part ${partNumber}`);
    }

    const etag = uploadResponse.headers.get('ETag').replace(/"/g, '');

    // Mark part as completed
    const completeResponse = await fetch(`${this.apiBase}/part-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        uploadId: this.uploadId,
        partNumber,
        etag,
      }),
    });

    if (!completeResponse.ok) {
      throw new Error(`Failed to mark part ${partNumber} as completed`);
    }

    this.uploadedParts.add(partNumber);
    this.uploadedETags.set(partNumber, etag);

    // Update progress
    const progress = (this.uploadedParts.size / this.totalParts) * 100;
    this.onProgress({
      uploadedParts: this.uploadedParts.size,
      totalParts: this.totalParts,
      progress,
      uploadedBytes: this.uploadedParts.size * this.partSize,
      totalBytes: this.file.size,
    });

    // Save state for resumption
    this.saveState();

    console.log(`Part ${partNumber}/${this.totalParts} uploaded (${progress.toFixed(1)}%)`);
  }

  /**
   * Complete multipart upload
   */
  async complete() {
    const response = await fetch(`${this.apiBase}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        uploadId: this.uploadId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete upload');
    }

    const result = await response.json();
    console.log('Upload completed:', result);

    return result;
  }

  /**
   * Pause upload
   */
  pause() {
    this.isPaused = true;
    console.log('Upload paused');
  }

  /**
   * Resume upload
   */
  resume() {
    this.isPaused = false;
    console.log('Upload resumed');
  }

  /**
   * Abort upload
   */
  async abort() {
    this.isAborted = true;

    if (!this.uploadId) {
      return;
    }

    try {
      await fetch(`${this.apiBase}/abort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          uploadId: this.uploadId,
        }),
      });

      this.clearState();
      console.log('Upload aborted');
    } catch (error) {
      console.error('Failed to abort upload:', error);
    }
  }

  /**
   * Save upload state to localStorage
   */
  saveState() {
    const state = {
      uploadId: this.uploadId,
      key: this.key,
      totalParts: this.totalParts,
      filename: this.file.name,
      fileSize: this.file.size,
      contentType: this.file.type,
    };

    localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
  }

  /**
   * Clear upload state from localStorage
   */
  clearState() {
    localStorage.removeItem(this.getStorageKey());
  }

  /**
   * Get storage key for this upload
   */
  getStorageKey() {
    // Use file name + size as unique identifier
    return `r2-upload:${this.file.name}:${this.file.size}`;
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export default R2MultipartUploader;
