/**
 * Offline Content Manager
 *
 * Manages offline content caching, downloads, and availability.
 * Works with the service worker to provide seamless offline experience.
 */

const OFFLINE_CACHE_NAME = 'ruach-offline-content-v1';
const MAX_OFFLINE_ITEMS = 50;

export interface OfflineItem {
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

export interface OfflineStatus {
  isOnline: boolean;
  hasServiceWorker: boolean;
  storageUsed: number;
  storageQuota: number;
  offlineItemsCount: number;
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Check if service worker is supported and registered
 */
export async function hasServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  return !!registration;
}

/**
 * Get storage quota and usage
 */
export async function getStorageInfo(): Promise<{
  used: number;
  quota: number;
  percentage: number;
}> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return { used: 0, quota: 0, percentage: 0 };
  }

  const estimate = await navigator.storage.estimate();
  const used = estimate.usage || 0;
  const quota = estimate.quota || 0;
  const percentage = quota > 0 ? (used / quota) * 100 : 0;

  return { used, quota, percentage };
}

/**
 * Get offline status
 */
export async function getOfflineStatus(): Promise<OfflineStatus> {
  const [hasSW, storage, items] = await Promise.all([
    hasServiceWorker(),
    getStorageInfo(),
    getOfflineItems(),
  ]);

  return {
    isOnline: isOnline(),
    hasServiceWorker: hasSW,
    storageUsed: storage.used,
    storageQuota: storage.quota,
    offlineItemsCount: items.length,
  };
}

/**
 * Store offline items metadata in IndexedDB
 */
async function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ruach-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('items')) {
        const store = db.createObjectStore('items', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }
    };
  });
}

/**
 * Save offline item metadata
 */
export async function saveOfflineItem(item: OfflineItem): Promise<void> {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['items'], 'readwrite');
    const store = transaction.objectStore('items');
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all offline items
 */
export async function getOfflineItems(): Promise<OfflineItem[]> {
  try {
    const db = await openOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get offline items:', error);
    return [];
  }
}

/**
 * Get offline item by ID
 */
export async function getOfflineItem(id: string): Promise<OfflineItem | null> {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['items'], 'readonly');
    const store = transaction.objectStore('items');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if item is available offline
 */
export async function isAvailableOffline(id: string): Promise<boolean> {
  const item = await getOfflineItem(id);
  if (!item) return false;

  // Check if expired
  if (item.expiresAt && item.expiresAt < Date.now()) {
    await deleteOfflineItem(id);
    return false;
  }

  return true;
}

/**
 * Delete offline item
 */
export async function deleteOfflineItem(id: string): Promise<void> {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['items'], 'readwrite');
    const store = transaction.objectStore('items');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all offline items
 */
export async function clearOfflineItems(): Promise<void> {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['items'], 'readwrite');
    const store = transaction.objectStore('items');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Download content for offline use
 */
export async function downloadForOffline(
  item: Omit<OfflineItem, 'downloadedAt'>
): Promise<void> {
  try {
    // Check if we've reached the limit
    const items = await getOfflineItems();
    if (items.length >= MAX_OFFLINE_ITEMS) {
      throw new Error(`Maximum offline items (${MAX_OFFLINE_ITEMS}) reached`);
    }

    // Check storage quota
    const storage = await getStorageInfo();
    if (storage.percentage > 90) {
      throw new Error('Storage quota exceeded (>90%)');
    }

    // Request caching via service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;

      // Send message to service worker to cache the content
      registration.active?.postMessage({
        type: 'CACHE_CONTENT',
        payload: {
          urls: [item.url, item.thumbnailUrl].filter(Boolean),
        },
      });
    }

    // Save metadata
    await saveOfflineItem({
      ...item,
      downloadedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  } catch (error) {
    console.error('Failed to download for offline:', error);
    throw error;
  }
}

/**
 * Remove content from offline storage
 */
export async function removeFromOffline(id: string): Promise<void> {
  const item = await getOfflineItem(id);
  if (!item) return;

  // Remove from cache via service worker
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;

    registration.active?.postMessage({
      type: 'REMOVE_CACHE',
      payload: {
        urls: [item.url, item.thumbnailUrl].filter(Boolean),
      },
    });
  }

  // Remove metadata
  await deleteOfflineItem(id);
}

/**
 * Clean up expired items
 */
export async function cleanupExpiredItems(): Promise<number> {
  const items = await getOfflineItems();
  const now = Date.now();
  let cleaned = 0;

  for (const item of items) {
    if (item.expiresAt && item.expiresAt < now) {
      await removeFromOffline(item.id);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Estimate item size (rough calculation)
 */
export function estimateItemSize(type: OfflineItem['type']): number {
  switch (type) {
    case 'media':
      return 50 * 1024 * 1024; // ~50MB for media
    case 'course':
      return 10 * 1024 * 1024; // ~10MB for course
    case 'lesson':
      return 5 * 1024 * 1024; // ~5MB for lesson
    case 'page':
      return 500 * 1024; // ~500KB for page
    default:
      return 1024 * 1024; // ~1MB default
  }
}
