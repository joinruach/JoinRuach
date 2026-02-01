# Media Transcoding Integration Checklist

Use this checklist to ensure proper integration and deployment of the media transcoding system.

## Pre-Deployment Setup

### System Requirements
- [ ] FFmpeg is installed on deployment server
  ```bash
  ffmpeg -version  # Verify installation
  ffprobe -version # Verify ffprobe is available
  ```
- [ ] Node.js version >= 18.0.0
- [ ] At least 50GB free disk space for temp files
- [ ] 4GB+ RAM available for worker processes

### Environment Configuration
- [ ] `REDIS_HOST` set and reachable
- [ ] `REDIS_PORT` correctly configured
- [ ] `REDIS_PASSWORD` set if Redis requires auth
- [ ] `REDIS_TLS` set correctly (true/false)
- [ ] `R2_ENDPOINT` points to Cloudflare R2
- [ ] `R2_ACCESS_KEY_ID` valid and active
- [ ] `R2_SECRET_ACCESS_KEY` correct
- [ ] `R2_BUCKET_NAME` exists and accessible
- [ ] `R2_PUBLIC_URL` points to public CDN endpoint
- [ ] `R2_REGION` set to "auto" or specific region

### Database
- [ ] Run migrations to update `media_items` table
  ```bash
  npm run strapi migrate
  ```
- [ ] Verify new columns exist:
  - `transcodingResults` (JSON)
  - `transcodingStatus` (enum)
  - `transcodingError` (text)

### Code Integration
- [ ] `/src/services/media-transcoding-queue.ts` created
- [ ] `/src/services/transcode-worker.ts` created
- [ ] `/src/services/media-transcoding-results.ts` created
- [ ] `/src/api/media-transcode/` directory created with controllers/routes/services
- [ ] `src/index.ts` imports media transcoding initialization
- [ ] `src/index.ts` calls `initializeMediaTranscodingQueue()` in bootstrap
- [ ] `src/index.ts` calls `shutdownMediaTranscodingQueue()` in destroy

## Testing

### Unit Tests
- [ ] Can import all modules without errors
- [ ] Queue initializes successfully
- [ ] Worker initializes successfully
- [ ] Service methods accessible via Strapi

### Integration Tests
- [ ] Redis connection established during bootstrap
- [ ] BullMQ queue created in Redis
- [ ] Test job can be queued
- [ ] Test job status can be retrieved
- [ ] Media item schema includes new fields

### API Tests
- [ ] POST `/api/media-transcode/queue` returns 200 with jobId
- [ ] POST `/api/media-transcode/quick-queue` returns 200 with multiple jobIds
- [ ] GET `/api/media-transcode/status/:jobId` returns job status
- [ ] GET `/api/media-transcode/jobs/:mediaItemId` returns job list
- [ ] Invalid media item ID returns 404
- [ ] Missing required fields returns 400

### FFmpeg Tests
- [ ] FFmpeg command execution works
- [ ] ffprobe metadata extraction works
- [ ] Video transcoding produces valid output
- [ ] Thumbnail generation produces valid images
- [ ] Audio extraction produces valid audio files
- [ ] Temp files are cleaned up after processing

### R2 Upload Tests
- [ ] Can authenticate to R2
- [ ] Can create test file in R2
- [ ] Can set proper content types
- [ ] Public URL is accessible
- [ ] URL structure matches expected format

### Performance Tests
- [ ] Queue accepts rapid job submissions
- [ ] Worker processes jobs without memory leaks
- [ ] Temp directory cleanup prevents disk full
- [ ] Progress updates are accurate
- [ ] Completed/failed jobs are logged

## Deployment

### Pre-Deployment
- [ ] All tests pass
- [ ] Code review completed
- [ ] Staging environment tested
- [ ] Backup database before deployment
- [ ] Backup current code for rollback

### Deployment Steps
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies (if needed)
npm install

# 3. Run migrations
npm run strapi migrate

# 4. Build application
npm run build

# 5. Restart server
systemctl restart strapi  # or equivalent
```

- [ ] Build completes without errors
- [ ] Application starts successfully
- [ ] Check logs for bootstrap messages
- [ ] Verify queue initialized message appears

### Post-Deployment
- [ ] Application is running
- [ ] Redis connection verified in logs
- [ ] Queue initialization confirmed in logs
- [ ] Test API endpoints with curl/Postman
- [ ] Monitor logs for errors
- [ ] Check R2 upload functionality

## Monitoring & Maintenance

### Daily Monitoring
- [ ] Check Redis memory usage
- [ ] Review job queue size
- [ ] Check failed job count
- [ ] Monitor disk space (temp directory)
- [ ] Review error logs for transcoding failures

### Weekly Maintenance
- [ ] Clear old completed jobs from queue
- [ ] Archive old transcoding results
- [ ] Review R2 storage usage
- [ ] Check FFmpeg version for updates

### Monthly Tasks
- [ ] Update FFmpeg if new version available
- [ ] Review transcoding performance metrics
- [ ] Optimize resolution/bitrate settings
- [ ] Clean up old media files from temp storage

## Troubleshooting

### Queue Not Initializing
- [ ] Check Redis connection
- [ ] Verify Redis is running: `redis-cli ping`
- [ ] Check environment variables
- [ ] Review Strapi logs for bootstrap errors

### Jobs Not Processing
- [ ] Verify worker is running
- [ ] Check FFmpeg installation: `ffmpeg -version`
- [ ] Check R2 credentials
- [ ] Review worker logs for errors
- [ ] Check temp directory permissions

### Transcoding Failures
- [ ] Verify source file is accessible
- [ ] Check FFmpeg command syntax
- [ ] Verify disk space available
- [ ] Check R2 upload permissions
- [ ] Review worker logs for specific error

### Slow Processing
- [ ] Reduce resolution/bitrate settings
- [ ] Increase server resources
- [ ] Check FFmpeg preset (fast/medium/slow)
- [ ] Monitor CPU/Memory usage

### R2 Upload Issues
- [ ] Verify credentials are valid
- [ ] Check bucket exists
- [ ] Verify public URL is correct
- [ ] Test S3 credentials with AWS CLI
- [ ] Check network connectivity to R2

## Performance Optimization

### For Better Performance
- [ ] Use faster FFmpeg preset for 480p
  ```
  -preset fast  # instead of medium
  ```
- [ ] Reduce 1080p bitrate to 3500k
- [ ] Process smaller files first (priority)
- [ ] Consider hardware acceleration if available
- [ ] Monitor and adjust based on results

### For Better Quality
- [ ] Increase bitrates:
  - 1080p: 6000k or higher
  - 720p: 3000k or higher
  - 480p: 1200k or higher
- [ ] Use -preset slow for higher quality
- [ ] Generate more thumbnails
- [ ] Use AAC audio codec

## Security Checklist

### API Security
- [ ] Rate limiting enabled (if applicable)
- [ ] Authentication required for admin endpoints
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] HTTPS enforced in production

### File Security
- [ ] Source files downloaded over HTTPS
- [ ] Temp files stored securely
- [ ] Temp files deleted after processing
- [ ] R2 bucket has proper permissions
- [ ] Public URLs don't expose sensitive data

### Credentials Security
- [ ] R2 credentials not in code
- [ ] Environment variables in `.env` (not committed)
- [ ] Redis password set if accessible remotely
- [ ] Credentials rotated periodically
- [ ] Access logs monitored

## Rollback Plan

If issues occur after deployment:

1. **Immediate Actions**
   - [ ] Stop accepting new transcoding jobs
   - [ ] Keep queue running for in-progress jobs
   - [ ] Notify users of issues

2. **If Critical Issues**
   ```bash
   # Stop the application
   systemctl stop strapi

   # Rollback code
   git revert <commit-hash>

   # Restore database
   psql < backup.sql

   # Restart
   systemctl start strapi
   ```

3. **After Rollback**
   - [ ] Verify application is stable
   - [ ] Check queue operations
   - [ ] Review logs for errors
   - [ ] Communicate status to users

## Documentation

- [ ] Update API documentation with endpoints
- [ ] Document custom resolution settings
- [ ] Update deployment procedures
- [ ] Add troubleshooting guide to wiki
- [ ] Create runbook for common issues

## Sign-Off

- [ ] Development Lead: _______________  Date: _____
- [ ] QA Lead: _______________  Date: _____
- [ ] DevOps Lead: _______________  Date: _____
- [ ] Product Manager: _______________  Date: _____

## Notes

```
[Space for deployment notes, issues encountered, and resolutions]
```
