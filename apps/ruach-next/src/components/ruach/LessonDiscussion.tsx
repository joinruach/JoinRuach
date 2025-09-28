"use client";
import { useState } from "react";
import { Button } from "@/components/ruach/ui/Button";
import CommentActions from "@/components/ruach/CommentActions";

export type Comment={ id:string|number; author:string; text:string; createdAt:string };

type Props = {
  comments?: Comment[];
  onSubmit: (text: string) => Promise<{ approved?: boolean } | void>;
};

export default function LessonDiscussion({ comments = [], onSubmit }: Props){
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState<null|"approved"|"queued">(null);

  async function post(e:React.FormEvent){
    e.preventDefault();
    if(!text.trim()) return;
    setLoading(true);
    setSuccess(null);
    try{
      const res=await onSubmit(text.trim());
      if(res && res.approved) setSuccess("approved");
      else setSuccess("queued");
      setText("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
      <h3 className="text-lg font-semibold text-white">Discussion</h3>
      <p className="mt-1 text-sm text-white/70">Share what the Holy Spirit highlighted and encourage others on the journey.</p>
      <form onSubmit={post} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={text}
          onChange={e=>setText(e.target.value)}
          placeholder="Share a thought…"
          className="flex-1 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
        />
        <Button type="submit" disabled={loading} variant="gold">
          {loading?"Posting…":"Post"}
        </Button>
      </form>
      {success==="approved"&&(
        <p className="mt-3 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          Thanks! Your comment is live.
        </p>
      )}
      {success==="queued"&&(
        <p className="mt-3 rounded-full border border-amber-300/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
          Thanks! Your comment is awaiting approval.
        </p>
      )}
      <ul className="mt-8 space-y-4">
        {comments.map((c)=>(
          <li key={c.id} className="rounded-2xl border border-white/10 bg-white p-4 text-neutral-900">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {c.author} • {new Date(c.createdAt).toLocaleString()}
            </div>
            <p className="mt-2 leading-relaxed text-neutral-800">{c.text}</p>
            <div className="mt-3">
              <CommentActions commentId={c.id} />
            </div>
          </li>
        ))}
        {!comments.length && (
          <li className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            No comments yet. Be the first to encourage the community.
          </li>
        )}
      </ul>
    </div>
  );
}
