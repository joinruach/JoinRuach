export function GET(){
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const body = `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
