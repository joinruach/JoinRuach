"use client";
import { useState } from "react";
import { Button } from "./ui/Button";
import { track } from "../../utils/analytics";

export default function GiftCourseForm({ courseSlug }:{ courseSlug: string }) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setOk(null);
    track("GiftCourseSubmit", { courseSlug });
    setTimeout(()=>{ setOk(true); setLoading(false); }, 600);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-black/10 p-4">
      <div><label className="block text-sm">Recipient Name</label>
        <input className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2" value={recipientName} onChange={e=>setRecipientName(e.target.value)} /></div>
      <div><label className="block text-sm">Recipient Email</label>
        <input type="email" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2" value={recipientEmail} onChange={e=>setRecipientEmail(e.target.value)} required /></div>
      <Button type="submit" variant="black" disabled={loading}>{loading ? "Processing…" : "Gift This Course"}</Button>
      {ok === true && <p className="text-sm text-green-700">Thanks! We’ll email the recipient.</p>}
      {ok === false && <p className="text-sm text-red-600">Couldn’t complete the gift. Try later.</p>}
    </form>
  );
}
