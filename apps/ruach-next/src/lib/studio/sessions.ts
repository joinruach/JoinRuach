import { z } from 'zod';
import {
  apiFetch,
  SessionSchema,
  AssetSchema,
  unwrapStrapiResponse,
  unwrapStrapiArray,
  type Session,
  type Asset,
  type SessionStatus,
  type CameraAngle,
} from './api';

// ==========================================
// Session API Methods
// ==========================================

/**
 * Get a single recording session by ID
 */
export async function getSession(
  sessionId: string,
  authToken: string
): Promise<Session> {
  const response = await apiFetch(`/api/recording-sessions/${sessionId}`, {
    method: 'GET',
    authToken,
  });

  return SessionSchema.parse(unwrapStrapiResponse(response));
}

/**
 * List all recording sessions
 */
export async function listSessions(
  authToken: string,
  filters?: {
    status?: SessionStatus | SessionStatus[];
    limit?: number;
    offset?: number;
  }
): Promise<Session[]> {
  const params = new URLSearchParams();

  if (filters?.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status];
    statuses.forEach((s) => params.append('filters[status][$in][]', s));
  }

  if (filters?.limit) {
    params.append('pagination[limit]', String(filters.limit));
  }

  if (filters?.offset) {
    params.append('pagination[start]', String(filters.offset));
  }

  params.append('sort[0]', 'createdAt:desc');

  const response = await apiFetch(
    `/api/recording-sessions?${params.toString()}`,
    {
      method: 'GET',
      authToken,
    }
  );

  return z
    .array(SessionSchema)
    .parse(unwrapStrapiArray(response));
}

/**
 * Create a new recording session
 */
export async function createSession(
  data: {
    title: string;
    recordingDate: Date | string;
    description?: string;
    speakers?: string[]; // Author IDs
    eventType?: string;
    anchorAngle?: CameraAngle;
    assets: string[]; // Asset IDs (A, B, C)
  },
  authToken: string
): Promise<Session> {
  const recordingDate =
    typeof data.recordingDate === 'string'
      ? data.recordingDate
      : data.recordingDate.toISOString();

  const response = await apiFetch('/api/recording-sessions', {
    method: 'POST',
    authToken,
    body: JSON.stringify({
      data: {
        ...data,
        recordingDate,
        status: 'ingesting',
      },
    }),
  });

  return SessionSchema.parse(unwrapStrapiResponse(response));
}

/**
 * Update a recording session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<{
    title: string;
    description: string;
    status: SessionStatus;
    operatorStatus: string;
    syncOffsets_ms: Record<string, number>;
    syncConfidence: Record<string, number>;
  }>,
  authToken: string
): Promise<Session> {
  const response = await apiFetch(`/api/recording-sessions/${sessionId}`, {
    method: 'PUT',
    authToken,
    body: JSON.stringify({ data: updates }),
  });

  return SessionSchema.parse(unwrapStrapiResponse(response));
}

/**
 * Delete a recording session
 */
export async function deleteSession(
  sessionId: string,
  authToken: string
): Promise<void> {
  await apiFetch(`/api/recording-sessions/${sessionId}`, {
    method: 'DELETE',
    authToken,
  });
}

/**
 * Get assets for a recording session
 */
export async function getSessionAssets(
  sessionId: string,
  authToken: string
): Promise<Asset[]> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/assets`,
    {
      method: 'GET',
      authToken,
    }
  );

  return z.array(AssetSchema).parse(unwrapStrapiArray(response));
}

/**
 * Trigger sync computation for a session
 */
export async function triggerSync(
  sessionId: string,
  authToken: string,
  masterCamera?: CameraAngle
): Promise<{ jobId: string }> {
  const response = await apiFetch(
    `/api/recording-sessions/${sessionId}/sync/compute`,
    {
      method: 'POST',
      authToken,
      body: JSON.stringify({ masterCamera }),
    }
  );

  return response as { jobId: string };
}
