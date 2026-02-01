# Media Transcoding Examples

This guide shows practical examples of using the media transcoding API.

## Quick Start

### 1. Upload Video and Queue Transcoding

```typescript
// In your media upload controller/service
async function uploadAndTranscode(ctx) {
  const strapi = ctx.strapi;

  // 1. Create media item
  const mediaItem = await strapi.entityService.create(
    'api::media-item.media-item',
    {
      data: {
        title: 'My Testimony',
        type: 'testimony',
        visibility: 'public',
        releasedAt: new Date(),
        // ... other fields
      }
    }
  );

  // 2. Upload video file to R2 (using existing upload)
  const uploadedFile = await strapi.plugin('upload').provider.upload({
    files: ctx.request.files.video,
  });

  // 3. Queue all transcoding jobs
  const response = await fetch(`${process.env.API_URL}/api/media-transcode/quick-queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaItemId: mediaItem.id,
      sourceFileUrl: uploadedFile.url,
      sourceFileName: uploadedFile.name,
    })
  });

  const result = await response.json();

  return {
    mediaItemId: mediaItem.id,
    jobIds: result.jobIds,
  };
}
```

### 2. Check Transcoding Progress

```typescript
async function checkTranscodingProgress(jobId: string) {
  const response = await fetch(
    `${process.env.API_URL}/api/media-transcode/status/${jobId}`
  );

  const status = await response.json();

  // status.progress: 0-100
  // status.currentTask: "Transcoding to 720p"
  // status.status: "processing" | "completed" | "failed"

  return status;
}
```

### 3. Retrieve Transcoding Results

```typescript
async function getTranscodingResults(strapi, mediaItemId: number) {
  const transcodeService = strapi.service('api::media-transcoding-results');

  // Get all results
  const results = await transcodeService.getTranscodingResults(mediaItemId);

  // Get available qualities for player
  const qualities = await transcodeService.getAvailableQualities(mediaItemId);
  // Returns:
  // [
  //   { resolution: '1080p', bitrate: '5000k', url: '...' },
  //   { resolution: '720p', bitrate: '2500k', url: '...' },
  //   { resolution: '480p', bitrate: '1000k', url: '...' }
  // ]

  // Get audio for download
  const audioUrl = await transcodeService.getAudioUrl(mediaItemId);

  // Get thumbnails
  const thumbnails = await transcodeService.getThumbnailUrls(mediaItemId);
  // Returns:
  // [
  //   { timestamp: 10, url: '...' },
  //   { timestamp: 30, url: '...' },
  //   { timestamp: 50, url: '...' }
  // ]

  return {
    status: results.status,
    qualities,
    audio: audioUrl,
    thumbnails,
  };
}
```

## Frontend Integration

### React Example

```jsx
import { useState, useEffect } from 'react';

function VideoTranscodingStatus({ mediaItemId, jobIds }) {
  const [progress, setProgress] = useState({});
  const [transcodingComplete, setTranscodingComplete] = useState(false);

  useEffect(() => {
    if (!jobIds || jobIds.length === 0) return;

    const interval = setInterval(async () => {
      const statuses = {};
      let allCompleted = true;

      for (const jobId of jobIds) {
        const res = await fetch(
          `/api/media-transcode/status/${jobId}`
        );
        const status = await res.json();

        statuses[jobId] = status;
        if (status.status !== 'completed' && status.status !== 'failed') {
          allCompleted = false;
        }
      }

      setProgress(statuses);

      if (allCompleted) {
        setTranscodingComplete(true);
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [jobIds]);

  return (
    <div className="transcoding-status">
      <h3>Video Processing Status</h3>

      {jobIds.map((jobId) => {
        const status = progress[jobId];
        if (!status) return <div key={jobId}>Loading...</div>;

        return (
          <div key={jobId} className="job-status">
            <p>{status.currentTask || 'Queued'}</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${status.progress}%` }}
              >
                {status.progress}%
              </div>
            </div>
            <p className="job-state">{status.status}</p>
          </div>
        );
      })}

      {transcodingComplete && (
        <div className="success-message">
          Video processing complete! You can now preview and publish.
        </div>
      )}
    </div>
  );
}

// Usage
function MediaUploadForm() {
  const [uploadedJobIds, setUploadedJobIds] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];

    // Upload file and get media item
    const formData = new FormData();
    formData.append('files', file);

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const [uploadedFile] = await uploadRes.json();

    // Create media item
    const mediaRes = await fetch('/api/media-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          title: file.name.split('.')[0],
          type: 'testimony',
          visibility: 'public',
          releasedAt: new Date().toISOString(),
        },
      }),
    });
    const mediaItem = await mediaRes.json();

    // Queue transcoding
    const transcodeRes = await fetch('/api/media-transcode/quick-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaItemId: mediaItem.data.id,
        sourceFileUrl: uploadedFile.url,
        sourceFileName: uploadedFile.name,
      }),
    });
    const transcodeResult = await transcodeRes.json();

    setUploadedJobIds(transcodeResult.jobIds);
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={handleUpload}
      />

      {uploadedJobIds && (
        <VideoTranscodingStatus
          jobIds={uploadedJobIds}
        />
      )}
    </div>
  );
}
```

### HTML/JavaScript Example

```html
<div id="video-upload">
  <input
    type="file"
    id="videoFile"
    accept="video/*"
  />
  <button onclick="handleUpload()">Upload Video</button>
  <div id="status"></div>
</div>

<script>
async function handleUpload() {
  const file = document.getElementById('videoFile').files[0];

  // Upload and get URL
  const formData = new FormData();
  formData.append('files', file);

  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  const [uploadedFile] = await uploadRes.json();

  // Queue transcoding
  const res = await fetch('/api/media-transcode/quick-queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaItemId: 123, // From context
      sourceFileUrl: uploadedFile.url,
      sourceFileName: uploadedFile.name,
    }),
  });
  const data = await res.json();

  // Monitor progress
  monitorProgress(data.jobIds);
}

async function monitorProgress(jobIds) {
  const statusDiv = document.getElementById('status');

  const interval = setInterval(async () => {
    let allDone = true;

    for (const jobId of jobIds) {
      const res = await fetch(`/api/media-transcode/status/${jobId}`);
      const status = await res.json();

      statusDiv.innerHTML += `
        <p>${status.currentTask}: ${status.progress}%</p>
      `;

      if (status.status !== 'completed') {
        allDone = false;
      }
    }

    if (allDone) {
      clearInterval(interval);
      statusDiv.innerHTML += '<p>Complete!</p>';
    }
  }, 2000);
}
</script>
```

## Advanced Usage

### Custom Transcode Resolutions

```typescript
const response = await fetch('/api/media-transcode/queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mediaItemId: 123,
    sourceFileUrl: 'https://...',
    sourceFileName: 'video.mp4',
    mediaType: 'video',
    jobType: 'transcode',
    resolutions: [
      { width: 4096, height: 2160, bitrate: '20000k', label: '4K' },
      { width: 1920, height: 1080, bitrate: '5000k', label: '1080p' },
      { width: 640, height: 360, bitrate: '500k', label: '360p' },
    ]
  })
});
```

### Custom Thumbnails

```typescript
// Get video duration first
const ffprobeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 "${videoPath}"`;

// Extract thumbnails at specific percentages
const videoDuration = 3600; // seconds
const response = await fetch('/api/media-transcode/queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mediaItemId: 123,
    sourceFileUrl: 'https://...',
    sourceFileName: 'video.mp4',
    mediaType: 'video',
    jobType: 'thumbnail',
    thumbnailTimestamps: [
      videoDuration * 0.05,  // 5%
      videoDuration * 0.25,  // 25%
      videoDuration * 0.50,  // 50%
      videoDuration * 0.75,  // 75%
      videoDuration * 0.95,  // 95%
    ]
  })
});
```

### Extract Audio

```typescript
// MP3 (default)
const mp3Response = await fetch('/api/media-transcode/queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mediaItemId: 123,
    sourceFileUrl: 'https://...',
    sourceFileName: 'video.mp4',
    mediaType: 'video',
    jobType: 'extract-audio',
    audioFormat: 'mp3'
  })
});

// AAC for podcasts
const aacResponse = await fetch('/api/media-transcode/queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mediaItemId: 123,
    sourceFileUrl: 'https://...',
    sourceFileName: 'video.mp4',
    mediaType: 'video',
    jobType: 'extract-audio',
    audioFormat: 'aac'
  })
});
```

### Error Handling

```typescript
async function monitorJobWithErrorHandling(jobId) {
  const maxAttempts = 300; // 10 minutes with 2-second polling
  let attempts = 0;

  const pollStatus = async () => {
    const res = await fetch(`/api/media-transcode/status/${jobId}`);
    if (!res.ok) {
      throw new Error(`Failed to get job status: ${res.status}`);
    }

    const status = await res.json();

    if (status.status === 'failed') {
      throw new Error(`Transcoding failed: ${status.errors?.[0]}`);
    }

    if (status.status === 'completed') {
      return status;
    }

    if (++attempts > maxAttempts) {
      throw new Error('Transcoding timeout');
    }

    // Continue polling
    await new Promise(resolve => setTimeout(resolve, 2000));
    return pollStatus();
  };

  try {
    const result = await pollStatus();
    console.log('Transcoding successful:', result);
    return result;
  } catch (error) {
    console.error('Transcoding error:', error.message);
    throw error;
  }
}
```

## Integration with Media Player

```typescript
async function loadVideoPlayer(mediaItemId) {
  // Get transcoding results
  const transcodeService = strapi.service('api::media-transcoding-results');
  const results = await transcodeService.getTranscodingResults(mediaItemId);

  if (results.status !== 'completed') {
    return null; // Video not ready
  }

  // Get available qualities
  const qualities = await transcodeService.getAvailableQualities(mediaItemId);

  // Initialize video.js with HLS playlist or direct sources
  const player = videojs('player', {
    controls: true,
    autoplay: false,
    preload: 'auto',
    sources: qualities.map(q => ({
      src: q.url,
      type: 'video/mp4',
      res: parseInt(q.resolution),
      label: q.resolution,
    }))
  });

  return player;
}
```

## Webhook Integration (Future)

When webhook support is added:

```typescript
// Listen for transcoding completion
strapi.on('media-transcoding:complete', async (event) => {
  const { mediaItemId, results } = event;

  // Update media item
  await strapi.entityService.update(
    'api::media-item.media-item',
    mediaItemId,
    {
      data: {
        transcodingResults: results,
        published: true, // Auto-publish if needed
      }
    }
  );

  // Send notification
  await strapi.service('api::notification.notification-service').send({
    userId: mediaItem.createdBy.id,
    message: 'Your video is ready to watch!',
  });
});
```
