'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Partners page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Unable to Load Partnership Info</h2>
        <p className="text-sm text-white/70">
          We encountered an error while loading the partnership information.
        </p>
        {error.digest && (
          <p className="text-xs text-white/50">Error ID: {error.digest}</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
