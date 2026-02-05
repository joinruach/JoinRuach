import { apiFetch, type CameraAngle } from './api';

// ==========================================
// EDL Types
// ==========================================

export interface Cut {
  id: string;
  startMs: number;
  endMs: number;
  camera: CameraAngle;
  reason?: 'speaker' | 'reaction' | 'wide';
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
