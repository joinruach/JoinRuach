# Strapi Preview Feature - Implementation Guide

This guide documents the implementation of Strapi's Preview feature in the Ruach Ministries application.

## Overview

The Preview feature allows content editors to preview their changes in the frontend application directly from Strapi's admin panel before publishing. This implementation includes:

- **Basic Preview** (Free): View draft content in the frontend
- **Live Preview** (Growth/Enterprise): Side-by-side editing with real-time updates

## Features Implemented

### Backend (Strapi)

1. **Preview Configuration** (`ruach-ministries-backend/config/admin.ts`)
   - Enabled preview functionality
   - Configured allowed origins for iframe embedding
   - Created handler for generating preview URLs
   - Added URL generation logic for all content types

2. **Environment Variables** (`.env`)
   - `CLIENT_URL`: Frontend application URL
   - `PREVIEW_SECRET`: Shared secret for preview authentication

3. **Supported Content Types**
   - Courses (`/courses/[slug]`)
   - Events (`/events/[slug]`)
   - Media Items (`/media/[slug]`)
   - Blog Posts (`/blog/[slug]`)
   - Articles (`/articles/[slug]`)
   - Series (`/series/[slug]`)
   - Outreach Stories (`/community-outreach/stories/[slug]`)
   - Static pages (About, Contact)

### Frontend (Next.js)

1. **Preview Route** (`apps/ruach-next/src/app/api/preview/route.ts`)
   - Handles draft mode activation/deactivation
   - Validates preview secret
   - Redirects to the requested preview URL

2. **Data Fetching Updates** (`apps/ruach-next/src/lib/strapi.ts`)
   - Added draft mode detection
   - Automatically includes `strapi-encode-source-maps` header in preview mode
   - Fetches draft content when draft mode is enabled

3. **CSP Headers** (`apps/ruach-next/src/middleware.ts`)
   - Added `frame-ancestors` directive to allow embedding in Strapi admin panel
   - Configured to allow the Strapi origin

4. **Live Preview Component** (`apps/ruach-next/src/components/preview/LivePreview.tsx`)
   - Handles real-time communication with Strapi admin panel
   - Refreshes content when updates are made
   - Enables interactive editing (Growth/Enterprise only)

5. **Environment Variables** (`.env`)
   - `PREVIEW_SECRET`: Shared secret matching backend configuration

## Setup Instructions

### 1. Backend Configuration

Add the following to your `.env` file in `ruach-ministries-backend/`:

```bash
# Preview Feature Configuration
CLIENT_URL=http://localhost:3000  # Your Next.js frontend URL
PREVIEW_SECRET=your-secure-random-secret  # Generate with: openssl rand -base64 32
```

### 2. Frontend Configuration

Add the following to your `.env` file in `apps/ruach-next/`:

```bash
# Preview Feature Configuration
PREVIEW_SECRET=your-secure-random-secret  # Must match backend PREVIEW_SECRET
```

### 3. Production Deployment

For production environments:

1. **Backend `.env`**:
   ```bash
   CLIENT_URL=https://your-production-domain.com
   PREVIEW_SECRET=<production-secret>  # Different from development!
   ```

2. **Frontend `.env`**:
   ```bash
   PREVIEW_SECRET=<production-secret>  # Must match backend
   ```

## Usage

### Basic Preview (All Plans)

1. Open any content entry in Strapi's Content Manager
2. Click the **"Open preview"** button in the top right
3. The preview will open showing your frontend with the draft content
4. Switch between draft and published versions using the toggle

### Live Preview (Growth/Enterprise)

1. Open any content entry in Strapi's Content Manager
2. Click the **"Open preview"** button
3. Use the side-by-side view to see both the edit form and preview
4. Double-click any content in the preview to edit it in place
5. Changes are reflected in real-time as you type

## How It Works

### Preview Flow

1. User clicks "Open preview" in Strapi admin panel
2. Strapi calls the preview `handler` function in `config/admin.ts`
3. Handler generates the appropriate frontend URL based on content type
4. Strapi redirects to `/api/preview?secret=xxx&url=/courses/my-course&status=draft`
5. Preview route validates the secret and enables Next.js draft mode
6. Frontend redirects to the actual page with draft mode enabled
7. Page components fetch draft content from Strapi

### Live Preview Flow

1. LivePreview component mounts and sends `previewReady` message to parent
2. Strapi sends back the Live Preview script
3. Script is injected into the page, enabling interactive features
4. When content is updated in Strapi, a `strapiUpdate` message is sent
5. Frontend refreshes the preview using `router.refresh()`

## Content Type Configuration

To enable preview for a new content type:

1. **Add slug field** to your content type (if not already present)
2. **Update `getPreviewPathname`** function in `ruach-ministries-backend/config/admin.ts`:

```typescript
case 'api::your-content-type.your-content-type': {
  if (!slug) {
    return '/your-content-type'; // Listing page
  }
  return `/your-content-type/${slug}`; // Detail page
}
```

3. **Ensure your Next.js page** fetches data with the Strapi utility functions (which automatically support draft mode)

## Disabling Preview for Specific Content Types

To disable preview for a content type, return `null` from the handler:

```typescript
case 'api::global-settings.global-settings':
  return null; // No preview for global settings
```

## Troubleshooting

### Preview button is disabled

- Make sure you've saved all changes in the Content Manager
- Check that the content type has a matching case in `getPreviewPathname`

### Preview shows published content instead of draft

- Verify `PREVIEW_SECRET` matches in both frontend and backend
- Check that the frontend route at `/api/preview/route.ts` is working
- Ensure draft mode is being enabled (check Network tab for cookies)

### "Invalid token" error

- The `PREVIEW_SECRET` doesn't match between frontend and backend
- Check both `.env` files

### Content not refreshing in Live Preview

- Check browser console for JavaScript errors
- Verify the LivePreview component is mounted
- Check that `NEXT_PUBLIC_STRAPI_URL` is set correctly

### iframe embedding blocked

- Verify the CSP headers in middleware are set correctly
- Check that `NEXT_PUBLIC_STRAPI_URL` matches your Strapi domain
- Look for CSP errors in browser console

## Security Considerations

1. **Secret Management**
   - Use strong, random secrets (minimum 32 characters)
   - Never commit secrets to version control
   - Use different secrets for development and production

2. **Origin Validation**
   - Preview route validates the secret before enabling draft mode
   - Middleware restricts iframe embedding to Strapi origin only
   - LivePreview component validates message origin

3. **Content Access**
   - Draft content requires a valid preview secret
   - Preview mode is session-based (stored in cookies)
   - Draft mode is automatically disabled for published content

## Related Files

### Backend
- `ruach-ministries-backend/config/admin.ts` - Preview configuration
- `ruach-ministries-backend/.env.example` - Environment variable template

### Frontend
- `apps/ruach-next/src/app/api/preview/route.ts` - Preview API route
- `apps/ruach-next/src/lib/strapi.ts` - Data fetching with draft support
- `apps/ruach-next/src/middleware.ts` - CSP headers for iframe embedding
- `apps/ruach-next/src/components/preview/LivePreview.tsx` - Live Preview component
- `apps/ruach-next/src/app/layout.tsx` - Root layout with LivePreview
- `apps/ruach-next/.env.example` - Environment variable template

## Official Documentation

For more details about Strapi's Preview feature, see:
- [Strapi Preview Documentation](https://docs.strapi.io/user-docs/latest/content-manager/previewing-content.html)
- [Next.js Draft Mode](https://nextjs.org/docs/app/building-your-application/configuring/draft-mode)

## Support

For issues or questions about this implementation:
1. Check the troubleshooting section above
2. Review the official Strapi and Next.js documentation
3. Check the implementation files listed above

---

**Implementation Date**: 2025-11-09
**Strapi Version**: 4.x
**Next.js Version**: 14.x
