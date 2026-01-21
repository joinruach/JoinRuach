import { NextResponse } from "next/server";
import { classifySnippet, type SnippetType } from "@/lib/ai/snippet-classifier";

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.warn(
    "⚠️  STRAPI_API_TOKEN not set - capture endpoint will not work"
  );
}

interface CaptureInput {
  text: string;
  title?: string;
  type?: SnippetType;
  topics?: string[];
  source?: string;
  mediaIds?: number[];
}

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * POST /api/capture
 *
 * Raw content capture endpoint with AI enrichment
 *
 * Security: Protected by CAPTURE_SECRET header (recommended for production)
 *
 * Flow:
 * 1. Verify capture secret (if configured)
 * 2. Accept raw text
 * 3. Create checksum for deduplication
 * 4. Check if already exists
 * 5. AI classification (Claude)
 * 6. Upsert topics
 * 7. Save to Strapi raw vault
 */
export async function POST(req: Request) {
  try {
    // Optional: Verify capture secret for production security
    // This prevents unauthorized access to your capture endpoint
    if (process.env.CAPTURE_SECRET) {
      const secret = req.headers.get("x-capture-secret");
      if (!secret || secret !== process.env.CAPTURE_SECRET) {
        console.warn("⚠️  Capture endpoint: Unauthorized request");
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const input = (await req.json()) as CaptureInput;

    const body = String(input.text || "").trim();
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Missing text" },
        { status: 400 }
      );
    }

    // Create checksum for deduplication
    const checksum = await sha256(body);

    // Check if snippet already exists
    const existing = await findSnippetByChecksum(checksum);
    if (existing?.data?.length) {
      return NextResponse.json({
        ok: true,
        deduped: true,
        saved: existing.data[0],
        message: "This snippet already exists",
      });
    }

    // AI enrichment - classify and add metadata
    const meta = await classifySnippet({
      body,
      hintTitle: input.title,
      hintType: input.type,
    });

    // Ensure topics exist (upsert)
    const topicIds = await upsertTopics(input.topics ?? meta.topics ?? []);

    // Save to Strapi raw vault
    const payload = {
      data: {
        title: input.title || meta.title || body.slice(0, 80),
        body,
        type: input.type || meta.type || "idea",
        status: "raw",
        source: input.source || "QuickCapture",
        summary: meta.summary || null,
        scripture_refs: meta.scripture_refs || [],
        checksum,
        capturedAt: new Date().toISOString(),
        topics: topicIds,
        ...(input.mediaIds && input.mediaIds.length > 0 ? { media: input.mediaIds } : {}),
      },
    };

    const saved = await strapiPost("/api/ruach-snippets", payload);

    return NextResponse.json({
      ok: true,
      saved: saved.data,
      meta,
      message: "Snippet captured successfully",
    });
  } catch (error) {
    console.error("Error in /api/capture:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ===========================
// Strapi Helper Functions
// ===========================

async function strapiPost(path: string, body: unknown) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Strapi error: ${err}`);
  }

  return res.json();
}

async function strapiGet(path: string) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Strapi error: ${err}`);
  }

  return res.json();
}

async function findSnippetByChecksum(checksum: string) {
  const qs = new URLSearchParams();
  qs.set("filters[checksum][$eq]", checksum);
  qs.set("pagination[pageSize]", "1");

  return strapiGet(`/api/ruach-snippets?${qs.toString()}`);
}

/**
 * Upsert topics - find existing or create new
 * Returns array of topic IDs
 */
async function upsertTopics(topicNames: string[]): Promise<number[]> {
  const unique = Array.from(
    new Set(topicNames.map((t) => t.trim().toLowerCase()).filter(Boolean))
  );

  if (!unique.length) return [];

  const ids: number[] = [];

  for (const name of unique) {
    try {
      // Find by name (case-insensitive)
      const qs = new URLSearchParams();
      qs.set("filters[name][$eq]", name);
      qs.set("pagination[pageSize]", "1");

      const found = await strapiGet(`/api/ruach-topics?${qs.toString()}`);

      if (found?.data?.length) {
        ids.push(found.data[0].id);
        continue;
      }

      // Create topic if not found
      const created = await strapiPost(`/api/ruach-topics`, { data: { name } });
      ids.push(created.data.id);
    } catch (error) {
      console.error(`Failed to upsert topic "${name}":`, error);
      // Continue with other topics
    }
  }

  return ids;
}
