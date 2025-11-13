/**
 * Background Sync Manager
 *
 * Handles form submissions and API requests when offline,
 * queuing them for sync when connection is restored.
 */

// Extend ServiceWorkerRegistration to include sync
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
      getTags(): Promise<string[]>;
    };
  }
}

export interface SyncQueueItem {
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

const SYNC_QUEUE_NAME = 'ruach-sync-queue';
const MAX_RETRIES = 3;

/**
 * Check if Background Sync API is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'sync' in ServiceWorkerRegistration.prototype
  );
}

/**
 * Open IndexedDB for sync queue
 */
async function openSyncDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ruach-sync', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(
  item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries' | 'maxRetries'>
): Promise<string> {
  const db = await openSyncDB();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const queueItem: SyncQueueItem = {
    ...item,
    id,
    timestamp: Date.now(),
    retries: 0,
    maxRetries: MAX_RETRIES,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const request = store.add(queueItem);

    request.onsuccess = () => {
      // Register sync if supported
      if (isBackgroundSyncSupported()) {
        navigator.serviceWorker.ready.then((registration) => {
          return registration.sync?.register('sync-queue');
        });
      }

      resolve(id);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all items in sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const db = await openSyncDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queue'], 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get sync queue:', error);
    return [];
  }
}

/**
 * Get sync queue item by ID
 */
export async function getSyncQueueItem(id: string): Promise<SyncQueueItem | null> {
  const db = await openSyncDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readonly');
    const store = transaction.objectStore('queue');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update sync queue item (for retry count)
 */
export async function updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
  const db = await openSyncDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await openSyncDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear entire sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  const db = await openSyncDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Process sync queue (attempt to sync all pending items)
 */
export async function processSyncQueue(): Promise<{
  successful: number;
  failed: number;
  remaining: number;
}> {
  const queue = await getSyncQueue();
  let successful = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (response.ok) {
        await removeFromSyncQueue(item.id);
        successful++;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);

      // Increment retry count
      item.retries++;

      if (item.retries >= item.maxRetries) {
        // Max retries reached, remove from queue
        await removeFromSyncQueue(item.id);
        failed++;
      } else {
        // Update retry count
        await updateSyncQueueItem(item);
      }
    }
  }

  const remainingQueue = await getSyncQueue();

  return {
    successful,
    failed,
    remaining: remainingQueue.length,
  };
}

/**
 * Queue form submission for background sync
 */
export async function queueFormSubmission(
  url: string,
  formData: FormData | Record<string, any>
): Promise<string> {
  const body =
    formData instanceof FormData
      ? JSON.stringify(Object.fromEntries(formData))
      : JSON.stringify(formData);

  return addToSyncQueue({
    type: 'form',
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
}

/**
 * Queue API request for background sync
 */
export async function queueApiRequest(
  url: string,
  options: RequestInit = {}
): Promise<string> {
  const method = (options.method || 'GET').toUpperCase() as SyncQueueItem['method'];
  const headers: Record<string, string> = {};

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  let body: string | undefined;
  if (options.body) {
    if (typeof options.body === 'string') {
      body = options.body;
    } else if (options.body instanceof FormData) {
      body = JSON.stringify(Object.fromEntries(options.body));
    } else {
      body = JSON.stringify(options.body);
    }
  }

  return addToSyncQueue({
    type: 'api',
    url,
    method,
    headers,
    body,
  });
}

/**
 * Enhanced fetch with automatic background sync fallback
 */
export async function fetchWithSync(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  } catch (error) {
    // If offline, queue for background sync
    if (!navigator.onLine) {
      await queueApiRequest(url, options);

      // Return a mock response indicating queued
      return new Response(
        JSON.stringify({
          queued: true,
          message: 'Request queued for sync when online',
        }),
        {
          status: 202, // Accepted
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    throw error;
  }
}
