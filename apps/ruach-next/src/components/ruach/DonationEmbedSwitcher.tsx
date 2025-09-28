"use client";
import { useState } from "react";
import Link from "next/link";
import DonationForm from "@ruach/components/components/ruach/DonationForm";
import EmbedScript from "@/components/ruach/embeds/EmbedScript";

interface DonationEmbedSwitcherProps {
  givebutterUrl: string;
  givebutterEmbedHtml?: string;
  memberfulUrl?: string;
}

const TABS = [
  { id: "givebutter", label: "Givebutter" },
  { id: "memberful", label: "Memberful" }
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function DonationEmbedSwitcher({ givebutterUrl, givebutterEmbedHtml, memberfulUrl }: DonationEmbedSwitcherProps){
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
            Memberful partners receive bonus content, live Q&As, and digital resources. Use the link below to manage your membership.
          </p>
          {memberfulUrl ? (
            <Link
              href={memberfulUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              Open Memberful Portal
            </Link>
          ) : (
            <p className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/60">
              Set `NEXT_PUBLIC_MEMBERFUL_URL` to enable the membership portal link.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
