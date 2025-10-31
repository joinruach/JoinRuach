"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmedContent() {
  const params = useSearchParams();
  const status = params.get("status");

  const showSuccess = status === "success";

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {showSuccess && (
        <>
          <h1 className="text-2xl font-semibold text-green-600">✅ Confirmation Successful</h1>
          <p className="text-gray-600 mt-2">
            Your email has been verified. You can now sign in and start your journey.
          </p>
        </>
      )}

      {!showSuccess && (
        <>
          <h1 className="text-2xl font-semibold text-red-600">✗ Confirmation Failed</h1>
          <p className="text-gray-600 mt-2">
            No confirmation status provided. Please check your email link or request a new one.
          </p>
        </>
      )}
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-lg">Loading confirmation…</div>}>
      <ConfirmedContent />
    </Suspense>
  );
}
