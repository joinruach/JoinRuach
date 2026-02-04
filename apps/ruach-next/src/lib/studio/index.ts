/**
 * Studio Library Barrel Export
 *
 * Centralized exports for all studio workflow utilities.
 */

// Types
export type {
  WorkflowStatus,
  WorkflowPriority,
  WorkflowCategory,
  WorkflowAction,
  InboxItem,
  WorkflowActivity,
  QueueFilters,
  QueueStats,
  WorkflowItemDetail,
} from './types';

// Inbox utilities
export {
  fetchInboxItems,
  calculateQueueStats,
  filterInboxItems,
} from './inbox';

// Mock data (for testing only)
export {
  generateMockInboxItems,
  generateMockActivity,
  generateMockItemDetail,
  generateMockStats,
} from './mockData';
