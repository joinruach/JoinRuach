import { NextRequest, NextResponse } from 'next/server';
import { getJSON } from '@/lib/strapi';

/**
 * Content Recommendations API
 * Returns personalized content recommendations
 *
 * GET /api/recommendations?userId=123&limit=10&type=media
 */
export async function GET(request: NextRequest) {
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

    const response = await getJSON<{ data: any[] }>(`/api/media-items?${params}`);
    const items = response.data || [];

    // Format as recommendations
    const recommendations = items.map((item: any) => ({
      contentType: 'media',
      contentId: item.id,
      title: item.attributes?.title || '',
      description: item.attributes?.excerpt || item.attributes?.description || '',
      url: `/media/${item.attributes?.slug}`,
      thumbnailUrl: item.attributes?.thumbnail?.data?.attributes?.url,
      score: 0.8, // Mock score
      reason: 'Popular with the Ruach community',
      metadata: {
        type: item.attributes?.type,
        views: item.attributes?.views,
        speakers: item.attributes?.speakers?.data?.map((s: any) => s.attributes?.name),
        tags: item.attributes?.tags?.data?.map((t: any) => t.attributes?.name),
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

export const revalidate = 3600; // Cache for 1 hour
