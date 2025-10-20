import type { MediaItemEntity } from "@/lib/types/strapi-types";

type UnknownEntity = MediaItemEntity | (Record<string, any> & { attributes?: Record<string, any> }) | null | undefined;

export function extractAttributes<T extends Record<string, any>>(entity: UnknownEntity): (T & Record<string, any>) | undefined {
  if (!entity || typeof entity !== "object") return undefined;
  if ("attributes" in entity && entity.attributes) {
    return entity.attributes as T;
  }

  const clone: Record<string, any> = { ...entity };
  delete clone.id;
  delete clone.documentId;
  delete clone.__component;
  return clone as T;
}

export function extractSingleRelation<T extends Record<string, any>>(value: any): (T & { id?: number }) | undefined {
  if (!value) return undefined;
  const data = (typeof value === "object" && value !== null && "data" in value) ? (value as any).data : value;
  if (!data || typeof data !== "object") return undefined;
  const attributes = extractAttributes<T>(data);
  if (!attributes) return undefined;
  return {
    id: (data as any).id,
    ...attributes,
  };
}

export function extractManyRelation<T extends Record<string, any>>(value: any): Array<T & { id?: number }> {
  if (!value) return [];
  const raw = (typeof value === "object" && value !== null && "data" in value) ? (value as any).data : value;
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .map((item) => {
      if (!item || typeof item !== "object") return undefined;
      const attributes = extractAttributes<T>(item);
      if (!attributes) return undefined;
      return {
        id: (item as any).id,
        ...attributes,
      };
    })
    .filter(Boolean) as Array<T & { id?: number }>;
}

export function extractMediaUrl(value: any): string | undefined {
  const media = extractSingleRelation<{ url?: string }>(value);
  if (media?.url && typeof media.url === "string") {
    return media.url;
  }

  if (value && typeof value === "object" && "url" in value && typeof (value as any).url === "string") {
    return (value as any).url;
  }

  return undefined;
}
