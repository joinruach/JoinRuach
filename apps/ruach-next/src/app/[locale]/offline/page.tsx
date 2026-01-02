"use client";

import LocalizedLink from "@/components/navigation/LocalizedLink";

// Offline page must be dynamic (uses browser APIs)
export const dynamic = "force-dynamic";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-6 px-4 text-center">
      {/* Icon */}
      <div className="text-8xl">📡</div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">You&apos;re Offline</h1>
        <p className="text-lg text-zinc-600 dark:text-white/70">
          It looks like you&apos;ve lost your internet connection.
        </p>
      </div>

      {/* Message */}
      <div className="max-w-md space-y-4">
        <p className="text-sm text-zinc-500 dark:text-white/60">
          Don&apos;t worry! Some content may still be available from your previous visits.
          Once you&apos;re back online, you&apos;ll have full access to all features.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-black transition hover:bg-amber-500"
        >
          Try Again
        </button>
        <LocalizedLink
          href="/"
        >
          <span className="rounded-full border border-zinc-300 dark:border-white/20 px-6 py-3 font-semibold text-zinc-900 dark:text-white transition hover:border-white hover:bg-white dark:hover:bg-white/10">
            Go to Homepage
          </span>
        </LocalizedLink>
      </div>

      {/* Cached Content Info */}
      <div className="mt-8 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 max-w-md">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-white">Offline Features</h2>
        <ul className="space-y-2 text-left text-sm text-zinc-600 dark:text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-amber-400">✓</span>
            <span>Previously viewed pages are cached</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400">✓</span>
            <span>Media thumbnails are available</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400">✓</span>
            <span>Course progress is saved locally</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-zinc-400 dark:text-white/40">✗</span>
            <span className="text-zinc-400 dark:text-white/40">New content requires internet</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-zinc-400 dark:text-white/40">✗</span>
            <span className="text-zinc-400 dark:text-white/40">Video streaming not available</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
