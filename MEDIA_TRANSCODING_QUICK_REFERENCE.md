# Media Transcoding Quick Reference

Fast reference guide for using the media transcoding API.

## Installation

```bash
# Install FFmpeg
# Ubuntu/Debian:
sudo apt-get install ffmpeg

# macOS:
brew install ffmpeg

# Check installation
ffmpeg -version
ffprobe -version
```

## Environment Setup

Add to `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

R2_ENDPOINT=https://account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=ruach-media
R2_PUBLIC_URL=https://media.yourdomain.com
R2_REGION=auto
```

## API Endpoints

### Queue All Standard Jobs (Recommended)
```bash
curl -X POST http://localhost:1337/api/media-transcode/quick-queue \
  -H "Content-Type: application/json" \
  -d '{
    "mediaItemId": 123,
    "sourceFileUrl": "https://r2.../video.mp4",
    "sourceFileName": "video.mp4"
  }'
```

### Queue Specific Job Type
```bash
# Transcode to multiple resolutions
curl -X POST http://localhost:1337/api/media-transcode/queue \
  -H "Content-Type: application/json" \
  -d '{
    "mediaItemId": 123,
    "sourceFileUrl": "https://r2.../video.mp4",
    "sourceFileName": "video.mp4",
    "mediaType": "video",
    "jobType": "transcode",
    "resolutions": [
      {"width": 1920, "height": 1080, "bitrate": "5000k", "label": "1080p"},
      {"width": 1280, "height": 720, "bitrate": "2500k", "label": "720p"},
      {"width": 854, "height": 480, "bitrate": "1000k", "label": "480p"}
    ]
  }'

# Extract thumbnails
curl -X POST http://localhost:1337/api/media-transcode/queue \
  -H "Content-Type: application/json" \
  -d '{
    "mediaItemId": 123,
    "sourceFileUrl": "https://r2.../video.mp4",
    "sourceFileName": "video.mp4",
    "mediaType": "video",
    "jobType": "thumbnail",
    "thumbnailTimestamps": [10, 30, 50]
  }'

# Extract audio
curl -X POST http://localhost:1337/api/media-transcode/queue \
  -H "Content-Type: application/json" \
  -d '{
    "mediaItemId": 123,
    "sourceFileUrl": "https://r2.../video.mp4",
    "sourceFileName": "video.mp4",
    "mediaType": "video",
    "jobType": "extract-audio",
    "audioFormat": "mp3"
  }'
```

### Get Job Status
```bash
curl http://localhost:1337/api/media-transcode/status/transcode:123:transcode:1234567890
```

Response:
```json
{
  "jobId": "transcode:123:transcode:1234567890",
  "status": "processing",
  "progress": 45,
  "currentTask": "Transcoding to 720p",
  "startedAt": "2024-02-01T10:30:00Z"
}
```

### List All Jobs for Media Item
```bash
curl http://localhost:1337/api/media-transcode/jobs/123
```

Response:
```json
{
  "mediaItemId": 123,
  "jobs": [
    {"jobId": "...", "type": "transcode", "status": "completed"},
    {"jobId": "...", "type": "thumbnail", "status": "completed"},
    {"jobId": "...", "type": "extract-audio", "status": "processing"}
  ]
}
```

## Service Methods

```typescript
// In any Strapi service/controller:

const transcodeService = strapi.service('api::media-transcoding-results');

// Get all results
const results = await transcodeService.getTranscodingResults(mediaItemId);

// Get video qualities
const qualities = await transcodeService.getAvailableQualities(mediaItemId);

// Get audio URL
const audioUrl = await transcodeService.getAudioUrl(mediaItemId);

// Get thumbnails
const thumbnails = await transcodeService.getThumbnailUrls(mediaItemId);
```

## Queue a Job Directly

```typescript
import {
  enqueueTranscodingJob,
  type TranscodingJobData
} from '../services/media-transcoding-queue';

const jobData: TranscodingJobData = {
  type: 'transcode',
  mediaItemId: 123,
  sourceFileUrl: 'https://...',
  sourceFileName: 'video.mp4',
  mediaType: 'video',
  resolutions: [
    { width: 1920, height: 1080, bitrate: '5000k', label: '1080p' }
  ],
  r2BucketName: 'ruach-media',
  r2OutputPath: 'media/123'
};

const jobId = await enqueueTranscodingJob(strapi, jobData);
```

## Common Use Cases

### Upload Video and Process
```typescript
// 1. Upload to R2
const file = await uploadToR2(videoFile);

// 2. Create media item
const mediaItem = await strapi.entityService.create('api::media-item.media-item', {
  data: { title: 'Video', type: 'testimony', releasedAt: new Date() }
});

// 3. Queue transcoding
const response = await fetch('/api/media-transcode/quick-queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mediaItemId: mediaItem.id,
    sourceFileUrl: file.url,
    sourceFileName: file.name
  })
});
```

### Monitor Until Complete
```typescript
async function waitForTranscoding(jobId, timeout = 3600000) {
  const startTime = Date.now();

  while (true) {
    const res = await fetch(`/api/media-transcode/status/${jobId}`);
    const status = await res.json();

    if (status.status === 'completed') {
      return status.results;
    }

    if (status.status === 'failed') {
      throw new Error(`Transcoding failed: ${status.errors[0]}`);
    }

    if (Date.now() - startTime > timeout) {
      throw new Error('Transcoding timeout');
    }

    await new Promise(r => setTimeout(r, 2000));
  }
}

const results = await waitForTranscoding('transcode:123:transcode:...');
```

### Display Video with Quality Selection
```typescript
async function loadVideoPlayer(mediaItemId) {
  const transcodeService = strapi.service('api::media-transcoding-results');
  const qualities = await transcodeService.getAvailableQualities(mediaItemId);

  const videoElement = document.getElementById('video');

  // Create quality selector
  const select = document.createElement('select');
  qualities.forEach(q => {
    const option = document.createElement('option');
    option.value = q.url;
    option.text = q.resolution;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    videoElement.src = select.value;
    videoElement.play();
  });

  // Set initial quality (highest)
  if (qualities.length > 0) {
    videoElement.src = qualities[0].url;
  }

  document.body.appendChild(select);
  document.body.appendChild(videoElement);
}
```

## Status Values

- `pending` - Job queued, waiting to process
- `processing` - Currently being processed
- `completed` - Successfully completed
- `failed` - Failed with error

## Media Item Fields

After transcoding completes, check:

```typescript
const mediaItem = await strapi.entityService.findOne(
  'api::media-item.media-item',
  id
);

mediaItem.transcodingStatus;    // "completed" | "processing" | "failed"
mediaItem.transcodingResults;   // { transcodes[], thumbnails[], audio{} }
mediaItem.transcodingError;     // Error message if failed
```

## Troubleshooting

### FFmpeg not found
```bash
# Verify installation
which ffmpeg

# If not found, install:
sudo apt-get install ffmpeg  # Ubuntu/Debian
brew install ffmpeg          # macOS
```

### Redis connection error
```bash
# Test Redis
redis-cli ping  # Should return "PONG"

# Check connection string
echo $REDIS_HOST
echo $REDIS_PORT
```

### R2 upload failing
```bash
# Test R2 credentials with AWS CLI
aws s3 ls s3://your-bucket --endpoint-url $R2_ENDPOINT

# If fails, verify:
echo $R2_ACCESS_KEY_ID
echo $R2_SECRET_ACCESS_KEY
echo $R2_ENDPOINT
```

### Job never completes
```bash
# Check worker logs
tail -f logs/strapi.log | grep "transcode-worker"

# Check Redis queue
redis-cli
> LLEN bull:media-transcoding:  # Job queue length
> ZCARD bull:media-transcoding:active  # Active jobs
```

## Performance Tips

### For Speed
```json
{
  "resolutions": [
    {"width": 1280, "height": 720, "bitrate": "1500k", "label": "720p"},
    {"width": 640, "height": 360, "bitrate": "500k", "label": "360p"}
  ]
}
```

### For Quality
```json
{
  "resolutions": [
    {"width": 3840, "height": 2160, "bitrate": "10000k", "label": "4K"},
    {"width": 1920, "height": 1080, "bitrate": "6000k", "label": "1080p"},
    {"width": 1280, "height": 720, "bitrate": "3000k", "label": "720p"}
  ]
}
```

## Environment Check

```bash
#!/bin/bash
echo "=== Transcoding System Check ==="
echo ""

echo "FFmpeg:"
ffmpeg -version | head -1

echo ""
echo "Node.js:"
node -v

echo ""
echo "Redis:"
redis-cli --version

echo ""
echo "Disk Space:"
df -h /tmp

echo ""
echo "Environment Variables:"
env | grep -E "REDIS|R2"
```

## Files Reference

- **Services**: `/src/services/media-transcoding-*.ts`
- **API**: `/src/api/media-transcode/`
- **Docs**:
  - `MEDIA_TRANSCODING_SETUP.md` - Full setup guide
  - `MEDIA_TRANSCODING_EXAMPLES.md` - Detailed examples
  - `MEDIA_TRANSCODING_QUICK_REFERENCE.md` - This file
  - `MEDIA_TRANSCODING_FILES.md` - File listing
  - `MEDIA_TRANSCODING_INTEGRATION_CHECKLIST.md` - Deployment checklist

## Support Resources

- FFmpeg docs: https://ffmpeg.org/documentation.html
- BullMQ docs: https://docs.bullmq.io/
- Redis docs: https://redis.io/documentation
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Strapi docs: https://docs.strapi.io/
