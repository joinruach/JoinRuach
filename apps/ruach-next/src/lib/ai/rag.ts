import { generateQueryEmbedding } from '@ruach/ai/embeddings';
import { semanticSearchChunks } from '@/lib/db/ai';
import { getJSON } from '@/lib/strapi';

/**
 * RAG (Retrieval-Augmented Generation) utilities
 * Provides relevant context for AI assistant
 */

// Strapi content response types
interface StrapiContentAttributes {
  title?: string;
  slug?: string;
  description?: string;
  excerpt?: string;
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
}

interface StrapiContentItem {
  id: number;
  attributes?: StrapiContentAttributes;
}

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
  contextText: string;
  sources: Array<{ title: string; url: string }>;
  searchResults: SearchResult[];
  userHistory: Array<{ title: string; contentType: string; watchedAt: Date }>;
}> {
  const { userId, limit = 5, useSemanticSearch = false } = options;

  let searchResults: SearchResult[] = [];
  let contextText = '';
  const sources: Array<{ title: string; url: string }> = [];

  try {
    if (useSemanticSearch && process.env.OPENAI_API_KEY) {
      // Use semantic search with embeddings
      const queryEmbedding = await generateQueryEmbedding(userQuery, {
        apiKey: process.env.OPENAI_API_KEY,
      });

      const results = await semanticSearchChunks({
        queryEmbedding,
        limit: limit * 4, // get more chunks then trim
        similarityThreshold: 0.4,
      });

      // Enrich with Strapi data and assemble context
      const topChunks = results.slice(0, limit * 2);
      contextText = topChunks
        .map((chunk, idx) => {
          const meta = (chunk.metadata || {}) as any;
          const title = meta.title || `${chunk.content_type} #${chunk.content_id}`;
          const url = meta.url || buildContentUrl(chunk.content_type, chunk.content_id);
          return `SOURCE ${idx + 1}: ${title}\nURL: ${url}\n${chunk.text}`;
        })
        .join('\n\n---\n\n');

      searchResults = await Promise.all(
        topChunks.map(async (chunk) => {
          const strapiData = await fetchStrapiContent(
            chunk.content_type,
            chunk.content_id
          );
          const meta = chunk.metadata as any;
          const title = strapiData?.title || meta?.title || 'Untitled';
          const url = meta?.url || buildContentUrl(chunk.content_type, strapiData?.slug || chunk.content_id);
          return {
            contentType: chunk.content_type,
            contentId: chunk.content_id,
            title,
            description: meta?.description || chunk.text?.slice(0, 300),
            url,
            speakers: meta?.speakers || [],
            tags: meta?.tags || [],
            similarity: chunk.similarity,
          };
        })
      );

      // unique sources
      const seen = new Set<string>();
      for (const s of searchResults) {
        const key = `${s.contentType}:${s.contentId}`;
        if (!seen.has(key)) {
          seen.add(key);
          sources.push({ title: s.title, url: s.url });
        }
      }
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

  return { contextText, sources, searchResults, userHistory };
}

/**
 * Fetch content from Strapi by type and ID
 */
async function fetchStrapiContent(contentType: string, contentId: number): Promise<StrapiContentAttributes | null> {
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

    const response = await getJSON<{ data: StrapiContentItem }>(`${endpoint}?${params}`);
    return response.data?.attributes || null;
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

    const response = await getJSON<{ data: StrapiContentItem[] }>(`/api/media-items?${params}`);
    const items = response.data || [];

    return items.map((item) => ({
      contentType: 'media',
      contentId: item.id,
      title: item.attributes?.title || 'Untitled',
      description: item.attributes?.description || item.attributes?.excerpt,
      url: `/media/${item.attributes?.slug || item.id}`,
      speakers: item.attributes?.speakers?.data
        ?.map((s) => s.attributes?.name)
        .filter((name): name is string => typeof name === 'string') || [],
      tags: item.attributes?.tags?.data
        ?.map((t) => t.attributes?.name)
        .filter((name): name is string => typeof name === 'string') || [],
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
