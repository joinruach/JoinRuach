import createSlugFreezeLifecycle from '../../../../utils/freeze-slug';

type LifecycleEvent = {
  result: Record<string, any>;
  params: Record<string, any>;
};

type SlugLifecycle = ReturnType<typeof createSlugFreezeLifecycle> & {
  afterUpdate?: (event: LifecycleEvent) => Promise<void>;
  afterCreate?: (event: LifecycleEvent) => Promise<void>;
};

const slugLifecycle = createSlugFreezeLifecycle('api::media-item.media-item') as SlugLifecycle;

export default {
  ...slugLifecycle,

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

    // Check if the media item was just published AND has autoPublish enabled
    if (result.publishedAt && result.autoPublish && result.platforms) {
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

    // Check if created as published with autoPublish enabled
    if (result.publishedAt && result.autoPublish && result.platforms) {
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
  },
};
