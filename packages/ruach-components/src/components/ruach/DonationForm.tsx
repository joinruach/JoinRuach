"use client";
import { useState, type FormEvent, type ReactElement } from "react";
import RecurringToggle from "./RecurringToggle";
import { Button } from "./../ruach/ui/Button";
import { track } from "../../utils/analytics";

export type DonationFormProps = {
  campaign?: string;
};

const PRESETS = [25, 50, 100, 250];
const MIN_DONATION_AMOUNT = 5;

export default function DonationForm({ campaign }: DonationFormProps): ReactElement {
  const [amount, setAmount] = useState<number | "">("");
  const [monthly, setMonthly] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const numericAmount = typeof amount === "number" ? amount : 0;
    setError(null);

    if (numericAmount < MIN_DONATION_AMOUNT) {
      setError(`Please choose at least $${MIN_DONATION_AMOUNT}.`);
      return;
    }

    track("GiveClick", {
      placement: "donation_form",
      amount: numericAmount,
      monthly: monthly ? "true" : "false"
    });

    setPending(true);

    try {
      const response = await fetch("/api/stripe/create-donation-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          monthly,
          campaign
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : "We couldn't process your gift right now. Please try again.";
        throw new Error(message);
      }

      const redirectUrl = typeof payload?.url === "string" ? payload.url : null;
      if (!redirectUrl) {
        throw new Error("Stripe checkout did not return a redirect URL.");
      }

      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-black/10 p-4">
      <label className="block text-sm font-semibold">Amount</label>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => setAmount(value)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ring-1 transition ${
              amount === value
                ? "ring-black bg-black text-white"
                : "ring-black/10 hover:ring-black/30"
            }`}
          >
            ${value}
          </button>
        ))}
        <input
          type="number"
          placeholder="Custom"
          min={1}
          value={amount === "" ? "" : amount}
          onChange={(event) =>
            setAmount(event.target.value ? Number(event.target.value) : "")
          }
          className="w-28 rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      <RecurringToggle value={monthly} onChange={setMonthly} />
      <Button
        type="submit"
        variant="gold"
        className="w-full mt-2"
        disabled={pending}
      >
        {pending ? "Redirecting…" : "Give through Stripe"}
      </Button>
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : (
        <p className="text-xs text-neutral-500">
          You’ll be redirected to Stripe for secure payment processing.
        </p>
      )}
    </form>
  );
}
