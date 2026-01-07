# Ingestion Console - Setup Guide

## Overview

The Ingestion Console is a complete workflow for uploading, processing, and reviewing scripture, canon, and library content before importing into Strapi.

## Architecture

### Backend (Strapi)
- **Queue System**: BullMQ with Redis for async job processing
- **Database Tables**: 
  - `scripture_sources` - Source/translation metadata
  - `scripture_versions` - Ingestion tracking with status/progress
  - `scripture_review_actions` - Manual QA workflow tracking
  - `canon_versions` - Canon (EGW) ingestion tracking
- **API Routes**: `/api/ingestion/*` for enqueue, list, and review actions

### Frontend (Next.js)
- **Studio Route**: `/studio/ingestion` - Main console interface
- **Upload Page**: `/studio/ingestion/upload` - File upload form
- **Review Page**: `/studio/ingestion/review/[versionId]` - 3-column review cockpit
- **API Routes**: `/api/ingestion/*` - Proxies to Strapi with auth

## Setup Instructions

### 1. Database Migration

Run the migration to create ingestion tables:

```bash
cd ruach-ministries-backend
npm run strapi migrations:run
```

Or manually run:
```bash
# The migration file is at:
# database/migrations/20260106000000_add_scripture_ingestion_system.js
```

### 2. Cloudflare R2 Configuration

The ingestion system uses R2 for file storage. Configure these environment variables:

**Backend (Strapi):**
```env
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=ruach-scripture-ingestion  # Or your existing bucket
R2_CDN_URL=https://cdn.joinruach.org  # Your R2 public URL or custom domain
```

**Optional (for separate ingestion bucket):**
```env
R2_INGESTION_BUCKET_NAME=ruach-scripture-ingestion  # Separate bucket for ingestion files
```

### 3. Redis Configuration

Ensure Redis is running for the BullMQ queue:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional
REDIS_TLS=false  # Set to true for TLS connections
```

### 4. Queue Bootstrap

The unified ingestion queue is automatically bootstrapped in `src/index.ts`. Verify it starts correctly:

```bash
cd ruach-ministries-backend
npm run develop
# Look for: "[unified-ingestion] Queue and worker initialized"
```

## Usage Workflow

### 1. Upload Content

1. Navigate to `/studio/ingestion/upload`
2. Select content type (Scripture/Canon/Library)
3. Enter source ID (e.g., `scr:yahscriptures`)
4. Configure ingestion parameters
5. Upload PDF/EPUB/DOCX file

**What happens:**
- File is uploaded to R2 bucket
- Version record created in database
- Job enqueued in BullMQ
- Status set to "pending"

### 2. Processing

The queue worker automatically:
1. Extracts content using Python scripts
2. Validates against canonical structure (if enabled)
3. Generates review report
4. Sets status to "reviewing"

### 3. Review & Approve

1. Navigate to `/studio/ingestion` (inbox)
2. Click "Review" on versions with "reviewing" status
3. Review summary, spot-check verses
4. Add review notes
5. Approve, Reject, or mark "Needs Review"

**What happens on approval:**
- Review action recorded
- Status updated
- Import to Strapi triggered automatically
- Status changes to "processing" → "completed"

## API Endpoints

### Frontend API (Next.js)

**POST** `/api/ingestion/upload`
- Uploads file to R2 and enqueues ingestion job
- Requires authentication

**GET** `/api/ingestion/versions?status=pending&contentType=scripture`
- Lists ingestion versions with filters
- Requires authentication

**POST** `/api/ingestion/review`
- Submits review action (approve/reject/needs_review)
- Requires authentication

### Backend API (Strapi)

**POST** `/api/ingestion/enqueue`
- Enqueues ingestion job
- Creates source/version records

**GET** `/api/ingestion/versions`
- Lists versions with filters

**POST** `/api/ingestion/review`
- Records review action and updates status

## Content Types

### Scripture (`contentType: "scripture"`)
- **Source ID format**: `scr:name` (e.g., `scr:yahscriptures`)
- **Testament options**: `tanakh`, `renewed_covenant`, `apocrypha`, `all`
- **Validation**: Can validate against canonical verse counts
- **Import**: Creates `scripture-work` and `scripture-verse` records

### Canon (`contentType: "canon"`)
- **Source ID format**: `canon:book-slug` (e.g., `canon:desire-of-ages`)
- **Import**: Creates `guidebook-node` records

### Library (`contentType: "library"`)
- **Source ID format**: `lib:book-slug` (e.g., `lib:theology-book`)
- **Import**: Uses existing library ingestion system

## Status Flow

```
pending → processing → reviewing → (approved) → processing → completed
                               ↓
                            rejected/failed
```

- **pending**: Job enqueued, waiting for worker
- **processing**: Extraction/validation running
- **reviewing**: Ready for manual QA review
- **completed**: Imported to Strapi successfully
- **failed**: Error occurred (check error_message)

## Troubleshooting

### Queue Not Processing

1. Check Redis connection: `redis-cli ping`
2. Verify queue initialized in Strapi logs
3. Check worker errors in Strapi logs

### Upload Fails

1. Verify R2 credentials in environment
2. Check bucket exists and has correct permissions
3. Verify file size limits (R2 default: 5GB)

### Import Not Triggering

1. Check review action was recorded in database
2. Verify queue worker is running
3. Check Strapi logs for import errors

## Next Steps

- [ ] Run Genesis extraction test
- [ ] Manual review of extracted content
- [ ] Test complete flow end-to-end
- [ ] Set up monitoring/alerting for failed jobs
- [ ] Add email notifications for review requests
