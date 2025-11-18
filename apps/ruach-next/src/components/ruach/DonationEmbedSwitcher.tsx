"use client";
import { useState } from "react";
import Link from "next-intl/link";
import DonationForm from "@ruach/components/components/ruach/DonationForm";
import EmbedScript from "@/components/ruach/embeds/EmbedScript";
import StripeSubscriptionButtons from "@/components/ruach/StripeSubscriptionButtons";

interface DonationEmbedSwitcherProps {
  givebutterUrl: string;
  givebutterEmbedHtml?: string;
}

const TABS = [
  { id: "givebutter", label: "Givebutter" },
  { id: "partners", label: "Monthly partners" }
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function DonationEmbedSwitcher({ givebutterUrl, givebutterEmbedHtml }: DonationEmbedSwitcherProps){
  const [tab, setTab] = useState<TabId>("givebutter");

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full border border-white/15 bg-white/5 p-1 text-sm">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 font-semibold transition ${
              tab === id ? "bg-amber-400 text-black" : "text-white/70 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "givebutter" ? (
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white p-6 text-neutral-900 shadow-sm">
            <DonationForm processorUrl={givebutterUrl} />
          </div>
          {givebutterEmbedHtml ? (
            <div className="rounded-3xl border border-white/10 bg-white p-6 text-neutral-900 shadow-sm">
              <EmbedScript html={givebutterEmbedHtml} />
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
              Add `NEXT_PUBLIC_GIVEBUTTER_EMBED_HTML` for inline donation checkout.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          <p>
            Become a monthly partner through Stripe to receive discipleship resources, partner-only livestreams, and behind-the-scenes updates. Use the billing portal if
            you&rsquo;re already giving monthly.
          </p>
          <StripeSubscriptionButtons
            checkoutLabel="Become a monthly partner"
            manageLabel="Manage billing"
            manageVariant="white"
            className="space-y-3"
            manageUnauthorizedMessage="Sign in to your Ruach account to manage billing."
          />
          <p className="text-xs text-white/60">
            Need help with your partnership?{" "}
            <Link href="/contact">
              <span className="text-amber-300 hover:text-amber-200">Contact our team</span>
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
