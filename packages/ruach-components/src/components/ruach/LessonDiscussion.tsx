"use client";
import { useMemo, useState } from "react";
import { Button } from "./ui/Button";

export type Comment = { id: string|number; author: string; text: string; createdAt: string };

export default function LessonDiscussion({
  comments = [],
  onSubmit,
}: {
  comments?: Comment[];
  onSubmit: (text: string) => Promise<{ approved?: boolean } | void>;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<null | "approved" | "queued">(null);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }),
    []
  );

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setSuccess(null);
    try {
      const res = await onSubmit(text.trim());
      if (res && res.approved) setSuccess("approved");
      else setSuccess("queued");
      setText("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold">Discussion</h3>

      <form onSubmit={post} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share a thought…"
          className="flex-1 rounded-lg border border-black/10 px-3 py-2"
        />
        <Button type="submit" disabled={loading} variant="black">
          {loading ? "Posting…" : "Post"}
        </Button>
      </form>

      {success === "approved" && (
        <p className="mt-3 rounded-lg bg-green-100 p-3 text-sm text-green-800">
          Thanks! Your comment is live.
        </p>
      )}
      {success === "queued" && (
        <p className="mt-3 rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800">
          Thanks! Your comment is awaiting approval.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="rounded-lg border border-black/10 p-3">
            <div className="text-sm text-neutral-500">
              {c.author} •{" "}
              <time dateTime={c.createdAt} suppressHydrationWarning>
                {dateFormatter.format(new Date(c.createdAt))}
              </time>
            </div>
            <p className="mt-1">{c.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
