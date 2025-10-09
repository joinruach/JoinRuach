import { getCourses, getEvents, getMediaItems } from "@/lib/strapi";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [courses, events, mediaResult] = await Promise.all([
    getCourses().catch(()=>[]),
    getEvents(50).catch(()=>[]),
    getMediaItems({ pageSize: 200 }).catch(()=>({ data: [] }))
  ]);
  const media = Array.isArray(mediaResult?.data) ? mediaResult.data : [];
  const courseUrls = (Array.isArray(courses) ? courses : [])
    .map((c: any) => c?.attributes?.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
    .map((slug) => `courses/${slug}`);
  const mediaUrls = media
    .map((m: any) => m?.attributes?.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
    .map((slug) => `media/${slug}`);
  const eventUrls = (Array.isArray(events) ? events : [])
    .map((e: any) => e?.attributes?.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
    .map((slug) => `events/${slug}`);
  const urls = [
    "", "media", "courses", "conferences", "community-outreach", "give", "about", "contact",
    ...courseUrls,
    ...mediaUrls,
    ...eventUrls
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls
      .filter(Boolean)
      .map((u) => `<url><loc>${escapeXml(`${site}/${u}`)}</loc></url>`)
      .join("") +
    `</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
