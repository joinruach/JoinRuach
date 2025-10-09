import Link from "next/link";
import { getEventBySlug, imgUrl } from "@/lib/strapi";

export const dynamic = "force-static";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  const a: any = ev?.attributes || {};
  const title = a.seoTitle || a.title || "Event";
  const desc = a.seoDescription || a.description || "";
  const image = imgUrl(a.seoImage?.data?.attributes?.url || a.cover?.data?.attributes?.url);
  return { title, description: desc, openGraph: { title, description: desc, images: image ? [image] : [] } };
}

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">Event not found.</div>;
  }
  const a: any = ev.attributes;
  const date = a.date || a.startDate;
  const end = a.endDate;

  return (
    <div className="space-y-10">
      <nav className="text-xs uppercase tracking-wide text-white/50">
        <Link href="/events" className="text-white/70 transition hover:text-white">Events</Link>
        <span className="mx-1">/</span>
        <span className="text-white">{a.title}</span>
      </nav>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        {a.cover?.data?.attributes?.url ? (
          <div className="relative h-72 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(a.cover.data.attributes.url)} alt={a.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
        ) : null}
        <div className="space-y-4 p-8 text-white">
          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            {date ? <span>{new Date(date).toLocaleString()}</span> : null}
            {end ? <span>– {new Date(end).toLocaleDateString()}</span> : null}
            {a.location ? <span>• {a.location}</span> : null}
          </div>
          <h1 className="text-3xl font-semibold text-white">{a.title}</h1>
          {a.description ? (
            <p className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap">{a.description}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            {a.registrationUrl ? (
              <Link
                href={a.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
              >
                Register now
              </Link>
            ) : null}
            <Link
              href="/conferences"
              className="inline-flex items-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
            >
              Back to conferences
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
