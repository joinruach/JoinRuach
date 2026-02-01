# Ruach Transcription Service

A comprehensive audio/video transcription service for the Ruach backend, powered by OpenAI's Whisper API with advanced features including job queuing, subtitle generation, and AI-powered summarization.

## Overview

The transcription service provides:

- **Audio/Video Transcription**: OpenAI Whisper API integration for accurate speech-to-text
- **Job Queuing**: BullMQ-based queue system for asynchronous processing with retry logic
- **Subtitle Generation**: Automatic VTT and SRT subtitle file generation with timestamps
- **Key Moment Extraction**: AI-powered identification of important segments using Claude
- **Summary Generation**: Claude-powered summaries of transcriptions for quick reference
- **Multiple Input Formats**: Support for both R2 file URLs and base64-encoded audio
- **Flexible Language Support**: Configurable language detection and specification

## Architecture

### Service Components

#### 1. **Transcription Service** (`/src/api/library/services/ruach-transcription.ts`)
   - Core service handling transcription logic
   - Manages BullMQ queue and workers
   - Handles OpenAI Whisper API calls
   - Coordinates subtitle generation and summarization
   - Stores results in the database

#### 2. **Content Type** (`/src/api/library-transcription/`)
   - `schema.json`: Defines the transcription data model
   - `lifecycles.ts`: Lifecycle hooks for validation
   - `controllers/library-transcription.ts`: Standard CRUD operations
   - `routes/library-transcription.ts`: RESTful endpoints

#### 3. **API Controllers** (`/src/api/ruach-transcription/`)
   - `controllers/ruach-transcription.ts`: Custom transcription endpoints
   - `routes/ruach-transcription.ts`: Route definitions
   - Handles job queueing and status retrieval

## Database Schema

### Library Transcription Content Type

```json
{
  "transcriptionId": "UUID - unique identifier",
  "sourceMediaId": "relation to media-item",
  "status": "enum: pending|processing|completed|failed",
  "transcriptText": "full transcribed text",
  "transcriptVTT": "VTT subtitle format",
  "transcriptSRT": "SRT subtitle format",
  "summary": "AI-generated summary",
  "keyMoments": [
    {
      "timestamp": 123.45,
      "endTimestamp": 145.67,
      "description": "Important moment description",
      "confidence": 0.95
    }
  ],
  "durationSeconds": 3600,
  "language": "en",
  "confidence": 0.95,
  "metadata": {}
}
```

## API Endpoints

### Transcription Operations

#### 1. Queue a Transcription Job
```
POST /api/ruach-transcription/transcribe
Content-Type: application/json

{
  "sourceMediaId": "media-item-id",
  "mediaUrl": "https://r2-bucket.example.com/audio.mp4",
  // OR
  "audioBase64": "base64-encoded-audio-data",
  "language": "en"  // optional, defaults to 'en'
}
```

**Response** (202 Accepted):
```json
{
  "transcriptionId": "uuid",
  "status": "pending",
  "message": "Transcription queued for processing"
}
```

#### 2. Get Transcription Status/Results
```
GET /api/ruach-transcription/:transcriptionId
```

**Response**:
```json
{
  "data": {
    "transcriptionId": "uuid",
    "status": "completed|processing|pending|failed",
    "transcriptText": "full transcript...",
    "transcriptVTT": "WEBVTT\n...",
    "transcriptSRT": "1\n00:00:00,000 --> 00:00:05,000\n...",
    "summary": "AI-generated summary...",
    "keyMoments": [...],
    "durationSeconds": 3600,
    "language": "en",
    "confidence": 0.95,
    "createdAt": "2025-02-01T12:00:00Z",
    "updatedAt": "2025-02-01T12:05:00Z"
  }
}
```

#### 3. Regenerate Summary
```
POST /api/ruach-transcription/:transcriptionId/summarize
```

**Response**:
```json
{
  "transcriptionId": "uuid",
  "summary": "Regenerated summary...",
  "message": "Summary generated successfully"
}
```

#### 4. Get Transcription by Media ID
```
GET /api/ruach-transcription/media/:mediaId
```

Returns the most recent transcription for a media item.

#### 5. Download Subtitles

**VTT Format**:
```
GET /api/ruach-transcription/:transcriptionId/vtt
```

**SRT Format**:
```
GET /api/ruach-transcription/:transcriptionId/srt
```

Both return downloadable subtitle files with proper MIME types.

### CRUD Operations

#### List Transcriptions
```
GET /api/library-transcriptions?status=completed&_limit=25&_start=0
```

#### Get Single Transcription
```
GET /api/library-transcriptions/:id
```

#### Create Transcription (manual)
```
POST /api/library-transcriptions
Content-Type: application/json

{
  "sourceMediaId": "media-id",
  "status": "pending",
  "transcriptText": "...",
  "durationSeconds": 3600,
  "language": "en"
}
```

#### Update Transcription
```
PUT /api/library-transcriptions/:id
```

#### Delete Transcription
```
DELETE /api/library-transcriptions/:id
```

## Job Processing Pipeline

### Processing Flow

```
1. User queues transcription (POST /api/ruach-transcription/transcribe)
   ↓
2. Create pending record in database
   ↓
3. Add job to BullMQ queue
   ↓
4. Worker picks up job
   ↓
5. Update status to "processing"
   ↓
6. Download audio (if URL provided) or decode base64
   ↓
7. Call Whisper API for transcription
   ↓
8. Generate VTT/SRT subtitle files
   ↓
9. Extract key moments using Claude
   ↓
10. Generate summary using Claude
   ↓
11. Save results to database
   ↓
12. Update status to "completed"
```

### Error Handling

- Failed jobs automatically retry up to 3 times with exponential backoff
- Failed jobs update transcription status to "failed" with error details
- Errors are logged and can be viewed in the metadata field

## Configuration

### Environment Variables

```bash
# OpenAI API Configuration
OPENAI_API_KEY=sk-...

# Claude API Configuration (for summaries and key moments)
CLAUDE_API_KEY=sk-ant-...

# Redis Configuration (optional, falls back to in-memory)
REDIS_URL=redis://localhost:6379
# OR Upstash (serverless)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Queue Configuration

- **Concurrency**: 3 concurrent transcriptions
- **Max Attempts**: 3 retry attempts per failed job
- **Backoff**: Exponential backoff starting at 2 seconds
- **Cleanup**: Completed jobs removed after 1 hour

## Usage Examples

### Example 1: Transcribe from R2 URL
```typescript
const response = await fetch('/api/ruach-transcription/transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceMediaId: 'media-123',
    mediaUrl: 'https://r2.ruach.media/sermons/sermon-001.mp4',
    language: 'en'
  })
});

const { transcriptionId } = await response.json();

// Poll for results
const checkStatus = async () => {
  const result = await fetch(`/api/ruach-transcription/${transcriptionId}`);
  const { data } = await result.json();

  if (data.status === 'completed') {
    console.log('Transcript:', data.transcriptText);
    console.log('Summary:', data.summary);
    console.log('Key moments:', data.keyMoments);
  }
};
```

### Example 2: Transcribe from Base64 Audio
```typescript
const audioBuffer = await fs.promises.readFile('sermon.mp3');
const base64Audio = audioBuffer.toString('base64');

const response = await fetch('/api/ruach-transcription/transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceMediaId: 'media-456',
    audioBase64: base64Audio,
    language: 'en'
  })
});
```

### Example 3: Download Subtitles
```typescript
// Download VTT
const vttResponse = await fetch(`/api/ruach-transcription/${transcriptionId}/vtt`);
const vttContent = await vttResponse.text();
fs.writeFileSync('subtitles.vtt', vttContent);

// Download SRT
const srtResponse = await fetch(`/api/ruach-transcription/${transcriptionId}/srt`);
const srtContent = await srtResponse.text();
fs.writeFileSync('subtitles.srt', srtContent);
```

## Data Models

### Transcription Record
```typescript
interface TranscriptionRecord {
  id: string;
  transcriptionId: string;  // UUID
  sourceMediaId: string;    // Relation to media-item
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transcriptText: string;
  transcriptVTT: string;
  transcriptSRT: string;
  summary: string;
  keyMoments: KeyMoment[];
  durationSeconds: number;
  language: string;
  confidence: number;  // 0-1
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

### Key Moment
```typescript
interface KeyMoment {
  timestamp: number;        // Seconds
  endTimestamp?: number;    // Optional end time
  description: string;      // 1-2 sentence description
  confidence?: number;      // 0-1
}
```

## Performance Considerations

### Transcription Duration
- **Processing Time**: Approximately 0.5x to 1x real-time duration
  - 1 hour audio = 30-60 minutes processing
  - Depends on audio quality and system load

### API Quotas
- **Whisper API**: Check OpenAI pricing and rate limits
- **Claude API**: Check Anthropic pricing and rate limits

### Database Optimization
- Index on `status` for quick filtering
- Index on `sourceMediaId` for media lookups
- Index on `transcriptionId` for unique lookups

## Integration with Media Items

The transcription service automatically creates relationships with media items:

```typescript
// Get media with transcriptions
const mediaItem = await strapi.entityService.findOne('api::media-item.media-item', mediaId, {
  populate: ['transcriptions']
});

// transcriptions array contains all transcriptions for this media
const transcription = mediaItem.transcriptions?.[0];
```

## Error Handling

### Common Errors

**Error: OPENAI_API_KEY not configured**
- Ensure `OPENAI_API_KEY` environment variable is set

**Error: Whisper API error: 429**
- Rate limit exceeded, job will retry automatically

**Error: Redis not available, using in-memory queue**
- Normal warning if Redis is not configured
- For production, configure Redis or Upstash

## Monitoring and Logging

All operations log to Strapi's logger:

```
[Transcription] Queued job abc123 for media xyz789
[Transcription] Processing job abc123 for media xyz789
[Transcription] Job abc123 completed
[Transcription] Job abc123 failed: error message
```

## Future Enhancements

Potential improvements:

1. **Batch Processing**: Queue multiple transcriptions for processing
2. **Webhooks**: Notify external systems when transcriptions complete
3. **Custom Models**: Support for fine-tuned Whisper models
4. **Speaker Diarization**: Identify different speakers
5. **Emotion Detection**: Analyze emotional tone of transcript
6. **Search Integration**: Full-text search across transcripts
7. **Translation**: Automatic transcription translation

## Troubleshooting

### Queue Not Processing Jobs

1. Check Redis connection (if configured)
2. Verify worker is running in logs
3. Check for error messages in job status
4. Review OpenAI API key and quota

### Transcription Quality Issues

1. Verify audio file is valid and accessible
2. Check language setting matches actual language
3. Try with different audio format/quality
4. Review Whisper API limits

### Memory Issues

1. Reduce queue concurrency in ruach-transcription.ts
2. Use URL-based media instead of base64 for large files
3. Implement cleanup for old transcriptions
4. Monitor Redis memory usage

## Security Considerations

- All endpoints require authentication
- API keys stored in environment variables only
- File URLs should be from trusted sources (R2)
- Base64 audio limited to prevent memory issues
- Transcription data follows media item permissions
