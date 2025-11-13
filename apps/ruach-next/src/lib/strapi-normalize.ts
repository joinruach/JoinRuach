import type { MediaItemEntity } from "@/lib/types/strapi-types";

// Helper type for entities that might have attributes
interface StrapiEntity {
  id?: number;
  documentId?: string;
  __component?: string;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

type UnknownEntity = MediaItemEntity | StrapiEntity | null | undefined;

// Type guard to check if value has a data property
function hasDataProperty(value: unknown): value is { data: unknown } {
  return typeof value === 'object' && value !== null && 'data' in value;
}

// Type guard to check if value has an id property
function hasIdProperty(value: unknown): value is { id: number } {
  return typeof value === 'object' && value !== null && 'id' in value && typeof (value as { id: unknown }).id === 'number';
}

// Type guard to check if value has a url property
function hasUrlProperty(value: unknown): value is { url: string } {
  return typeof value === 'object' && value !== null && 'url' in value && typeof (value as { url: unknown }).url === 'string';
}

export function extractAttributes<T extends Record<string, unknown>>(entity: UnknownEntity): (T & Record<string, unknown>) | undefined {
  if (!entity || typeof entity !== "object") return undefined;
  if ("attributes" in entity && entity.attributes && typeof entity.attributes === 'object') {
    return entity.attributes as T;
  }

  const clone: Record<string, unknown> = { ...entity };
  delete clone.id;
  delete clone.documentId;
  delete clone.__component;
  return clone as T;
}

export function extractSingleRelation<T extends Record<string, unknown>>(value: unknown): (T & { id?: number }) | undefined {
  if (!value) return undefined;

  // Extract data if wrapped in { data: ... }
  const data = hasDataProperty(value) ? value.data : value;
  if (!data || typeof data !== "object") return undefined;

  const attributes = extractAttributes<T>(data);
  if (!attributes) return undefined;

  return {
    id: hasIdProperty(data) ? data.id : undefined,
    ...attributes,
  };
}

export function extractManyRelation<T extends Record<string, unknown>>(value: unknown): Array<T & { id?: number }> {
  if (!value) return [];

  // Extract data if wrapped in { data: ... }
  const raw = hasDataProperty(value) ? value.data : value;
  const list = Array.isArray(raw) ? raw : [raw];

  return list
    .map((item) => {
      if (!item || typeof item !== "object") return undefined;
      const attributes = extractAttributes<T>(item);
      if (!attributes) return undefined;
      return {
        id: hasIdProperty(item) ? item.id : undefined,
        ...attributes,
      };
    })
    .filter((item): item is T & { id?: number } => Boolean(item));
}

export function extractMediaUrl(value: unknown): string | undefined {
  const media = extractSingleRelation<{ url?: string }>(value);
  if (media?.url && typeof media.url === "string") {
    return media.url;
  }

  if (hasUrlProperty(value)) {
    return value.url;
  }

  return undefined;
}
