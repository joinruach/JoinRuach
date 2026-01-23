/**
 * Simple text chunker for RAG V1.
 * Splits by paragraphs, builds ~maxChars chunks with overlap.
 */

export type Chunk = {
  index: number;
  text: string;
};

function normalizeWhitespace(input: string) {
  return input.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

export function chunkText(
  input: string,
  opts: { maxChars?: number; overlapChars?: number } = {}
): Chunk[] {
  const maxChars = opts.maxChars ?? 3500;
  const overlapChars = opts.overlapChars ?? 600;

  const text = normalizeWhitespace(input);
  if (!text) return [];

  const paragraphs = text
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  if (!paragraphs.length) return [];

  const chunks: Chunk[] = [];
  let buffer = '';

  const pushChunk = (t: string) => {
    const cleaned = t.trim();
    if (cleaned) {
      chunks.push({ index: chunks.length, text: cleaned });
    }
  };

  for (const p of paragraphs) {
    const candidate = buffer ? `${buffer}\n\n${p}` : p;
    if (candidate.length <= maxChars) {
      buffer = candidate;
      continue;
    }

    // flush current buffer
    pushChunk(buffer);

    // start new buffer with overlap tail
    const overlap = buffer.slice(Math.max(0, buffer.length - overlapChars));
    buffer = overlap ? `${overlap}\n\n${p}` : p;

    // hard-split if still too long
    while (buffer.length > maxChars) {
      pushChunk(buffer.slice(0, maxChars));
      buffer = buffer.slice(Math.max(0, maxChars - overlapChars));
    }
  }

  // final flush
  pushChunk(buffer);

  return chunks;
}
