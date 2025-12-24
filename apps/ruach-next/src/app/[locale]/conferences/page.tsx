import LocalizedLink from "@/components/navigation/LocalizedLink";
import EmbedScript from "@/components/ruach/embeds/EmbedScript";
import SpeakerCard from "@/components/ruach/SpeakerCard";
import { getConferencePage, getEvents, imgUrl } from "@/lib/strapi";
import type {
  ConferenceMerchItem,
  ConferencePageEntity,
  ConferenceScheduleItem,
  ConferenceSpeakerItem,
  EventEntity,
} from "@/lib/types/strapi-types";

type ScheduleBlock = {
  id?: number | string;
  time?: string;
  title?: string;
  description?: string;
};

type SpeakerBlock = {
  id?: number | string;
  name: string;
  displayName?: string;
  role?: string;
  bio?: string;
  photo?: string;
};

type MerchBlock = {
  id?: number | string;
  title: string;
  description?: string;
  href: string;
  ctaLabel?: string;
};

const defaultDescription = "Join remnant believers hungry for the fire of God through worship, deliverance, teaching, and cinematic storytelling.";

const defaultSchedule: ScheduleBlock[] = [
  { time: "Friday 7:00 PM", title: "Worship & Encounter Night", description: "Extended worship, prophetic ministry, and testimony film premiere." },
  { time: "Saturday 10:00 AM", title: "Deliverance Intensive", description: "Teaching with live ministry activation and Q&A." },
  { time: "Saturday 2:00 PM", title: "Creative Lab", description: "Ruach Studios behind-the-scenes storytelling workshop." }
];

const defaultSpeakers: SpeakerBlock[] = [
  { name: "Marc Christopher Seals", displayName: "Marc C. Seals", role: "Co-Founder & Film Director", bio: "Marc releases cinematic testimonies that stir faith for deliverance and healing." },
  { name: "Jonathan Seals", role: "Bible Teacher", bio: "Jonathan equips believers to walk in holiness, power, and prophetic clarity." },
  { name: "Guest Revivalist", role: "Special Guest", bio: "Friends of Ruach carry the fire of awakening to every gathering." }
];

const defaultMerch: MerchBlock[] = [
  { title: "Ruach Fire Hoodie", description: "Limited conference edition. Soft fleece, ember print.", href: "https://buy.stripe.com/test_hoodie", ctaLabel: "Purchase via Stripe" },
  { title: "Testimony Film Bundle", description: "Download our latest stories and support new productions.", href: "https://buy.stripe.com/test_films", ctaLabel: "Purchase via Stripe" }
];

const fallbackRegistrationUrl = process.env.NEXT_PUBLIC_GIVEBUTTER_REGISTRATION_URL || "https://givebutter.com/ruach-conference";

function pickNonEmpty(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== "string") continue;
    if (value.trim() === "") continue;
    return value;
  }
  return undefined;
}

function maybeAttributes<T extends Record<string, any>>(input: T | { attributes?: T } | null | undefined): T | undefined {
  if (!input || typeof input !== "object") return undefined;
  if ("attributes" in input && input.attributes && typeof input.attributes === "object") {
    return input.attributes as T;
  }
  return input as T;
}

function resolveMediaUrl(media: unknown): string | undefined {
  if (!media) return undefined;
  if (typeof media === "string") return imgUrl(media);
  if (typeof media !== "object") return undefined;
  const wrappedMedia = media as { data?: unknown };
  const node = wrappedMedia.data ? wrappedMedia.data : media;
  const attrs = maybeAttributes<{ url?: string }>(node);
  if (!attrs?.url || typeof attrs.url !== "string") return undefined;
  return imgUrl(attrs.url);
}

function normalizeSchedule(items?: ConferenceScheduleItem[] | null): ScheduleBlock[] | undefined {
  if (!Array.isArray(items)) return undefined;

  const normalized = items
    .map((item) => {
      const data = maybeAttributes<ConferenceScheduleItem>(item);
      if (!data) return undefined;

      const title = pickNonEmpty(
        data.title,
        data.name,
        data.label
      );
      const description = pickNonEmpty(
        data.description,
        data.body
      );
      const time = pickNonEmpty(
        data.time,
        data.label
      );

      if (!title && !description && !time) return undefined;

      return {
        id: item?.id,
        title: title ?? "",
        description: description ?? "",
        time: time ?? undefined,
      } satisfies ScheduleBlock;
    })
    .filter(Boolean) as ScheduleBlock[];

  return normalized.length ? normalized : undefined;
}

function normalizeSpeakers(items?: ConferenceSpeakerItem[] | null): SpeakerBlock[] | undefined {
  if (!Array.isArray(items)) return undefined;

  const normalized = items
    .map((item) => {
      const data = maybeAttributes<ConferenceSpeakerItem>(item);
      if (!data) return undefined;

      const displayName = pickNonEmpty(
        data.displayName,
        (data as { display_name?: string }).display_name,
      );
      const name = pickNonEmpty(data.name, data.title);
      const role = pickNonEmpty(data.role, data.title);
      const bio = pickNonEmpty(data.bio, data.description, data.body);
      const photo = resolveMediaUrl(data.photo ?? data.image);

      if (!name) return undefined;

      return {
        id: item?.id,
        name,
        displayName: displayName ?? undefined,
        role: role ?? undefined,
        bio: bio ?? undefined,
        photo: photo ?? undefined,
      } satisfies SpeakerBlock;
    })
    .filter(Boolean) as SpeakerBlock[];

  return normalized.length ? normalized : undefined;
}

function normalizeMerch(items?: ConferenceMerchItem[] | null): MerchBlock[] | undefined {
  if (!Array.isArray(items)) return undefined;

  const normalized = items
    .map((item) => {
      const data = maybeAttributes<ConferenceMerchItem>(item);
      if (!data) return undefined;

      const title = pickNonEmpty(data.title, data.name);
      const href = pickNonEmpty(data.href, data.link, data.url);
      const description = pickNonEmpty(data.description, data.body);
      const ctaLabel = pickNonEmpty(data.ctaLabel, data.cta_label);

      if (!title || !href) return undefined;

      return {
        id: item?.id,
        title,
        href,
        description: description ?? undefined,
        ctaLabel: ctaLabel ?? undefined,
      } satisfies MerchBlock;
    })
    .filter(Boolean) as MerchBlock[];

  return normalized.length ? normalized : undefined;
}

function formatDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString();
}

function pickFeaturedEvent(page?: ConferencePageEntity | null, fallback?: EventEntity) {
  const attributes = page?.attributes;
  return (
    attributes?.featuredEvent?.data ||
    attributes?.featured_event?.data ||
    fallback ||
    null
  );
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

export default async function ConferencesPage(){
  const [pageResult, eventsResult] = await Promise.allSettled([getConferencePage(), getEvents(1)]);
  const page = pageResult.status === "fulfilled" ? pageResult.value : null;
  const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];

  const pageAttributes = (page?.attributes ?? {}) as ConferencePageEntity["attributes"];
  const featured = pickFeaturedEvent(page, events?.[0]) as EventEntity | null;
  const eventAttributes = (featured?.attributes ?? {}) as EventEntity["attributes"];

  const heroImage =
    resolveMediaUrl(pageAttributes.heroImage) ||
    resolveMediaUrl(pageAttributes.hero_image) ||
    resolveMediaUrl(pageAttributes.heroPhoto) ||
    resolveMediaUrl(pageAttributes.hero_photo) ||
    (eventAttributes.cover?.data?.attributes?.url ? imgUrl(eventAttributes.cover.data.attributes.url) : undefined);

  const badge = pickNonEmpty(
    pageAttributes.heroBadge,
    pageAttributes.hero_badge,
    pageAttributes.badge,
  ) || "Ruach Conference";

  const title = pickNonEmpty(
    pageAttributes.heroTitle,
    pageAttributes.hero_title,
    pageAttributes.title,
    eventAttributes.title,
  ) || "Ruach Fire Gathering";

  const description = pickNonEmpty(
    pageAttributes.heroDescription,
    pageAttributes.hero_description,
    pageAttributes.description,
    eventAttributes.description,
  ) || defaultDescription;

  const dateValue = pickNonEmpty(
    pageAttributes.date,
    pageAttributes.eventDate,
    pageAttributes.event_date,
    pageAttributes.startDate,
    pageAttributes.start_date,
    eventAttributes.date,
    eventAttributes.startDate,
  );

  const location = pickNonEmpty(
    pageAttributes.location,
    pageAttributes.eventLocation,
    pageAttributes.event_location,
    eventAttributes.location,
  );

  const dateDisplay = formatDate(dateValue);

  const registrationUrl = pickNonEmpty(
    pageAttributes.registrationUrl,
    pageAttributes.registration_url,
    pageAttributes.registrationLink,
    pageAttributes.registration_link,
  ) || fallbackRegistrationUrl;

  const registrationEmbed = pickNonEmpty(
    pageAttributes.registrationEmbed,
    pageAttributes.registration_embed,
    process.env.NEXT_PUBLIC_GIVEBUTTER_REGISTRATION_EMBED,
  );

  const primaryCtaLabel = pickNonEmpty(
    pageAttributes.primaryCtaLabel,
    pageAttributes.primary_cta_label,
    pageAttributes.registrationLabel,
    pageAttributes.registration_label,
  ) || "Register on Givebutter";

  const primaryCtaUrl = pickNonEmpty(
    pageAttributes.primaryCtaUrl,
    pageAttributes.primary_cta_url,
    registrationUrl,
  ) || registrationUrl;

  const secondaryCtaLabel = pickNonEmpty(
    pageAttributes.secondaryCtaLabel,
    pageAttributes.secondary_cta_label,
    pageAttributes.sponsorLabel,
    pageAttributes.sponsor_label,
    pageAttributes.sponsorCtaLabel,
    pageAttributes.sponsor_cta_label,
  ) || "Sponsor a student";

  const secondaryCtaUrl = pickNonEmpty(
    pageAttributes.secondaryCtaUrl,
    pageAttributes.secondary_cta_url,
    pageAttributes.sponsorUrl,
    pageAttributes.sponsor_url,
    pageAttributes.sponsorCtaUrl,
    pageAttributes.sponsor_cta_url,
  ) || "/give";

  const schedule = normalizeSchedule(pageAttributes.schedule) ?? defaultSchedule;
  const speakers = normalizeSpeakers(pageAttributes.speakers) ?? defaultSpeakers;
  const merch = normalizeMerch(pageAttributes.merch) ?? defaultMerch;

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-white text-neutral-900 shadow-xl">
        {heroImage ? (
          <div className="relative h-64 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt={title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/5" />
          </div>
        ) : null}
        <div className="grid gap-6 p-8 md:grid-cols-[1.5fr,1fr]">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.4em] text-neutral-500">{badge}</span>
            <h1 className="text-3xl font-semibold text-neutral-900">{title}</h1>
            <p className="text-neutral-600">
              {description}
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
              {dateDisplay ? <span>{dateDisplay}</span> : null}
              {location ? <span>• {location}</span> : null}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {isExternal(primaryCtaUrl) ? (
                <a
                  href={primaryCtaUrl}
                  className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {primaryCtaLabel}
                </a>
              ) : (
                <LocalizedLink href={primaryCtaUrl}>
                  <span className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
                    {primaryCtaLabel}
                  </span>
                </LocalizedLink>
              )}
              {isExternal(secondaryCtaUrl) ? (
                <a
                  href={secondaryCtaUrl}
                  className="inline-flex items-center rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {secondaryCtaLabel}
                </a>
              ) : (
                <LocalizedLink href={secondaryCtaUrl}>
                  <span className="inline-flex items-center rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-500">
                    {secondaryCtaLabel}
                  </span>
                </LocalizedLink>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/10 dark:shadow-none">
            <h2 className="text-sm font-semibold text-neutral-800">Secure your seat</h2>
            <p className="mt-2 text-sm text-neutral-600">Givebutter processes all registrations and donations.</p>
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
              {registrationEmbed ? (
                <EmbedScript html={registrationEmbed} />
              ) : (
                <p className="text-xs text-neutral-500">
                  Add your Givebutter embed HTML in Strapi or via `NEXT_PUBLIC_GIVEBUTTER_REGISTRATION_EMBED` to show inline checkout.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Schedule Preview</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">We will release a full schedule closer to the event. Highlights below are sample sessions.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {schedule.map((block, index) => {
            const key = block.id ?? `${block.title}-${block.time ?? index}`;
            return (
              <div key={key} className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                {block.time ? (
                  <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">{block.time}</div>
                ) : null}
                <div className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">{block.title}</div>
                {block.description ? (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">{block.description}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white p-10 text-neutral-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">Featured Speakers</h2>
            <p className="text-sm text-neutral-600">Leaders who burn for Jesus and carry impartation for freedom.</p>
          </div>
          <LocalizedLink href="/contact">
            <span className="text-sm font-semibold text-neutral-700 hover:text-neutral-900">Invite Ruach to your city →</span>
          </LocalizedLink>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {speakers.map((speaker, index) => {
            const key = speaker.id ?? `${speaker.name}-${index}`;
            return (
              <SpeakerCard
                key={key}
                name={speaker.name}
                displayName={speaker.displayName}
                role={speaker.role}
                bio={speaker.bio}
                photoUrl={speaker.photo}
                photoAlt={speaker.displayName || speaker.name}
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Conference Merch</h2>
            <p className="text-sm text-zinc-600 dark:text-white/70">Grab limited releases to support Ruach Studios.</p>
          </div>
          <LocalizedLink href="/media">
            <span className="text-sm font-semibold text-amber-300 hover:text-amber-200">Watch our latest stories →</span>
          </LocalizedLink>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {merch.map((item, index) => {
            const key = item.id ?? `${item.title}-${index}`;
            const external = isExternal(item.href);
            return (
              <div key={key} className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
                <div className="text-lg font-semibold text-zinc-900 dark:text-white">{item.title}</div>
                {item.description ? (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">{item.description}</p>
                ) : null}
                {external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
                  >
                    {item.ctaLabel || "Purchase via Stripe"}
                  </a>
                ) : (
                  <LocalizedLink href={item.href}>
                    <span className="mt-4 inline-flex items-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300">
                      {item.ctaLabel || "Purchase via Stripe"}
                    </span>
                  </LocalizedLink>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
