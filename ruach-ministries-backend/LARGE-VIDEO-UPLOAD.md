# Large Video Upload System

## Overview

The large video upload system enables resumable uploads of huge video files (up to 10GB) directly to Cloudflare R2, bypassing Strapi for better performance and reliability.

## Features

✅ **Multipart Upload** - Files split into 5MB chunks for efficient transfer
✅ **Progress Tracking** - Real-time progress bar showing upload status
✅ **Resumable** - Interrupted uploads automatically resume from last completed chunk
✅ **Pause/Resume** - Manual control over upload process
✅ **Automatic Retry** - Failed chunks automatically retry
✅ **Concurrent Uploads** - 3 chunks uploaded simultaneously for speed
✅ **Local State** - Upload state persisted in browser localStorage
✅ **Redis State** - Server-side upload sessions stored in Redis (24h expiry)

---

## Architecture

### Backend Components

**1. R2 Direct Upload Controller**
`src/api/upload/controllers/r2-direct-upload.js`

Endpoints:
- `POST /api/upload/r2-direct/initiate` - Start new upload
- `POST /api/upload/r2-direct/part-url` - Get presigned URL for chunk
- `POST /api/upload/r2-direct/part-complete` - Mark chunk as uploaded
- `POST /api/upload/r2-direct/complete` - Finalize upload
- `POST /api/upload/r2-direct/abort` - Cancel upload
- `GET /api/upload/r2-direct/status/:uploadId` - Check upload progress

**2. Redis Service**
`src/services/redis.js`

Provides shared Redis connection for upload state management.

**3. Upload Routes**
`src/api/upload/routes/r2-direct-upload.js`

Registers all R2 direct upload endpoints.

### Frontend Components

**1. R2 Multipart Uploader (JavaScript Library)**
`src/plugins/ruach-video-uploader/admin/src/extensions/upload/r2-multipart-uploader.js`

Core upload logic:
- Multipart upload orchestration
- Progress tracking
- State persistence (localStorage)
- Resumption logic
- Error handling with retry

**2. Video Upload Widget (React Component)**
`src/plugins/ruach-video-uploader/admin/src/extensions/upload/VideoUploadWidget.jsx`

Strapi admin UI component:
- File selection
- Progress bar
- Pause/Resume/Cancel controls
- Error display
- Integration with Strapi forms

**3. Admin Registration**
`src/plugins/ruach-video-uploader/admin/src/index.ts`

Registers custom video upload widget as a Strapi custom field.

---

## How It Works

### Upload Flow

```
1. User selects video file (up to 10GB)
2. Client initiates multipart upload → Server creates upload session in Redis
3. Server returns uploadId, key, totalParts
4. Client requests presigned URL for each part → Server generates S3 presigned URL
5. Client uploads part directly to R2 → No data passes through Strapi
6. Client notifies server of completion → Server tracks completed parts in Redis
7. Repeat steps 4-6 for all parts (3 concurrent)
8. Client signals completion → Server finalizes multipart upload in R2
9. Server returns public CDN URL → Client updates form field
```

### Resumption Flow

```
1. Upload interrupted (network failure, browser close, etc.)
2. State saved in localStorage: uploadId, filename, fileSize
3. User returns and selects same file
4. Client checks localStorage → Finds saved upload session
5. Client queries server for status → Server returns completed part numbers
6. Upload resumes from first uncompleted part
```

---

## Usage in Strapi Admin

### Adding to Content Type

1. Open **Content-Type Builder**
2. Select **media-item** (or any content type)
3. Click **Add another field**
4. Select **Custom** → **Large Video Upload (Resumable)**
5. Name the field (e.g., `largeVideoUrl`)
6. Save

### Using the Widget

1. **Select File**: Click "Select Large Video File" button
2. **Review Info**: Verify filename, size, type
3. **Start Upload**: Click "Start Upload" button
4. **Monitor Progress**: Watch progress bar and bytes transferred
5. **Pause/Resume**: Use controls as needed
6. **Complete**: URL automatically populated in form field

### Best Practices

| Video Size | Recommended Method | Why |
|------------|-------------------|-----|
| **< 500MB** | Standard upload | Faster, simpler |
| **500MB - 2GB** | Standard upload | Still manageable |
| **2GB - 10GB** | Large video upload | Resumable, safer |
| **> 10GB** | YouTube-first | YouTube handles transcoding + CDN |

---

## API Reference

### `POST /api/upload/r2-direct/initiate`

**Request:**
```json
{
  "filename": "sermon-2024-12-24.mp4",
  "contentType": "video/mp4",
  "fileSize": 3221225472
}
```

**Response:**
```json
{
  "uploadId": "abc123xyz",
  "key": "uploads/direct/1234abcd5678efgh.mp4",
  "totalParts": 644,
  "partSize": 5242880
}
```

### `POST /api/upload/r2-direct/part-url`

**Request:**
```json
{
  "uploadId": "abc123xyz",
  "partNumber": 1
}
```

**Response:**
```json
{
  "uploadUrl": "https://r2.cloudflarestorage.com/...",
  "partNumber": 1
}
```

### `POST /api/upload/r2-direct/complete`

**Request:**
```json
{
  "uploadId": "abc123xyz"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://cdn.joinruach.org/direct/1234abcd5678efgh.mp4",
  "key": "uploads/direct/1234abcd5678efgh.mp4",
  "filename": "sermon-2024-12-24.mp4",
  "fileSize": 3221225472,
  "contentType": "video/mp4"
}
```

---

## Configuration

### Environment Variables

All existing R2 configuration is reused:

```env
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://...r2.cloudflarestorage.com
R2_BUCKET_NAME=ruach-ministries-assets
R2_PUBLIC_URL=https://cdn.joinruach.org/uploads

REDIS_HOST=...
REDIS_PORT=25061
REDIS_PASSWORD=...
REDIS_TLS=true
```

### Limits

| Setting | Value | Configurable In |
|---------|-------|-----------------|
| **Max file size** | 10GB | `r2-direct-upload.js:36` |
| **Part size** | 5MB | `r2-direct-upload.js:90` |
| **Concurrency** | 3 parts | `r2-multipart-uploader.js:13` |
| **Session expiry** | 24 hours | `r2-direct-upload.js:100` |
| **Presigned URL expiry** | 1 hour | `r2-direct-upload.js:170` |
| **Allowed types** | MP4, MOV, AVI, WebM | `r2-direct-upload.js:46` |

---

## Troubleshooting

### Upload fails immediately

**Symptoms:** Error message appears right after clicking "Start Upload"

**Causes:**
- File type not allowed (check allowed types)
- File size exceeds 10GB
- Redis not available
- R2 credentials invalid

**Solutions:**
1. Check browser console for detailed error
2. Verify file type is MP4/MOV/AVI/WebM
3. Verify Redis is running: `redis-cli ping`
4. Verify R2 credentials in `.env`

---

### Upload stalls at specific percentage

**Symptoms:** Progress bar stops, no error shown

**Causes:**
- Network timeout
- R2 service issue
- Browser throttling

**Solutions:**
1. **Pause and Resume**: Click pause, wait 10 seconds, click resume
2. **Check Network**: Open browser DevTools → Network tab → Look for failed requests
3. **Retry Failed Parts**: System automatically retries failed parts
4. **Close and Resume**: Close browser, reopen, select same file → Upload resumes

---

### Upload completes but URL not working

**Symptoms:** Upload shows 100%, but video URL returns 404

**Causes:**
- R2 public URL misconfigured
- File not yet available on CDN (propagation delay)
- Incomplete multipart upload

**Solutions:**
1. Wait 30-60 seconds (CDN propagation)
2. Check R2 dashboard → Verify file exists
3. Check `R2_PUBLIC_URL` environment variable
4. Test direct R2 URL (before CDN)

---

### Cannot resume upload after browser close

**Symptoms:** Selecting same file starts upload from 0%

**Causes:**
- localStorage cleared
- Upload session expired (>24h)
- Different browser/device

**Solutions:**
1. Check localStorage: `localStorage.getItem('r2-upload:filename:size')`
2. Use same browser/device for resumption
3. Complete uploads within 24 hours
4. If session expired, restart upload

---

## Performance Optimization

### Upload Speed

Expected speeds (5MB parts, 3 concurrent):
- **50 Mbps connection:** ~15 MB/s (~3.5 hours for 5GB)
- **100 Mbps connection:** ~30 MB/s (~1.8 hours for 5GB)
- **500 Mbps connection:** ~60 MB/s (~1.4 hours for 5GB)

**To increase speed:**
1. Increase concurrency: `r2-multipart-uploader.js:13` (3 → 5)
2. Increase part size: `r2-direct-upload.js:90` (5MB → 10MB)
3. Use wired connection (not WiFi)
4. Close bandwidth-heavy apps

### Memory Usage

**Browser:** ~15MB per concurrent upload (3 parts × 5MB)
**Server:** Minimal (presigned URLs, no file buffering)
**Redis:** ~1KB per upload session

---

## Security

### Authentication

All endpoints require Strapi authentication (JWT token from localStorage).

### Validation

- **Server-side:** File type whitelist, size limits
- **Client-side:** File type validation before upload
- **R2:** Presigned URLs expire after 1 hour

### Best Practices

✅ Keep `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` secret
✅ Use HTTPS only (enforced by middleware)
✅ Enable CORS only for trusted domains
✅ Monitor R2 usage to detect abuse
✅ Set CloudFlare R2 lifecycle rules to delete incomplete uploads

---

## Monitoring

### Upload Metrics

**Redis keys:**
```bash
# List active uploads
redis-cli KEYS "r2-upload:*"

# Check specific upload
redis-cli GET "r2-upload:abc123xyz"
```

**Logs:**
```bash
# Filter upload-related logs
cat strapi.log | grep "r2-upload"
```

### R2 Storage

Check Cloudflare dashboard:
- **Bucket:** ruach-ministries-assets
- **Path:** /uploads/direct/
- **Incomplete uploads:** Should auto-cleanup after 7 days

---

## Future Enhancements

Potential improvements:

1. **Automatic transcoding** - Convert uploads to optimized formats
2. **Thumbnail generation** - Extract video thumbnails automatically
3. **Metadata extraction** - Duration, resolution, codec info
4. **Bandwidth throttling** - Prevent uploads from saturating connection
5. **Admin dashboard** - View all active uploads, pause/resume/cancel
6. **Email notifications** - Alert when large upload completes
7. **Webhook integration** - Trigger workflows on upload completion

---

## Support

For issues or questions:
1. Check this documentation
2. Review server logs: `src/config/logger.js`
3. Check browser console (F12)
4. Test with smaller file first (100MB)
5. Verify all dependencies installed: `pnpm install`

---

**Version:** 1.0.0
**Last Updated:** 2024-12-24
**Maintainer:** Ruach Development Team
