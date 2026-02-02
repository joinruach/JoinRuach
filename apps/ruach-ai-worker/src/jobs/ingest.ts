import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chunk size for embeddings (roughly 500 tokens)
const CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

interface ContentChunk {
  text: string;
  metadata: {
    contentType: string;
    contentId: string;
    locale: string;
    chunkIndex: number;
    title?: string;
    url?: string;
  };
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(
  text: string,
  contentType: string,
  contentId: string,
  locale: string,
  title?: string,
  url?: string
): ContentChunk[] {
  const chunks: ContentChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunkText = text.slice(start, end);

    chunks.push({
      text: chunkText,
      metadata: {
        contentType,
        contentId,
        locale,
        chunkIndex,
        title,
        url,
      },
    });

    start = end - CHUNK_OVERLAP;
    chunkIndex++;

    // Prevent infinite loop on very short text
    if (end === text.length) break;
  }

  return chunks;
}

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(
  chunks: ContentChunk[]
): Promise<Array<ContentChunk & { embedding: number[] }>> {
  const results: Array<ContentChunk & { embedding: number[] }> = [];

  // Process in batches of 100 (OpenAI limit)
  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.text);

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });

    for (let j = 0; j < batch.length; j++) {
      results.push({
        ...batch[j]!,
        embedding: response.data[j]!.embedding,
      });
    }
  }

  return results;
}

/**
 * Fetch content from Strapi
 */
export async function fetchContent(
  contentType: string,
  contentId: string,
  locale: string
): Promise<{ title: string; content: string; url?: string } | null> {
  const strapiUrl = process.env.STRAPI_URL;
  const strapiToken = process.env.STRAPI_API_TOKEN;

  if (!strapiUrl || !strapiToken) {
    console.warn("Strapi not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${strapiUrl}/api/${contentType}s/${contentId}?locale=${locale}`,
      {
        headers: {
          Authorization: `Bearer ${strapiToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch ${contentType}:${contentId}`);
      return null;
    }

    const data = await response.json();
    const attrs = data.data?.attributes || data.data;

    return {
      title: attrs.title || attrs.name || "",
      content: attrs.content || attrs.description || attrs.body || "",
      url: attrs.slug ? `/${locale}/${contentType}/${attrs.slug}` : undefined,
    };
  } catch (error) {
    console.error("Strapi fetch error:", error);
    return null;
  }
}
