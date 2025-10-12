"use client";
import { getProvider, getProcessorUrl, getStripeCheckoutPath, getStripePortalPath } from "@ruach/addons/lib/donations";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

export default function DonationProviderEmbed() {
  const provider = getProvider();
  const url = getProcessorUrl();
  const checkoutPath = getStripeCheckoutPath();
  const portalPath = getStripePortalPath();
  const [pending, setPending] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{ track("DonationProviderView", { provider }); }, [provider]);

  const callStripeEndpoint = async (path: string, action: "checkout" | "portal") => {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          res.status === 401
            ? "Sign in to your Ruach account to manage billing."
            : typeof payload?.error === "string"
              ? payload.error
              : "We couldn’t process your request. Please try again.";
        throw new Error(message);
      }

      const redirectUrl = typeof payload?.url === "string" ? payload.url : null;
      if (!redirectUrl) {
        throw new Error("Stripe did not return a redirect URL.");
      }

      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error. Please try again.");
    } finally {
      setPending(null);
    }
  };

  if (provider === "givebutter") {
    return (
      <div className="rounded-xl border border-black/10 p-4">
        <h3 className="font-semibold">Give securely via Givebutter</h3>
        <iframe
          src={url}
          className="mt-3 h-[720px] w-full rounded-lg"
          allow="payment *; clipboard-write *"
        />
      </div>
    );
  }
  if (provider === "stripe") {
    return (
      <div className="rounded-xl border border-black/10 p-4">
        <h3 className="font-semibold">Become a Monthly Partner</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Launch or manage your recurring partnership through Stripe for instant access to Ruach partner benefits.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              track("GiveClick", { provider, action: "checkout" });
              void callStripeEndpoint(checkoutPath, "checkout");
            }}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black transition hover:bg-amber-400 disabled:opacity-70"
            disabled={pending !== null}
          >
            {pending === "checkout" ? "Redirecting…" : "Start monthly giving"}
          </button>
          <button
            type="button"
            onClick={() => {
              track("GiveClick", { provider, action: "portal" });
              void callStripeEndpoint(portalPath, "portal");
            }}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-black/10 px-4 py-2 font-semibold text-black transition hover:bg-black/5 disabled:opacity-70"
            disabled={pending !== null}
          >
            {pending === "portal" ? "Opening portal…" : "Manage billing"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-black/10 p-4">
      <h3 className="font-semibold">Partner on Patreon</h3>
      <a
        href={url}
        onClick={()=>track("GiveClick", { provider })}
        className="mt-3 inline-flex rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-400"
      >
        Become a Patron
      </a>
    </div>
  );
}
