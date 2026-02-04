# Phase 9: API Specification

API endpoints for media ingestion and sync workflow.

---

## POST /v2/sessions

Create a new recording session.

**Request:**
```json
{
  "title": "Sunday Service - Main Sanctuary",
  "date": "2026-02-03",
  "location": "Main Campus",
  "notes": "3-camera setup, sermon + worship",
  "projectId": "proj-abc123"
}
```

**Response:** `201 Created`
```json
{
  "id": "session-xyz789",
  "title": "Sunday Service - Main Sanctuary",
  "date": "2026-02-03",
  "status": "draft",
  "createdAt": "2026-02-03T10:00:00Z",
  "projectId": "proj-abc123"
}
```

**Errors:**
- `400` - Missing required fields
- `401` - Unauthorized

---

## POST /v2/sessions/:id/assets/init-upload

Initialize upload for a media asset.

**Request:**
```json
{
  "cameraLabel": "A",
  "filename": "CAM_A_001.mp4",
  "contentType": "video/mp4",
  "sizeBytes": 5368709120
}
```

**Response:** `200 OK`
```json
{
  "assetId": "asset-abc123",
  "uploadUrl": "https://{account}.r2.cloudflarestorage.com/...",
  "uploadId": "multipart-upload-id",
  "expiresAt": "2026-02-03T11:00:00Z",
  "parts": [
    {
      "partNumber": 1,
      "uploadUrl": "https://..."
    },
    // ... more parts for multipart upload
  ]
}
```

**Errors:**
- `404` - Session not found
- `400` - Invalid camera label or file size
- `409` - Asset already exists for this camera

---

## POST /v2/sessions/:id/assets/:assetId/complete

Mark upload complete and trigger ingestion pipeline.

**Request:**
```json
{
  "uploadId": "multipart-upload-id",
  "parts": [
    { "partNumber": 1, "etag": "abc123..." },
    { "partNumber": 2, "etag": "def456..." }
  ]
}
```

**Response:** `200 OK`
```json
{
  "assetId": "asset-abc123",
  "status": "ingesting",
  "originalUrl": "https://r2.../projects/proj-abc123/20260203/originals/angle-001_v001.mp4",
  "ingestionJobId": "job-123"
}
```

**Errors:**
- `404` - Session or asset not found
- `400` - Invalid upload parts
- `409` - Upload already completed

---

## GET /v2/sessions/:id/assets

List all assets for a session.

**Query Parameters:**
- `includeDerivatives` (boolean) - Include derived media (proxy, mezzanine, audio)

**Response:** `200 OK`
```json
{
  "sessionId": "session-xyz789",
  "assets": [
    {
      "id": "asset-abc123",
      "cameraLabel": "A",
      "originalUrl": "https://r2.../originals/angle-001_v001.mp4",
      "status": "ready",
      "metadata": {
        "durationMs": 1800000,
        "fps": 30,
        "resolution": "1920x1080",
        "codec": "h264"
      },
      "derivatives": [
        {
          "kind": "proxy",
          "url": "https://r2.../proxies/angle-001_v001.mp4",
          "sizeBytes": 52428800
        },
        {
          "kind": "mezzanine",
          "url": "https://r2.../mezzanines/angle-001_v001.mov",
          "sizeBytes": 2147483648
        },
        {
          "kind": "audio-wav",
          "url": "https://r2.../audios/angle-001_v001.wav",
          "sizeBytes": 104857600
        }
      ]
    }
    // ... cameras B and C
  ]
}
```

---

## POST /v2/sessions/:id/sync/compute

Trigger sync analysis for session.

**Request:**
```json
{
  "masterCamera": "A",
  "method": "xcorr"
}
```

**Response:** `202 Accepted`
```json
{
  "sessionId": "session-xyz789",
  "syncJobId": "sync-job-456",
  "status": "syncing",
  "estimatedCompletionMs": 60000
}
```

**Errors:**
- `404` - Session not found
- `400` - Missing audio on one or more cameras
- `409` - Sync already in progress

---

## GET /v2/sessions/:id/sync

Get sync results for session.

**Response:** `200 OK`
```json
{
  "sessionId": "session-xyz789",
  "status": "needs-review",
  "masterCamera": "A",
  "method": "xcorr",
  "offsets": {
    "A": 0,
    "B": 1234,
    "C": -532
  },
  "confidence": {
    "B": 12.4,
    "C": 8.1
  },
  "classification": {
    "B": "looks-good",
    "C": "review-suggested"
  },
  "operatorStatus": "pending",
  "computedAt": "2026-02-03T10:15:00Z",
  "debugArtifacts": {
    "correlationPlot": "https://r2.../sync/correlation-B.png"
  }
}
```

**Response:** `404 Not Found` (if sync not yet computed)

---

## POST /v2/sessions/:id/sync/approve

Approve computed sync offsets.

**Request:**
```json
{
  "approvedBy": "operator-user-id",
  "notes": "Confidence looks good, proceeding"
}
```

**Response:** `200 OK`
```json
{
  "sessionId": "session-xyz789",
  "status": "ready",
  "operatorStatus": "approved",
  "finalOffsets": {
    "A": 0,
    "B": 1234,
    "C": -532
  },
  "approvedAt": "2026-02-03T10:20:00Z"
}
```

---

## POST /v2/sessions/:id/sync/correct

Manually correct sync offsets.

**Request:**
```json
{
  "correctedBy": "operator-user-id",
  "offsets": {
    "A": 0,
    "B": 1250,
    "C": -520
  },
  "notes": "Adjusted B by +16ms, C by +12ms after waveform review"
}
```

**Response:** `200 OK`
```json
{
  "sessionId": "session-xyz789",
  "status": "ready",
  "operatorStatus": "corrected",
  "finalOffsets": {
    "A": 0,
    "B": 1250,
    "C": -520
  },
  "originalOffsets": {
    "A": 0,
    "B": 1234,
    "C": -532
  },
  "correctedAt": "2026-02-03T10:25:00Z"
}
```

---

## GET /v2/sessions/:id/status

Get session processing status.

**Response:** `200 OK`
```json
{
  "sessionId": "session-xyz789",
  "status": "ready",
  "assets": {
    "total": 3,
    "ingested": 3,
    "ready": 3
  },
  "sync": {
    "computed": true,
    "operatorStatus": "approved"
  },
  "readyForNextPhase": true,
  "updatedAt": "2026-02-03T10:20:00Z"
}
```

**Possible Status Values:**
- `draft` - Session created, no assets uploaded
- `ingesting` - One or more assets uploading/processing
- `syncing` - Audio sync analysis in progress
- `needs-review` - Sync complete, awaiting operator review
- `ready` - Approved and ready for next phase

---

## WebSocket: /v2/sessions/:id/events

Subscribe to real-time session updates.

**Events:**
```json
{
  "event": "asset.ingesting",
  "assetId": "asset-abc123",
  "cameraLabel": "A",
  "progress": 0.45
}
```

```json
{
  "event": "asset.ready",
  "assetId": "asset-abc123",
  "cameraLabel": "A"
}
```

```json
{
  "event": "sync.computing",
  "progress": 0.67
}
```

```json
{
  "event": "sync.complete",
  "confidence": {
    "B": 12.4,
    "C": 8.1
  }
}
```

---

## Error Responses

All endpoints follow standard error format:

```json
{
  "error": {
    "code": "SYNC_FAILED",
    "message": "Audio correlation failed for camera C",
    "details": {
      "camera": "C",
      "reason": "No audio track found"
    }
  }
}
```

**Common Error Codes:**
- `SESSION_NOT_FOUND`
- `ASSET_NOT_FOUND`
- `UPLOAD_FAILED`
- `INGESTION_FAILED`
- `SYNC_FAILED`
- `INVALID_CAMERA_LABEL`
- `MISSING_AUDIO_TRACK`
- `VFR_CONVERSION_FAILED`
