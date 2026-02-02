import Link from "next/link";
import Image from "next/image";
import { imgUrl } from "@/lib/strapi";
import { extractAttributes, extractSingleRelation } from "@/lib/strapi-normalize";
import type { EventEntity } from "@/lib/types/strapi-types";

type Props = {
  events: EventEntity[];
  locale: string;
};

export default function UpcomingEventsSection({ events, locale }: Props) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Upcoming Events</h2>
        <Link
          href={`/${locale}/events`}
          className="text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
        >
          View all →
        </Link>
      </div>

      <div className="mt-4 space-y-4">
        {events.map((event) => {
          const attributes = extractAttributes(event);
          if (!attributes) return null;

          const coverMedia = extractSingleRelation<{ url?: string }>(attributes.cover);
          const coverUrl = coverMedia?.url ? imgUrl(coverMedia.url) : null;
          const date = attributes.date || attributes.startDate;
          const formattedDate = date
            ? new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "TBA";

          return (
            <Link
              key={attributes.slug || event.id}
              href={`/${locale}/events/${attributes.slug}`}
              className="group flex gap-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 transition hover:border-amber-400"
            >
              {coverUrl && (
                <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-white/10">
                  <Image
                    src={coverUrl}
                    alt={attributes.title || "Event"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  {formattedDate}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  {attributes.title}
                </h3>
                {attributes.location && (
                  <p className="mt-1 text-xs text-zinc-600 dark:text-white/60">
                    {attributes.location}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
