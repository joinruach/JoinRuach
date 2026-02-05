import { z } from 'zod';

// ==========================================
// Zod Schemas for Type Safety
// ==========================================

export const SessionStatusSchema = z.enum([
  'draft',
  'ingesting',
  'needs-review',
  'syncing',
  'synced',
  'editing',
  'rendering',
  'published',
  'archived',
]);

export const OperatorStatusSchema = z.enum(['pending', 'approved', 'corrected']);

export const CameraAngleSchema = z.enum(['A', 'B', 'C']);

export const SessionSchema = z.object({
  id: z.number(),
  documentId: z.string().optional(),
  sessionId: z.string(),
  title: z.string(),
  status: SessionStatusSchema,
  operatorStatus: OperatorStatusSchema.optional(),
  syncOffsets_ms: z.record(z.number()).optional(),
  syncConfidence: z.record(z.number()).optional(),
  syncMethod: z.enum(['audio-offset-finder', 'manual', 'timecode']).optional(),
  anchorAngle: CameraAngleSchema.optional(),
  recordingDate: z.string(), // ISO date string
  description: z.string().optional(),
  durationMs: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
});

export const AssetSchema = z.object({
  id: z.number(),
  documentId: z.string().optional(),
  assetId: z.string(),
  angle: CameraAngleSchema,
  filename: z.string(),
  r2_key: z.string().optional(),
  r2_proxy_url: z.string().optional(),
  r2_mezzanine_url: z.string().optional(),
  r2_audio_wav_url: z.string().optional(),
  transcodingStatus: z.enum(['pending', 'processing', 'complete', 'failed']).optional(),
  uploadStatus: z.enum(['pending', 'uploading', 'complete', 'failed']).optional(),
  durationMs: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SyncResultSchema = z.object({
  camera: CameraAngleSchema,
  offsetMs: z.number(),
  confidence: z.number(), // standard_score from audio-offset-finder (not 0-1!)
  classification: z.enum(['looks-good', 'review-suggested', 'needs-manual-nudge']),
});

export type Session = z.infer<typeof SessionSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type SyncResult = z.infer<typeof SyncResultSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type OperatorStatus = z.infer<typeof OperatorStatusSchema>;
export type CameraAngle = z.infer<typeof CameraAngleSchema>;

// ==========================================
// API Error Handling
// ==========================================

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ==========================================
// Base Fetch with JWT + Error Handling
// ==========================================

interface ApiFetchOptions<T = unknown> extends RequestInit {
  authToken: string;
  schema?: z.ZodSchema<T>;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions<T>
): Promise<T> {
  const { authToken, schema, ...fetchOptions } = options;
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_STRAPI_URL environment variable is not set');
  }

  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      cache: fetchOptions.cache || 'no-store', // Disable caching by default, allow override
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      let errorDetails: unknown;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = { error: response.statusText };
      }

      const errorMessage =
        typeof errorDetails === 'object' &&
        errorDetails !== null &&
        'error' in errorDetails
          ? String(errorDetails.error)
          : response.statusText || 'Unknown error';

      throw new ApiError(response.status, errorMessage, errorDetails);
    }

    const data = await response.json();

    // Validate with Zod if schema provided
    if (schema) {
      return schema.parse(data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ApiError(
        500,
        'Invalid response schema from API',
        error.issues
      );
    }

    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'Network error'
    );
  }
}

// ==========================================
// Polling Helper for Async Operations
// ==========================================

interface PollOptions {
  maxAttempts?: number;
  interval?: number;
  onProgress?: (attempt: number) => void;
}

export async function pollUntil<T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  options: PollOptions = {}
): Promise<T> {
  const { maxAttempts = 30, interval = 2000, onProgress } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (onProgress) {
      onProgress(attempt);
    }

    const result = await fn();

    if (condition(result)) {
      return result;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw new Error(
    `Polling timeout: condition not met after ${maxAttempts} attempts`
  );
}

// ==========================================
// Strapi Response Normalization Helpers
// ==========================================

/**
 * Extract data from Strapi's wrapped response format
 * Handles both { data: {...} } and direct object returns
 */
export function unwrapStrapiResponse<T>(response: unknown): T {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    response.data
  ) {
    return response.data as T;
  }
  return response as T;
}

/**
 * Extract array data from Strapi's wrapped response format
 * Handles both { data: [...] } and direct array returns
 */
export function unwrapStrapiArray<T>(response: unknown): T[] {
  const data = unwrapStrapiResponse<unknown>(response);
  return Array.isArray(data) ? (data as T[]) : [];
}
