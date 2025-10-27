# Cross-Platform Auto-Publishing System

## 🎯 Vision

**"Upload once in Ruach → auto-publish to every connected channel."**

When you publish a media item in Strapi, it automatically distributes to all connected social platforms:

- ▶️ **YouTube** - Video sharing and community posts
- 📘 **Facebook** - Page posts with links/photos
- 📸 **Instagram** - Photo posts with captions
- 🐦 **X (Twitter)** - Tweets with links
- 💰 **Patreon** - Creator posts
- 📺 **Rumble** - Video platform
- 🌐 **Locals** - Community platform
- ✝️ **Truth Social** - Social network

---

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Strapi Media Item                         │
│  (title, description, shortDescription, hashtags, etc.)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Lifecycle Hook (afterUpdate/afterCreate)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Ruach Publisher Plugin                          │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Publisher  │─────▶│   Providers  │                    │
│  │   Service    │      │   Service    │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                      │                            │
│         ▼                      ▼                            │
│  ┌──────────────────────────────────────┐                  │
│  │       BullMQ Job Queue (Redis)       │                  │
│  └──────────────────────────────────────┘                  │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  YouTube    │  │  Facebook   │  │  Instagram  │  ...  │
│  │  Provider   │  │  Provider   │  │  Provider   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Media Item Published** - User publishes a media item in Strapi
2. **Lifecycle Hook Triggered** - `afterUpdate` or `afterCreate` hook fires
3. **Publisher Service Called** - Checks if `autoPublish` is enabled
4. **Jobs Queued** - Creates a BullMQ job for each enabled platform
5. **Workers Process Jobs** - Background workers call platform-specific providers
6. **Status Updated** - Success/failure status saved back to media item

---

## 📋 Media Item Schema

The `media-item` content type has been extended with these fields:

| Field | Type | Description |
|-------|------|-------------|
| `autoPublish` | Boolean | Master switch to enable automatic posting |
| **Platform Toggles:** | | **Easy on/off switches for each platform:** |
| `publishYouTube` | Boolean | ▶️ Publish to YouTube |
| `publishFacebook` | Boolean | 📘 Publish to Facebook Page |
| `publishInstagram` | Boolean | 📸 Publish to Instagram |
| `publishX` | Boolean | 🐦 Publish to X (Twitter) |
| `publishPatreon` | Boolean | 💰 Publish to Patreon |
| `publishRumble` | Boolean | 📺 Publish to Rumble |
| `publishLocals` | Boolean | 🌐 Publish to Locals |
| `publishTruthSocial` | Boolean | ✝️ Publish to Truth Social |
| `publishStatus` | JSON | Per-platform status with timestamps and errors |
| `shortDescription` | Text | Social media-ready caption (max 500 chars) |
| `hashtags` | String | Hashtags for social posts (e.g., "#Faith #Ministry") |
| `socialThumbnail` | Media | Optional custom thumbnail for social (1200x630) |

### Example `publishStatus` JSON:

```json
{
  "youtube": {
    "status": "success",
    "publishedAt": "2025-01-15T10:30:00.000Z",
    "result": {
      "type": "community_post",
      "videoUrl": "https://youtube.com/watch?v=..."
    }
  },
  "facebook": {
    "status": "success",
    "publishedAt": "2025-01-15T10:30:05.000Z",
    "result": {
      "type": "link",
      "id": "123456789",
      "postUrl": "https://facebook.com/123456789"
    }
  },
  "instagram": {
    "status": "failed",
    "error": "Missing thumbnail image",
    "failedAt": "2025-01-15T10:30:10.000Z",
    "attempts": 3
  }
}
```

---

## 🚀 Setup Guide

### Prerequisites

1. **Redis Server** - Required for BullMQ job queue
2. **Platform API Credentials** - See platform-specific setup below

### Installation

```bash
cd ruach-ministries-backend

# Install dependencies
pnpm install bullmq googleapis form-data node-fetch

# Start Redis (macOS)
brew install redis
brew services start redis

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

### Environment Configuration

Copy `.env.example` and add your credentials:

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# YouTube
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token

# Facebook & Instagram
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
FACEBOOK_PAGE_ID=your_page_id
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_account_id

# X (Twitter)
X_API_BEARER_TOKEN=your_bearer_token

# Patreon
PATREON_ACCESS_TOKEN=your_access_token
PATREON_CAMPAIGN_ID=your_campaign_id

# Truth Social
TRUTH_SOCIAL_ACCESS_TOKEN=your_access_token
```

---

## 🔐 Platform-Specific Setup

### YouTube (OAuth2)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Add redirect URI: `http://localhost:1337/api/youtube/callback`
4. Enable YouTube Data API v3
5. Generate a refresh token using OAuth flow
6. Add credentials to `.env`

**Required Scopes:**
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube.force-ssl`

### Facebook & Instagram (Graph API)

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Create an app with "Business" type
3. Add Facebook Login and Instagram Basic Display products
4. Generate a **Page Access Token** with these permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
5. Connect your Instagram Business Account to your Facebook Page
6. Add credentials to `.env`

**Note:** Instagram requires a Business Account connected to a Facebook Page.

### X / Twitter (API v2)

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app (or use existing)
3. Navigate to "Keys and tokens"
4. Generate a **Bearer Token** or use OAuth 2.0
5. Add `X_API_BEARER_TOKEN` to `.env`

**Required Permissions:**
- Tweet read and write
- Users read

### Patreon (Creator API)

1. Go to [Patreon Clients](https://www.patreon.com/portal/registration/register-clients)
2. Create a new client
3. Get your Access Token
4. Find your Campaign ID from your Patreon dashboard
5. Add credentials to `.env`

### Truth Social (Mastodon API)

1. Create a Truth Social account
2. Go to Settings → Development
3. Create a new application
4. Generate Access Token with `write:statuses` scope
5. Add `TRUTH_SOCIAL_ACCESS_TOKEN` to `.env`

### Rumble & Locals

These platforms have limited API access. The providers return manual posting instructions with formatted content.

---

## 📡 API Endpoints

The plugin exposes these admin-only API endpoints:

### Manually Publish a Media Item

```bash
POST /api/ruach-publisher/publish/:id
```

Queues publishing jobs for all enabled platforms.

**Response:**
```json
{
  "success": true,
  "message": "Queued 5 publishing jobs",
  "queued": 5,
  "platforms": ["youtube", "facebook", "instagram", "x", "patreon"],
  "jobIds": ["1-youtube-1234567890", "1-facebook-1234567890", ...]
}
```

### Retry Failed Platform

```bash
POST /api/ruach-publisher/retry/:id/:platform
```

Retries publishing to a specific platform.

**Example:**
```bash
POST /api/ruach-publisher/retry/1/instagram
```

### Get Publishing Status

```bash
GET /api/ruach-publisher/status/:id
```

Returns publishing status for all platforms.

**Response:**
```json
{
  "success": true,
  "mediaItemId": 1,
  "totalJobs": 5,
  "jobs": [
    {
      "id": "1-youtube-1234567890",
      "platform": "youtube",
      "state": "completed",
      "attemptsMade": 1,
      "timestamp": 1705320600000
    },
    ...
  ]
}
```

### Get Supported Platforms

```bash
GET /api/ruach-publisher/platforms
```

Returns list of all supported platforms with metadata.

---

## 🎨 Usage in Strapi Admin

### Enable Auto-Publishing

1. Go to Content Manager → Media Items
2. Create or edit a media item
3. Fill in required fields:
   - Title, description
   - **shortDescription** (for social captions)
   - **hashtags** (e.g., "#Faith #Ministry #Testimony")
   - Upload thumbnail (or **socialThumbnail** for custom)
4. **Check the master switch:** `autoPublish` ✅
5. **Toggle on your desired platforms:**
   - ✅ publishYouTube
   - ✅ publishFacebook
   - ✅ publishInstagram
   - ✅ publishX
   - etc.
6. Click "Publish"

The plugin will automatically queue jobs for all enabled platforms!

**The UI will show clean toggle switches for each platform - no JSON editing required!**

### Check Publishing Status

1. View the media item in Strapi Admin
2. Check the **publishStatus** field
3. See success/failure for each platform
4. Use retry API endpoint for failed platforms

---

## 🧪 Testing

### Test Individual Provider

Create a test script:

```javascript
// test-youtube-provider.js
const { YouTubeProvider } = require('./src/plugins/ruach-publisher/server/services/providers/youtube');

const mockMediaItem = {
  id: 1,
  title: 'Test Video',
  shortDescription: 'This is a test post',
  hashtags: '#Test #Ministry',
  slug: 'test-video',
};

const provider = new YouTubeProvider(strapi);
provider.publish(mockMediaItem)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

### Monitor Jobs

Use BullMQ's built-in monitoring:

```bash
# Install bull-board for web UI
pnpm install @bull-board/api @bull-board/koa

# Access at http://localhost:1337/admin/queues
```

---

## 🐛 Troubleshooting

### "Queue not initialized" Error

**Cause:** Redis is not running or can't connect.

**Solution:**
```bash
# Check Redis status
redis-cli ping
# Should return: PONG

# If not running:
brew services start redis
# or
docker start redis
```

### "Provider not found for platform: xxx"

**Cause:** Platform name mismatch or typo.

**Solution:** Ensure platform names match exactly:
- `youtube`, `facebook`, `instagram`, `x`, `patreon`, `rumble`, `locals`, `truthsocial`

### "Invalid credentials" or API errors

**Cause:** Missing or expired API tokens.

**Solution:**
1. Check `.env` file has all required credentials
2. Verify tokens haven't expired
3. Check API quotas/limits on platform dashboards
4. Review provider logs for specific error messages

### Jobs stuck in "waiting" state

**Cause:** Worker not processing jobs.

**Solution:**
1. Restart Strapi to reinitialize workers
2. Check Redis connection
3. Check worker logs for errors

---

## 📊 Monitoring & Logging

All publishing events are logged with Winston:

```javascript
// Example log output
[Winston] Publisher: Distributing media item to platforms
  mediaItemId: 1
  mediaItemTitle: "Sunday Service - Faith & Trust"
  platforms: ["youtube", "facebook", "instagram"]

[Winston] YouTube: Starting YouTube upload
  mediaItemId: 1
  caption: "Sunday Service - Faith & Trust..."

[Winston] YouTube: Successfully published to YouTube
  mediaItemId: 1
  platform: "youtube"
  videoId: "abc123xyz"

[Winston] Facebook: Successfully published to Facebook
  mediaItemId: 1
  postId: "123456789"
  postUrl: "https://facebook.com/123456789"
```

---

## 🎯 Best Practices

### Content Optimization

1. **shortDescription** - Keep it concise (100-300 chars)
2. **hashtags** - Use 3-5 relevant hashtags
3. **socialThumbnail** - Use 1200x630px for best results
4. **Test first** - Disable `autoPublish` and use manual endpoints for testing

### Error Handling

1. **Check publishStatus** regularly
2. **Retry failed platforms** using the retry API
3. **Monitor logs** for patterns in failures
4. **Update credentials** when tokens expire

### Performance

1. **BullMQ handles concurrency** - Up to 5 jobs process simultaneously
2. **Failed jobs retry automatically** - 3 attempts with exponential backoff
3. **Completed jobs are cleaned up** - Last 100 kept for 24 hours

---

## 🚧 Future Enhancements

### Planned Features

- [ ] **AI Caption Generation** - Auto-generate platform-specific captions
- [ ] **Auto-Subtitle Generation** - Extract and post subtitles
- [ ] **Thumbnail Auto-Generation** - Create platform-optimized thumbnails
- [ ] **Analytics Dashboard** - Track views/engagement across platforms
- [ ] **Scheduled Publishing** - Delay posts to specific times
- [ ] **A/B Testing** - Test different captions/thumbnails
- [ ] **Weekly Report** - Email summary of cross-platform analytics

### Platform Support Roadmap

- [ ] **TikTok** - Short-form video platform
- [ ] **LinkedIn** - Professional network
- [ ] **Pinterest** - Visual discovery
- [ ] **Reddit** - Community posts

---

## 📚 API Reference

### Publisher Service

```javascript
// Get the service
const publisherService = strapi.plugin('ruach-publisher').service('publisher');

// Distribute to all platforms
await publisherService.distribute(mediaItem);

// Retry specific platform
await publisherService.retry(mediaItemId, 'youtube');

// Get status
const status = await publisherService.getStatus(mediaItemId);
```

### Providers Service

```javascript
// Get the service
const providersService = strapi.plugin('ruach-publisher').service('providers');

// Get specific provider
const youtubeProvider = providersService.getProvider('youtube');

// Get all platforms
const platforms = providersService.getSupportedPlatforms();
```

---

## 📞 Support

For issues or questions:

1. Check this documentation
2. Review Winston logs for detailed error messages
3. Test individual providers with manual API calls
4. Check platform API status pages

---

## ✅ Quick Start Checklist

- [ ] Redis installed and running
- [ ] `.env` configured with platform credentials
- [ ] Dependencies installed (`pnpm install`)
- [ ] Strapi restarted to load plugin
- [ ] Test publish to one platform first
- [ ] Enable `autoPublish` on media items
- [ ] Monitor logs for errors
- [ ] Check `publishStatus` field for results

---

**Last Updated:** January 15, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready
