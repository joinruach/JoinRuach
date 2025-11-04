import Link from "next/link";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import DonationForm from "@ruach/components/components/ruach/DonationForm";
import VolunteerSignupForm from "@/components/ruach/VolunteerSignupForm";
import EmbedScript from "@/components/ruach/embeds/EmbedScript";
import { getCommunityOutreachPage, getOutreachStories, imgUrl } from "@/lib/strapi";
import type { CommunityOutreachPageEntity, OutreachCampaignEntity } from "@/lib/types/strapi-types";
import { mapStoryToMediaCard } from "./story-helpers";

export const dynamic = "force-static";
export const revalidate = 300;

const fallbackStories: MediaCardProps[] = [
  {
    title: "Deliverance on the Streets",
    href: "/community-outreach/stories",
    excerpt: "Testimonies from downtown outreach nights.",
    category: "Outreach"
  },
  {
    title: "Feeding Families",
    href: "/community-outreach/stories",
    excerpt: "Weekly grocery deliveries and prayer appointments.",
    category: "Community"
  },
  {
    title: "Youth on Fire",
    href: "/community-outreach/stories",
    excerpt: "Teens leading worship in the city park.",
    category: "Youth"
  }
];

const fallbackVolunteerHighlights: Array<{ title: string; description?: string; icon?: string }> = [
  { title: "Street evangelism & prayer tents" },
  { title: "Food distributions & compassion projects" },
  { title: "Follow-up discipleship and small groups" }
];

const fallbackGivingHighlights = [
  {
    label: "Most Impactful",
    amount: "$75 / month",
    description: "Feeds 5 families + funds outreach film gear."
  },
  {
    label: "Launch Kit",
    amount: "$250 one-time",
    description: "Covers venue, permits, and testimony cards."
  }
];

const defaultHeroDescription =
  "We take testimonies beyond the camera. Every week Ruach volunteers share the gospel, deliver groceries, pray for the sick, and disciple new believers across our city.";

type CampaignSummary = {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  donationLink?: string;
  giveCode?: string;
  active?: boolean;
  metrics: Array<{ id?: number; label?: string; value?: string; description?: string }>;
};

function mapCampaign(campaign: OutreachCampaignEntity): CampaignSummary | null {
  if (!campaign?.attributes?.slug || !campaign.attributes.name) {
    return null;
  }

  const { attributes } = campaign;
  const metrics = Array.isArray(attributes.impactMetrics)
    ? attributes.impactMetrics
        .map((metric) => ({
          id: metric?.id,
          label: metric?.label,
          value: metric?.value,
          description: metric?.description
        }))
        .filter((metric) => Boolean(metric.value || metric.label))
    : [];

  return {
    id: campaign.id,
    name: attributes.name,
    slug: attributes.slug,
    summary: attributes.summary ?? undefined,
    donationLink: attributes.donationLink ?? undefined,
    giveCode: attributes.giveCode ?? undefined,
    active: attributes.active,
    metrics
  };
}

function normalizeVolunteerHighlights(
  entity?: CommunityOutreachPageEntity["attributes"]["volunteerHighlights"]
): Array<{ title: string; description?: string; icon?: string }> {
  if (!Array.isArray(entity) || entity.length === 0) {
    return fallbackVolunteerHighlights;
  }

  const normalized = entity
    .map((item) => ({
      title: item?.title ?? "",
      description: item?.description,
      icon: item?.icon
    }))
    .filter((item) => Boolean(item.title?.trim()));

  return normalized.length > 0 ? normalized : fallbackVolunteerHighlights;
}

function normalizeGivingHighlights(entity?: CommunityOutreachPageEntity["attributes"]["givingHighlights"]) {
  if (!Array.isArray(entity) || entity.length === 0) {
    return fallbackGivingHighlights;
  }

  const normalized = entity
    .map((item) => ({
      label: item?.label,
      amount: item?.amount,
      description: item?.description,
      badge: item?.badge
    }))
    .filter((item) => Boolean(item.label?.trim() || item.amount?.trim()));

  return normalized.length > 0 ? normalized : fallbackGivingHighlights;
}

export async function generateMetadata() {
  const page = await getCommunityOutreachPage();
  const attributes = page?.attributes;
  const seo = attributes?.seo;

  if (seo?.metaTitle || seo?.metaDescription) {
    const imageUrl = seo?.shareImage?.data?.attributes?.url;
    const ogImage = imageUrl ? imgUrl(imageUrl) : undefined;
    return {
      title: seo?.metaTitle ?? "Community Outreach — Ruach Ministries",
      description: seo?.metaDescription ?? defaultHeroDescription,
      openGraph: {
        title: seo?.metaTitle ?? "Community Outreach — Ruach Ministries",
        description: seo?.metaDescription ?? defaultHeroDescription,
        images: ogImage ? [{ url: ogImage }] : undefined
      }
    };
  }

  return {
    title: "Community Outreach — Ruach Ministries",
    description: defaultHeroDescription
  };
}

export default async function CommunityOutreachPage() {
  const page = await getCommunityOutreachPage();
  const attributes = page?.attributes;

  const heroEyebrow = attributes?.heroEyebrow ?? "Ruach in the City";
  const heroTitle = attributes?.heroTitle ?? "Community Outreach";
  const heroDescription = attributes?.heroDescription ?? defaultHeroDescription;
  const heroPrimaryCta =
    attributes?.heroPrimaryCtaLabel && attributes?.heroPrimaryCtaUrl
      ? { label: attributes.heroPrimaryCtaLabel, href: attributes.heroPrimaryCtaUrl }
      : { label: "Volunteer with Ruach", href: "#volunteer" };
  const heroSecondaryCta =
    attributes?.heroSecondaryCtaLabel && attributes?.heroSecondaryCtaUrl
      ? { label: attributes.heroSecondaryCtaLabel, href: attributes.heroSecondaryCtaUrl }
      : { label: "Support Outreach", href: "#support" };

  const featuredStoryEntities = attributes?.featuredStories?.data ?? [];
  let stories = featuredStoryEntities
    .map(mapStoryToMediaCard)
    .filter((story): story is MediaCardProps => Boolean(story));

  if (stories.length === 0) {
    const fallbackEntities = await getOutreachStories({ limit: 6, featured: true });
    stories = fallbackEntities
      .map(mapStoryToMediaCard)
      .filter((story): story is MediaCardProps => Boolean(story));

    if (stories.length === 0) {
      const recentStories = await getOutreachStories({ limit: 6 });
      stories = recentStories
        .map(mapStoryToMediaCard)
        .filter((story): story is MediaCardProps => Boolean(story));
    }
  }

  if (stories.length === 0) {
    stories = fallbackStories;
  }

  const volunteerHighlights = normalizeVolunteerHighlights(attributes?.volunteerHighlights);
  const givingHighlights = normalizeGivingHighlights(attributes?.givingHighlights);
  const campaigns = (attributes?.highlightedCampaigns?.data ?? [])
    .map(mapCampaign)
    .filter((campaign): campaign is CampaignSummary => Boolean(campaign));

  const volunteerBodyHtml = attributes?.volunteerSectionBody ?? "";
  const givingBodyHtml = attributes?.givingSectionBody ?? "";

  const volunteerFormEmbed = attributes?.volunteerFormEmbed?.trim() ?? "";
  const volunteerFormProvider = attributes?.volunteerFormProvider?.trim() ?? "";

  const donationFormUrl =
    attributes?.donationFormUrl?.trim() ||
    process.env.NEXT_PUBLIC_OUTREACH_GIVE_URL ||
    "https://givebutter.com/ruach-outreach";

  const storiesHeading = attributes?.featuredStoriesHeading ?? "Stories from the Streets";
  const storiesCtaLabel = attributes?.featuredStoriesCtaLabel ?? "View all testimonies →";
  const storiesCtaUrl = attributes?.featuredStoriesCtaUrl ?? "/community-outreach/stories";

  const volunteerSectionTitle = attributes?.volunteerSectionTitle ?? "Volunteer Sign-Up";
  const givingSectionTitle = attributes?.givingSectionTitle ?? "Support Outreach Campaigns";

  const subscriptionBanner =
    attributes?.subscriptionBannerEnabled && attributes?.subscriptionBanner
      ? {
          title: attributes.subscriptionBanner.title ?? "",
          body: attributes.subscriptionBanner.body ?? "",
          ctaLabel: attributes.subscriptionBanner.ctaLabel ?? undefined,
          ctaUrl: attributes.subscriptionBanner.ctaUrl ?? undefined,
          image: attributes.subscriptionBanner.image?.data?.attributes
        }
      : null;

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-10 text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">{heroEyebrow}</span>
        <h1 className="mt-4 text-3xl font-semibold text-white">{heroTitle}</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/70">{heroDescription}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={heroPrimaryCta.href}
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            {heroPrimaryCta.label}
          </Link>
          <Link
            href={heroSecondaryCta.href}
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
          >
            {heroSecondaryCta.label}
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">{storiesHeading}</h2>
          {storiesCtaUrl ? (
            <Link href={storiesCtaUrl} className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              {storiesCtaLabel}
            </Link>
          ) : null}
        </div>
        <div className="rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
          <MediaGrid items={stories} />
        </div>
      </section>

      {campaigns.length > 0 ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white">Active Campaigns</h2>
            <span className="text-sm text-white/60">
              Strategic initiatives we are funding in the city
            </span>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                    {campaign.summary ? (
                      <p className="mt-2 text-sm text-white/70">{campaign.summary}</p>
                    ) : null}
                  </div>
                  {!campaign.active ? (
                    <span className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-white/60">
                      Paused
                    </span>
                  ) : null}
                </div>
                {campaign.metrics.length > 0 ? (
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {campaign.metrics.map((metric) => (
                      <div key={`${campaign.id}-${metric.id ?? metric.label}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        {metric.value ? (
                          <dt className="text-lg font-semibold text-white">{metric.value}</dt>
                        ) : null}
                        {metric.label ? (
                          <dd className="text-xs uppercase tracking-wide text-white/60">
                            {metric.label}
                          </dd>
                        ) : null}
                        {metric.description ? (
                          <p className="mt-2 text-xs text-white/60">{metric.description}</p>
                        ) : null}
                      </div>
                    ))}
                  </dl>
                ) : null}
                {campaign.donationLink ? (
                  <Link
                    href={campaign.donationLink}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-amber-200"
                  >
                    Support this campaign →
                  </Link>
                ) : campaign.giveCode ? (
                  <p className="mt-5 text-xs uppercase tracking-[0.24em] text-white/60">
                    Give Code: {campaign.giveCode}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section
        id="volunteer"
        className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 text-white lg:grid-cols-[1.1fr,0.9fr]"
      >
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">{volunteerSectionTitle}</h2>
          {volunteerBodyHtml ? (
            <div
              className="prose prose-invert prose-sm max-w-none text-white/70"
              dangerouslySetInnerHTML={{ __html: volunteerBodyHtml }}
            />
          ) : (
            <p className="text-sm text-white/70">{defaultHeroDescription}</p>
          )}
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {volunteerHighlights.map((highlight, index) => (
              <li key={`${highlight.title}-${index}`}>
                • {highlight.title}
                {highlight.description ? (
                  <span className="ml-1 text-white/60">— {highlight.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
          {volunteerFormEmbed ? (
            <EmbedScript html={volunteerFormEmbed} />
          ) : (
            <VolunteerSignupForm />
          )}
          {volunteerFormProvider ? (
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-white/50">
              Powered by {volunteerFormProvider}
            </p>
          ) : null}
        </div>
      </section>

      <section
        id="support"
        className="grid gap-8 rounded-3xl border border-white/10 bg-white p-8 text-neutral-900 md:grid-cols-[1.2fr,1fr]"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">{givingSectionTitle}</h2>
          {givingBodyHtml ? (
            <div
              className="prose prose-sm max-w-none text-neutral-600"
              dangerouslySetInnerHTML={{ __html: givingBodyHtml }}
            />
          ) : (
            <p className="text-sm text-neutral-600">
              Every dollar fuels groceries, Bibles, film production, and deliverance teams in the
              field. Give a one-time gift or become a monthly partner.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {givingHighlights.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                {item.badge ? (
                  <div className="text-xs uppercase tracking-wide text-neutral-500">{item.badge}</div>
                ) : null}
                {item.label ? (
                  <div className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
                    {item.label}
                  </div>
                ) : null}
                {item.amount ? (
                  <div className="mt-2 text-lg font-semibold text-neutral-900">{item.amount}</div>
                ) : null}
                {item.description ? (
                  <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <DonationForm processorUrl={donationFormUrl} />
        </div>
      </section>

      {subscriptionBanner?.title ? (
        <section className="rounded-3xl border border-white/10 bg-white/[0.08] p-8 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">{subscriptionBanner.title}</h3>
              {subscriptionBanner.body ? (
                <p className="text-sm text-white/70">{subscriptionBanner.body}</p>
              ) : null}
              {subscriptionBanner.ctaLabel && subscriptionBanner.ctaUrl ? (
                <Link
                  href={subscriptionBanner.ctaUrl}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-amber-200"
                >
                  {subscriptionBanner.ctaLabel} →
                </Link>
              ) : null}
            </div>
            {subscriptionBanner.image?.url ? (
              <img
                src={imgUrl(subscriptionBanner.image.url)}
                alt={subscriptionBanner.image.alternativeText ?? subscriptionBanner.title}
                className="h-32 w-full max-w-sm rounded-2xl object-cover"
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
