"use client";
import { useEffect, useMemo } from "react";
import { track } from "../../utils/analytics";
export default function DonationFunnelTracker({ stage, extra }:{ stage: "view"|"amount_selected"|"redirect_to_processor"|"completed"; extra?: Record<string,any> }) {
  const stableExtra = useMemo(() => (extra ? { ...extra } : undefined), [extra ? JSON.stringify(extra) : undefined]);
  useEffect(()=>{
    track("DonationFunnel", stableExtra ? { stage, ...stableExtra } : { stage });
  }, [stage, stableExtra]);
  return null;
}
