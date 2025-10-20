const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL;
const MEDIA_CDN = process.env.NEXT_PUBLIC_MEDIA_CDN_URL || "https://cdn.joinruach.org";

export function imgUrl(path?: string) {
  if (!path) return undefined;
  const trimmed = path.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("http")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.endsWith(".r2.cloudflarestorage.com")) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        const filename = segments[segments.length - 1];
        if (filename) {
          const base = MEDIA_CDN.endsWith("/") ? MEDIA_CDN.slice(0, -1) : MEDIA_CDN;
          return `${base}/${filename}`;
        }
      }
    } catch {
      // ignore parsing issues and fall back to the raw URL
    }
    return trimmed;
  }

  const baseCandidate = MEDIA_CDN || STRAPI_BASE || "";
  if (!baseCandidate) return trimmed;
  const base = baseCandidate.endsWith("/") ? baseCandidate.slice(0, -1) : baseCandidate;
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${normalized}`;
}
