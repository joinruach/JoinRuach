import Link from "next/link";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import DonationForm from "@ruach/components/components/ruach/DonationForm";
import VolunteerSignupForm from "@/components/ruach/VolunteerSignupForm";
import { getMediaByCategory } from "@/lib/strapi";
import { extractAttributes, extractManyRelation, extractSingleRelation } from "@/lib/strapi-normalize";
import type { MediaItemEntity } from "@/lib/types/strapi-types";

export const dynamic = "force-static";
export const revalidate = 300;

const fallbackStories: MediaCardProps[] = [
  {
    title: "Deliverance on the Streets",
    href: "/media",
    excerpt: "Testimonies from downtown outreach nights.",
    category: "Outreach"
  },
  {
    title: "Feeding Families",
    href: "/media",
    excerpt: "Weekly grocery deliveries and prayer appointments.",
    category: "Community"
  },
  {
    title: "Youth on Fire",
    href: "/media",
    excerpt: "Teens leading worship in the city park.",
    category: "Youth"
  }
];

export default async function CommunityOutreachPage(){
  const outreachMedia = await getMediaByCategory("outreach", 6).catch(() => [] as any[]);
  const stories: MediaCardProps[] = outreachMedia.length
    ? outreachMedia
        .map((item: MediaItemEntity | Record<string, any>) => {
          const attributes = extractAttributes<MediaItemEntity["attributes"]>(item as any);
          if (!attributes?.slug) return null;

          const thumbnailMedia = extractSingleRelation<{ url?: string; alternativeText?: string }>(attributes.thumbnail);
          const speakers = extractManyRelation<{ name?: string; displayName?: string }>(attributes.speakers)
            .map((speaker) => speaker.displayName?.trim() || speaker.name)
            .filter((name): name is string => Boolean(name && name.trim()));
          const categorySource =
            extractSingleRelation<{ name?: string }>(attributes.category)?.name ?? attributes.legacyCategory ?? undefined;
          const category = typeof categorySource === "string" && categorySource.trim().length ? categorySource : undefined;

          return {
            title: attributes.title ?? "Untitled Media",
            href: `/media/${attributes.slug}`,
            excerpt: attributes.description ?? attributes.excerpt ?? undefined,
            category,
            thumbnail: thumbnailMedia?.url
              ? { src: thumbnailMedia.url, alt: thumbnailMedia.alternativeText ?? attributes.title }
              : undefined,
            views: attributes.views ?? 0,
            durationSec: attributes.durationSec ?? undefined,
            speakers,
          } as MediaCardProps;
        })
        .filter((story): story is MediaCardProps => Boolean(story))
    : fallbackStories;

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-10 text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">Ruach in the City</span>
        <h1 className="mt-4 text-3xl font-semibold text-white">Community Outreach</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          We take testimonies beyond the camera. Every week Ruach volunteers share the gospel, deliver groceries, pray for the sick, and disciple new believers across our city.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="#volunteer"
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            Volunteer with Ruach
          </Link>
          <Link
            href="#support"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
          >
            Support Outreach
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">Stories from the Streets</h2>
          <Link href="/media" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
            View all testimonies →
          </Link>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
          <MediaGrid items={stories} />
        </div>
      </section>

      <section id="volunteer" className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 text-white lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">Volunteer Sign-Up</h2>
          <p className="text-sm text-white/70">
            We train outreach teams to carry deliverance, evangelism, media, and mercy ministry. Share your availability and we’ll plug you into the next outing.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>• Street evangelism & prayer tents</li>
            <li>• Food distributions & compassion projects</li>
            <li>• Follow-up discipleship and small groups</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
          <VolunteerSignupForm />
        </div>
      </section>

      <section id="support" className="grid gap-8 rounded-3xl border border-white/10 bg-white p-8 text-neutral-900 md:grid-cols-[1.2fr,1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Support Outreach Campaigns</h2>
          <p className="text-sm text-neutral-600">
            Every dollar fuels groceries, Bibles, film production, and deliverance teams in the field. Give a one-time gift or become a monthly partner.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">Most Impactful</div>
              <div className="mt-2 text-lg font-semibold text-neutral-900">$75 / month</div>
              <p className="mt-1 text-sm text-neutral-600">Feeds 5 families + funds outreach film gear.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">Launch Kit</div>
              <div className="mt-2 text-lg font-semibold text-neutral-900">$250 one-time</div>
              <p className="mt-1 text-sm text-neutral-600">Covers venue, permits, and testimony cards.</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <DonationForm processorUrl={process.env.NEXT_PUBLIC_OUTREACH_GIVE_URL || "https://givebutter.com/ruach-outreach"} />
        </div>
      </section>
    </div>
  );
}
