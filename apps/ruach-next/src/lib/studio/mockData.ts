/**
 * Mock Data for Studio Workflows
 *
 * Used for testing and Storybook stories during Phase 1.
 * Will be replaced with actual API calls in later phases.
 */

import type { InboxItem, WorkflowActivity, WorkflowItemDetail, QueueStats } from './types';

/**
 * Generate mock inbox items for testing
 */
export function generateMockInboxItems(count: number = 10): InboxItem[] {
  const items: InboxItem[] = [];
  const now = Date.now();

  const statuses = ['pending', 'reviewing', 'failed', 'queued', 'rendering'] as const;
  const priorities = ['urgent', 'high', 'normal', 'low'] as const;
  const categories = ['ingest', 'render', 'publish', 'edit'] as const;

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];

    items.push({
      id: `mock-${i}`,
      category,
      entityType: category === 'ingest' ? 'upload' : 'render-job',
      entityId: 1000 + i,

      title: `${category === 'ingest' ? 'Upload' : 'Render Job'} ${1000 + i}`,
      subtitle: `Test ${category} workflow item`,
      thumbnailUrl: undefined,
      icon: category === 'ingest' ? '📥' : '🎞️',

      status,
      priority,
      reason: getReasonForStatus(status, category),

      availableActions: getActionsForStatus(status),
      primaryAction: getPrimaryAction(status),

      createdAt: new Date(now - i * 3600000).toISOString(),
      updatedAt: new Date(now - i * 1800000).toISOString(),
      lastActivityAt: new Date(now - i * 900000).toISOString(),
    });
  }

  return items;
}

/**
 * Get appropriate reason message for status
 */
function getReasonForStatus(status: string, category: string): string {
  const reasons: Record<string, string> = {
    pending: `Waiting for ${category} to start`,
    reviewing: 'Requires operator review and approval',
    failed: 'Process failed and needs retry or investigation',
    queued: 'Waiting in queue for processing',
    rendering: 'Currently being processed',
  };
  return reasons[status] || 'Needs attention';
}

/**
 * Get available actions for status
 */
function getActionsForStatus(status: string): ('review' | 'approve' | 'reject' | 'retry' | 'cancel')[] {
  const actions: Record<string, ('review' | 'approve' | 'reject' | 'retry' | 'cancel')[]> = {
    pending: ['review', 'cancel'],
    reviewing: ['approve', 'reject'],
    failed: ['retry', 'cancel'],
    queued: ['cancel'],
    rendering: ['cancel'],
  };
  return actions[status] || ['review'];
}

/**
 * Get primary action for status
 */
function getPrimaryAction(status: string): 'review' | 'approve' | 'reject' | 'retry' | 'cancel' {
  const primary: Record<string, 'review' | 'approve' | 'reject' | 'retry' | 'cancel'> = {
    pending: 'review',
    reviewing: 'approve',
    failed: 'retry',
    queued: 'review',
    rendering: 'review',
  };
  return primary[status] || 'review';
}

/**
 * Generate mock workflow activity history
 */
export function generateMockActivity(count: number = 5): WorkflowActivity[] {
  const activities: WorkflowActivity[] = [];
  const now = Date.now();

  const actions = [
    'created',
    'status_changed',
    'review',
    'approve',
    'retry',
  ] as const;

  for (let i = 0; i < count; i++) {
    activities.push({
      id: `activity-${i}`,
      timestamp: new Date(now - i * 3600000).toISOString(),
      actor: i % 2 === 0 ? 'system' : 'user-123',
      action: actions[i % actions.length],
      details: `Mock activity ${i}`,
    });
  }

  return activities;
}

/**
 * Generate mock workflow item detail
 */
export function generateMockItemDetail(id: string): WorkflowItemDetail {
  const item = generateMockInboxItems(1)[0];
  return {
    ...item,
    id,
    description: 'This is a mock workflow item for testing purposes.',
    history: generateMockActivity(5),
    metadata: {
      uploadedBy: 'user-123',
      fileSize: 1024 * 1024 * 100, // 100MB
      duration: 3600, // 1 hour
    },
  };
}

/**
 * Generate mock queue stats
 */
export function generateMockStats(items: InboxItem[]): QueueStats {
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
    if (item.priority === 'urgent') stats.urgent++;
    if (item.status === 'reviewing') stats.needsReview++;
    if (item.status === 'failed') stats.failed++;
    if (item.status === 'processing' || item.status === 'rendering') stats.processing++;

    stats.byCategory[item.category]++;
    stats.byStatus[item.status]++;
  }

  return stats;
}
