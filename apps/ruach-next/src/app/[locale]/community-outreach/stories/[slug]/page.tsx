import Link from "next-intl/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import { getOutreachStoryBySlug, getOutreachStorySlugs, getOutreachStories, imgUrl } from "@/lib/strapi";
import type { OutreachStoryEntity } from "@/lib/types/strapi-types";
import { formatStoryDate, getPrimaryStoryMedia, mapStoryToMediaCard } from "../../story-helpers";

type Props = { params: Promise<{ slug: string }> };

function resolveShareImage(story: OutreachStoryEntity) {
  const seoImage = story.attributes?.seo?.shareImage?.data?.attributes?.url;
  if (seoImage) {
    return imgUrl(seoImage);
  }

  const hero = getPrimaryStoryMedia(story);
  return hero?.url;
}

export async function generateStaticParams() {
  const slugs = await getOutreachStorySlugs(60).catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const story = await getOutreachStoryBySlug(slug).catch(() => null);

  if (!story?.attributes) {
    return {
      title: "Outreach Story",
      description: "Testimonies and updates from Ruach community outreach teams."
    };
  }

  const attributes = story.attributes;
  const title =
    attributes.seo?.metaTitle ??
    `${attributes.title} — Outreach Story`;
  const description =
    attributes.seo?.metaDescription ??
    attributes.summary ??
    "Testimonies and updates from Ruach community outreach teams.";
  const imageUrl = resolveShareImage(story);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined
    }
  };
}

export default async function OutreachStoryPage({ params }: Props) {
  const { slug } = await params;
  const story = await getOutreachStoryBySlug(slug).catch(() => null);

  if (!story?.attributes) {
    notFound();
  }

  const attributes = story.attributes;
  const heroMedia = getPrimaryStoryMedia(story);
  const storyDate =
    formatStoryDate(attributes.storyDate) ?? formatStoryDate(story.publishedAt);
  const campaign = attributes.relatedCampaign?.data?.attributes;
  const tags = attributes.tags?.data ?? [];

  const relatedEntities = await getOutreachStories({
    limit: 4,
    excludeIds: [story.id]
  }).catch(() => []);

  const relatedStories = relatedEntities
    .map(mapStoryToMediaCard)
    .filter((card): card is MediaCardProps => Boolean(card));

  return (
    <article className="space-y-12">
      <nav className="text-sm">
        <Link href="/community-outreach">
          <span className="text-amber-300 hover:text-amber-200">← Back to Community Outreach</span>
        </Link>
      </nav>

      <header className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-white">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/60">
          <span>{storyDate ?? "Outreach Story"}</span>
          {campaign?.name ? <span>• {campaign.name}</span> : null}
        </div>
        <h1 className="text-3xl font-semibold text-white">{attributes.title}</h1>
        {attributes.summary ? (
          <p className="max-w-2xl text-sm text-white/70">{attributes.summary}</p>
        ) : null}
        {heroMedia ? (
          <Image
            src={heroMedia.url}
            alt={heroMedia.alternativeText || attributes.title}
            width={heroMedia.width || 1200}
            height={heroMedia.height || 630}
            className="w-full rounded-3xl border border-white/10 object-cover"
            priority
          />
        ) : null}
      </header>

      <section className="rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
        <div
          className="prose prose-neutral max-w-none"
          dangerouslySetInnerHTML={{ __html: attributes.body ?? "" }}
        />
        {tags.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={tag?.id ?? tag?.attributes?.slug ?? tag?.attributes?.name ?? `tag-${index}`}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs uppercase tracking-wide text-neutral-500"
              >
                {tag?.attributes?.name ?? "Tag"}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {campaign ? (
        <section className="rounded-3xl border border-white/10 bg-black/40 p-8 text-white">
          <h2 className="text-xl font-semibold text-white">About this Campaign</h2>
          {campaign.summary ? (
            <p className="mt-3 text-sm text-white/70">{campaign.summary}</p>
          ) : null}
          {campaign.donationLink ? (
            <Link href={campaign.donationLink}>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-amber-200">
                Support this campaign →
              </span>
            </Link>
          ) : campaign.giveCode ? (
            <p className="mt-5 text-xs uppercase tracking-[0.3em] text-white/60">
              Give Code: {campaign.giveCode}
            </p>
          ) : null}
        </section>
      ) : null}

      {relatedStories.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">More outreach impact</h2>
            <Link href="/community-outreach/stories">
              <span className="text-sm font-semibold text-amber-300 hover:text-amber-200">View all stories →</span>
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
            <MediaGrid items={relatedStories} />
          </div>
        </section>
      ) : null}
    </article>
  );
}
