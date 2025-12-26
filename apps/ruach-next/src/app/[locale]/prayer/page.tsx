// apps/ruach-next/src/app/[locale]/prayer/page.tsx
import type { Metadata } from "next";
import PrayerRequestForm from "./PrayerRequestForm";

export const metadata: Metadata = {
  title: "Submit a Prayer Request — Ruach Ministries",
  description:
    "Share a prayer request with Ruach Ministries. Our team will pray and follow up if you request it.",
};

export default function PrayerPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8 space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Submit a Prayer Request</h1>
        <p className="text-base text-zinc-700 dark:text-zinc-300">
          You're not alone. Share what's going on and we'll pray. If you want follow-up,
          check the consent box.
        </p>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            Confidentiality note
          </p>
          <p className="mt-1">
            Please don't include highly sensitive personal information. If you're in immediate
            danger, call local emergency services.
          </p>
        </div>
      </header>

      <PrayerRequestForm />

      <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Ways to go deeper</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <a
            className="rounded-xl border border-zinc-200 px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            href="/give"
          >
            Partner with Ruach →
            <div className="mt-1 text-zinc-600 dark:text-zinc-400">
              Fuel the work and help more people.
            </div>
          </a>
          <a
            className="rounded-xl border border-zinc-200 px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            href="/media"
          >
            Watch testimonies →
            <div className="mt-1 text-zinc-600 dark:text-zinc-400">
              Strengthen your faith with real stories.
            </div>
          </a>
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Privacy details: <a className="underline" href="/privacy">Privacy Policy</a>
        </p>
      </section>
    </main>
  );
}
