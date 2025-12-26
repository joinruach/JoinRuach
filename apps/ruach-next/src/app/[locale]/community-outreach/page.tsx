/* eslint-disable react/no-unescaped-entities */
import LocalizedLink from "@/components/navigation/LocalizedLink";
import Image from "next/image";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import DonationForm from "@ruach/components/components/ruach/DonationForm";
import VolunteerSignupForm from "@/components/ruach/VolunteerSignupForm";
import EmbedScript from "@/components/ruach/embeds/EmbedScript";
import { getCommunityOutreachPage, getOutreachStories, imgUrl } from "@/lib/strapi";
import type { CommunityOutreachPageEntity, OutreachCampaignEntity } from "@/lib/types/strapi-types";
import { mapStoryToMediaCard } from "./story-helpers";

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
  { title: "Build truth-centered platforms & tools", description: "Code, design, content systems" },
  { title: "Create Scripture-rooted media & resources", description: "Video, writing, courses, podcasts" },
  { title: "Develop communities of discernment", description: "Local hubs, online networks, study groups" },
  { title: "Test & validate emerging technologies", description: "AI, blockchain, communication tools" }
];

type GivingHighlight = {
  label?: string;
  amount?: string;
  description?: string;
  badge?: string;
};

const fallbackGivingHighlights: GivingHighlight[] = [
  {
    label: "Most Impactful",
    amount: "$75 / month",
    description: "Feeds 5 families + funds outreach film gear.",
    badge: "Partner Favorite"
  },
  {
    label: "Launch Kit",
    amount: "$250 one-time",
    description: "Covers venue, permits, and testimony cards.",
    badge: undefined
  }
];

const defaultHeroDescription =
  "Technology is accelerating. Narratives are being shaped. Systems are being built—not just to inform people, but to guide behavior, manage belief, and centralize authority.\n\nRuach is not here to compete with those systems. Ruach is here to build something different.\n\nNot control systems—but truth systems. Systems that help people see clearly, test what they hear, and walk faithfully in a fractured world.\n\nWe're gathering Kingdom creators and developers—builders who will shape tools, platforms, and communities rooted in Scripture, powered by testimony, open to examination, and resistant to control.";

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

function normalizeGivingHighlights(
  entity?: CommunityOutreachPageEntity["attributes"]["givingHighlights"]
): GivingHighlight[] {
  if (!Array.isArray(entity) || entity.length === 0) {
    return fallbackGivingHighlights;
  }

  const normalized: GivingHighlight[] = entity
    .map((item) => ({
      label: item?.label,
      amount: item?.amount,
      description: item?.description,
      badge: item?.badge
    }))
    .filter((item) => Boolean(item.label?.trim() || item.amount?.trim()));

  return normalized.length > 0 ? normalized : fallbackGivingHighlights;
}

function extractMediaDimension(media: unknown, key: "width" | "height"): number | undefined {
  if (!media || typeof media !== "object") {
    return undefined;
  }
  const value = (media as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

export async function generateMetadata() {
  const page = await getCommunityOutreachPage().catch(() => null);
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

export default async function CommunityOutreachPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  const page = await getCommunityOutreachPage().catch(() => null);
  const attributes = page?.attributes;

  const heroEyebrow = attributes?.heroEyebrow ?? "Ruach in a Moment of Tension";
  const heroTitle = attributes?.heroTitle ?? "They're Building Control Systems. We're Building Truth Systems.";
  const heroDescription = attributes?.heroDescription ?? defaultHeroDescription;
  const heroPrimaryCta =
    attributes?.heroPrimaryCtaLabel && attributes?.heroPrimaryCtaUrl
      ? { label: attributes.heroPrimaryCtaLabel, href: attributes.heroPrimaryCtaUrl }
      : { label: "Explore Stories", href: "/community-outreach/stories" };
  const heroSecondaryCta =
    attributes?.heroSecondaryCtaLabel && attributes?.heroSecondaryCtaUrl
      ? { label: attributes.heroSecondaryCtaLabel, href: attributes.heroSecondaryCtaUrl }
      : { label: "Join Us", href: "#volunteer" };

  const featuredStoryEntities = attributes?.featuredStories?.data ?? [];
  let stories = featuredStoryEntities
    .map(mapStoryToMediaCard)
    .filter((story): story is MediaCardProps => Boolean(story));

  if (stories.length === 0) {
    const fallbackEntities = await getOutreachStories({ limit: 6, featured: true }).catch(() => []);
    stories = fallbackEntities
      .map(mapStoryToMediaCard)
      .filter((story): story is MediaCardProps => Boolean(story));

    if (stories.length === 0) {
      const recentStories = await getOutreachStories({ limit: 6 }).catch(() => []);
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

  const storiesHeading = attributes?.featuredStoriesHeading ?? "Stories from the Field";
  const storiesCtaLabel = attributes?.featuredStoriesCtaLabel ?? "View all testimonies →";
  const storiesCtaUrl = attributes?.featuredStoriesCtaUrl ?? "/community-outreach/stories";

  const volunteerSectionTitle = attributes?.volunteerSectionTitle ?? "Join the Builders";
  const givingSectionTitle = attributes?.givingSectionTitle ?? "Fuel Kingdom Infrastructure";

  const rawSubscriptionImage = attributes?.subscriptionBanner?.image?.data?.attributes;
  const subscriptionBannerImage = (() => {
    if (!rawSubscriptionImage?.url) return null;
    const resolvedUrl = imgUrl(rawSubscriptionImage.url);
    if (!resolvedUrl) return null;
    return {
      url: resolvedUrl,
      alt: rawSubscriptionImage.alternativeText ?? attributes?.subscriptionBanner?.title ?? "",
      width: extractMediaDimension(rawSubscriptionImage, "width"),
      height: extractMediaDimension(rawSubscriptionImage, "height")
    };
  })();

  const subscriptionBanner =
    attributes?.subscriptionBannerEnabled && attributes?.subscriptionBanner
      ? {
          title: attributes.subscriptionBanner.title ?? "",
          body: attributes.subscriptionBanner.body ?? "",
          ctaLabel: attributes.subscriptionBanner.ctaLabel ?? undefined,
          ctaUrl: attributes.subscriptionBanner.ctaUrl ?? undefined,
          image: subscriptionBannerImage
        }
      : null;

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-border bg-card p-10 text-foreground shadow-[0_25px_80px_rgba(43,37,30,0.08)]">
        <span className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{heroEyebrow}</span>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">{heroTitle}</h1>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground">{heroDescription}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedLink href={heroPrimaryCta.href}>
            <span className="rounded-full bg-[hsl(var(--primary))] px-5 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition hover:bg-[#C7A574]">
              {heroPrimaryCta.label}
            </span>
          </LocalizedLink>
          <LocalizedLink href={heroSecondaryCta.href}>
            <span className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-[rgba(43,43,43,0.05)]">
              {heroSecondaryCta.label}
            </span>
          </LocalizedLink>
        </div>
      </section>

      {/* What Makes a Truth System? */}
      <section className="rounded-3xl border border-border bg-card p-8 text-foreground">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">What Makes a Truth System?</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="text-3xl">📖</div>
            <h3 className="text-lg font-semibold text-foreground">Scripture-Rooted</h3>
            <p className="text-sm text-muted-foreground">
              God's Word is the plumbline for all decisions, interpretations, and direction.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-3xl">🎙️</div>
            <h3 className="text-lg font-semibold text-foreground">Testimony-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Real stories over synthetic narratives. Lived faith over curated performance.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-3xl">🔍</div>
            <h3 className="text-lg font-semibold text-foreground">Open to Examination</h3>
            <p className="text-sm text-muted-foreground">
              Truth invites testing. Questions are not threats—they're pathways to clarity.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-3xl">🌐</div>
            <h3 className="text-lg font-semibold text-foreground">Resistant to Control</h3>
            <p className="text-sm text-muted-foreground">
              Decentralized by design. No single voice replaces conscience, Scripture, or the Spirit.
            </p>
          </div>
        </div>
      </section>

      {/* Kingdom Creators & Developers */}
      <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-300/30 dark:from-amber-500/10 dark:to-orange-500/10 p-10 text-zinc-900 dark:text-white">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white">
            We're Gathering Kingdom Creators
          </h2>
          <p className="text-base text-zinc-700 dark:text-white/80">
            Not everyone is called to build. But if you sense God calling you to create, develop, or shape infrastructure that serves His Kingdom—you're in the right place.
          </p>
          <div className="grid gap-6 md:grid-cols-3 text-left mt-8">
            <div className="rounded-2xl border border-amber-200 bg-white dark:border-amber-300/20 dark:bg-white/5 p-6 space-y-3">
              <div className="text-3xl">🛠️</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Builders</h3>
              <p className="text-sm text-zinc-600 dark:text-white/70">
                Developers, designers, engineers creating platforms, tools, and systems that serve truth over control.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white dark:border-amber-300/20 dark:bg-white/5 p-6 space-y-3">
              <div className="text-3xl">✍️</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Creators</h3>
              <p className="text-sm text-zinc-600 dark:text-white/70">
                Writers, filmmakers, artists producing media that awakens, equips, and challenges the Church.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white dark:border-amber-300/20 dark:bg-white/5 p-6 space-y-3">
              <div className="text-3xl">🧭</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Leaders</h3>
              <p className="text-sm text-zinc-600 dark:text-white/70">
                Pastors, teachers, organizers building communities of discernment rooted in Scripture and Spirit.
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-white/70 mt-6">
            If this resonates, scroll down to "Join the Builders" and let us know what you're called to create.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">{storiesHeading}</h2>
          {storiesCtaUrl ? (
            <LocalizedLink href={storiesCtaUrl}>
              <span className="text-sm font-semibold text-foreground underline decoration-[hsl(var(--primary))] decoration-2 underline-offset-4">
                {storiesCtaLabel}
              </span>
            </LocalizedLink>
          ) : null}
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
          <MediaGrid items={stories} />
        </div>
      </section>

      {/* The Mirror - Optional Introduction (Feature Flag) */}
      {process.env.NEXT_PUBLIC_MIRROR_ENABLED === "true" ? (
        <section className="rounded-3xl border border-border bg-gradient-to-br from-card to-muted/30 p-8 text-foreground">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="text-2xl font-semibold text-foreground">🪞 The Mirror</h2>
            <p className="text-lg text-muted-foreground">Reflection. Discernment. Witness.</p>
            <p className="text-sm text-muted-foreground">
              We don't tell you what to think. We help you learn how to see.
            </p>
            <p className="text-sm text-muted-foreground">
              The Mirror is a space for truth-seeking—where Scripture meets lived experience, where you
              slow down, test ideas, and grow in spiritual clarity.
            </p>
            <div className="mt-8 grid gap-6 text-left md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Reflect</h3>
                <p className="text-sm text-muted-foreground">
                  Scripture-based reflection guides and journaling prompts
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Discern</h3>
                <p className="text-sm text-muted-foreground">
                  Test teachings, analyze cultural trends through a biblical lens
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Witness</h3>
                <p className="text-sm text-muted-foreground">
                  Share your testimony, join prayer, walk out truth in community
                </p>
              </div>
            </div>
            <div className="mt-6">
              <LocalizedLink href="/community-outreach#volunteer">
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/50">
                  Enter The Mirror →
                </span>
              </LocalizedLink>
            </div>
          </div>
        </section>
      ) : null}

      <section
        id="volunteer"
        className="grid gap-8 rounded-3xl border border-border bg-card p-8 text-foreground lg:grid-cols-[1.1fr,0.9fr]"
      >
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">{volunteerSectionTitle}</h2>
          {volunteerBodyHtml ? (
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: volunteerBodyHtml }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{defaultHeroDescription}</p>
          )}
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {volunteerHighlights.map((highlight, index) => (
              <li key={`${highlight.title}-${index}`}>
                • {highlight.title}
                {highlight.description ? (
                  <span className="ml-1 text-muted-foreground">— {highlight.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-muted/60 p-6">
          {volunteerFormEmbed ? (
            <EmbedScript html={volunteerFormEmbed} />
          ) : (
            <VolunteerSignupForm />
          )}
          {volunteerFormProvider ? (
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Powered by {volunteerFormProvider}
            </p>
          ) : null}
        </div>
      </section>

      <section
        id="support"
        className="grid gap-8 rounded-3xl border border-border bg-card p-8 text-foreground md:grid-cols-[1.2fr,1fr]"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">{givingSectionTitle}</h2>
          {givingBodyHtml ? (
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: givingBodyHtml }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Every dollar fuels groceries, Bibles, film production, and deliverance teams in the
              field. Give a one-time gift or become a monthly partner.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {givingHighlights.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-2xl border border-border bg-muted/60 p-4">
                {item.badge ? (
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{item.badge}</div>
                ) : null}
                {item.label ? (
                  <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </div>
                ) : null}
                {item.amount ? (
                  <div className="mt-2 text-lg font-semibold text-foreground">{item.amount}</div>
                ) : null}
                {item.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_rgba(43,37,30,0.08)]">
          <DonationForm processorUrl={donationFormUrl} />
        </div>
      </section>

      {/* Called to Lead? - Carry the Fire Cross-Link */}
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-2xl font-semibold">Called to Lead?</h2>
          <p className="text-sm text-zinc-700 dark:text-white/80">
            Some are called to participate. Others are called to lead, replicate, or build outreach where they live.
          </p>
          <p className="text-sm text-zinc-700 dark:text-white/80">
            If you sense God calling you beyond volunteering—to plant something, lead something, or carry this fire into your city—we want to equip and send you.
          </p>
          <LocalizedLink href="/carry">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300 dark:border-white/20 px-5 py-2 text-sm font-semibold text-zinc-800 dark:text-white/90 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Learn More →
            </span>
          </LocalizedLink>
        </div>
      </section>
    </div>
  );
}
