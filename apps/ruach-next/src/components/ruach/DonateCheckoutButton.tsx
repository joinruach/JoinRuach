"use client";

import { useLocale } from "next-intl";
import { useState } from "react";

export default function DonateCheckoutButton({
  className = "",
  label = "Give securely",
}: {
  className?: string;
  label?: string;
}) {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/donation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, source: "give_page" }),
      });

      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Unable to start checkout.");
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={startCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? "Loading..." : label}
    </button>
  );
}

