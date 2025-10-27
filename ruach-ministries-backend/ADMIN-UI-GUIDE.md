# Admin UI Guide - Cross-Platform Publishing

## What You'll See in Strapi Admin

When you edit a media item in Strapi Admin, the cross-platform publishing fields will appear like this:

---

### Publishing Section

```
┌─────────────────────────────────────────────────────────────┐
│  Auto-Publish Settings                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  □ Auto Publish                                             │
│  └─ Automatically post to connected social platforms        │
│     when published                                          │
│                                                              │
│  Platform Selection:                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ☑ ▶️ Publish to YouTube                             │  │
│  │  ☑ 📘 Publish to Facebook Page                       │  │
│  │  ☑ 📸 Publish to Instagram                           │  │
│  │  ☑ 🐦 Publish to X (Twitter)                         │  │
│  │  □ 💰 Publish to Patreon                             │  │
│  │  □ 📺 Publish to Rumble                              │  │
│  │  □ 🌐 Publish to Locals                              │  │
│  │  □ ✝️ Publish to Truth Social                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Social Media Content:                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Short Description                                     │  │
│  │ ┌──────────────────────────────────────────────────┐ │  │
│  │ │ Join us for Sunday Service where we explore      │ │  │
│  │ │ faith, hope, and trust in God's promises.        │ │  │
│  │ │                                            (500)  │ │  │
│  │ └──────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Hashtags                                              │  │
│  │ ┌──────────────────────────────────────────────────┐ │  │
│  │ │ #Faith #Ministry #SundayService #Hope            │ │  │
│  │ └──────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Social Thumbnail (1200x630 recommended)              │  │
│  │ ┌──────────────────────────────────────────────────┐ │  │
│  │ │  [thumbnail-image.jpg]                           │ │  │
│  │ │  📎 Upload new image                             │ │  │
│  │ └──────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## How It Works

### 1. Master Switch
The **Auto Publish** checkbox is your master control:
- ✅ **Checked** = Publishing enabled (but only to platforms you select)
- ⬜ **Unchecked** = All auto-publishing disabled

### 2. Platform Toggles
Each platform has its own toggle switch:
- ✅ **Checked** = Will post to this platform when you publish
- ⬜ **Unchecked** = Will skip this platform

**No JSON editing required!** Just click the checkboxes.

### 3. Content Fields

#### Short Description
- **Purpose**: Social media-ready caption
- **Recommended**: 100-300 characters
- **Used for**: Twitter, Facebook, Instagram, etc.
- **If empty**: Falls back to full description

#### Hashtags
- **Format**: Space-separated (e.g., `#Faith #Ministry #Hope`)
- **Recommended**: 3-5 hashtags
- **Automatically added** to posts on each platform

#### Social Thumbnail
- **Optional**: Custom image for social media
- **Size**: 1200x630px recommended
- **If empty**: Uses main thumbnail

---

## Example Workflow

### Quick Publish to YouTube + Facebook

1. Open your media item
2. ✅ Check "Auto Publish"
3. ✅ Check "Publish to YouTube"
4. ✅ Check "Publish to Facebook"
5. Fill in "Short Description":
   ```
   Join us for Sunday Service! Today we explore faith and trust.
   ```
6. Add hashtags:
   ```
   #Faith #Ministry #SundayService
   ```
7. Click **Publish**

**Done!** The system will:
- Queue 2 jobs (YouTube + Facebook)
- Process them in the background
- Update `publishStatus` with results
- Retry automatically if anything fails

---

## Checking Status

After publishing, you can view the `publishStatus` field (JSON) to see results:

```json
{
  "youtube": {
    "status": "success",
    "publishedAt": "2025-01-15T10:30:00.000Z",
    "result": {
      "type": "community_post",
      "message": "Video already on YouTube. Manual community post recommended.",
      "videoUrl": "https://youtube.com/watch?v=...",
      "publicUrl": "https://joinruach.org/watch/sunday-service"
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
  }
}
```

---

## Tips for Best Results

### ✅ Do's

1. **Write concise short descriptions** (100-300 chars)
2. **Use relevant hashtags** (3-5 max)
3. **Upload high-quality thumbnails** (1200x630)
4. **Test with one platform first** before enabling all
5. **Check publishStatus** after publishing

### ❌ Don'ts

1. **Don't skip short description** - Full description may be too long
2. **Don't overuse hashtags** - Too many looks spammy
3. **Don't enable unconnected platforms** - Will fail if credentials missing
4. **Don't forget to check master switch** - `autoPublish` must be on
5. **Don't worry about errors** - System retries automatically

---

## Troubleshooting

### "Nothing published!"

**Check:**
1. Is `autoPublish` checkbox checked? ✅
2. Is at least one platform toggle checked? ✅
3. Is Redis running? (Required for job queue)
4. Are platform credentials in `.env`?

### "Some platforms failed"

**Check `publishStatus` field for errors:**

Common issues:
- **Instagram**: Missing thumbnail image
- **YouTube**: Invalid credentials or expired token
- **Facebook**: Page token expired
- **All platforms**: Missing `.env` credentials

**Fix:**
- Add missing credentials to `.env`
- Retry using API: `POST /api/ruach-publisher/retry/:id/:platform`

---

## Admin Panel Preview

Your actual UI will look like this (Strapi's clean interface):

- **Checkboxes**: Native Strapi boolean toggles
- **Text fields**: Standard text inputs
- **Emojis**: Show inline with platform names
- **Layout**: Clean, organized sections
- **Validation**: Strapi's built-in validation

**No custom code needed** - Strapi automatically generates a beautiful UI from the schema!

---

## Advanced: Bulk Operations

Want to enable the same platforms for multiple media items?

1. Select multiple items in Content Manager
2. Click "Bulk Edit"
3. Enable platforms
4. Save

All selected items will now auto-publish to those platforms!

---

## Need Help?

- **Schema**: See `src/api/media-item/content-types/media-item/schema.json`
- **Full Guide**: See `CROSS-PLATFORM-PUBLISHING.md`
- **Troubleshooting**: See `EMAIL-CONFIRMATION-TROUBLESHOOTING.md` for debugging tips
- **Operations**: See `ops/OPERATIONS_RUNBOOK.md`

---

**Updated:** January 2025
**Version:** 2.0 (Toggle-based UI)
