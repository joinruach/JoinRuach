# Ruach Transcription Service - Quick Start Guide

## Installation & Setup

### 1. Environment Configuration

Add these variables to your `.env` file:

```bash
# Required
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxx

# Optional (for production job queuing)
REDIS_URL=redis://localhost:6379

# OR Upstash (serverless alternative)
UPSTASH_REDIS_REST_URL=https://your-workspace.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### 2. Verify Installation

All files should be created. Check:

```bash
# Service file exists
ls -l src/api/library/services/ruach-transcription.ts

# Content type exists
ls -l src/api/library-transcription/

# API endpoints exist
ls -l src/api/ruach-transcription/
```

### 3. Database Migration

When you start Strapi, it will automatically create the `library_transcriptions` table.

## Basic Usage

### Queue a Transcription

```javascript
const response = await fetch('/api/ruach-transcription/transcribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sourceMediaId: 'your-media-id',
    mediaUrl: 'https://r2.bucket/sermon.mp4',
    language: 'en'
  })
});

const { transcriptionId } = await response.json();
console.log('Transcription queued:', transcriptionId);
```

### Check Status

```javascript
const response = await fetch(
  `/api/ruach-transcription/${transcriptionId}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const { data } = await response.json();
console.log('Status:', data.status);
console.log('Progress:', data.status === 'completed' ? 'Done!' : 'Processing...');
```

### Get Results When Complete

```javascript
if (data.status === 'completed') {
  console.log('Transcript:', data.transcriptText);
  console.log('Summary:', data.summary);
  console.log('Key Moments:', data.keyMoments);
  console.log('Duration:', data.durationSeconds, 'seconds');
}
```

### Download Subtitles

```javascript
// VTT format
const vtt = await fetch(
  `/api/ruach-transcription/${transcriptionId}/vtt`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.text());

// SRT format
const srt = await fetch(
  `/api/ruach-transcription/${transcriptionId}/srt`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.text());
```

## API Quick Reference

### Transcription Operations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ruach-transcription/transcribe` | Queue transcription |
| GET | `/api/ruach-transcription/:id` | Get status/results |
| POST | `/api/ruach-transcription/:id/summarize` | Regenerate summary |
| GET | `/api/ruach-transcription/media/:mediaId` | Get by media ID |
| GET | `/api/ruach-transcription/:id/vtt` | Download VTT file |
| GET | `/api/ruach-transcription/:id/srt` | Download SRT file |

### CRUD Operations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/library-transcriptions` | List all |
| GET | `/api/library-transcriptions/:id` | Get one |
| POST | `/api/library-transcriptions` | Create |
| PUT | `/api/library-transcriptions/:id` | Update |
| DELETE | `/api/library-transcriptions/:id` | Delete |

## Common Scenarios

### Scenario 1: Transcribe Video from R2

```javascript
async function transcribeVideo(mediaId, r2Url) {
  const response = await fetch('/api/ruach-transcription/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      sourceMediaId: mediaId,
      mediaUrl: r2Url,
      language: 'en'
    })
  });

  return (await response.json()).transcriptionId;
}
```

### Scenario 2: Transcribe Uploaded Audio

```javascript
async function transcribeAudio(mediaId, audioFile) {
  const buffer = await audioFile.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  const response = await fetch('/api/ruach-transcription/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      sourceMediaId: mediaId,
      audioBase64: base64,
      language: 'en'
    })
  });

  return (await response.json()).transcriptionId;
}
```

### Scenario 3: Poll for Completion

```javascript
async function waitForCompletion(transcriptionId, maxWait = 3600000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const response = await fetch(
      `/api/ruach-transcription/${transcriptionId}`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );

    const { data } = await response.json();

    if (data.status === 'completed') {
      return data;
    }

    if (data.status === 'failed') {
      throw new Error(`Transcription failed: ${data.metadata?.error}`);
    }

    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Transcription timeout');
}
```

### Scenario 4: Get All Transcriptions for Media

```javascript
async function getMediaTranscriptions(mediaId) {
  const response = await fetch(
    `/api/ruach-transcription/media/${mediaId}`,
    { headers: { 'Authorization': `Bearer ${authToken}` } }
  );

  return (await response.json()).data;
}
```

## Subtitle Formats

### VTT Format
```
WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to our message today.

00:00:05.000 --> 00:00:10.000
We're excited to share with you.
```

### SRT Format
```
1
00:00:00,000 --> 00:00:05,000
Welcome to our message today.

2
00:00:05,000 --> 00:00:10,000
We're excited to share with you.
```

## Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| `pending` | Waiting in queue | Check again soon |
| `processing` | Currently transcribing | Wait, don't retry |
| `completed` | Done | Results available |
| `failed` | Error occurred | Check metadata.error |

## Troubleshooting

### "OPENAI_API_KEY not configured"
- Ensure `OPENAI_API_KEY` is set in `.env`
- Restart Strapi after updating environment

### "Redis not available"
- Normal warning - service uses in-memory queue
- For production, configure Redis or Upstash

### Job stuck in "processing"
- Check Strapi logs for worker errors
- Verify OpenAI API quota
- Check network connectivity

### "Transcription not found"
- Verify transcriptionId is correct
- Check if it belongs to authenticated user's media
- May not be created yet if just queued

## Performance Tips

1. **Use R2 URLs** instead of base64 for large files (better performance)
2. **Batch operations** when possible (queue multiple transcriptions)
3. **Configure Redis** in production (better queue performance)
4. **Monitor API quotas** (OpenAI and Claude usage)
5. **Clean up old transcriptions** periodically (save storage)

## Monitoring

Check job status:
```javascript
async function checkQueueStatus() {
  // Count pending jobs
  const pending = await fetch('/api/library-transcriptions?status=pending', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  // Count processing jobs
  const processing = await fetch('/api/library-transcriptions?status=processing', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  console.log(`Queue Status: ${pending.meta.pagination.total} pending, ${processing.meta.pagination.total} processing`);
}
```

## Support

For detailed documentation, see:
- **TRANSCRIPTION_SERVICE.md** - Complete API documentation
- **IMPLEMENTATION_COMPLETE.md** - Architecture and integration details
- Code comments in source files for function details

## Example: Complete Workflow

```javascript
async function transcribeAndGetResults(mediaId, r2Url) {
  try {
    // 1. Queue transcription
    console.log('Queuing transcription...');
    const queueResponse = await fetch('/api/ruach-transcription/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sourceMediaId: mediaId,
        mediaUrl: r2Url,
        language: 'en'
      })
    });

    const { transcriptionId } = await queueResponse.json();
    console.log(`Transcription queued: ${transcriptionId}`);

    // 2. Poll for completion
    console.log('Waiting for transcription...');
    let result;
    while (true) {
      const statusResponse = await fetch(
        `/api/ruach-transcription/${transcriptionId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      result = (await statusResponse.json()).data;

      if (result.status === 'completed') {
        console.log('Transcription complete!');
        break;
      }

      if (result.status === 'failed') {
        throw new Error(`Failed: ${result.metadata?.error}`);
      }

      await new Promise(r => setTimeout(r, 5000));
    }

    // 3. Process results
    console.log('\n=== Results ===');
    console.log(`Transcript: ${result.transcriptText.substring(0, 100)}...`);
    console.log(`Summary: ${result.summary}`);
    console.log(`Key Moments: ${result.keyMoments.length} found`);
    console.log(`Duration: ${result.durationSeconds} seconds`);

    // 4. Download subtitles
    const vttResponse = await fetch(
      `/api/ruach-transcription/${transcriptionId}/vtt`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const vttContent = await vttResponse.text();
    console.log(`\nVTT file available (${vttContent.length} bytes)`);

    return result;

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}
```

## Quick Links

- Documentation: `ruach-ministries-backend/TRANSCRIPTION_SERVICE.md`
- Service: `ruach-ministries-backend/src/api/library/services/ruach-transcription.ts`
- Content Type: `ruach-ministries-backend/src/api/library-transcription/`
- API: `ruach-ministries-backend/src/api/ruach-transcription/`
