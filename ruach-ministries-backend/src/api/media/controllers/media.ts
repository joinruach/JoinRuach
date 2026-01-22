type MediaItem = {
  id: number;
  title?: string;
  slug?: string;
  episodeNumber?: number;
  seasonNumber?: number;
  publishedAt?: string;
  releasedAt?: string;
  durationSec?: number;
  thumbnail?: { url?: string; alternativeText?: string } | null;
  series?: { id?: number } | null;
};

function normalizeMedia(item: any): MediaItem {
  if (!item || typeof item !== "object") return item as MediaItem;
  const thumbnail = item.thumbnail?.data?.attributes ?? item.thumbnail ?? null;
  const series = item.series?.data ?? item.series ?? null;
  return {
    ...item,
    thumbnail,
    series,
  } as MediaItem;
}

function getDateValue(value?: string) {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

export default {
  async library(ctx: any) {
    const collections = await strapi.entityService.findMany("api::series.series", {
      fields: ["title", "slug", "summary", "description", "kind", "visibility", "sortMode", "featured", "publishedAt"],
      populate: {
        poster: { fields: ["url", "alternativeText"] },
        coverImage: { fields: ["url", "alternativeText"] },
        heroBackdrop: { fields: ["url", "alternativeText"] },
        tags: { fields: ["name", "slug"] },
      },
      filters: {
        visibility: "public",
        // TEMP: Removed publishedAt filter due to draft/publish system issue
        // publishedAt: { $notNull: true },
      },
      sort: ["id:desc"],  // TEMP: Sort by ID since publishedAt is null
      pagination: { pageSize: 500 },
    });

    const episodesRaw = await strapi.entityService.findMany("api::media-item.media-item", {
      fields: ["title", "slug", "episodeNumber", "seasonNumber", "publishedAt", "releasedAt", "durationSec"],
      populate: {
        thumbnail: { fields: ["url", "alternativeText"] },
        series: { fields: ["id"] },
      },
      filters: {
        itemType: "episode",
        visibility: "public",
        // TEMP: Removed publishedAt filter
        // publishedAt: { $notNull: true },
      },
      sort: ["releasedAt:desc"],  // TEMP: Sort by releasedAt
      pagination: { pageSize: 2000 },
    });

    const standaloneRaw = await strapi.entityService.findMany("api::media-item.media-item", {
      fields: ["title", "slug", "publishedAt", "releasedAt", "durationSec", "excerpt", "type", "requiredAccessLevel"],
      populate: {
        thumbnail: { fields: ["url", "alternativeText"] },
        category: { fields: ["name", "slug"] },
        speakers: { fields: ["name", "displayName", "title"] },
      },
      filters: {
        itemType: "standalone",
        visibility: "public",
        // TEMP: Removed publishedAt filter
        // publishedAt: { $notNull: true },
      },
      sort: ["releasedAt:desc"],
      pagination: { pageSize: 2000 },
    });

    const episodes = (episodesRaw || []).map(normalizeMedia);
    const standalone = (standaloneRaw || []).map((item: any) => normalizeMedia(item));

    const episodeBySeries = new Map<number, MediaItem[]>();
    for (const episode of episodes) {
      const seriesId = episode.series?.id;
      if (!seriesId) continue;
      const list = episodeBySeries.get(seriesId) ?? [];
      list.push(episode);
      episodeBySeries.set(seriesId, list);
    }

    const collectionsWithMeta = (collections || []).map((collection: any) => {
      const seriesId = collection.id as number;
      const seriesEpisodes = episodeBySeries.get(seriesId) ?? [];
      const latestEpisode = seriesEpisodes.reduce<MediaItem | null>((current, next) => {
        if (!current) return next;
        const currentDate = getDateValue(current.publishedAt || current.releasedAt);
        const nextDate = getDateValue(next.publishedAt || next.releasedAt);
        return nextDate > currentDate ? next : current;
      }, null);

      return {
        ...collection,
        episodeCount: seriesEpisodes.length,
        latestEpisode,
      };
    });

    ctx.body = {
      collections: collectionsWithMeta,
      standalone,
    };
  },
};
