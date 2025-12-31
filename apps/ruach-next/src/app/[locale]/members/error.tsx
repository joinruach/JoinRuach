'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MembersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[Members Error Boundary] Caught error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  const handleRetry = () => {
    reset();
  };

  const handleRelogin = () => {
    router.push('/logout');
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Unable to load member area
        </h2>
        <p className="text-zinc-600 dark:text-white/70">
          We encountered an error while loading your member area. This could be due to:
        </p>
        <ul className="text-sm text-zinc-600 dark:text-white/70 text-left space-y-1">
          <li>• Your session may have expired</li>
          <li>• The server may be temporarily unavailable</li>
          <li>• There may be a connectivity issue</li>
        </ul>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left text-xs text-zinc-500 dark:text-white/60 border border-zinc-200 dark:border-white/10 rounded p-3">
            <summary className="cursor-pointer font-semibold">Error Details (dev only)</summary>
            <pre className="mt-2 overflow-auto">{error.message}</pre>
          </details>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRetry}
            className="rounded-md bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 transition"
          >
            Retry
          </button>
          <button
            onClick={handleRelogin}
            className="rounded-md border border-zinc-300 dark:border-white/20 px-4 py-2 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition"
          >
            Sign out and log back in
          </button>
          <a
            href="/contact"
            className="text-sm text-amber-500 hover:text-amber-600 transition"
          >
            Contact support if this persists →
          </a>
        </div>
      </div>
    </div>
  );
}
