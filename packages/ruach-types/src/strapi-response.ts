/**
 * Strict Strapi response types with runtime validation helpers
 */

// Base entity structure
export interface StrapiEntityBase {
  id: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

// Generic Strapi response wrapper
export interface StrictStrapiResponse<T> {
  data: T;
  meta?: StrapiMeta;
}

export interface StrapiCollectionResponse<T> {
  data: T[];
  meta?: StrapiMeta;
}

export interface StrapiMeta {
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

// Strapi error structure
export interface StrictStrapiError {
  status: number;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface StrapiErrorResponse {
  error: StrictStrapiError;
}

// Type guards
export function isStrapiError(response: unknown): response is StrapiErrorResponse {
  if (!response || typeof response !== 'object') return false;
  const r = response as Record<string, unknown>;
  return (
    'error' in r &&
    r.error !== null &&
    typeof r.error === 'object' &&
    'status' in (r.error as object) &&
    'message' in (r.error as object)
  );
}

export function isStrapiCollection<T>(
  response: unknown
): response is StrapiCollectionResponse<T> {
  if (!response || typeof response !== 'object') return false;
  const r = response as Record<string, unknown>;
  return 'data' in r && Array.isArray(r.data);
}

export function isStrapiSingle<T>(response: unknown): response is StrictStrapiResponse<T> {
  if (!response || typeof response !== 'object') return false;
  const r = response as Record<string, unknown>;
  return (
    'data' in r && r.data !== null && typeof r.data === 'object' && !Array.isArray(r.data)
  );
}

// Media/file structure
export interface StrictStrapiMedia {
  url: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string;
  size?: number;
  hash?: string;
  ext?: string;
  name?: string;
}

export interface StrapiMediaData {
  data?: {
    id?: number;
    attributes?: StrictStrapiMedia;
  } | null;
}

export interface StrapiMediaCollection {
  data?: Array<{
    id: number;
    attributes: StrictStrapiMedia;
  }> | null;
}

// Relation structures
export interface StrapiRelation<T> {
  data?: T | null;
}

export interface StrapiRelationCollection<T> {
  data?: T[] | null;
}

// Helper to safely extract media URL
export function extractMediaUrl(media: StrapiMediaData | undefined | null): string | null {
  return media?.data?.attributes?.url ?? null;
}

// Helper to safely extract relation
export function extractRelation<T>(relation: StrapiRelation<T> | undefined | null): T | null {
  return relation?.data ?? null;
}

// Helper to safely extract relation collection
export function extractRelationCollection<T>(
  relation: StrapiRelationCollection<T> | undefined | null
): T[] {
  return relation?.data ?? [];
}
