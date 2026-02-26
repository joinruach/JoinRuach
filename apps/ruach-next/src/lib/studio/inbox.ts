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
 * Calls Strapi directly with JWT (more efficient than HTTP hop through /api)
 */
async function fetchIngestionInbox(jwt: string): Promise<InboxItem[]> {
  try {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    const response = await fetch(`${strapiUrl}/api/ingestion/versions`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      console.warn('[Inbox] Failed to fetch ingestion versions:', response.status);
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
    console.warn('[Inbox] Error fetching ingestion inbox:', error);
    return [];
  }
}

/**
 * Fetch render inbox items
 * Queries the render-job API for failed/queued jobs needing attention
 */
async function fetchRenderInbox(jwt: string): Promise<InboxItem[]> {
  try {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    const response = await fetch(
      `${strapiUrl}/api/render-jobs?filters[status][$in]=failed,queued,rendering&sort=updatedAt:desc&pagination[limit]=50&populate=recordingSession`,
      {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );

    if (!response.ok) {
      // Endpoint may not exist yet — degrade gracefully
      return [];
    }

    const data = await response.json();
    const jobs = data.data || [];

    return jobs.map((job: {
      id: number;
      documentId?: string;
      status: string;
      preset?: string;
      recordingSession?: { title?: string };
      createdAt: string;
      updatedAt: string;
      errorMessage?: string;
    }) => ({
      id: `render-${job.documentId || job.id}`,
      category: 'render' as const,
      entityType: 'render-job' as const,
      entityId: job.documentId || job.id,

      title: `Render: ${job.preset || 'Default'}`,
      subtitle: job.recordingSession?.title,
      icon: '🎬',

      status: job.status as WorkflowStatus,
      priority: job.status === 'failed' ? 'urgent' as const
        : job.status === 'rendering' ? 'high' as const
        : 'normal' as const,
      reason: job.status === 'failed'
        ? `Render failed: ${job.errorMessage || 'Unknown error'}`
        : job.status === 'rendering'
        ? 'Render in progress'
        : 'Queued for rendering',

      availableActions: job.status === 'failed'
        ? ['retry', 'cancel'] as const
        : ['review'] as const,
      primaryAction: job.status === 'failed' ? 'retry' as const : 'review' as const,

      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch publishing inbox items from the ruach-publisher plugin
 */
async function fetchPublishInbox(jwt: string): Promise<InboxItem[]> {
  try {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    const response = await fetch(
      `${strapiUrl}/api/ruach-publisher/jobs?status=failed,active,waiting,delayed`,
      {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );

    if (!response.ok) {
      console.warn('[Inbox] Failed to fetch publish jobs:', response.status);
      return [];
    }

    const data = await response.json();
    const jobs = data.jobs || [];

    return jobs.map((job: {
      id: string;
      platform: string;
      mediaItemId?: number;
      mediaItemTitle?: string;
      workflowState: string;
      priority: string;
      retryAllowed: boolean;
      failedReason?: string;
      timestamp?: number;
      finishedOn?: number;
    }) => ({
      id: `publish-${job.id}`,
      category: 'publish' as const,
      entityType: 'publish-job' as const,
      entityId: job.mediaItemId || job.id,

      title: job.mediaItemTitle || `Publish: ${job.platform}`,
      subtitle: job.platform,
      icon: '🚀',

      status: job.workflowState as WorkflowStatus,
      priority: job.priority as WorkflowPriority,
      reason: job.workflowState === 'failed'
        ? `Publish to ${job.platform} failed: ${job.failedReason || 'Unknown error'}`
        : job.workflowState === 'processing'
        ? `Publishing to ${job.platform} in progress`
        : `Queued for ${job.platform}`,

      availableActions: job.retryAllowed
        ? ['retry', 'cancel'] as const
        : ['review'] as const,
      primaryAction: job.retryAllowed ? 'retry' as const : 'review' as const,

      createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : new Date().toISOString(),
      updatedAt: job.finishedOn
        ? new Date(job.finishedOn).toISOString()
        : job.timestamp
        ? new Date(job.timestamp).toISOString()
        : new Date().toISOString(),
    }));
  } catch (error) {
    console.warn('[Inbox] Error fetching publish inbox:', error);
    return [];
  }
}

/**
 * Fetch edit decision inbox items from EDL content type
 */
async function fetchEditInbox(jwt: string): Promise<InboxItem[]> {
  try {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    const response = await fetch(
      `${strapiUrl}/api/edit-decision-lists?filters[status][$in]=pending,reviewing&populate=recordingSession&sort=updatedAt:desc&pagination[limit]=50`,
      {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );

    if (!response.ok) {
      console.warn('[Inbox] Failed to fetch EDL inbox:', response.status);
      return [];
    }

    const data = await response.json();
    const edls = data.data || [];

    return edls.map((edl: {
      id: number;
      documentId?: string;
      status: string;
      name?: string;
      recordingSession?: { title?: string; documentId?: string };
      createdAt: string;
      updatedAt: string;
    }) => ({
      id: `edit-${edl.documentId || edl.id}`,
      category: 'edit' as const,
      entityType: 'media-item' as const,
      entityId: edl.documentId || edl.id,

      title: edl.name || 'Edit Decision List',
      subtitle: edl.recordingSession?.title,
      icon: '✂️',

      status: edl.status as WorkflowStatus,
      priority: edl.status === 'reviewing' ? 'high' as const : 'normal' as const,
      reason: edl.status === 'reviewing'
        ? 'EDL ready for operator review'
        : 'EDL pending approval',

      availableActions: edl.status === 'reviewing'
        ? ['review', 'approve', 'reject'] as const
        : ['review'] as const,
      primaryAction: edl.status === 'reviewing' ? 'approve' as const : 'review' as const,

      createdAt: edl.createdAt,
      updatedAt: edl.updatedAt,
    }));
  } catch (error) {
    console.warn('[Inbox] Error fetching edit inbox:', error);
    return [];
  }
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
