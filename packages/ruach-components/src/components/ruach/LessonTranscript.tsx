"use client";
import { useState } from "react";
import { Button } from "./../ruach/ui/Button";

export default function LessonTranscript({ html, downloadHref }:{ html?: string; downloadHref?: string }) {
  const [open, setOpen] = useState(true);
  if (!html && !downloadHref) return null;
  return (
    <div className="mt-6 rounded-xl border border-black/10 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Transcript</h3>
        <div className="flex gap-2">
          {downloadHref && <Button as="a" href={downloadHref} variant="black" size="sm">Download</Button>}
          <Button onClick={()=>setOpen(o=>!o)} variant="white" size="sm">{open ? "Hide" : "Show"}</Button>
        </div>
      </div>
      {open && html && <div className="prose prose-neutral mt-4" dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
}
