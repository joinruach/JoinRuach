import { NextRequest, NextResponse } from 'next/server';
import { getJSON } from '@/lib/strapi';

export const dynamic = 'force-dynamic';

// Strapi media item response type
interface MediaItemResponse {
  id: number;
  attributes: {
    title: string;
    slug: string;
    excerpt?: string | null;
    description?: string | null;
    type?: string | null;
    views?: number | null;
    thumbnail?: {
      data?: {
        attributes?: {
          url?: string;
        } | null;
      } | null;
    } | null;
    speakers?: {
      data?: Array<{
        attributes?: {
          name?: string;
        } | null;
      }> | null;
    } | null;
    tags?: {
      data?: Array<{
        attributes?: {
          name?: string;
        } | null;
      }> | null;
    } | null;
  };
}

// Recommendation response type
interface Recommendation {
  contentType: string;
  contentId: number;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  score: number;
  reason: string;
  metadata: {
    type?: string;
    views?: number;
    speakers?: string[];
    tags?: string[];
  };
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  count: number;
}

// Type guard for media item
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

/**
 * Content Recommendations API
 * Returns personalized content recommendations
 *
 * GET /api/recommendations?userId=123&limit=10&type=media
 */
export async function GET(request: NextRequest): Promise<NextResponse<RecommendationsResponse | { error: string }>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const contentType = searchParams.get('type');

    // TODO: Implement full recommendation engine
    // For now, return popular content as fallback

    // Fetch popular media items
    const params = new URLSearchParams({
      'sort[0]': 'views:desc',
      'pagination[limit]': limit.toString(),
      'populate[thumbnail]': 'true',
      'populate[speakers]': 'true',
      'populate[tags]': 'true',
      ...(contentType && { 'filters[type][$eq]': contentType }),
    });

    const response = await getJSON<{ data: unknown[] }>(`/api/media-items?${params}`);
    const validItems = (response.data || []).filter(isValidMediaItem);

    // Format as recommendations
    const recommendations: Recommendation[] = validItems.map((item) => ({
      contentType: 'media',
      contentId: item.id,
      title: item.attributes.title,
      description: item.attributes.excerpt || item.attributes.description || '',
      url: `/media/${item.attributes.slug}`,
      thumbnailUrl: item.attributes.thumbnail?.data?.attributes?.url,
      score: 0.8, // Mock score
      reason: 'Popular with the Ruach community',
      metadata: {
        type: item.attributes.type || undefined,
        views: item.attributes.views || undefined,
        speakers: item.attributes.speakers?.data
          ?.map((s) => s.attributes?.name)
          .filter((name): name is string => typeof name === 'string') || [],
        tags: item.attributes.tags?.data
          ?.map((t) => t.attributes?.name)
          .filter((name): name is string => typeof name === 'string') || [],
      },
    }));

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
