/**
 * Prose Component
 *
 * Lightweight markdown-ish renderer with support for structured tokens like:
 *   {{scripture osis="Acts.17.11" translation="ESV"}}
 *
 * Intentionally minimal: handles common Guidebook formatting without pulling in a full markdown engine.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { ScriptureQuote } from "@/components/ScriptureQuote";
import { sanitizeForReact } from "@/utils/sanitize";

interface ProseProps {
  content: string;
  className?: string;
}

type ScriptureCitation = {
  osis: string;
  translation: string | null;
  blockquote: boolean;
};

type ResolvedScripture = {
  osis: string;
  translationRequested: string | null;
  translationServed: string | null;
  reference: string | null;
  text: string | null;
  copyright: string | null;
  sourceId: number | null;
  notice?: string;
  error?: string;
};

function parseScriptureTokenBlock(block: string): ScriptureCitation | null {
  const trimmed = block.trim();
  const match = trimmed.match(/^(>\s*)?\{\{\s*scripture\b([^}]*)\}\}\s*$/);
  if (!match) return null;

  const attrs = match[2] ?? "";
  const pairs = Array.from(attrs.matchAll(/(\w+)\s*=\s*"([^"]*)"/g)).map((m) => [m[1], m[2]] as const);

  const osis = pairs.find(([k]) => k === "osis")?.[1]?.trim();
  if (!osis) return null;

  const translation = pairs.find(([k]) => k === "translation")?.[1]?.trim() || null;

  return {
    osis,
    translation,
    blockquote: Boolean(match[1]),
  };
}

function markdownBlockToHtml(block: string): string {
  const html = block
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Blockquotes
    .replace(/^> \*(.+?)\*$/gm, "<blockquote><em>$1</em></blockquote>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr />")
    // Lists (basic support)
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Wrap list items in ul
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .trim();

  if (!html) return "";

  const isBlock =
    html.startsWith("<h") ||
    html.startsWith("<blockquote") ||
    html.startsWith("<hr") ||
    html.startsWith("<ul");

  return isBlock ? html : `<p>${html}</p>`;
}

function citationKey(c: Pick<ScriptureCitation, "osis" | "translation">) {
  return `${c.osis}::${c.translation ?? ""}`;
}

export function Prose({ content, className = "" }: ProseProps) {
  const blocks = useMemo(() => content.split(/\n\n+/), [content]);

  const citations = useMemo(() => {
    const seen = new Set<string>();
    const out: ScriptureCitation[] = [];
    for (const block of blocks) {
      const cite = parseScriptureTokenBlock(block);
      if (!cite) continue;
      const key = citationKey(cite);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(cite);
    }
    return out;
  }, [blocks]);

  const [resolved, setResolved] = useState<Record<string, ResolvedScripture>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      if (citations.length === 0) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/canon/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            citations: citations.map((c) => ({ osis: c.osis, translation: c.translation })),
          }),
          signal: controller.signal,
        });

        if (!res.ok) return;

        const data = (await res.json()) as { results?: ResolvedScripture[] };
        const next: Record<string, ResolvedScripture> = {};
        for (const item of data.results ?? []) {
          const key = `${item.osis}::${item.translationRequested ?? ""}`;
          next[key] = item;
        }

        if (!cancelled) setResolved(next);
      } catch (error) {
        if ((error as any)?.name !== "AbortError") {
          console.error("Failed to resolve scriptures:", error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [citations]);

  return (
    <div
      className={`prose-neutral dark:prose-invert max-w-none ${className}`}
    >
      {blocks.map((block, index) => {
        const cite = parseScriptureTokenBlock(block);
        if (cite) {
          const key = citationKey(cite);
          const data = resolved[key];
          const quote = (
            <ScriptureQuote
              key={`scripture-${key}-${index}`}
              osis={cite.osis}
              translationRequested={cite.translation}
              resolved={data}
              loading={loading && !data}
            />
          );

          return cite.blockquote ? (
            <blockquote key={`bq-${key}-${index}`}>{quote}</blockquote>
          ) : (
            <div key={`div-${key}-${index}`}>{quote}</div>
          );
        }

        const html = markdownBlockToHtml(block);
        if (!html) return null;

        return <div key={`md-${index}`} dangerouslySetInnerHTML={sanitizeForReact(html)} />;
      })}
    </div>
  );
}
