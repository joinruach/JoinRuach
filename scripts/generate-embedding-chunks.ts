#!/usr/bin/env tsx
/**
 * Generate chunk-level embeddings from Strapi content.
 * Uses OpenAI text-embedding-3-small by default.
 *
 * Usage:
 *   pnpm tsx scripts/generate-embedding-chunks.ts [--content-type=media] [--limit=100]
 */

import 'dotenv/config';
import { chunkText } from '../apps/ruach-next/src/lib/ai/chunking';
import { upsertChunkEmbedding } from '../apps/ruach-next/src/lib/db/ai';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN;
const STRAPI_STATUS = process.env.STRAPI_STATUS || 'published';
const STRAPI_BLOG_ENDPOINT = process.env.STRAPI_BLOG_ENDPOINT || 'blog-posts';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const args = process.argv.slice(2);
const options = {
  contentType: args.find((a) => a.startsWith('--content-type='))?.split('=')[1],
  limit: parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '500', 10),
  batchSize: parseInt(args.find((a) => a.startsWith('--batch-size='))?.split('=')[1] || '5', 10),
};

type StrapiItem = {
  id: number;
  attributes?: Record<string, any>;
};

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required');
  process.exit(1);
}

function buildSourceUrl(contentType: string, slugOrId: string | number) {
  const slug = slugOrId ?? '';
  const map: Record<string, string> = {
    media: '/media',
    lesson: '/courses/lesson',
    blog: '/blog',
    course: '/courses',
    series: '/series',
  };
  const base = map[contentType] || '/';
  return `${base}/${slug}`;
}

async function fetchCollection(contentType: string, limit: number): Promise<StrapiItem[]> {
  const endpoints: Record<string, string> = {
    media: 'media-items',
    lesson: 'lessons',
    blog: STRAPI_BLOG_ENDPOINT,
    course: 'courses',
    series: 'series-collection',
  };
  const collection = endpoints[contentType];
  if (!collection) throw new Error(`Unknown content type: ${contentType}`);

  const url = new URL(`${STRAPI_URL}/api/${collection}`);
  url.searchParams.set('pagination[pageSize]', limit.toString());
  url.searchParams.set('populate', '*');
  url.searchParams.set('status', STRAPI_STATUS);

  const res = await fetch(url.toString(), {
    headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : undefined,
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json?.data ?? [];
}

async function embed(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI embeddings failed: ${res.status} ${body}`);
  }
  const json = await res.json();
  return json.data.map((d: any) => d.embedding as number[]);
}

function bestText(attrs: Record<string, any>): string {
  const primary =
    attrs.transcript ||
    attrs.content ||
    attrs.body ||
    attrs.description ||
    attrs.excerpt ||
    attrs.summary ||
    attrs.seo?.description;

  if (primary && primary.toString().length > 0) {
    return primary.toString();
  }

  // Fallback: shallow scan for the longest string value (depth-limited)
  let longest = '';
  const stack: Array<any> = [attrs];
  let depth = 0;
  while (stack.length && depth < 200) {
    const node = stack.pop();
    if (typeof node === 'string' && node.length > longest.length) {
      longest = node;
    } else if (Array.isArray(node)) {
      stack.push(...node);
    } else if (node && typeof node === 'object') {
      stack.push(...Object.values(node));
    }
    depth++;
  }

  return longest || '';
}

async function processType(contentType: string, limit: number) {
  console.log(`\n▶ Processing ${contentType} (limit ${limit})`);
  const items = await fetchCollection(contentType, limit);
  let embedded = 0;

  if (!items.length) {
    console.warn(`⚠️  No items returned for ${contentType}. Check status=${STRAPI_STATUS}, token permissions, and endpoint.`);
  }

  for (const item of items) {
    const attrs = (item as any)?.attributes ? (item as any).attributes : (item as any);
    const sourceText = bestText(attrs);
    if (!sourceText || sourceText.length < 80) continue;

    const chunks = chunkText(sourceText, { maxChars: 3500, overlapChars: 600 });
    if (!chunks.length) continue;

    // Embed in small batches to reduce latency
    for (let i = 0; i < chunks.length; i += options.batchSize) {
      const batch = chunks.slice(i, i + options.batchSize);
      const embeddings = await embed(batch.map((c) => c.text));
      for (let j = 0; j < batch.length; j++) {
        const c = batch[j];
        const embedding = embeddings[j];
        await upsertChunkEmbedding({
          contentType,
          contentId: item.id,
          chunkIndex: c.index,
          text: c.text,
          embedding,
          metadata: {
            title: attrs.title || `${contentType} #${item.id}`,
            url: buildSourceUrl(contentType, attrs.slug || item.id),
            contentType,
            contentId: item.id,
            chunkIndex: c.index,
          },
        });
        embedded += 1;
        if (embedded % 50 === 0) {
          console.log(`   embedded chunks: ${embedded}`);
        }
      }
    }
  }

  if (embedded === 0 && items.length > 0) {
    console.warn(`⚠️  Embedded 0 chunks for ${contentType}. Sample record:`);
    console.warn(JSON.stringify(items[0], null, 2));
  }

  console.log(`✅ Done ${contentType}. Chunks embedded: ${embedded}`);
}

async function main() {
  const contentTypes = options.contentType
    ? [options.contentType]
    : ['media', 'lesson', 'blog', 'course', 'series'];

  for (const ct of contentTypes) {
    await processType(ct, options.limit);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
