"use client";
import { useState } from "react";
import { Button } from "@/components/ruach/ui/Button";
import { track } from "@/lib/analytics";

export default function ContactForm(){
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name")?.toString().trim(),
      email: form.get("email")?.toString().trim(),
      topic: form.get("topic")?.toString() || undefined,
      message: form.get("message")?.toString().trim()
    };

    if (!payload.name || !payload.email || !payload.message) {
      setError("Please complete all required fields.");
      return;
    }

    setStatus("loading");
    setError(null);
    track("ContactFormStart", { topic: payload.topic });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Unable to send message");
      }
      track("ContactFormSubmit", { topic: payload.topic });
      setStatus("success");
      e.currentTarget.reset();
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Something went wrong");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-xs uppercase tracking-wide text-white/60">Name</label>
          <input
            id="contact-name"
            name="name"
            required
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="text-xs uppercase tracking-wide text-white/60">Email</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-topic" className="text-xs uppercase tracking-wide text-white/60">Topic</label>
        <select
          id="contact-topic"
          name="topic"
          className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
        >
          <option value="General">General inquiry</option>
          <option value="Speaking">Invite Ruach to minister</option>
          <option value="Media">Media / Collaboration</option>
          <option value="Prayer">Prayer request</option>
        </select>
      </div>
      <div>
        <label htmlFor="contact-message" className="text-xs uppercase tracking-wide text-white/60">Message</label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
          placeholder="How can we pray, partner, or serve?"
        />
      </div>
      {error ? (
        <p className="rounded-full border border-amber-300/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">{error}</p>
      ) : null}
      {status === "success" ? (
        <p className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          Thank you! Our team will respond shortly.
        </p>
      ) : null}
      <Button
        type="submit"
        variant="gold"
        className="rounded-full px-6 py-2 text-sm font-semibold text-black"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
