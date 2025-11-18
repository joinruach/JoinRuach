import Link from "next-intl/link";
import { getEvents, imgUrl } from "@/lib/strapi";

export default async function EventsPage(){
  const events = await getEvents(24);
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">Calendar</span>
        <h1 className="mt-4 text-3xl font-semibold text-white">Gatherings & Campaigns</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          Track Ruach conferences, outreach nights, and media premieres. Join in person or partner from wherever you are.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => {
          const a = event.attributes;
          const date = a.date || a.startDate;
          return (
            <Link
              key={event.id}
              href={`/events/${a.slug}`}
            >
              <div className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-amber-300/60">
              <div className="relative aspect-[4/3] bg-white/5">
                {a.cover?.data?.attributes?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl(a.cover.data.attributes.url)}
                    alt={a.title}
                    className="h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                {date ? (
                  <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-900">
                    {new Date(date).toLocaleDateString()}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 p-5 text-sm text-white/70">
                <h2 className="text-lg font-semibold text-white">{a.title}</h2>
                {a.location ? <div className="text-xs uppercase tracking-wide text-white/50">{a.location}</div> : null}
                {a.description ? (
                  <p className="line-clamp-3 text-white/70">{a.description}</p>
                ) : null}
              </div>
            </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
