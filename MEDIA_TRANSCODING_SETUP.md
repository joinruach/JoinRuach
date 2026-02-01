# Media Transcoding Pipeline Setup

This document describes the FFmpeg-based transcoding worker system for processing video uploads and generating multiple formats.

## Architecture

The transcoding system uses BullMQ (backed by Redis) to manage asynchronous transcoding jobs. The system is composed of:

1. **Media Transcoding Queue** (`src/services/media-transcoding-queue.ts`)
   - BullMQ queue for managing transcoding jobs
   - Supports multiple job types: transcode, thumbnail, extract-audio
   - Progress tracking and status updates

2. **Transcode Worker** (`src/services/transcode-worker.ts`)
   - Executes FFmpeg commands for video processing
   - Handles downloading source files from R2
   - Uploads processed files back to R2
   - Supports concurrent processing

3. **API Endpoints** (`src/api/media-transcode/`)
   - Queue new transcoding jobs
   - Get job status
   - List jobs for a media item
   - Retrieve transcoding results

4. **Results Management** (`src/services/media-transcoding-results.ts`)
   - Store and retrieve transcoding results
   - Access convenient methods for video qualities, audio, thumbnails

## Setup

### Prerequisites

1. **FFmpeg Installation**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install ffmpeg

   # macOS
   brew install ffmpeg

   # Docker (included in deployment)
   ```

2. **Redis Connection**
   - Must be configured via environment variables
   - See `src/services/donation-thankyou-queue.ts` for connection setup

3. **Cloudflare R2 Access**
   - `R2_ENDPOINT` - R2 endpoint URL
   - `R2_ACCESS_KEY_ID` - R2 access key
   - `R2_SECRET_ACCESS_KEY` - R2 secret key
   - `R2_BUCKET_NAME` - Target bucket (default: "ruach-media")
   - `R2_PUBLIC_URL` - Public URL for R2 bucket
   - `R2_REGION` - Region (default: "auto")

4. **Environment Variables**
   ```env
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your-password
   REDIS_TLS=false

   # Cloudflare R2
   R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret-key
   R2_BUCKET_NAME=ruach-media
   R2_PUBLIC_URL=https://media.yourdomain.com
   R2_REGION=auto
   ```

### Initialization

The queue is automatically initialized in `src/index.ts` during bootstrap:

```typescript
await initializeMediaTranscodingQueue({ strapi });
```

## API Endpoints

### 1. Queue Transcoding Job

**POST** `/api/media-transcode/queue`

Queue a specific transcoding job (transcode, thumbnail, or audio extraction).

**Request Body:**
```json
{
  "mediaItemId": 123,
  "sourceFileUrl": "https://r2-bucket.r2.cloudflarestorage.com/uploads/video.mp4",
  "sourceFileName": "video.mp4",
  "mediaType": "video",
  "jobType": "transcode",
  "resolutions": [
    {
      "width": 1920,
      "height": 1080,
      "bitrate": "5000k",
      "label": "1080p"
    },
    {
      "width": 1280,
      "height": 720,
      "bitrate": "2500k",
      "label": "720p"
    },
    {
      "width": 854,
      "height": 480,
      "bitrate": "1000k",
      "label": "480p"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "transcode:123:transcode:1706824523456",
  "mediaItemId": 123,
  "jobType": "transcode"
}
```

### 2. Quick Queue (All Transcoding)

**POST** `/api/media-transcode/quick-queue`

Queue all standard transcoding jobs at once (1080p, 720p, 480p, thumbnails, audio).

**Request Body:**
```json
{
  "mediaItemId": 123,
  "sourceFileUrl": "https://r2-bucket.r2.cloudflarestorage.com/uploads/video.mp4",
  "sourceFileName": "video.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "mediaItemId": 123,
  "jobIds": [
    "transcode:123:transcode:1706824523456",
    "transcode:123:thumbnail:1706824523457",
    "transcode:123:extract-audio:1706824523458"
  ],
  "message": "Queued transcodes (1080p, 720p, 480p), thumbnails, and audio extraction"
}
```

### 3. Get Job Status

**GET** `/api/media-transcode/status/:jobId`

Get the current status and progress of a transcoding job.

**Response:**
```json
{
  "jobId": "transcode:123:transcode:1706824523456",
  "status": "processing",
  "progress": 45,
  "currentTask": "Transcoding to 720p",
  "startedAt": "2024-02-01T10:30:00Z",
  "completedAt": null
}
```

Possible status values: `pending`, `processing`, `completed`, `failed`

### 4. List Media Jobs

**GET** `/api/media-transcode/jobs/:mediaItemId`

List all transcoding jobs for a specific media item.

**Response:**
```json
{
  "mediaItemId": 123,
  "jobs": [
    {
      "jobId": "transcode:123:transcode:1706824523456",
      "type": "transcode",
      "status": "completed"
    },
    {
      "jobId": "transcode:123:thumbnail:1706824523457",
      "type": "thumbnail",
      "status": "completed"
    },
    {
      "jobId": "transcode:123:extract-audio:1706824523458",
      "type": "extract-audio",
      "status": "processing"
    }
  ]
}
```

## Job Types

### 1. Transcode (`transcode`)

Encodes video to multiple resolutions with H.264 codec.

**Parameters:**
- `resolutions`: Array of resolution objects with width, height, bitrate, and label

**Output:**
- MP4 files with H.264 video and AAC audio
- Stored at `media/{mediaItemId}/transcodes/`

**Example:**
```javascript
{
  type: "transcode",
  mediaItemId: 123,
  sourceFileUrl: "...",
  sourceFileName: "video.mp4",
  mediaType: "video",
  resolutions: [
    { width: 1920, height: 1080, bitrate: "5000k", label: "1080p" },
    { width: 1280, height: 720, bitrate: "2500k", label: "720p" },
    { width: 854, height: 480, bitrate: "1000k", label: "480p" }
  ]
}
```

### 2. Thumbnail (`thumbnail`)

Extracts thumbnail images at specified timestamps.

**Parameters:**
- `thumbnailTimestamps`: Array of timestamps in seconds

**Output:**
- JPEG images (320x180)
- Stored at `media/{mediaItemId}/thumbnails/`

**Example:**
```javascript
{
  type: "thumbnail",
  mediaItemId: 123,
  sourceFileUrl: "...",
  sourceFileName: "video.mp4",
  mediaType: "video",
  thumbnailTimestamps: [10, 30, 50] // 10%, 30%, 50% of duration
}
```

### 3. Extract Audio (`extract-audio`)

Extracts audio track from video.

**Parameters:**
- `audioFormat`: Output format ("mp3", "aac", "ogg") - default: "mp3"

**Output:**
- Audio file in specified format
- Stored at `media/{mediaItemId}/audio/`

**Example:**
```javascript
{
  type: "extract-audio",
  mediaItemId: 123,
  sourceFileUrl: "...",
  sourceFileName: "video.mp4",
  mediaType: "video",
  audioFormat: "mp3"
}
```

## Media Item Schema Updates

The `media-item` content type now includes:

```json
{
  "transcodingResults": {
    "type": "json",
    "description": "Transcoding results with URLs and metadata"
  },
  "transcodingStatus": {
    "type": "enumeration",
    "enum": ["pending", "processing", "completed", "failed", "not_started"],
    "default": "not_started"
  },
  "transcodingError": {
    "type": "text",
    "description": "Last error message if transcoding failed"
  }
}
```

## Accessing Transcoding Results

The `media-transcoding-results` service provides convenient methods:

```typescript
const transcodeService = strapi.service('api::media-transcoding-results');

// Get overall transcoding status
const results = await transcodeService.getTranscodingResults(mediaItemId);

// Get available video qualities
const qualities = await transcodeService.getAvailableQualities(mediaItemId);

// Get audio download URL
const audioUrl = await transcodeService.getAudioUrl(mediaItemId);

// Get thumbnail URLs
const thumbnails = await transcodeService.getThumbnailUrls(mediaItemId);

// Get HLS playlist URL (if implemented)
const hlsUrl = await transcodeService.getHLSPlaylistUrl(mediaItemId);
```

## Job Configuration

### Queue Settings
- **Concurrency**: 1 (processes one job at a time to avoid overwhelming the server)
- **Attempts**: 2 (retries failed jobs once)
- **Backoff**: Exponential with 1-minute initial delay
- **Retention**: Completed jobs kept for 24 hours, failed jobs for 7 days

### Progress Tracking
- Progress updates sent to Redis during processing
- Clients can poll the status endpoint to track progress
- Current task description provided (e.g., "Transcoding to 720p")

## Error Handling

Failed jobs are stored with error messages. Retrieve via status endpoint or media item `transcodingError` field.

**Common Issues:**
1. **FFmpeg not installed**: Install via system package manager
2. **R2 credentials invalid**: Verify environment variables
3. **Insufficient disk space**: Ensure temp directory has space
4. **Source file unreachable**: Verify R2 URL is accessible

## Performance Considerations

1. **Processing Time**
   - Depends on video duration and resolution
   - 1080p encoding typically takes 2-5x real-time
   - Thumbnail generation is fast (~1 second per image)

2. **Disk Space**
   - Temporary directory needs ~2x source file size
   - Cleaned up after upload to R2

3. **Memory**
   - FFmpeg uses 200-500MB per encoding job
   - Single concurrent job limits memory usage

4. **Network**
   - Download from R2: ~100-500 Mbps
   - Upload to R2: ~100-500 Mbps

## Future Enhancements

1. **HLS Streaming** - Segment video for adaptive streaming
2. **WebP Thumbnails** - Better compression for thumbnails
3. **Parallel Processing** - Process multiple jobs concurrently
4. **Webhook Notifications** - Notify when transcoding completes
5. **Progress Events** - Real-time WebSocket updates
6. **Quality Presets** - Pre-defined encoding profiles

## Monitoring

Monitor the transcoding queue via:
1. Redis logs
2. Strapi logs (filter for `[media-transcoding]` and `[transcode-worker]`)
3. Database (media item `transcodingStatus` field)
4. API status endpoints

## Deployment

The system is designed for:
1. **Standalone servers** - Uses local FFmpeg installation
2. **Container deployment** - FFmpeg included in Docker image
3. **Serverless** - NOT recommended due to FFmpeg overhead

For production deployment, ensure:
- FFmpeg is pre-installed
- Redis is highly available
- R2 credentials are secure
- Adequate disk space for temp files
- Monitor transcoding queue health
