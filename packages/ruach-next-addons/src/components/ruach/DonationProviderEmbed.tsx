"use client";
import { getProvider, getProcessorUrl } from "@/lib/donations";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

export default function DonationProviderEmbed() {
  const provider = getProvider();
  const url = getProcessorUrl();

  useEffect(()=>{ track("DonationProviderView", { provider }); }, [provider]);

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
  if (provider === "memberful") {
    return (
      <div className="rounded-xl border border-black/10 p-4">
        <h3 className="font-semibold">Become a Member</h3>
        <a
          href={url}
          onClick={()=>track("GiveClick", { provider })}
          className="mt-3 inline-flex rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-400"
        >
          Join on Memberful
        </a>
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
