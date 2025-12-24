import { requireActiveMembership } from "@/lib/require-membership";
import { getDownloadableMediaItems, imgUrl } from "@/lib/strapi";
import { extractAttributes, extractMediaUrl, extractSingleRelation } from "@/lib/strapi-normalize";
import type { MediaItemEntity } from "@/lib/types/strapi-types";
import TrackedLink from "@/components/ruach/TrackedLink";

export const dynamic = "force-dynamic";

type DownloadResource = {
  id: number;
  title: string;
  description?: string;
  href: string;
  label: string;
  releasedAt?: string | null;
  type?: string | null;
  thumbnail?: {
    src?: string;
    alt?: string;
  };
};

function normalizeDownload(entity: MediaItemEntity | Record<string, unknown>): DownloadResource | null {
  const attr = extractAttributes<MediaItemEntity["attributes"]>(entity);
  if (!attr) return null;

  const sourceFile = extractSingleRelation<{ url?: string }>(attr.source?.file);
  const fileUrl = extractMediaUrl(attr.source?.file) ?? sourceFile?.url;
  const directUrl = attr.source?.url;
  const ctaUrl = attr.ctaUrl;

  const href = imgUrl(fileUrl ?? "") || directUrl || ctaUrl || undefined;
  if (!href) return null;

  return {
    id: (entity as MediaItemEntity)?.id ?? 0,
    title: attr.title ?? "Downloadable resource",
    description: attr.description ?? attr.excerpt ?? undefined,
    href,
    label: attr.ctaLabel ?? (ctaUrl ? "Open product" : "Download"),
    releasedAt: attr.releasedAt,
    type: attr.type,
    thumbnail: (() => {
      const thumbnailUrl = extractMediaUrl(attr.thumbnail);
      if (!thumbnailUrl) return undefined;
      const thumbnailMedia = extractSingleRelation<{ alternativeText?: string }>(attr.thumbnail);
      return {
        src: imgUrl(thumbnailUrl),
        alt: thumbnailMedia?.alternativeText ?? attr.title ?? "Download",
      };
    })(),
  };
}

function formatDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function MemberDownloadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const path = "/members/downloads";
  await requireActiveMembership(path, locale);

  const { data } = await getDownloadableMediaItems({ pageSize: 30 });
  const resources = data
    .map((entity) => normalizeDownload(entity))
    .filter((item): item is DownloadResource => Boolean(item));

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Member Library</span>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Downloads &amp; Resources</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-white/70">
          Access partner-only study guides, eBooks, and sermon notes bundled with your membership or released as standalone products.
        </p>
      </header>

      <section className="space-y-4">
        <div className="grid gap-6 md:grid-cols-2">
          {resources.length ? (
            resources.map((resource) => {
              const releaseLabel = formatDate(resource.releasedAt);
              return (
                <article
                  key={resource.id}
                  className="flex h-full flex-col rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 text-zinc-900 dark:text-white"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {resource.thumbnail?.src ? (
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resource.thumbnail.src}
                          alt={resource.thumbnail.alt ?? resource.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex-1 space-y-2">
                      {releaseLabel ? (
                        <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">{releaseLabel}</span>
                      ) : null}
                      <h2 className="text-lg font-semibold">{resource.title}</h2>
                      {resource.description ? (
                        <p className="text-sm text-zinc-600 dark:text-white/70">{resource.description}</p>
                      ) : null}
                      {resource.type ? (
                        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/50">{resource.type}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-6">
                    <TrackedLink
                      href={resource.href}
                      prefetch={false}
                      className="inline-flex items-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
                      target={resource.href?.startsWith("http") ? "_blank" : undefined}
                      rel={resource.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                      download={resource.href.startsWith("http") ? undefined : ""}
                      event="MemberDownloadClick"
                      eventProps={{ resource: resource.title }}
                    >
                      {resource.label}
                    </TrackedLink>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-sm text-zinc-600 dark:text-white/70">
              Downloadable resources will appear here once they are published for members.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
