"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ruach/toast/useToast";

interface Props {
  commentId: number | string;
}

export default function CommentModerationActions({ commentId }: Props){
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [isPending, startTransition] = useTransition();

  async function act(action: "approve" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/comments/${commentId}/${action}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }
      toast({
        title: action === "approve" ? "Comment approved" : "Comment rejected",
        variant: "success"
      });
      startTransition(() => router.refresh());
    } catch (err: any) {
      toast({
        title: "Moderation error",
        description: err?.message || "Unable to process request",
        variant: "error"
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => act("approve")}
        disabled={loading !== null || isPending}
        className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading === "approve" ? "Approving…" : "Approve"}
      </button>
      <button
        type="button"
        onClick={() => act("reject")}
        disabled={loading !== null || isPending}
        className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
      >
        {loading === "reject" ? "Rejecting…" : "Reject"}
      </button>
    </div>
  );
}
