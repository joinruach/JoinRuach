import Link from "next-intl/link";
import { getEventBySlug, imgUrl } from "@/lib/strapi";
import { LiveIndicator, LivestreamPlayer, UpcomingStream } from "@/components/livestream";
import { isStreamLive, getLivestreamStatus, extractYouTubeVideoId } from "@/lib/livestream";

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

  // Livestream support
  const livestreamUrl = a.livestreamUrl || a.videoUrl;
  const videoId = livestreamUrl ? extractYouTubeVideoId(livestreamUrl) : null;
  const hasLivestream = Boolean(videoId);
  const isLive = hasLivestream && date ? isStreamLive(date, end, a.isLive) : false;
  const livestreamStatus = hasLivestream && date ? getLivestreamStatus(date, end, a.isLive) : null;
  const showChat = a.showChat !== false; // Default to true if not specified
  const coverUrl = imgUrl(a.cover?.data?.attributes?.url);

  return (
    <div className="space-y-10">
      <nav className="text-xs uppercase tracking-wide text-neutral-600 dark:text-white/50">
        <Link href="/events" className="text-neutral-700 transition hover:text-neutral-900 dark:text-white/70 dark:hover:text-white">Events</Link>
        <span className="mx-1">/</span>
        <span className="text-neutral-900 dark:text-white">{a.title}</span>
      </nav>

      {/* Upcoming stream countdown */}
      {hasLivestream && livestreamStatus === "upcoming" && date && (
        <UpcomingStream
          title={a.title}
          description={a.description}
          scheduledTime={date}
          thumbnail={coverUrl}
        />
      )}

      {/* Live player */}
      {hasLivestream && isLive && videoId && (
        <LivestreamPlayer
          videoId={videoId}
          isLive={true}
          showChat={showChat}
          title={a.title}
        />
      )}

      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/5">
        {a.cover?.data?.attributes?.url ? (
          <div className="relative h-72 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(a.cover.data.attributes.url)} alt={a.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
        ) : null}
        <div className="space-y-4 p-8 text-neutral-900 dark:text-white">
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-white/70">
            {isLive && <LiveIndicator isLive={true} size="sm" />}
            {date ? <span>{new Date(date).toLocaleString()}</span> : null}
            {end ? <span>– {new Date(end).toLocaleDateString()}</span> : null}
            {a.location ? <span>• {a.location}</span> : null}
          </div>
          <h1 className="text-3xl font-semibold text-neutral-900 dark:text-white">{a.title}</h1>
          {a.description ? (
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/70 whitespace-pre-wrap">{a.description}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            {a.registrationUrl ? (
              <Link
                href={a.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
              >
                Register now
              </Link>
            ) : null}
            <Link
              href="/conferences"
              className="inline-flex items-center rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900 dark:border-white/20 dark:text-white/80 dark:hover:border-white dark:hover:text-white"
            >
              Back to conferences
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
