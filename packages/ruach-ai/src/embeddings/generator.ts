import OpenAI from 'openai';

export type ContentType = 'media' | 'lesson' | 'blog' | 'course' | 'series' | 'event';

export interface ContentItem {
  id: number;
  title: string;
  description?: string;
  excerpt?: string;
  summary?: string;
  transcript?: string;
  tags?: Array<{ name: string }>;
  speakers?: Array<{ name: string }>;
}

export interface EmbeddingResult {
  contentType: ContentType;
  contentId: number;
  embedding: number[];
  textContent: string;
  metadata: Record<string, any>;
}

/**
 * Prepares text content for embedding generation
 * Combines title, description, transcript excerpt, and metadata
 */
export function prepareTextForEmbedding(item: ContentItem): string {
  const parts: string[] = [];

  // Title (most important)
  if (item.title) {
    parts.push(item.title);
  }

  // Description/excerpt/summary
  const description = item.description || item.excerpt || item.summary;
  if (description) {
    parts.push(description);
  }

  // Transcript excerpt (first 2000 characters)
  if (item.transcript) {
    const cleanTranscript = item.transcript
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    parts.push(cleanTranscript.substring(0, 2000));
  }

  // Tags
  if (item.tags && item.tags.length > 0) {
    parts.push(item.tags.map(t => t.name).join(', '));
  }

  // Speakers
  if (item.speakers && item.speakers.length > 0) {
    parts.push(`Speaker: ${item.speakers.map(s => s.name).join(', ')}`);
  }

  return parts.join(' | ');
}

/**
 * Extracts metadata from content item for storage
 */
export function extractMetadata(item: ContentItem): Record<string, any> {
  return {
    title: item.title,
    description: item.description || item.excerpt || item.summary,
    tags: item.tags?.map(t => t.name) || [],
    speakers: item.speakers?.map(s => s.name) || [],
    hasTranscript: !!item.transcript,
  };
}

/**
 * Generates embeddings for a batch of content items
 */
export async function generateEmbeddings(
  items: ContentItem[],
  contentType: ContentType,
  options: {
    apiKey: string;
    model?: string;
    batchSize?: number;
  }
): Promise<EmbeddingResult[]> {
  const openai = new OpenAI({ apiKey: options.apiKey });
  const model = options.model || 'text-embedding-3-small';
  const batchSize = options.batchSize || 100;

  const results: EmbeddingResult[] = [];

  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const texts = batch.map(item => prepareTextForEmbedding(item));

    // Generate embeddings
    const response = await openai.embeddings.create({
      model,
      input: texts,
      encoding_format: 'float',
    });

    // Combine results
    batch.forEach((item, index) => {
      results.push({
        contentType,
        contentId: item.id,
        embedding: response.data[index].embedding,
        textContent: texts[index],
        metadata: extractMetadata(item),
      });
    });

    // Rate limiting: small delay between batches
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Generates embedding for a single query string
 */
export async function generateQueryEmbedding(
  query: string,
  options: {
    apiKey: string;
    model?: string;
  }
): Promise<number[]> {
  const openai = new OpenAI({ apiKey: options.apiKey });
  const model = options.model || 'text-embedding-3-small';

  const response = await openai.embeddings.create({
    model,
    input: query,
    encoding_format: 'float',
  });

  return response.data[0].embedding;
}
