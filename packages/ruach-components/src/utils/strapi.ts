const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL;

export function imgUrl(path?: string) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return STRAPI_BASE ? `${STRAPI_BASE}${path}` : path;
}
