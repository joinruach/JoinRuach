import createSlugFreezeLifecycle from '../../../../utils/freeze-slug';
import { revalidateContent } from '../../../../utils/cache-revalidation';

type LifecycleEvent = {
  result: Record<string, any>;
  params: Record<string, any>;
};

type BeforeLifecycleEvent = {
  params: {
    data: Record<string, any>;
    where?: { id?: number };
  };
};

type SlugLifecycle = ReturnType<typeof createSlugFreezeLifecycle> & {
  afterUpdate?: (event: LifecycleEvent) => Promise<void>;
  afterCreate?: (event: LifecycleEvent) => Promise<void>;
};

const slugLifecycle = createSlugFreezeLifecycle('api::media-item.media-item') as SlugLifecycle;

function getRelationId(value: unknown) {
  if (!value) return undefined;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "object" && value && "data" in value) {
    const dataValue = (value as { data?: unknown }).data;
    if (typeof dataValue === "number" || typeof dataValue === "string") return dataValue;
    if (typeof dataValue === "object" && dataValue && "id" in dataValue) {
      const idValue = (dataValue as { id?: unknown }).id;
      if (typeof idValue === "number" || typeof idValue === "string") return idValue;
    }
  }
  if (typeof value === "object" && value && "connect" in value) {
    const connectValue = (value as { connect?: unknown }).connect;
    if (Array.isArray(connectValue) && connectValue.length > 0) {
      const first = connectValue[0] as { id?: unknown };
      if (typeof first?.id === "number" || typeof first?.id === "string") return first.id;
    }
  }
  if (typeof value === "object" && value && "id" in value) {
    const idValue = (value as { id?: unknown }).id;
    if (typeof idValue === "number" || typeof idValue === "string") return idValue;
  }
  return undefined;
}

function validateEpisodeRules(data: Record<string, any>, existing?: Record<string, any>) {
  const merged = { ...existing, ...data };
  const itemType = merged.itemType ?? "standalone";
  const seriesId = getRelationId(merged.series);

  if (itemType === "episode") {
    if (!seriesId) {
      throw new Error("Episode media items must belong to a series.");
    }
    if (!merged.episodeNumber) {
      throw new Error("Episode media items must include an episodeNumber.");
    }
  } else if (seriesId) {
    throw new Error("Standalone media items cannot be assigned to a series.");
  }
}

function normalizePublishStatus(data: Record<string, any>) {
  if (!("publishStatus" in data)) return;
  const value = data.publishStatus;
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      data.publishStatus = null;
      return;
    }
    try {
      data.publishStatus = JSON.parse(trimmed);
    } catch {
      throw new Error("publishStatus must be valid JSON.");
    }
  }
}

function buildRevalidationTags(result: Record<string, any>) {
  const tags = ["media-items", "media-library"];
  const category = result.category;
  if (category) {
    tags.push(`media-category:${category}`);
  }

  const itemType = result.itemType;
  const seriesId = getRelationId(result.series);
  if (itemType === "episode" && seriesId) {
    tags.push(`collection:${seriesId}:episodes`);
  }

  return tags;
}

export default {
  ...slugLifecycle,

  async beforeCreate(event: BeforeLifecycleEvent) {
    normalizePublishStatus(event.params.data);
    validateEpisodeRules(event.params.data);
  },

  async beforeUpdate(event: BeforeLifecycleEvent) {
    normalizePublishStatus(event.params.data);
    const id = event.params.where?.id;
    if (!id) {
      validateEpisodeRules(event.params.data);
      return;
    }

    const existing = await strapi.entityService.findOne("api::media-item.media-item", id, {
      fields: ["itemType", "episodeNumber"],
      populate: { series: { fields: ["id"] } },
    });

    validateEpisodeRules(event.params.data, existing ?? undefined);
  },

  /**
   * After Update Hook
   * Triggered when a media-item is published or updated
   */
  async afterUpdate(event: LifecycleEvent) {
    // Call slug freeze lifecycle if it exists
    if (slugLifecycle?.afterUpdate) {
      await slugLifecycle.afterUpdate(event);
    }

    const { result } = event;

    // Trigger cache revalidation if published
    if (result.publishedAt) {
      const additionalTags = buildRevalidationTags(result);
      await revalidateContent('api::media-item.media-item', result, additionalTags);
    }

    // Check if the media item was just published AND has autoPublish enabled
    if (result.publishedAt && result.autoPublish) {
      // Check if at least one platform is enabled
      const hasEnabledPlatform = result.publishYouTube || result.publishFacebook ||
        result.publishInstagram || result.publishX || result.publishPatreon ||
        result.publishRumble || result.publishLocals || result.publishTruthSocial;

      if (hasEnabledPlatform) {
        try {
          // Get the publisher plugin service
          const publisherService = strapi.plugin('ruach-publisher')?.service('publisher');

          if (publisherService) {
            // Queue the distribution job
            await publisherService.distribute(result);

            strapi.log.info(`Auto-publish queued for media-item: ${result.id} (${result.title})`);
          } else {
            strapi.log.warn('ruach-publisher plugin not found. Auto-publish skipped.');
          }
        } catch (error) {
          strapi.log.error('Error triggering auto-publish:', error);
        }
      }
    }
  },

  /**
   * After Create Hook
   * Triggered when a new media-item is created and published immediately
   */
  async afterCreate(event: LifecycleEvent) {
    // Call slug freeze lifecycle if it exists
    if (slugLifecycle?.afterCreate) {
      await slugLifecycle.afterCreate(event);
    }

    const { result } = event;

    // Trigger cache revalidation if published
    if (result.publishedAt) {
      const additionalTags = buildRevalidationTags(result);
      await revalidateContent('api::media-item.media-item', result, additionalTags);
    }

    // Check if created as published with autoPublish enabled
    if (result.publishedAt && result.autoPublish) {
      // Check if at least one platform is enabled
      const hasEnabledPlatform = result.publishYouTube || result.publishFacebook ||
        result.publishInstagram || result.publishX || result.publishPatreon ||
        result.publishRumble || result.publishLocals || result.publishTruthSocial;

      if (hasEnabledPlatform) {
        try {
          const publisherService = strapi.plugin('ruach-publisher')?.service('publisher');

          if (publisherService) {
            await publisherService.distribute(result);
            strapi.log.info(`Auto-publish queued for new media-item: ${result.id} (${result.title})`);
          }
        } catch (error) {
          strapi.log.error('Error triggering auto-publish on create:', error);
        }
      }
    }
  },

  /**
   * After Delete Hook
   * Triggered when a media-item is deleted
   */
  async afterDelete(event: LifecycleEvent) {
    const { result } = event;
    // Revalidate to remove from cache
    const additionalTags = buildRevalidationTags(result);
    await revalidateContent('api::media-item.media-item', result, additionalTags);
  },
};
