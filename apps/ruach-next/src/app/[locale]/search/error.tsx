'use client';

import { useEffect } from 'react';
import LocalizedLink from "@/components/navigation/LocalizedLink";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Search error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Search Unavailable</h2>
        <p className="text-sm text-zinc-600 dark:text-white/70">
          We encountered an error while searching. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-500 dark:text-white/50">Error ID: {error.digest}</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
        >
          Try Again
        </button>
        <LocalizedLink href="/">
          <span className="rounded-full border border-zinc-300 dark:border-white/20 px-6 py-2 text-sm font-semibold text-zinc-900 dark:text-white transition hover:border-white hover:bg-white dark:hover:bg-white/10">
            Go Home
          </span>
        </LocalizedLink>
      </div>
    </div>
  );
}
