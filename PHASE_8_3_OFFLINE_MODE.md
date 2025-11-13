# Phase 8.3: Offline Mode Enhancements

## Overview

Phase 8.3 implements comprehensive offline capabilities, transforming the Ruach Ministries platform into a fully functional Progressive Web App (PWA) that works seamlessly without an internet connection.

---

## Features Implemented

### 1. Offline Content Manager

**Module:** `src/lib/offline/offlineManager.ts`

A comprehensive utility for managing content available offline using IndexedDB and the Cache API.

**Features:**
- Store and retrieve offline content metadata
- Check storage quota and usage
- Download content for offline use
- Remove content from offline storage
- Clean up expired items
- Format storage sizes

**Key Functions:**

```typescript
// Check online status
isOnline(): boolean

// Get offline status with statistics
getOfflineStatus(): Promise<OfflineStatus>

// Download content for offline use
downloadForOffline(item: OfflineItem): Promise<void>

// Check if content is available offline
isAvailableOffline(id: string): Promise<boolean>

// Remove content from offline storage
removeFromOffline(id: string): Promise<void>

// Get all offline items
getOfflineItems(): Promise<OfflineItem[]>

// Clean up expired items
cleanupExpiredItems(): Promise<number>

// Format bytes to human-readable
formatBytes(bytes: number): string
```

**Data Structure:**

```typescript
interface OfflineItem {
  id: string;
  type: 'media' | 'course' | 'lesson' | 'page';
  title: string;
  url: string;
  thumbnailUrl?: string;
  size?: number;
  downloadedAt: number;
  expiresAt?: number;
  metadata?: Record<string, any>;
}

interface OfflineStatus {
  isOnline: boolean;
  hasServiceWorker: boolean;
  storageUsed: number;
  storageQuota: number;
  offlineItemsCount: number;
}
```

### 2. Background Sync Manager

**Module:** `src/lib/offline/backgroundSync.ts`

Handles form submissions and API requests when offline, queuing them for automatic sync when connection is restored.

**Features:**
- Queue API requests and form submissions
- Automatic retry with configurable max attempts
- Process sync queue when back online
- IndexedDB-based queue storage
- Integration with Service Worker Sync API

**Key Functions:**

```typescript
// Check if Background Sync is supported
isBackgroundSyncSupported(): boolean

// Queue form submission
queueFormSubmission(url: string, formData: FormData): Promise<string>

// Queue API request
queueApiRequest(url: string, options: RequestInit): Promise<string>

// Process sync queue (attempt all pending syncs)
processSyncQueue(): Promise<{
  successful: number;
  failed: number;
  remaining: number;
}>

// Enhanced fetch with automatic fallback
fetchWithSync(url: string, options: RequestInit): Promise<Response>
```

**Data Structure:**

```typescript
interface SyncQueueItem {
  id: string;
  type: 'form' | 'api';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  retries: number;
  maxRetries: number;
}
```

### 3. Offline Indicator Component

**Location:** `src/components/offline/OfflineIndicator.tsx`

A banner component that displays connection status and manages background sync.

**Features:**
- Detects online/offline status changes
- Shows banner when offline
- Auto-syncs queued requests when back online
- Displays sync progress
- Smooth animations
- Auto-hide after success

**Usage:**

```tsx
// Add to root layout
import OfflineIndicator from '@/components/offline/OfflineIndicator';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <OfflineIndicator />
      </body>
    </html>
  );
}
```

**States:**
- **Offline**: Amber banner with "You are offline" message
- **Syncing**: Green banner with spinner and "Syncing pending changes..."
- **Synced**: Green banner with checkmark and success message

### 4. Offline Download Button

**Location:** `src/components/offline/OfflineDownloadButton.tsx`

A reusable button component for downloading content for offline use.

**Features:**
- Two variants: button and icon
- Three sizes: sm, md, lg
- Shows download status (downloadable, downloading, downloaded)
- Error handling with user feedback
- Integrates with offline manager

**Props:**

```typescript
interface OfflineDownloadButtonProps {
  id: string;
  type: 'media' | 'course' | 'lesson' | 'page';
  title: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}
```

**Usage:**

```tsx
// Button variant
<OfflineDownloadButton
  id="media-123"
  type="media"
  title="Understanding the Holy Spirit"
  url="/media/understanding-holy-spirit"
  thumbnailUrl="/images/thumb.jpg"
  variant="button"
  size="md"
/>

// Icon variant
<OfflineDownloadButton
  id="course-456"
  type="course"
  title="End Times Prophecy"
  url="/courses/end-times"
  variant="icon"
  size="sm"
/>
```

### 5. Offline Content Manager Page

**Location:** `src/app/[locale]/members/offline/page.tsx`

A dedicated page for managing all offline content.

**Features:**
- List all offline content with details
- Bulk selection and deletion
- Storage usage statistics
- Cleanup expired items
- Clear all offline content
- Navigate to content

**Sections:**
- **Status Cards**: Online/offline status, item count, storage used/quota
- **Actions**: Remove selected, cleanup expired, clear all
- **Content List**: All downloaded items with checkboxes and actions

**Access:** Navigate to `/members/offline`

---

## Technical Architecture

### File Structure

```
src/
├── lib/
│   └── offline/
│       ├── offlineManager.ts      # Content management
│       └── backgroundSync.ts      # Form & API sync
├── components/
│   └── offline/
│       ├── OfflineIndicator.tsx   # Connection status banner
│       └── OfflineDownloadButton.tsx  # Download button
└── app/
    └── [locale]/
        ├── members/
        │   └── offline/
        │       └── page.tsx       # Content manager page
        └── offline/
            └── page.tsx           # Offline fallback page
```

### Data Storage

**IndexedDB Databases:**

1. **ruach-offline** (Content metadata)
   - Store: `items`
   - Indexes: `type`, `downloadedAt`

2. **ruach-sync** (Sync queue)
   - Store: `queue`
   - Indexes: `timestamp`, `type`

**Cache API:**
- Uses service worker caching (configured in `next.config.mjs`)
- Cache names: `cdn-cache`, `r2-cache`, `image-cache`, `api-cache`, etc.

### Service Worker Integration

The existing PWA setup (via `@ducanh2912/next-pwa`) handles:
- Page caching
- Asset caching
- Runtime caching strategies

Our enhancements add:
- Content-specific caching via offline manager
- Background sync for forms/API
- Message passing for cache control

---

## Usage Guide

### 1. Adding Offline Download to Content Pages

```tsx
import OfflineDownloadButton from '@/components/offline/OfflineDownloadButton';

export default function MediaPage({ media }) {
  return (
    <div>
      <h1>{media.title}</h1>
      <OfflineDownloadButton
        id={media.id}
        type="media"
        title={media.title}
        url={`/media/${media.slug}`}
        thumbnailUrl={media.thumbnail}
        variant="button"
      />
    </div>
  );
}
```

### 2. Using Background Sync for Forms

```tsx
import { queueFormSubmission } from '@/lib/offline/backgroundSync';
import { isOnline } from '@/lib/offline/offlineManager';

async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  const formData = new FormData(e.target as HTMLFormElement);

  if (!isOnline()) {
    // Queue for background sync
    await queueFormSubmission('/api/contact', formData);
    alert('Your message will be sent when connection is restored');
  } else {
    // Normal submission
    await fetch('/api/contact', {
      method: 'POST',
      body: formData,
    });
  }
}
```

### 3. Enhanced Fetch with Auto-Sync

```tsx
import { fetchWithSync } from '@/lib/offline/backgroundSync';

// This will automatically queue for sync if offline
const response = await fetchWithSync('/api/likes', {
  method: 'POST',
  body: JSON.stringify({ mediaId: '123' }),
  headers: { 'Content-Type': 'application/json' },
});

if (response.status === 202) {
  // Request was queued for sync
  console.log('Queued for sync when online');
}
```

### 4. Checking Offline Availability

```tsx
import { isAvailableOffline } from '@/lib/offline/offlineManager';

const available = await isAvailableOffline('media-123');

if (available) {
  // Show "Available Offline" badge
  <span>📥 Available Offline</span>
}
```

### 5. Getting Storage Info

```tsx
import { getOfflineStatus, formatBytes } from '@/lib/offline/offlineManager';

const status = await getOfflineStatus();

console.log(`Storage: ${formatBytes(status.storageUsed)} / ${formatBytes(status.storageQuota)}`);
console.log(`Offline items: ${status.offlineItemsCount}`);
```

---

## Best Practices

### 1. Content Download Limits

Set reasonable limits to prevent storage exhaustion:

```typescript
const MAX_OFFLINE_ITEMS = 50; // Already configured
const MAX_STORAGE_PERCENTAGE = 90; // Warn at 90% usage
```

### 2. Expiration Strategy

Content expires after 30 days by default:

```typescript
expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
```

Run cleanup periodically:

```typescript
// On app startup
useEffect(() => {
  cleanupExpiredItems();
}, []);
```

### 3. User Feedback

Always provide feedback for offline operations:

```tsx
if (!isOnline()) {
  toast.info('You are offline. Changes will sync when connected.');
}
```

### 4. Graceful Degradation

Disable features that require internet:

```tsx
const online = isOnline();

<button disabled={!online}>
  {online ? 'Submit' : 'Offline - Cannot Submit'}
</button>
```

### 5. Storage Quota Warnings

Warn users when storage is low:

```typescript
const status = await getOfflineStatus();
const percentage = (status.storageUsed / status.storageQuota) * 100;

if (percentage > 90) {
  alert('Storage almost full. Please remove some offline content.');
}
```

---

## Testing

### Manual Testing Checklist

**Offline Manager:**
- [ ] Download content for offline
- [ ] View downloaded content list
- [ ] Remove individual items
- [ ] Bulk select and remove
- [ ] Cleanup expired items
- [ ] Clear all content
- [ ] Verify storage statistics

**Offline Indicator:**
- [ ] Go offline (airplane mode)
- [ ] Banner appears
- [ ] Go back online
- [ ] Banner shows sync progress
- [ ] Successfully syncs queued items
- [ ] Banner auto-hides after sync

**Background Sync:**
- [ ] Submit form while offline
- [ ] Form queued successfully
- [ ] Go back online
- [ ] Form auto-syncs
- [ ] Multiple forms sync correctly
- [ ] Failed syncs retry up to max

**Download Button:**
- [ ] Click to download content
- [ ] Shows downloading state
- [ ] Shows downloaded state
- [ ] Click to remove content
- [ ] Error handling works
- [ ] Both variants (button/icon) work

### Simulating Offline Mode

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Change "Online" dropdown to "Offline"

**Application Tab:**
- View IndexedDB databases
- Inspect Cache Storage
- Check Service Worker status

### Testing Background Sync

```javascript
// In console, manually trigger sync
navigator.serviceWorker.ready.then(registration => {
  return registration.sync.register('sync-queue');
});
```

---

## Performance Considerations

### Storage Efficiency

**IndexedDB:**
- Lightweight metadata only (~1KB per item)
- Indexes for fast queries
- Automatic cleanup of expired items

**Cache API:**
- Browser-managed storage
- Automatic eviction when full
- Size limits vary by browser

### Memory Usage

**Offline Manager:**
- Async operations prevent blocking
- Lazy loading of data
- Efficient data structures

**Background Sync:**
- Queue processed in batches
- Configurable retry limits
- Automatic cleanup of old items

### Network Efficiency

**Selective Caching:**
- Users choose what to download
- Not everything cached automatically
- Expired content removed

**Smart Syncing:**
- Only sync when online
- Batch multiple requests
- Retry failed requests

---

## Troubleshooting

### Issue: Content not downloading

**Solutions:**
- Check service worker is registered
- Verify sufficient storage quota
- Check browser console for errors
- Ensure URLs are cacheable

### Issue: Background sync not working

**Solutions:**
- Verify Background Sync API support
- Check service worker is active
- Inspect sync queue in IndexedDB
- Ensure network requests are valid

### Issue: Storage quota exceeded

**Solutions:**
- Run cleanup expired items
- Remove old offline content
- Check storage usage in DevTools
- Reduce max offline items limit

### Issue: Offline indicator not showing

**Solutions:**
- Verify component is in layout
- Check browser online/offline events
- Inspect component state in React DevTools
- Test with airplane mode

---

## Browser Support

### Required APIs

**IndexedDB:** ✅ All modern browsers
**Cache API:** ✅ All modern browsers
**Service Workers:** ✅ All modern browsers
**Background Sync:** ⚠️ Chrome, Edge, Opera (graceful degradation)

### Fallbacks

For browsers without Background Sync:
- Forms show "Will sync when online" message
- Manual retry button provided
- Queue still works, just no automatic sync

---

## Security Considerations

### Data Storage

**IndexedDB:**
- Domain-isolated
- Not accessible cross-origin
- Cleared when cookies cleared

**Cache API:**
- Same-origin policy
- HTTPS required in production
- Isolated per service worker

### Sensitive Data

**Never cache:**
- Authentication tokens
- Personal information
- Payment details
- Private content

**Use encryption for:**
- User-specific content
- Downloaded media with DRM
- Form data with PII

---

## Future Enhancements

### Planned Features

1. **Offline Media Playback**
   - Download video/audio files
   - Encrypted storage for premium content
   - Playlist management

2. **Selective Sync**
   - Choose which types to sync
   - Priority queue for important requests
   - Bandwidth-aware syncing

3. **Advanced Caching Strategies**
   - Predictive preloading
   - Machine learning-based caching
   - Network-adaptive caching

4. **Collaboration Features**
   - Offline commenting
   - Offline note-taking
   - Sync conflicts resolution

5. **Analytics**
   - Track offline usage
   - Monitor sync success rates
   - Storage usage analytics

---

## Migration Guide

### Upgrading from Basic PWA

If you have an existing PWA setup:

1. **Install offline manager:**
   ```bash
   # No installation needed, utilities are built-in
   ```

2. **Add OfflineIndicator to layout:**
   ```tsx
   import OfflineIndicator from '@/components/offline/OfflineIndicator';
   ```

3. **Add download buttons to content:**
   ```tsx
   import OfflineDownloadButton from '@/components/offline/OfflineDownloadButton';
   ```

4. **Update forms to use background sync:**
   ```tsx
   import { queueFormSubmission } from '@/lib/offline/backgroundSync';
   ```

5. **Test offline functionality thoroughly**

---

## Resources

- [MDN: Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN: Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [MDN: Background Sync](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Web.dev: Reliable PWAs](https://web.dev/reliable/)

---

## Summary

Phase 8.3 successfully implements comprehensive offline functionality:

✅ **Offline Content Manager** with IndexedDB storage
✅ **Background Sync** for forms and API requests
✅ **Offline Indicator** with auto-sync
✅ **Download Button** component for content
✅ **Content Manager Page** for user control
✅ **Storage Management** with quota tracking
✅ **Graceful Degradation** for unsupported browsers

The platform now works seamlessly offline, automatically syncing when connection is restored! 📱✨
