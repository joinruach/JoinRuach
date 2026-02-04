/**
 * Universal Workflow Types for Ruach Studio
 *
 * Unified type system for all studio workflows:
 * - Ingest (upload + multi-cam sessions)
 * - Edit (EDL + edit decisions)
 * - Render (encoding + transcoding)
 * - Publish (platform distribution)
 * - Library (content catalog)
 */

export type WorkflowStatus =
  // Ingest workflow
  | 'pending' | 'processing' | 'reviewing' | 'approved' | 'rejected'
  // Render workflow
  | 'queued' | 'rendering' | 'encoding' | 'uploading'
  // Publish workflow
  | 'scheduled' | 'published'
  // Terminal states
  | 'completed' | 'failed' | 'cancelled' | 'archived';

export type WorkflowPriority = 'urgent' | 'high' | 'normal' | 'low';

export type WorkflowCategory = 'ingest' | 'edit' | 'publish' | 'render' | 'library';

export type WorkflowAction =
  | 'review' | 'approve' | 'reject' | 'retry' | 'cancel'
  | 'edit' | 'publish' | 'archive' | 'delete';

/**
 * Universal inbox item representation
 * Used across all workflow queues for consistent display
 */
export interface InboxItem {
  id: string;
  category: WorkflowCategory;
  entityType: 'session' | 'upload' | 'render-job' | 'publish-job' | 'media-item' | 'series';
  entityId: string | number;

  // Display
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  icon?: string;

  // State
  status: WorkflowStatus;
  priority: WorkflowPriority;
  reason: string;  // Why this needs attention

  // Actions
  availableActions: WorkflowAction[];
  primaryAction: WorkflowAction;

  // Timing
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

/**
 * Activity timeline entry for workflow history
 */
export interface WorkflowActivity {
  id: string;
  timestamp: string;
  actor: string;  // User ID or system
  action: WorkflowAction | 'created' | 'updated' | 'status_changed';
  details: string;
  oldStatus?: WorkflowStatus;
  newStatus?: WorkflowStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Filter configuration for queue tables
 */
export interface QueueFilters {
  status?: WorkflowStatus[];
  priority?: WorkflowPriority[];
  category?: WorkflowCategory[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Queue statistics for dashboard widgets
 */
export interface QueueStats {
  total: number;
  urgent: number;
  needsReview: number;
  failed: number;
  processing: number;
  byCategory: Record<WorkflowCategory, number>;
  byStatus: Record<WorkflowStatus, number>;
}

/**
 * Workflow item detail (extended inbox item with full context)
 */
export interface WorkflowItemDetail extends InboxItem {
  description?: string;
  history: WorkflowActivity[];
  metadata: Record<string, unknown>;
  assignedTo?: string;
  blockedBy?: string[];  // IDs of items blocking this one
  blocking?: string[];   // IDs of items blocked by this one
}
