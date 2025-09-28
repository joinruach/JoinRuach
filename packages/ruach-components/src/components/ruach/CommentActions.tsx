"use client";
import { useState } from "react";
import { useToast } from "@/components/ruach/toast/useToast";

export default function CommentActions({ commentId }: { commentId: string | number }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function report() {
    setBusy(true);
    const r = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    setBusy(false);
    if (r.ok) toast({ title: "Reported", description: "Thanks for helping keep the discussion healthy.", variant: "success" });
    else toast({ title: "Error", description: "Couldn’t submit report.", variant: "error" });
  }

  return (
    <button
      onClick={report}
      disabled={busy}
      className="mt-2 rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-60"
      title="Flag this comment for review"
    >
      {busy ? "Reporting…" : "Report"}
    </button>
  );
}
