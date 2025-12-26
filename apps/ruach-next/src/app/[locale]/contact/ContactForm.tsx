// apps/ruach-next/src/app/[locale]/contact/ContactForm.tsx
"use client";

import * as React from "react";
import { useActionState } from "react";
import { submitContactForm } from "./actions";

const initialState = { ok: false as const };

const INTENTS = [
  { value: "invite", label: "Invite Ruach to an Event/Outreach", icon: "🎤" },
  { value: "prayer", label: "Request Prayer", icon: "🙏" },
  { value: "partnership", label: "Partnership Question", icon: "🤝" },
  { value: "testimony", label: "Submit a Testimony/Media", icon: "📖" },
];

export default function ContactForm() {
  const [state, action, pending] = useActionState(submitContactForm, initialState);
  const [selectedIntent, setSelectedIntent] = React.useState<string>("");

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Message Received ✓
        </h2>
        <p className="mt-2 text-zinc-700 dark:text-zinc-300">
          Thank you for reaching out. Our team will respond within a few days.
          Every message is prayed over.
        </p>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          "The Lord is near to all who call on Him..." — Psalm 145:18
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
      {/* Honeypot */}
      <div className="hidden">
        <label>
          Website
          <input name="website" autoComplete="off" tabIndex={-1} />
        </label>
      </div>

      {/* Intent Selector */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-zinc-900 dark:text-white">
          What brings you here?
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {INTENTS.map((intent) => (
            <label
              key={intent.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                selectedIntent === intent.value
                  ? "border-amber-500 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/20"
                  : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="intent"
                value={intent.value}
                checked={selectedIntent === intent.value}
                onChange={(e) => setSelectedIntent(e.target.value)}
                className="h-4 w-4"
              />
              <span className="text-xl">{intent.icon}</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {intent.label}
              </span>
            </label>
          ))}
        </div>
        {fe.intent && <p className="mt-1 text-xs text-red-600">{fe.intent}</p>}
      </div>

      {/* Show form fields only after intent is selected */}
      {selectedIntent && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="text-sm font-medium text-zinc-900 dark:text-white">
                Name
              </label>
              <input
                name="name"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
                placeholder="Your name"
              />
              {fe.name && <p className="mt-1 text-xs text-red-600">{fe.name}</p>}
            </div>

            <div className="sm:col-span-1">
              <label className="text-sm font-medium text-zinc-900 dark:text-white">
                Email
              </label>
              <input
                name="email"
                type="email"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
                placeholder="you@email.com"
              />
              {fe.email && <p className="mt-1 text-xs text-red-600">{fe.email}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-white">
                Phone (optional)
              </label>
              <input
                name="phone"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
                placeholder="(optional)"
              />
            </div>

            {/* Intent-specific fields */}
            {selectedIntent === "invite" && (
              <>
                <div className="sm:col-span-1">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    Church/Organization
                  </label>
                  <input
                    name="churchName"
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
                    placeholder="Church or org name"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    Event Type
                  </label>
                  <input
                    name="eventType"
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
                    placeholder="e.g., Conference, Outreach, Training"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    Proposed Date/Timeframe
                  </label>
                  <input
                    name="eventDate"
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
                    placeholder="e.g., Spring 2025"
                  />
                </div>
              </>
            )}

            {selectedIntent === "partnership" && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-zinc-900 dark:text-white">
                  Partnership Interest
                </label>
                <select
                  name="partnershipType"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="">Select type...</option>
                  <option value="individual">Individual Monthly Partner</option>
                  <option value="church">Church/Organizational Partner</option>
                  <option value="one-time">One-Time Giving Question</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            {selectedIntent === "testimony" && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-zinc-900 dark:text-white">
                  Testimony Type
                </label>
                <select
                  name="testimonyType"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="">Select type...</option>
                  <option value="deliverance">Deliverance/Freedom</option>
                  <option value="healing">Healing</option>
                  <option value="salvation">Salvation</option>
                  <option value="transformation">Life Transformation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-white">
                Message
              </label>
              <textarea
                name="message"
                rows={6}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900"
                placeholder="Share your story, question, or request..."
              />
              {fe.message && (
                <p className="mt-1 text-xs text-red-600">{fe.message}</p>
              )}
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
            {pending ? "Sending..." : "Send Message"}
          </button>

          <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Every message is prayed over by our team.
          </p>
        </>
      )}
    </form>
  );
}
