"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ruach/ui/Button";

export default function VolunteerSignupForm(){
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name")?.toString().trim(),
      email: form.get("email")?.toString().trim(),
      phone: form.get("phone")?.toString().trim() || undefined,
      availability: form.get("availability")?.toString() || undefined,
      message: form.get("message")?.toString().trim() || undefined
    };

    if (!payload.name || !payload.email) {
      setError("Name and email are required.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/outreach/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      let data: { error?: string } | undefined;
      try {
        data = await res.json();
      } catch {
        // JSON parsing failed
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit");
      }
      track("VolunteerSignupSubmit", { availability: payload.availability });
      setStatus("success");
      e.currentTarget.reset();
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vol-name" className="text-xs uppercase tracking-wide text-white/60">
            Name
          </label>
          <input
            id="vol-name"
            name="name"
            required
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
            placeholder="Your name"
            onFocus={()=>track("VolunteerSignupStart")}
          />
        </div>
        <div>
          <label htmlFor="vol-email" className="text-xs uppercase tracking-wide text-white/60">
            Email
          </label>
          <input
            id="vol-email"
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vol-phone" className="text-xs uppercase tracking-wide text-white/60">
            Phone (optional)
          </label>
          <input
            id="vol-phone"
            name="phone"
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label htmlFor="vol-availability" className="text-xs uppercase tracking-wide text-white/60">
            Availability
          </label>
          <select
            id="vol-availability"
            name="availability"
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
          >
            <option value="Weekend">Weekend outreach</option>
            <option value="Weeknight">Weeknight gatherings</option>
            <option value="Remote">Remote support</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="vol-message" className="text-xs uppercase tracking-wide text-white/60">
          Tell us more
        </label>
        <textarea
          id="vol-message"
          name="message"
          rows={4}
          className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
          placeholder="Share your heart for the city, skills, or availability."
        />
      </div>
      {error ? (
        <p className="rounded-full border border-amber-300/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">{error}</p>
      ) : null}
      {status === "success" ? (
        <p className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          Thank you! Our outreach team will follow up soon.
        </p>
      ) : null}
      <Button
        type="submit"
        variant="gold"
        className="rounded-full px-6 py-2 text-sm font-semibold text-black"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Sending…" : "Submit volunteer form"}
      </Button>
    </form>
  );
}
