import { NextRequest, NextResponse } from 'next/server';
import { getJSON } from '@/lib/strapi';
import { generateRecommendations, popularityRecommendations } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';

interface MediaItemResponse {
  id: number;
  attributes: {
    title: string;
    slug: string;
    excerpt?: string | null;
    description?: string | null;
    type?: string | null;
    views?: number | null;
    publishedAt?: string | null;
    thumbnail?: {
      data?: {
        attributes?: { url?: string } | null;
      } | null;
    } | null;
    speakers?: {
      data?: Array<{ attributes?: { name?: string } | null }> | null;
    } | null;
    tags?: {
      data?: Array<{ attributes?: { name?: string } | null }> | null;
    } | null;
  };
}

function isValidMediaItem(item: unknown): item is MediaItemResponse {
  if (!item || typeof item !== 'object') return false;
  const i = item as Partial<MediaItemResponse>;
  return (
    typeof i.id === 'number' &&
    i.attributes !== null &&
    i.attributes !== undefined &&
    typeof i.attributes === 'object' &&
    typeof i.attributes.title === 'string' &&
    typeof i.attributes.slug === 'string'
  );
}

function extractTags(item: MediaItemResponse): string[] {
  return (
    item.attributes.tags?.data
      ?.map((t) => t.attributes?.name)
      .filter((name): name is string => typeof name === 'string') || []
  );
}

function extractSpeakers(item: MediaItemResponse): string[] {
  return (
    item.attributes.speakers?.data
      ?.map((s) => s.attributes?.name)
      .filter((name): name is string => typeof name === 'string') || []
  );
}

/**
 * Fetch user viewing history tags for personalization
 */
async function fetchUserHistoryWithTags(userId: string): Promise<
  Array<{ title: string; contentType: string; tags: string[] }>
> {
  try {
    const params = new URLSearchParams({
      'filters[user][id][$eq]': userId,
      'sort[0]': 'updatedAt:desc',
      'pagination[limit]': '20',
      'populate[mediaItem][fields][0]': 'title',
      'populate[mediaItem][fields][1]': 'type',
      'populate[mediaItem][populate][tags][fields][0]': 'name',
    });

    const response = await getJSON<{
      data: Array<{
        id: number;
        attributes?: {
          mediaItem?: {
            data?: {
              attributes?: {
                title?: string;
                type?: string;
                tags?: {
                  data?: Array<{ attributes?: { name?: string } | null }> | null;
                } | null;
              } | null;
            } | null;
          } | null;
        };
      }>;
    }>(`/api/media-progresses?${params}`);

    return (response.data || []).map((entry) => {
      const media = entry.attributes?.mediaItem?.data?.attributes;
      return {
        title: media?.title || 'Unknown',
        contentType: media?.type || 'media',
        tags:
          media?.tags?.data
            ?.map((t) => t.attributes?.name)
            .filter((n): n is string => typeof n === 'string') || [],
      };
    });
  } catch {
    return [];
  }
}

/**
 * Content Recommendations API
 *
 * GET /api/recommendations?userId=123&limit=10&type=media
 *
 * Personalized when userId provided, popularity-only for anonymous.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10));
    const contentType = searchParams.get('type');

    // Fetch candidate content (larger pool for scoring)
    const fetchLimit = Math.max(limit * 3, 30);
    const params = new URLSearchParams({
      'sort[0]': 'views:desc',
      'pagination[limit]': fetchLimit.toString(),
      'populate[thumbnail]': 'true',
      'populate[speakers]': 'true',
      'populate[tags]': 'true',
      ...(contentType && { 'filters[type][$eq]': contentType }),
    });

    const response = await getJSON<{ data: unknown[] }>(`/api/media-items?${params}`);
    const validItems = (response.data || []).filter(isValidMediaItem);

    const candidates = validItems.map((item) => ({
      id: item.id,
      title: item.attributes.title,
      slug: item.attributes.slug,
      description: item.attributes.excerpt || item.attributes.description || undefined,
      thumbnailUrl: item.attributes.thumbnail?.data?.attributes?.url,
      type: item.attributes.type || undefined,
      views: item.attributes.views || 0,
      publishedAt: item.attributes.publishedAt || new Date().toISOString(),
      tags: extractTags(item),
      speakers: extractSpeakers(item),
    }));

    let recommendations;

    if (userId) {
      const userHistory = await fetchUserHistoryWithTags(userId);
      recommendations = generateRecommendations(candidates, userHistory, limit);
    } else {
      recommendations = popularityRecommendations(candidates, limit);
    }

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
