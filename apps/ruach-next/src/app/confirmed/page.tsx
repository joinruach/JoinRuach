"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ConfirmedContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const reason = params.get("reason");

  const showSuccess = status === "success";

  // Get user-friendly error messages based on reason
  const getErrorMessage = (errorReason: string | null) => {
    switch (errorReason) {
      case "legacy_token":
        return {
          title: "Outdated Confirmation Link",
          message: "This confirmation link uses an old format. Please request a new confirmation email below.",
        };
      case "expired_token":
        return {
          title: "Confirmation Link Expired",
          message: "Your confirmation link has expired. For security, confirmation links are only valid for a limited time. Please request a new one below.",
        };
      case "invalid_token":
        return {
          title: "Invalid Confirmation Link",
          message: "This confirmation link is not valid. It may have been used already or is malformed. Please request a new one below.",
        };
      case "missing_token":
        return {
          title: "Missing Confirmation Token",
          message: "No confirmation token was provided. Please check your email link or request a new one below.",
        };
      case "user_not_found":
        return {
          title: "Account Not Found",
          message: "We couldn't find an account associated with this confirmation link. The account may have been deleted.",
        };
      case "server_error":
        return {
          title: "Server Error",
          message: "An unexpected error occurred. Please try again later or contact support if the problem persists.",
        };
      default:
        return {
          title: "Confirmation Failed",
          message: "Unable to confirm your email. Please check your email link or request a new one below.",
        };
    }
  };

  const errorInfo = !showSuccess ? getErrorMessage(reason) : null;

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center max-w-2xl mx-auto">
      {showSuccess && (
        <>
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-600 mb-3">
            Email Confirmed!
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Your email has been verified successfully. You can now sign in and start your journey with Ruach.
          </p>
          <Link
            href="/login?confirmed=true"
            className="inline-block bg-ruach-flame hover:bg-ruach-flame-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Sign In Now
          </Link>
        </>
      )}

      {!showSuccess && errorInfo && (
        <>
          <div className="text-6xl mb-4">✗</div>
          <h1 className="text-3xl font-bold text-red-600 mb-3">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            {errorInfo.message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Link
              href="/check-email"
              className="inline-block bg-ruach-flame hover:bg-ruach-flame-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Request New Confirmation Email
            </Link>
            <Link
              href="/login"
              className="inline-block border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Back to Login
            </Link>
          </div>

          {reason === "legacy_token" && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Our confirmation system was recently upgraded for better security.
                Old confirmation links no longer work. Requesting a new email will send you an updated link.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ruach-flame mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Confirming your email…</p>
        </div>
      </div>
    }>
      <ConfirmedContent />
    </Suspense>
  );
}
