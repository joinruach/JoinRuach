import { getCourses, getEvents, getMediaItems } from "@/lib/strapi";
export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const courses = await getCourses();
  const events = await getEvents(50);
  const { data: media } = await getMediaItems({ pageSize: 200 });
  const urls = [
    "", "media", "courses", "conferences", "community-outreach", "give", "about", "contact",
    ...courses.map((c:any)=>`courses/${c.attributes.slug}`),
    ...media.map((m:any)=>`media/${m.attributes.slug}`),
    ...events.map((e:any)=>`events/${e.attributes.slug}`)
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls.map(u=>`<url><loc>${site}/${u}</loc></url>`).join("") +
    `</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
