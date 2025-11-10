"use client";
import { useState } from "react";
import { Button } from "./../ruach/ui/Button";
import { sanitizeHtml } from "../../lib/sanitize";

export default function LessonTranscript({ html, downloadHref }:{ html?: string; downloadHref?: string }) {
  const [open, setOpen] = useState(true);
  if (!html && !downloadHref) return null;

  const cleanTranscript = html ? sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
  }) : '';

  return (
    <div className="mt-6 rounded-xl border border-black/10 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Transcript</h3>
        <div className="flex gap-2">
          {downloadHref && <Button as="a" href={downloadHref} variant="black" size="sm">Download</Button>}
          <Button onClick={()=>setOpen(o=>!o)} variant="white" size="sm">{open ? "Hide" : "Show"}</Button>
        </div>
      </div>
      {open && cleanTranscript && <div className="prose prose-neutral mt-4" dangerouslySetInnerHTML={{ __html: cleanTranscript }} />}
    </div>
  );
}
