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
    blog: 'blogs',
    course: 'courses',
    series: 'series-collection',
  };
  const collection = endpoints[contentType];
  if (!collection) throw new Error(`Unknown content type: ${contentType}`);

  const url = `${STRAPI_URL}/api/${collection}?pagination[pageSize]=${limit}&populate=*`;
  const res = await fetch(url);
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
  return (
    attrs.transcript ||
    attrs.content ||
    attrs.body ||
    attrs.description ||
    attrs.excerpt ||
    ''
  ).toString();
}

async function processType(contentType: string, limit: number) {
  console.log(`\n▶ Processing ${contentType} (limit ${limit})`);
  const items = await fetchCollection(contentType, limit);
  let embedded = 0;

  for (const item of items) {
    const attrs = item.attributes || {};
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
