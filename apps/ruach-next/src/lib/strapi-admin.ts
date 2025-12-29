/**
 * Strapi Admin API Layer
 *
 * Admin-specific API functions for the Studio Dashboard.
 * All functions require authentication via strapiJwt token.
 */

import { getJSON, postJSON, putJSON, deleteJSON } from '@/lib/strapi';
import type { MediaItemEntity, SeriesEntity, CategoryEntity } from '@/lib/types/strapi-types';

// ============================================================================
// Types
// ============================================================================

export type MediaItemFormData = {
  title: string;
  description?: string;
  excerpt?: string;
  contentType: 'testimony' | 'teaching' | 'worship' | 'podcast' | 'short';
  videoUrl?: string;
  sourceKey?: string; // R2 storage key
  thumbnail?: number; // Media ID
  speakers?: number[]; // Speaker IDs
  tags?: number[]; // Tag IDs
  categories?: number[]; // Category IDs
  series?: number; // Series ID
  weekNumber?: number;
  episodeNumber?: number;
  publishYouTube?: boolean;
  publishFacebook?: boolean;
  publishInstagram?: boolean;
  publishX?: boolean;
  publishPatreon?: boolean;
  publishRumble?: boolean;
  publishLocals?: boolean;
  publishTruthSocial?: boolean;
  autoPublish?: boolean;
  publishedAt?: string | null;
};

export type StrapiListResponse<T> = {
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

export type PublishingStatus = {
  success: boolean;
  data?: {
    publishStatus: Record<string, {
      status: 'success' | 'failed' | 'pending';
      timestamp?: string;
      error?: string;
      result?: unknown;
    }>;
  };
};

// ============================================================================
// Media Item CRUD
// ============================================================================

/**
 * Get media item for editing (fully populated)
 */
export async function getMediaItemForEdit(
  id: string | number,
  token: string
): Promise<MediaItemEntity | null> {
  const params = new URLSearchParams();
  params.set('populate[thumbnail]', '*');
  params.set('populate[speakers]', '*');
  params.set('populate[tags]', '*');
  params.set('populate[categories]', '*');
  params.set('populate[series]', '*');
  params.set('populate[source]', '*');
  params.set('populate[seoImage]', '*');

  try {
    const response = await getJSON<{ data: MediaItemEntity }>(
      `/api/media-items/${id}?${params.toString()}`,
      { authToken: token }
    );
    return response.data;
  } catch (error) {
    console.error('[getMediaItemForEdit] Error:', error);
    return null;
  }
}

/**
 * Get recent media items for dashboard
 */
export async function getRecentMediaItems(
  token: string,
  limit = 10
): Promise<MediaItemEntity[]> {
  const params = new URLSearchParams();
  params.set('sort[0]', 'createdAt:desc');
  params.set('pagination[pageSize]', String(limit));
  params.set('populate[thumbnail]', '*');
  params.set('populate[speakers]', '*');

  try {
    const response = await getJSON<StrapiListResponse<MediaItemEntity>>(
      `/api/media-items?${params.toString()}`,
      { authToken: token }
    );
    return response.data || [];
  } catch (error) {
    console.error('[getRecentMediaItems] Error:', error);
    return [];
  }
}

/**
 * Create new media item
 */
export async function createMediaItem(
  data: MediaItemFormData,
  token: string
): Promise<{ success: boolean; data?: MediaItemEntity; error?: string }> {
  try {
    const payload = {
      data: {
        title: data.title,
        description: data.description,
        excerpt: data.excerpt,
        type: data.contentType,
        ...(data.videoUrl && {
          videoUrl: data.videoUrl,
        }),
        ...(data.sourceKey && {
          source: {
            kind: 'file',
            url: data.videoUrl,
          },
        }),
        ...(data.thumbnail && {
          thumbnail: data.thumbnail,
        }),
        ...(data.speakers && data.speakers.length > 0 && {
          speakers: data.speakers,
        }),
        ...(data.tags && data.tags.length > 0 && {
          tags: data.tags,
        }),
        ...(data.categories && data.categories.length > 0 && {
          categories: data.categories,
        }),
        ...(data.series && {
          series: data.series,
        }),
        ...(data.weekNumber && {
          weekNumber: data.weekNumber,
        }),
        ...(data.episodeNumber && {
          episodeNumber: data.episodeNumber,
        }),
        publishYouTube: data.publishYouTube ?? false,
        publishFacebook: data.publishFacebook ?? false,
        publishInstagram: data.publishInstagram ?? false,
        publishX: data.publishX ?? false,
        publishPatreon: data.publishPatreon ?? false,
        publishRumble: data.publishRumble ?? false,
        publishLocals: data.publishLocals ?? false,
        publishTruthSocial: data.publishTruthSocial ?? false,
        autoPublish: data.autoPublish ?? false,
        ...(data.publishedAt && {
          publishedAt: data.publishedAt,
        }),
      },
    };

    const response = await postJSON<{ data: MediaItemEntity }>(
      '/api/media-items',
      payload,
      { authToken: token }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[createMediaItem] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create media item',
    };
  }
}

/**
 * Update existing media item
 */
export async function updateMediaItem(
  id: string | number,
  data: Partial<MediaItemFormData>,
  token: string
): Promise<{ success: boolean; data?: MediaItemEntity; error?: string }> {
  try {
    const payload = {
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.contentType && { type: data.contentType }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
        ...(data.speakers !== undefined && { speakers: data.speakers }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.categories !== undefined && { categories: data.categories }),
        ...(data.series !== undefined && { series: data.series }),
        ...(data.weekNumber !== undefined && { weekNumber: data.weekNumber }),
        ...(data.episodeNumber !== undefined && { episodeNumber: data.episodeNumber }),
        ...(data.publishYouTube !== undefined && { publishYouTube: data.publishYouTube }),
        ...(data.publishFacebook !== undefined && { publishFacebook: data.publishFacebook }),
        ...(data.publishInstagram !== undefined && { publishInstagram: data.publishInstagram }),
        ...(data.publishX !== undefined && { publishX: data.publishX }),
        ...(data.publishPatreon !== undefined && { publishPatreon: data.publishPatreon }),
        ...(data.publishRumble !== undefined && { publishRumble: data.publishRumble }),
        ...(data.publishLocals !== undefined && { publishLocals: data.publishLocals }),
        ...(data.publishTruthSocial !== undefined && { publishTruthSocial: data.publishTruthSocial }),
        ...(data.autoPublish !== undefined && { autoPublish: data.autoPublish }),
        ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt }),
      },
    };

    const response = await putJSON<{ data: MediaItemEntity }>(
      `/api/media-items/${id}`,
      payload,
      { authToken: token }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[updateMediaItem] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update media item',
    };
  }
}

/**
 * Delete media item
 */
export async function deleteMediaItem(
  id: string | number,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteJSON(`/api/media-items/${id}`, { authToken: token });
    return { success: true };
  } catch (error) {
    console.error('[deleteMediaItem] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete media item',
    };
  }
}

// ============================================================================
// Publishing Controls
// ============================================================================

/**
 * Get publishing status for a media item
 */
export async function getPublishingStatus(
  id: string | number,
  token: string
): Promise<PublishingStatus | null> {
  try {
    const response = await getJSON<PublishingStatus>(
      `/api/ruach-publisher/status/${id}`,
      { authToken: token }
    );
    return response;
  } catch (error) {
    console.error('[getPublishingStatus] Error:', error);
    return null;
  }
}

/**
 * Retry failed publish for specific platform
 */
export async function retryPublish(
  id: string | number,
  platform: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await postJSON(
      `/api/ruach-publisher/retry/${id}/${platform}`,
      {},
      { authToken: token }
    );
    return { success: true };
  } catch (error) {
    console.error('[retryPublish] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retry publish',
    };
  }
}

// ============================================================================
// Metadata Helpers (for forms)
// ============================================================================

/**
 * Get all speakers
 */
export async function getAllSpeakers(token: string) {
  const params = new URLSearchParams();
  params.set('fields[0]', 'name');
  params.set('fields[1]', 'displayName');
  params.set('sort[0]', 'name:asc');
  params.set('pagination[pageSize]', '100');

  try {
    const response = await getJSON<{ data: Array<{ id: number; attributes: { name?: string; displayName?: string } }> }>(
      `/api/speakers?${params.toString()}`,
      { authToken: token }
    );
    return response.data || [];
  } catch (error) {
    console.error('[getAllSpeakers] Error:', error);
    return [];
  }
}

/**
 * Get all categories
 */
export async function getAllCategories(token: string) {
  const params = new URLSearchParams();
  params.set('fields[0]', 'name');
  params.set('fields[1]', 'slug');
  params.set('sort[0]', 'name:asc');
  params.set('pagination[pageSize]', '100');

  try {
    const response = await getJSON<{ data: CategoryEntity[] }>(
      `/api/categories?${params.toString()}`,
      { authToken: token }
    );
    return response.data || [];
  } catch (error) {
    console.error('[getAllCategories] Error:', error);
    return [];
  }
}

/**
 * Get all series
 */
export async function getAllSeriesForAdmin(token: string) {
  const params = new URLSearchParams();
  params.set('fields[0]', 'title');
  params.set('fields[1]', 'slug');
  params.set('sort[0]', 'createdAt:desc');
  params.set('pagination[pageSize]', '100');

  try {
    const response = await getJSON<{ data: SeriesEntity[] }>(
      `/api/series-collection?${params.toString()}`,
      { authToken: token }
    );
    return response.data || [];
  } catch (error) {
    console.error('[getAllSeriesForAdmin] Error:', error);
    return [];
  }
}

// ============================================================================
// Series CRUD
// ============================================================================

export type SeriesFormData = {
  title: string;
  slug: string;
  description?: string;
  coverImage?: number; // Media ID
  mediaItems?: number[]; // Media item IDs
};

/**
 * Create new series
 */
export async function createSeries(
  data: SeriesFormData,
  token: string
): Promise<{ success: boolean; data?: SeriesEntity; error?: string }> {
  try {
    const payload = {
      data: {
        title: data.title,
        slug: data.slug,
        ...(data.description && { description: data.description }),
        ...(data.coverImage && { coverImage: data.coverImage }),
        ...(data.mediaItems && { mediaItems: data.mediaItems }),
      },
    };

    const response = await postJSON<{ data: SeriesEntity }>(
      '/api/series-collection',
      payload,
      { authToken: token }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[createSeries] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create series',
    };
  }
}

/**
 * Update existing series
 */
export async function updateSeries(
  id: string | number,
  data: Partial<SeriesFormData>,
  token: string
): Promise<{ success: boolean; data?: SeriesEntity; error?: string }> {
  try {
    const payload = {
      data: {
        ...(data.title && { title: data.title }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.mediaItems !== undefined && { mediaItems: data.mediaItems }),
      },
    };

    const response = await putJSON<{ data: SeriesEntity }>(
      `/api/series-collection/${id}`,
      payload,
      { authToken: token }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[updateSeries] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update series',
    };
  }
}

/**
 * Delete series
 */
export async function deleteSeries(
  id: string | number,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteJSON(`/api/series-collection/${id}`, { authToken: token });
    return { success: true };
  } catch (error) {
    console.error('[deleteSeries] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete series',
    };
  }
}
