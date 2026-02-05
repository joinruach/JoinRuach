import { apiFetch, type CameraAngle } from './api';

// ==========================================
// Sync API Methods
// ==========================================

/**
 * Compute sync offsets for a recording session
 * Backend uses audio-offset-finder to compute offsets
 */
export async function computeSync(
  sessionId: string,
  authToken: string,
  masterCamera?: CameraAngle
): Promise<{
  jobId: string;
  message: string;
}> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/sync/compute`,
    {
      method: 'POST',
      authToken,
      body: JSON.stringify({ masterCamera }),
    }
  );

  return response as { jobId: string; message: string };
}

/**
 * Get sync computation status
 */
export async function getSyncStatus(
  sessionId: string,
  authToken: string
): Promise<{
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress?: number;
  result?: {
    syncOffsets_ms: Record<string, number>;
    syncConfidence: Record<string, number>;
    syncMethod: string;
  };
  error?: string;
}> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/sync/status`,
    {
      method: 'GET',
      authToken,
    }
  );

  return response as {
    status: 'pending' | 'processing' | 'complete' | 'failed';
    progress?: number;
    result?: {
      syncOffsets_ms: Record<string, number>;
      syncConfidence: Record<string, number>;
      syncMethod: string;
    };
    error?: string;
  };
}

/**
 * Approve sync results
 * Operator has reviewed and approved the automatic sync
 */
export async function approveSync(
  sessionId: string,
  authToken: string,
  notes?: string
): Promise<{
  success: boolean;
  session: {
    status: string;
    operatorStatus: string;
  };
}> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/sync/approve`,
    {
      method: 'POST',
      authToken,
      body: JSON.stringify({ notes }),
    }
  );

  return response as {
    success: boolean;
    session: {
      status: string;
      operatorStatus: string;
    };
  };
}

/**
 * Correct sync offsets manually
 * Operator has manually adjusted offsets
 */
export async function correctSync(
  sessionId: string,
  offsets: Record<string, number>,
  authToken: string,
  notes?: string
): Promise<{
  success: boolean;
  session: {
    status: string;
    operatorStatus: string;
    syncOffsets_ms: Record<string, number>;
  };
}> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/sync/correct`,
    {
      method: 'POST',
      authToken,
      body: JSON.stringify({ offsets, notes }),
    }
  );

  return response as {
    success: boolean;
    session: {
      status: string;
      operatorStatus: string;
      syncOffsets_ms: Record<string, number>;
    };
  };
}

/**
 * Classify sync confidence into UX-friendly categories
 * Based on audio-offset-finder standard_score:
 * - >= 10: 'looks-good' (one-click approve)
 * - >= 5: 'review-suggested' (quick visual check)
 * - < 5: 'needs-manual-nudge' (manual correction required)
 */
export function classifySyncConfidence(
  confidence: number
): 'looks-good' | 'review-suggested' | 'needs-manual-nudge' {
  if (confidence >= 10) return 'looks-good';
  if (confidence >= 5) return 'review-suggested';
  return 'needs-manual-nudge';
}

/**
 * Get human-readable sync confidence description
 */
export function getSyncConfidenceLabel(
  classification: 'looks-good' | 'review-suggested' | 'needs-manual-nudge'
): string {
  switch (classification) {
    case 'looks-good':
      return 'Looks Good ✓';
    case 'review-suggested':
      return 'Review Suggested ⚠️';
    case 'needs-manual-nudge':
      return 'Needs Manual Nudge ⚠️';
  }
}

/**
 * Get confidence color for UI display
 */
export function getSyncConfidenceColor(
  classification: 'looks-good' | 'review-suggested' | 'needs-manual-nudge'
): string {
  switch (classification) {
    case 'looks-good':
      return 'text-green-600 dark:text-green-400';
    case 'review-suggested':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'needs-manual-nudge':
      return 'text-red-600 dark:text-red-400';
  }
}
