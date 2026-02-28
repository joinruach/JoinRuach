import { apiFetch, type CameraAngle } from './api';

// ==========================================
// EDL Types
// ==========================================

export interface Cut {
  id: string;
  startMs: number;
  endMs: number;
  camera: CameraAngle;
  reason?: 'speaker' | 'reaction' | 'wide' | 'emphasis' | 'operator';
  confidence?: number;
}

export interface ChapterMarker {
  id: string;
  timeMs: number;
  title: string;
  description?: string;
}

export interface CanonicalEDL {
  id: number;
  sessionId: string;
  version: number;
  status: 'draft' | 'approved' | 'locked';
  durationMs: number;
  tracks: {
    program: Cut[]; // Final camera selection
    chapters?: ChapterMarker[];
  };
  metrics: {
    totalCuts: number;
    avgShotLength: number;
    cameraDistribution: Record<CameraAngle, number>;
  };
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// ==========================================
// EDL API Methods (Phase 11)
// ==========================================

/**
 * Generate EDL for a session
 * ⚠️ Backend implementation pending (Phase 11)
 */
export async function generateEDL(
  sessionId: string,
  authToken: string,
  options?: {
    minShotLength?: number;
    maxShotLength?: number;
    switchCooldown?: number;
  }
): Promise<{
  jobId: string;
  message: string;
}> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/edl/generate`,
    {
      method: 'POST',
      authToken,
      body: JSON.stringify(options || {}),
    }
  );

  return response as { jobId: string; message: string };
}

/**
 * Get EDL for a session
 * ⚠️ Backend implementation pending (Phase 11)
 */
export async function getEDL(
  sessionId: string,
  authToken: string
): Promise<CanonicalEDL | null> {
  // Dev-only mock EDL for visual testing of confidence UI
  if (process.env.NEXT_PUBLIC_DEV_MOCK_EDL === 'true') {
    return buildMockEDL(sessionId);
  }

  try {
    const response = await apiFetch(
      `/api/recording-sessions/${sessionId}/edl`,
      {
        method: 'GET',
        authToken,
      }
    );

    return response as CanonicalEDL;
  } catch (error) {
    // EDL not found
    return null;
  }
}

/** Dev-only: hardcoded EDL with mixed confidence for UI testing */
function buildMockEDL(sessionId: string): CanonicalEDL {
  const cuts: Cut[] = [
    { id: 'mock-1', startMs: 0, endMs: 8000, camera: 'A', reason: 'speaker', confidence: 0.95 },
    { id: 'mock-2', startMs: 8000, endMs: 14000, camera: 'B', reason: 'speaker', confidence: 0.85 },
    { id: 'mock-3', startMs: 14000, endMs: 22000, camera: 'A', reason: 'speaker', confidence: 0.82 },
    { id: 'mock-4', startMs: 22000, endMs: 30000, camera: 'C', reason: 'wide', confidence: 0.65 },
    { id: 'mock-5', startMs: 30000, endMs: 38000, camera: 'B', reason: 'emphasis', confidence: 0.55 },
    { id: 'mock-6', startMs: 38000, endMs: 46000, camera: 'A', reason: 'speaker', confidence: 0.52 },
    { id: 'mock-7', startMs: 46000, endMs: 52000, camera: 'C', reason: 'wide', confidence: 0.35 },
    { id: 'mock-8', startMs: 52000, endMs: 60000, camera: 'B', reason: 'emphasis', confidence: 0.4 },
  ];

  return {
    id: 999,
    sessionId,
    version: 1,
    status: 'draft',
    durationMs: 60000,
    tracks: { program: cuts },
    metrics: {
      totalCuts: cuts.length,
      avgShotLength: 7500,
      cameraDistribution: { A: 3, B: 3, C: 2 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update EDL cuts
 * ⚠️ Backend implementation pending (Phase 11)
 */
export async function updateEDL(
  sessionId: string,
  cuts: Cut[],
  authToken: string
): Promise<CanonicalEDL> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/edl`,
    {
      method: 'PUT',
      authToken,
      body: JSON.stringify({ cuts }),
    }
  );

  return response as CanonicalEDL;
}

/**
 * Approve EDL
 * ⚠️ Backend implementation pending (Phase 11)
 */
export async function approveEDL(
  sessionId: string,
  authToken: string
): Promise<CanonicalEDL> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/edl/approve`,
    {
      method: 'POST',
      authToken,
    }
  );

  return response as CanonicalEDL;
}

/**
 * Lock EDL (prevents further editing)
 * ⚠️ Backend implementation pending (Phase 11)
 */
export async function lockEDL(
  sessionId: string,
  authToken: string
): Promise<CanonicalEDL> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/edl/lock`,
    {
      method: 'POST',
      authToken,
    }
  );

  return response as CanonicalEDL;
}

/**
 * Export EDL to different formats
 * ⚠️ Backend implementation pending (Phase 11)
 */
export async function exportEDL(
  sessionId: string,
  format: 'json' | 'fcpxml' | 'premiere' | 'resolve',
  authToken: string
): Promise<Blob> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/recording-sessions/${sessionId}/edl/export/${format}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to export EDL: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Update a single cut
 */
export async function updateCut(
  sessionId: string,
  cutId: string,
  updates: Partial<Cut>,
  authToken: string
): Promise<CanonicalEDL> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/edl/cuts/${cutId}`,
    {
      method: 'PATCH',
      authToken,
      body: JSON.stringify(updates),
    }
  );

  return response as CanonicalEDL;
}

/**
 * Split a cut at specific timestamp
 */
export async function splitCut(
  sessionId: string,
  cutId: string,
  splitTimeMs: number,
  authToken: string
): Promise<CanonicalEDL> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/edl/cuts/${cutId}/split`,
    {
      method: 'POST',
      authToken,
      body: JSON.stringify({ splitTimeMs }),
    }
  );

  return response as CanonicalEDL;
}

/**
 * Delete a cut
 */
export async function deleteCut(
  sessionId: string,
  cutId: string,
  authToken: string
): Promise<CanonicalEDL> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/edl/cuts/${cutId}`,
    {
      method: 'DELETE',
      authToken,
    }
  );

  return response as CanonicalEDL;
}

/**
 * Update chapter markers
 */
export async function updateChapters(
  sessionId: string,
  chapters: ChapterMarker[],
  authToken: string
): Promise<CanonicalEDL> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/edl/chapters`,
    {
      method: 'PUT',
      authToken,
      body: JSON.stringify({ chapters }),
    }
  );

  return response as CanonicalEDL;
}
