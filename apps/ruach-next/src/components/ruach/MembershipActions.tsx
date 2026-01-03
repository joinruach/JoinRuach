"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ruach/ui/Button";
import type { MembershipTier } from "@/lib/memberships";

type Action = {
  tier: MembershipTier;
  label: string;
  variant: "gold" | "white";
};

type Props = {
  currentTier?: MembershipTier | null;
  membershipStatus?: string | null;
  hasActiveMembership: boolean;
};

const ACTIONS_BY_TIER: Record<MembershipTier, Action[]> = {
  supporter: [
    { tier: "partner", label: "Upgrade to Partner", variant: "gold" },
    { tier: "builder", label: "Upgrade to Builder", variant: "white" },
  ],
  partner: [
    { tier: "builder", label: "Upgrade to Builder", variant: "gold" },
    { tier: "supporter", label: "Downgrade to Supporter", variant: "white" },
  ],
  builder: [
    { tier: "partner", label: "Downgrade to Partner", variant: "white" },
  ],
};

export default function MembershipActions({
  currentTier,
  membershipStatus,
  hasActiveMembership,
}: Props) {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<MembershipTier | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const actions = currentTier ? ACTIONS_BY_TIER[currentTier] ?? [] : [];
  const isPaused = membershipStatus === "past_due" || membershipStatus === "canceled";
  const isDisabled = !hasActiveMembership || isPaused;

  const handleClick = async (tier: MembershipTier, upgrade: boolean) => {
    if (isDisabled) return;
    setLoadingTier(tier);
    setMessage(null);

    try {
      const res = await fetch("/api/stripe/change-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Unable to update membership");
      }

      setMessage(
        upgrade
          ? "Upgrade in progress—refreshing your membership status."
          : "Downgrade scheduled. We refreshed your membership state."
      );
      router.refresh();
    } catch (error) {
      console.error("[membership] change error", error);
      setMessage(error instanceof Error ? error.message : "Unable to change membership");
    } finally {
      setLoadingTier(null);
    }
  };

  if (!actions.length) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm dark:border-white/5 dark:bg-white/5">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Membership actions</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
          Join a membership to see upgrade or downgrade options.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Upgrade or downgrade</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
        Adjust your tier while Stripe handles proration. Changes take effect immediately on your next billing cycle.
      </p>
      <div className="mt-4 grid gap-3">
        {actions.map((action) => (
          <Button
            key={action.tier}
            variant={action.variant}
            className="w-full"
            onClick={() => handleClick(action.tier, action.variant === "gold")}
            disabled={isDisabled || loadingTier === action.tier}
            aria-busy={loadingTier === action.tier}
          >
            {loadingTier === action.tier ? "Processing…" : action.label}
          </Button>
        ))}
      </div>
      {isDisabled ? (
        <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
          Update your billing info before adjusting tiers.
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-zinc-700 dark:text-white/80">{message}</p>
      ) : null}
    </div>
  );
}
