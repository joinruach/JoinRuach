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

// ==========================================
// Phase 9-11: Multi-Camera Workflow
// ==========================================

// Re-export all types and functions from multi-camera workflow modules
export {
  // API utilities
  apiFetch,
  pollUntil,
  unwrapStrapiResponse,
  unwrapStrapiArray,
  ApiError,
  // Types
  type Session,
  type Asset,
  type SyncResult,
  type SessionStatus,
  type OperatorStatus,
  type CameraAngle,
} from './api';

export {
  // Session operations
  getSession,
  listSessions,
  createSession,
  updateSession,
  deleteSession,
  getSessionAssets,
  triggerSync,
} from './sessions';

export {
  // Sync operations
  computeSync,
  getSyncStatus,
  approveSync,
  correctSync,
  classifySyncConfidence,
  getSyncConfidenceLabel,
  getSyncConfidenceColor,
} from './sync';

export {
  // Transcript operations (Phase 10)
  startTranscription,
  getTranscript,
  updateTranscriptSegments,
  getSubtitleFile,
  formatTimestamp,
  parseTimestamp,
  generateSRT,
  generateVTT,
  getConfidenceColor,
  getConfidenceLabel,
  type Transcript,
  type TranscriptSegment,
  type TranscriptWord,
  type StartTranscriptionOptions,
} from './transcript';

export {
  // EDL operations (Phase 11)
  generateEDL,
  getEDL,
  updateEDL,
  approveEDL,
  lockEDL,
  exportEDL,
  type Cut,
  type ChapterMarker,
  type CanonicalEDL,
} from './edl';
