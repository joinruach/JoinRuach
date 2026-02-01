"use client";
import { useState } from "react";
import { Button } from "@/components/ruach/ui/Button";
import { cn } from "@/lib/cn";
import { sanitizeForReact } from "@/utils/sanitize";

type Props = {
  html?: string;
  downloadHref?: string;
};

export default function LessonTranscript({ html, downloadHref }: Props){
  const [open,setOpen]=useState(true);
  if(!html && !downloadHref) return null;
  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-white">Transcript</h3>
        <div className="flex items-center gap-3">
          {downloadHref && (
            <Button as="a" href={downloadHref} variant="white" size="sm" className="rounded-full px-4 py-2 text-xs uppercase tracking-wide">
              Download
            </Button>
          )}
          <Button
            onClick={()=>setOpen(o=>!o)}
            variant="gold"
            size="sm"
            className="rounded-full px-4 py-2 text-xs uppercase tracking-wide"
          >
            {open?"Hide":"Show"}
          </Button>
        </div>
      </div>
      {open && html ? (
        <div className={cn("prose prose-neutral mt-6 max-w-none text-white", "prose-headings:text-white prose-p:text-white/80 prose-strong:text-white", "prose-a:text-amber-300 hover:prose-a:text-amber-200")}
          dangerouslySetInnerHTML={sanitizeForReact(html)}
        />
      ) : null}
    </div>
  );
}
