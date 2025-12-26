// apps/ruach-next/src/app/[locale]/prayer/PrayerRequestForm.tsx
"use client";

import * as React from "react";
import { useActionState } from "react";
import { submitPrayerRequest } from "./actions";

const initialState = { ok: false as const };

export default function PrayerRequestForm() {
  const [state, action, pending] = useActionState(submitPrayerRequest, initialState);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-xl font-semibold">Received ❤️</h2>
        <p className="mt-2 text-zinc-700 dark:text-zinc-300">
          Thank you for trusting us with this. Our team will pray. If you requested follow-up,
          we'll reach out soon.
        </p>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          "The Lord is near to the brokenhearted…" — Psalm 34:18
        </p>
      </div>
    );
  }

  const fe = (state as any).fieldErrors ?? {};

  return (
    <form
      action={action}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      {/* Honeypot (hidden) */}
      <div className="hidden">
        <label>
          Website
          <input name="website" autoComplete="off" tabIndex={-1} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="text-sm font-medium">Name</label>
          <input
            name="name"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
            placeholder="Your name"
          />
          {fe.name && <p className="mt-1 text-xs text-red-600">{fe.name}</p>}
        </div>

        <div className="sm:col-span-1">
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
            placeholder="you@email.com"
          />
          {fe.email && <p className="mt-1 text-xs text-red-600">{fe.email}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Phone (optional)</label>
          <input
            name="phone"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
            placeholder="(optional)"
          />
          {fe.phone && <p className="mt-1 text-xs text-red-600">{fe.phone}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Prayer request</label>
          <textarea
            name="request"
            rows={7}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
            placeholder="Share what you'd like us to pray for…"
          />
          {fe.request && <p className="mt-1 text-xs text-red-600">{fe.request}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 text-sm">
            <input
              name="followUpConsent"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border border-zinc-300 dark:border-zinc-700"
            />
            <span className="text-zinc-700 dark:text-zinc-300">
              I consent to follow-up by email (and phone if provided).
            </span>
          </label>
        </div>
      </div>

      {(state as any).message && (
        <p className="mt-4 text-sm text-red-600">{(state as any).message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
