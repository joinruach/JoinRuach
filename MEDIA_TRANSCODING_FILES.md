# Media Transcoding Implementation - File Summary

This document lists all files created and modified for the FFmpeg transcoding worker system.

## New Files Created

### 1. Core Services

#### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/ruach-ministries-backend/src/services/media-transcoding-queue.ts`
- **Purpose**: BullMQ queue management for transcoding jobs
- **Key Exports**:
  - `initializeMediaTranscodingQueue()` - Initialize the queue and worker
  - `enqueueTranscodingJob()` - Queue a new job
  - `getTranscodingJobStatus()` - Get job status
  - `listMediaTranscodingJobs()` - List jobs for media item
  - `shutdownMediaTranscodingQueue()` - Graceful shutdown
- **Job Types**: transcode, thumbnail, extract-audio
- **Features**:
  - Progress tracking
  - Automatic retries (2 attempts)
  - Job priority support
  - Result storage in Redis

#### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/ruach-ministries-backend/src/services/transcode-worker.ts`
- **Purpose**: FFmpeg transcoding execution
- **Key Methods**:
  - `processTranscodingJob()` - Main job processor
  - `_downloadFromR2()` - Download source file
  - `_uploadToR2()` - Upload processed files
  - `_getVideoMetadata()` - Extract video info
  - `_processTranscodes()` - H.264 transcoding
  - `_processThumbnails()` - Thumbnail extraction
  - `_processAudioExtraction()` - Audio extraction
- **Features**:
  - FFmpeg command execution
  - Progress updates
  - Temp file management
  - R2 integration
  - Error handling with cleanup

#### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/ruach-ministries-backend/src/services/media-transcoding-results.ts`
- **Purpose**: Store and retrieve transcoding results
- **Key Methods**:
  - `updateMediaItemWithResults()` - Update media item with results
  - `getTranscodingResults()` - Fetch results
  - `clearTranscodingResults()` - Clear results
  - `getHLSPlaylistUrl()` - Get HLS playlist
  - `getAvailableQualities()` - Get video qualities
  - `getAudioUrl()` - Get audio download URL
  - `getThumbnailUrls()` - Get thumbnail URLs
- **Features**:
  - Stores results in media item JSON
  - Helper methods for common queries
  - Error handling and logging

### 2. API Endpoints

#### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/ruach-ministries-backend/src/api/media-transcode/controllers/media-transcode.ts`
- **Endpoints**:
  - `POST /api/media-transcode/queue` - Queue specific job
  - `GET /api/media-transcode/status/:jobId` - Get job status
  - `GET /api/media-transcode/jobs/:mediaItemId` - List media jobs
  - `POST /api/media-transcode/quick-queue` - Queue all standard jobs
- **Features**:
  - Input validation
  - Media item verification
  - Job queuing
  - Status retrieval
  - Error responses

#### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/ruach-ministries-backend/src/api/media-transcode/routes/media-transcode.ts`
- **Routes Configuration**:
  - POST /api/media-transcode/queue
  - GET /api/media-transcode/status/:jobId
  - GET /api/media-transcode/jobs/:mediaItemId
  - POST /api/media-transcode/quick-queue

#### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/ruach-ministries-backend/src/api/media-transcode/services/transcode-worker.ts`
- **Purpose**: Service wrapper for transcode worker implementation
- **Integrates**: Transcode worker logic with Strapi service layer

#### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/ruach-ministries-backend/src/api/media-transcode/index.ts`
- **Purpose**: API plugin entry point

### 3. Documentation

#### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/MEDIA_TRANSCODING_SETUP.md`
- **Contents**:
  - Architecture overview
  - Setup instructions
  - Environment variable configuration
  - API endpoint documentation
  - Job type specifications
  - Schema updates
  - Error handling
  - Performance considerations
  - Deployment guidelines

#### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/MEDIA_TRANSCODING_EXAMPLES.md`
- **Contents**:
  - Quick start examples
  - Frontend integration (React, HTML/JS)
  - Advanced usage patterns
  - Custom transcoding resolutions
  - Error handling examples
  - Media player integration
  - Webhook integration (future)

#### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/MEDIA_TRANSCODING_FILES.md`
- This file - complete file listing and descriptions

## Modified Files

### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/ruach-ministries-backend/src/index.ts`
**Changes**:
- Added import for `initializeMediaTranscodingQueue` and `shutdownMediaTranscodingQueue`
- Added queue initialization in bootstrap phase
- Added queue shutdown in destroy phase

**Lines Modified**:
- Line 7: Added import
- Line 53: Added initialization call
- Lines 112-114: Added shutdown call

### `/sessions/great-brave-maxwell/mnt/ruach-new/ruach-monorepo/ruach-ministries-backend/src/api/media-item/content-types/media-item/schema.json`
**Changes**:
- Added `transcodingResults` field (JSON) - stores transcoding output URLs and metadata
- Added `transcodingStatus` field (enum) - tracks processing state
- Added `transcodingError` field (text) - stores error messages

**New Attributes**:
```json
{
  "transcodingResults": { "type": "json" },
  "transcodingStatus": { "type": "enumeration", "enum": [...] },
  "transcodingError": { "type": "text" }
}
```

## Directory Structure

```
ruach-ministries-backend/
├── src/
│   ├── services/
│   │   ├── media-transcoding-queue.ts          [NEW]
│   │   ├── transcode-worker.ts                 [NEW]
│   │   └── media-transcoding-results.ts        [NEW]
│   ├── api/
│   │   └── media-transcode/                    [NEW DIRECTORY]
│   │       ├── controllers/
│   │       │   └── media-transcode.ts          [NEW]
│   │       ├── routes/
│   │       │   └── media-transcode.ts          [NEW]
│   │       ├── services/
│   │       │   └── transcode-worker.ts         [NEW]
│   │       └── index.ts                        [NEW]
│   └── index.ts                                [MODIFIED]
└── documentation/
    ├── MEDIA_TRANSCODING_SETUP.md              [NEW]
    ├── MEDIA_TRANSCODING_EXAMPLES.md           [NEW]
    └── MEDIA_TRANSCODING_FILES.md              [NEW - THIS FILE]
```

## Dependencies Used

### Existing Dependencies
- `bullmq` (^5.63.0) - Queue management
- `redis` (^4.7.0) - Cache and queue backend
- `@strapi/strapi` (5.30.1) - Framework
- `form-data` (^4.0.4) - Multipart requests
- `uuid` (^9.0.1) - ID generation

### System Dependencies
- `ffmpeg` - Video encoding (must be installed separately)
- `ffprobe` - Video metadata extraction (included with ffmpeg)

### New Dependencies (Optional)
- `@aws-sdk/client-s3` (already in package.json) - R2 uploads
- `node:child_process` - FFmpeg execution (built-in)
- `node:fs` - File operations (built-in)
- `node:path` - Path handling (built-in)
- `node:os` - OS operations (built-in)

## API Quick Reference

### Queue Job
```
POST /api/media-transcode/queue
```
Payload: mediaItemId, sourceFileUrl, sourceFileName, mediaType, jobType, [resolutions/thumbnailTimestamps/audioFormat]

### Get Status
```
GET /api/media-transcode/status/:jobId
```
Returns: jobId, status, progress, currentTask, startedAt, completedAt, results, errors

### List Jobs
```
GET /api/media-transcode/jobs/:mediaItemId
```
Returns: mediaItemId, jobs[]

### Quick Queue All
```
POST /api/media-transcode/quick-queue
```
Payload: mediaItemId, sourceFileUrl, sourceFileName
Returns: jobIds for transcode, thumbnail, and audio extraction jobs

## Database Schema Changes

### Media Item
Added three new fields to `api::media-item.media-item`:

1. **transcodingResults** (JSON)
   - Stores: Video qualities, thumbnail URLs, audio URL
   - Format: { transcodes[], thumbnails[], audio{}, hlsPlaylist{} }

2. **transcodingStatus** (Enum)
   - Values: not_started, pending, processing, completed, failed
   - Default: not_started

3. **transcodingError** (Text)
   - Stores error message if transcoding fails

## Environment Variables Required

```env
# Redis Connection (required)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Cloudflare R2 (required for file storage)
R2_ENDPOINT=https://account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=ruach-media
R2_PUBLIC_URL=https://media.yourdomain.com
R2_REGION=auto
```

## Testing Checklist

- [ ] FFmpeg is installed and accessible
- [ ] Redis connection works
- [ ] R2 credentials are valid
- [ ] Temp directory has write permissions
- [ ] Queue initializes without errors
- [ ] Can queue a transcode job
- [ ] Can get job status
- [ ] Can list media jobs
- [ ] Transcoding completes successfully
- [ ] Files are uploaded to R2
- [ ] Results are stored in media item
- [ ] Error handling works for failures

## Performance Benchmarks

### Typical Processing Times (per operation)
- 1080p encode: 2-5x real-time duration
- 720p encode: 1-2x real-time duration
- 480p encode: 0.5-1x real-time duration
- Thumbnail generation: ~1 second per image
- Audio extraction: ~0.1-0.5x real-time duration

### Resource Usage
- Memory: 200-500MB per concurrent job
- Disk: ~2x source file size (temporary)
- Network: 100-500 Mbps (depends on ISP)

## Support & Troubleshooting

### Common Issues
1. **FFmpeg not found**: Install via system package manager
2. **R2 upload fails**: Check credentials and bucket name
3. **Job never completes**: Check Redis connection and worker logs
4. **Out of disk space**: Monitor temp directory cleanup
5. **Slow transcoding**: Reduce resolutions or disable concurrent jobs

### Logging
- Strapi logs: `[media-transcoding]` and `[transcode-worker]` prefixes
- Redis logs: Monitor queue activity
- System logs: Check FFmpeg errors

## Future Enhancements
- [ ] HLS streaming segment generation
- [ ] Webhook notifications on completion
- [ ] Real-time progress via WebSocket
- [ ] Video quality presets
- [ ] Adaptive bitrate selection
- [ ] WebP thumbnail generation
- [ ] Parallel multi-resolution encoding
- [ ] Resume capability for large files
