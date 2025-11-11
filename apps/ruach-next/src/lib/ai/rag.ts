import { generateQueryEmbedding } from '@ruach/ai/embeddings';
import { semanticSearch } from '@/lib/db/ai';
import { getJSON } from '@/lib/strapi';

/**
 * RAG (Retrieval-Augmented Generation) utilities
 * Provides relevant context for AI assistant
 */

interface SearchResult {
  contentType: string;
  contentId: number;
  title: string;
  description?: string;
  url: string;
  speakers?: string[];
  tags?: string[];
  similarity?: number;
}

/**
 * Get relevant context for a user query
 * Uses semantic search to find related content
 */
export async function getRelevantContext(
  userQuery: string,
  options: {
    userId?: number;
    limit?: number;
    useSemanticSearch?: boolean;
  } = {}
): Promise<{
  searchResults: SearchResult[];
  userHistory: Array<{ title: string; contentType: string; watchedAt: Date }>;
}> {
  const { userId, limit = 5, useSemanticSearch = false } = options;

  let searchResults: SearchResult[] = [];

  try {
    if (useSemanticSearch && process.env.OPENAI_API_KEY) {
      // Use semantic search with embeddings
      const queryEmbedding = await generateQueryEmbedding(userQuery, {
        apiKey: process.env.OPENAI_API_KEY,
      });

      const results = await semanticSearch({
        queryEmbedding,
        limit,
        similarityThreshold: 0.7,
      });

      // Enrich with Strapi data
      searchResults = await Promise.all(
        results.map(async (result) => {
          const strapiData = await fetchStrapiContent(
            result.content_type,
            result.content_id
          );
          return {
            contentType: result.content_type,
            contentId: result.content_id,
            title: strapiData?.title || result.metadata.title || 'Untitled',
            description: strapiData?.description || result.metadata.description,
            url: buildContentUrl(result.content_type, strapiData?.slug || result.content_id),
            speakers: result.metadata.speakers || [],
            tags: result.metadata.tags || [],
            similarity: result.similarity,
          };
        })
      );
    } else {
      // Fallback to keyword search
      searchResults = await keywordSearch(userQuery, limit);
    }
  } catch (error) {
    console.error('Error getting relevant context:', error);
    // Return empty results on error
  }

  // Get user history if userId provided
  let userHistory: Array<{ title: string; contentType: string; watchedAt: Date }> = [];
  // TODO: Implement user history fetching
  // if (userId) {
  //   userHistory = await getUserRecentViews(userId, 3);
  // }

  return { searchResults, userHistory };
}

/**
 * Fetch content from Strapi by type and ID
 */
async function fetchStrapiContent(contentType: string, contentId: number) {
  try {
    let endpoint = '';
    switch (contentType) {
      case 'media':
        endpoint = `/api/media-items/${contentId}`;
        break;
      case 'lesson':
        endpoint = `/api/lessons/${contentId}`;
        break;
      case 'blog':
        endpoint = `/api/blogs/${contentId}`;
        break;
      case 'course':
        endpoint = `/api/courses/${contentId}`;
        break;
      case 'series':
        endpoint = `/api/series-collection/${contentId}`;
        break;
      default:
        return null;
    }

    const params = new URLSearchParams({
      'populate[thumbnail]': 'true',
      'populate[speakers]': 'true',
      'populate[tags]': 'true',
    });

    const response = await getJSON<{ data: any }>(`${endpoint}?${params}`);
    return response.data?.attributes || response.data;
  } catch (error) {
    console.error(`Error fetching ${contentType}/${contentId}:`, error);
    return null;
  }
}

/**
 * Fallback keyword search using Strapi
 */
async function keywordSearch(query: string, limit: number): Promise<SearchResult[]> {
  try {
    // Search media items
    const params = new URLSearchParams({
      'filters[$or][0][title][$containsi]': query,
      'filters[$or][1][description][$containsi]': query,
      'pagination[limit]': limit.toString(),
      'populate[thumbnail]': 'true',
      'populate[speakers]': 'true',
      'populate[tags]': 'true',
    });

    const response = await getJSON<{ data: any[] }>(`/api/media-items?${params}`);
    const items = response.data || [];

    return items.map((item: any) => ({
      contentType: 'media',
      contentId: item.id,
      title: item.attributes?.title || 'Untitled',
      description: item.attributes?.description || item.attributes?.excerpt,
      url: `/media/${item.attributes?.slug || item.id}`,
      speakers: item.attributes?.speakers?.data?.map((s: any) => s.attributes?.name),
      tags: item.attributes?.tags?.data?.map((t: any) => t.attributes?.name),
    }));
  } catch (error) {
    console.error('Keyword search error:', error);
    return [];
  }
}

/**
 * Build URL for content
 */
function buildContentUrl(contentType: string, slugOrId: string | number): string {
  const baseMap: Record<string, string> = {
    media: '/media',
    lesson: '/courses/lesson',
    blog: '/blog',
    course: '/courses',
    series: '/series',
  };

  const base = baseMap[contentType] || '/';
  return `${base}/${slugOrId}`;
}
