"use client";

import { useState } from "react";
import { Button } from "@/components/ruach/ui/Button";
import { cn } from "@/lib/cn";

type Orientation = "column" | "row";

type Props = {
  checkoutLabel?: string;
  manageLabel?: string;
  className?: string;
  orientation?: Orientation;
  gapClassName?: string;
  checkoutVariant?: "black" | "white" | "gold";
  manageVariant?: "black" | "white" | "gold";
  size?: "sm" | "md";
  showCheckout?: boolean;
  showManage?: boolean;
  manageUnauthorizedMessage?: string;
  checkoutDisabledMessage?: string;
};

type PendingAction = "checkout" | "portal" | null;

function stackClasses(orientation: Orientation) {
  if (orientation === "row") {
    return "flex flex-wrap gap-3";
  }
  return "flex flex-col gap-3";
}

export default function StripeSubscriptionButtons({
  checkoutLabel = "Become a partner",
  manageLabel = "Manage billing",
  className,
  orientation = "column",
  gapClassName,
  checkoutVariant = "gold",
  manageVariant = "white",
  size = "md",
  showCheckout = true,
  showManage = true,
  manageUnauthorizedMessage = "Sign in to your Ruach account to manage billing.",
}: Props) {
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);

  const callEndpoint = async (endpoint: string, action: Exclude<PendingAction, null>, unauthorizedMessage?: string) => {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          res.status === 401 && unauthorizedMessage
            ? unauthorizedMessage
            : typeof payload?.error === "string"
              ? payload.error
              : "We couldn't process your request right now. Please try again.";
        throw new Error(message);
      }

      const url = typeof payload?.url === "string" ? payload.url : null;
      if (!url) {
        throw new Error("The server response did not include a redirect URL.");
      }

      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error. Please try again.";
      setError(message);
    } finally {
      setPending(null);
    }
  };

  const handleCheckout = () => {
    void callEndpoint("/api/stripe/create-checkout-session", "checkout");
  };

  const handlePortal = () => {
    void callEndpoint("/api/stripe/create-billing-portal-session", "portal", manageUnauthorizedMessage);
  };

  const layoutClass = cn(stackClasses(orientation), gapClassName);

  return (
    <div className={className}>
      <div className={layoutClass}>
        {showCheckout ? (
          <Button
            type="button"
            onClick={handleCheckout}
            variant={checkoutVariant}
            size={size}
            disabled={pending !== null}
            className={orientation === "row" ? undefined : "w-full justify-center"}
          >
            {pending === "checkout" ? "Redirecting…" : checkoutLabel}
          </Button>
        ) : null}

        {showManage ? (
          <Button
            type="button"
            onClick={handlePortal}
            variant={manageVariant}
            size={size}
            disabled={pending !== null}
            className={orientation === "row" ? undefined : "w-full justify-center"}
          >
            {pending === "portal" ? "Loading portal…" : manageLabel}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="mt-3 text-xs font-medium text-rose-200" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
