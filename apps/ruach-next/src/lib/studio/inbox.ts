/**
 * Inbox Aggregation Logic
 *
 * Centralized inbox that pulls attention items from all workflows:
 * - Ingestion (failed uploads, pending reviews)
 * - Render (failed jobs, queued jobs)
 * - Publishing (scheduled, failed publishes)
 * - Edit (pending EDL approvals)
 */

import type { InboxItem, QueueStats, WorkflowPriority, WorkflowStatus } from './types';

/**
 * Priority order for sorting (lower = higher priority)
 */
const PRIORITY_ORDER: Record<WorkflowPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * Fetch ingestion inbox items
 * Fetches from /api/ingestion/versions and converts to InboxItems
 */
async function fetchIngestionInbox(jwt: string): Promise<InboxItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    // Note: /api/ingestion/versions uses NextAuth session cookies for auth,
    // so no Authorization header is needed
    const response = await fetch(`${baseUrl}/api/ingestion/versions`, {
      cache: 'no-store',
      credentials: 'include', // Include cookies for session auth
    });

    if (!response.ok) {
      console.error('[Inbox] Failed to fetch ingestion versions:', response.status);
      return [];
    }

    const data = await response.json();
    const versions = data.versions || [];

    return versions
      .filter(
        (v: { status: string }) =>
          v.status === 'reviewing' || v.status === 'failed' || v.status === 'pending'
      )
      .map((version: {
        versionId: string;
        sourceId: string;
        contentType: string;
        status: string;
        progress: number;
        createdAt: string;
        completedAt?: string;
      }) => ({
        id: `ingest-${version.versionId}`,
        category: 'ingest' as const,
        entityType: 'upload' as const,
        entityId: version.versionId,

        title: `Ingestion: ${version.contentType}`,
        subtitle: version.sourceId,
        thumbnailUrl: undefined,
        icon: version.contentType === 'scripture' ? '📖' : version.contentType === 'canon' ? '📚' : '📗',

        status: version.status as WorkflowStatus,
        priority:
          version.status === 'failed'
            ? 'urgent'
            : version.status === 'reviewing'
            ? 'high'
            : 'normal',
        reason:
          version.status === 'failed'
            ? 'Ingestion failed and needs attention'
            : version.status === 'reviewing'
            ? 'Ready for operator review'
            : 'Ingestion pending',

        availableActions:
          version.status === 'reviewing'
            ? ['review', 'approve', 'reject']
            : version.status === 'failed'
            ? ['retry', 'cancel']
            : ['review'],
        primaryAction: version.status === 'reviewing' ? 'approve' : 'review',

        createdAt: version.createdAt,
        updatedAt: version.completedAt || version.createdAt,
      }));
  } catch (error) {
    console.error('[Inbox] Error fetching ingestion inbox:', error);
    return [];
  }
}

/**
 * Fetch render inbox items
 * Note: Render jobs API requires session IDs, so we only return failed/queued jobs for now
 * Full implementation will come in Phase 3 with a dedicated render jobs list endpoint
 */
async function fetchRenderInbox(jwt: string): Promise<InboxItem[]> {
  // For Phase 2, we'll return empty array until we have a render jobs list API
  // Phase 3 will add: GET /api/render-job/render-jobs (list all jobs)
  // For now, individual session render jobs are accessible via /api/render-job/render-jobs/session/:id
  return [];
}

/**
 * Fetch publishing inbox items
 * TODO: Wire to actual publishing API in Phase 5
 */
async function fetchPublishInbox(jwt: string): Promise<InboxItem[]> {
  // Mock implementation - replace with actual API call in Phase 5
  return [];
}

/**
 * Fetch edit decision inbox items
 * TODO: Wire to actual EDL API in Phase 5
 */
async function fetchEditInbox(jwt: string): Promise<InboxItem[]> {
  // Mock implementation - replace with actual API call in Phase 5
  return [];
}

/**
 * Main inbox aggregation function
 * Fetches items from all workflows in parallel and sorts by priority
 *
 * @param jwt - Strapi JWT token for authentication
 * @returns Prioritized array of inbox items
 */
export async function fetchInboxItems(jwt: string): Promise<InboxItem[]> {
  // Parallel fetch from all workflows
  const [ingestionItems, renderItems, publishItems, editItems] = await Promise.all([
    fetchIngestionInbox(jwt),
    fetchRenderInbox(jwt),
    fetchPublishInbox(jwt),
    fetchEditInbox(jwt),
  ]);

  const items = [...ingestionItems, ...renderItems, ...publishItems, ...editItems];

  // Sort by priority, then by date (newest first)
  return items.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, sort by date
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

/**
 * Calculate queue statistics from inbox items
 *
 * @param items - Array of inbox items
 * @returns Queue statistics object
 */
export function calculateQueueStats(items: InboxItem[]): QueueStats {
  const stats: QueueStats = {
    total: items.length,
    urgent: 0,
    needsReview: 0,
    failed: 0,
    processing: 0,
    byCategory: {
      ingest: 0,
      edit: 0,
      publish: 0,
      render: 0,
      library: 0,
    },
    byStatus: {
      pending: 0,
      processing: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
      queued: 0,
      rendering: 0,
      encoding: 0,
      uploading: 0,
      scheduled: 0,
      published: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      archived: 0,
    },
  };

  for (const item of items) {
    // Priority counts
    if (item.priority === 'urgent') stats.urgent++;

    // Status counts
    if (item.status === 'reviewing') stats.needsReview++;
    if (item.status === 'failed') stats.failed++;
    if (item.status === 'processing' || item.status === 'rendering' || item.status === 'encoding') {
      stats.processing++;
    }

    // Category counts
    stats.byCategory[item.category]++;

    // Status breakdown
    stats.byStatus[item.status]++;
  }

  return stats;
}

/**
 * Filter inbox items by criteria
 *
 * @param items - Array of inbox items
 * @param filters - Filter criteria
 * @returns Filtered array of inbox items
 */
export function filterInboxItems(
  items: InboxItem[],
  filters: {
    status?: string[];
    priority?: string[];
    category?: string[];
    search?: string;
  }
): InboxItem[] {
  let filtered = [...items];

  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter((item) => filters.status!.includes(item.status));
  }

  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter((item) => filters.priority!.includes(item.priority));
  }

  if (filters.category && filters.category.length > 0) {
    filtered = filtered.filter((item) => filters.category!.includes(item.category));
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.subtitle?.toLowerCase().includes(searchLower) ||
        item.reason.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}
