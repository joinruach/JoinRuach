'use client';

import { useEffect } from 'react';

export default function OutreachError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Community outreach error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Unable to load outreach content
        </h2>
        <p className="mb-6 text-gray-600">
          We encountered an error while loading the community outreach content. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
