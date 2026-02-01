import type { Core } from "@strapi/strapi";
import type { TranscodingJobProgress } from "./media-transcoding-queue";

/**
 * Service to manage transcoding results and update media items
 */
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Update media item with transcoding results
   */
  async updateMediaItemWithResults(
    mediaItemId: number,
    results: TranscodingJobProgress
  ) {
    try {
      if (results.status === "completed" && results.results) {
        // Store results in media item
        const mediaItem = await strapi.entityService.findOne(
          "api::media-item.media-item",
          mediaItemId,
          { fields: ["id", "transcodingResults"] } as any
        );

        if (!mediaItem) {
          strapi.log.warn(
            `[transcoding-results] Media item ${mediaItemId} not found`
          );
          return;
        }

        // Merge with existing results
        const existingResults = (mediaItem as any).transcodingResults || {};
        const updatedResults = {
          ...existingResults,
          ...results.results,
          lastUpdated: new Date().toISOString(),
        };

        await strapi.entityService.update("api::media-item.media-item", mediaItemId, {
          data: {
            transcodingResults: updatedResults,
            transcodingStatus: "completed",
            transcodingError: null,
          } as any,
        });

        strapi.log.info(
          `[transcoding-results] Updated media item ${mediaItemId} with transcoding results`
        );
      } else if (results.status === "processing") {
        // Update status to processing
        const mediaItem = await strapi.entityService.findOne(
          "api::media-item.media-item",
          mediaItemId,
          { fields: ["id"] }
        );

        if (mediaItem) {
          await strapi.entityService.update("api::media-item.media-item", mediaItemId, {
            data: {
              transcodingStatus: "processing",
              transcodingError: null,
            } as any,
          });
        }
      } else if (results.status === "failed") {
        // Store error and mark as failed
        const errorMessage = results.errors?.[0] || "Unknown transcoding error";

        await strapi.entityService.update("api::media-item.media-item", mediaItemId, {
          data: {
            transcodingStatus: "failed",
            transcodingError: errorMessage,
          } as any,
        });

        strapi.log.error(
          `[transcoding-results] Transcoding failed for media ${mediaItemId}: ${errorMessage}`
        );
      }
    } catch (error) {
      strapi.log.error(
        `[transcoding-results] Failed to update media item ${mediaItemId}:`,
        error instanceof Error ? error.message : error
      );
    }
  },

  /**
   * Get transcoding results for a media item
   */
  async getTranscodingResults(mediaItemId: number) {
    try {
      const mediaItem = await strapi.entityService.findOne(
        "api::media-item.media-item",
        mediaItemId,
        {
          fields: [
            "id",
            "transcodingResults",
            "transcodingStatus",
            "transcodingError",
          ],
        } as any
      );

      if (!mediaItem) {
        return null;
      }

      const item = mediaItem as any;
      return {
        status: item.transcodingStatus || "not_started",
        results: item.transcodingResults || null,
        error: item.transcodingError || null,
      };
    } catch (error) {
      strapi.log.error(
        `[transcoding-results] Failed to get results for media ${mediaItemId}:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  },

  /**
   * Clear transcoding results for a media item
   */
  async clearTranscodingResults(mediaItemId: number) {
    try {
      await strapi.entityService.update("api::media-item.media-item", mediaItemId, {
        data: {
          transcodingResults: null,
          transcodingStatus: "not_started",
          transcodingError: null,
        } as any,
      });

      strapi.log.info(
        `[transcoding-results] Cleared transcoding results for media ${mediaItemId}`
      );
    } catch (error) {
      strapi.log.error(
        `[transcoding-results] Failed to clear results for media ${mediaItemId}:`,
        error instanceof Error ? error.message : error
      );
    }
  },

  /**
   * Get HLS playlist URL if available
   */
  async getHLSPlaylistUrl(
    mediaItemId: number
  ): Promise<string | null> {
    try {
      const results = await this.getTranscodingResults(mediaItemId);

      if (!results?.results?.hlsPlaylist?.url) {
        return null;
      }

      return results.results.hlsPlaylist.url;
    } catch (error) {
      strapi.log.error(
        `[transcoding-results] Failed to get HLS playlist URL:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  },

  /**
   * Get available video qualities
   */
  async getAvailableQualities(
    mediaItemId: number
  ): Promise<
    Array<{
      resolution: string;
      bitrate: string;
      url: string;
    }>
  > {
    try {
      const results = await this.getTranscodingResults(mediaItemId);

      if (!results?.results?.transcodes) {
        return [];
      }

      return results.results.transcodes.map((t: any) => ({
        resolution: t.resolution,
        bitrate: t.bitrate || "unknown",
        url: t.outputUrl,
      }));
    } catch (error) {
      strapi.log.error(
        `[transcoding-results] Failed to get available qualities:`,
        error instanceof Error ? error.message : error
      );
      return [];
    }
  },

  /**
   * Get audio download URL
   */
  async getAudioUrl(
    mediaItemId: number
  ): Promise<string | null> {
    try {
      const results = await this.getTranscodingResults(mediaItemId);

      if (!results?.results?.audio?.outputUrl) {
        return null;
      }

      return results.results.audio.outputUrl;
    } catch (error) {
      strapi.log.error(
        `[transcoding-results] Failed to get audio URL:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  },

  /**
   * Get thumbnail URLs
   */
  async getThumbnailUrls(
    mediaItemId: number
  ): Promise<
    Array<{
      timestamp: number;
      url: string;
    }>
  > {
    try {
      const results = await this.getTranscodingResults(mediaItemId);

      if (!results?.results?.thumbnails) {
        return [];
      }

      return results.results.thumbnails.map((t: any) => ({
        timestamp: t.timestamp,
        url: t.outputUrl,
      }));
    } catch (error) {
      strapi.log.error(
        `[transcoding-results] Failed to get thumbnail URLs:`,
        error instanceof Error ? error.message : error
      );
      return [];
    }
  },
});
