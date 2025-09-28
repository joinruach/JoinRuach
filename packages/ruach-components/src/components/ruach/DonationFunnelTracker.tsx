"use client";
import { useEffect } from "react";
import { track } from "../../utils/analytics";
export default function DonationFunnelTracker({ stage, extra }:{ stage: "view"|"amount_selected"|"redirect_to_processor"|"completed"; extra?: Record<string,any> }) {
  useEffect(()=>{ track("DonationFunnel", { stage, ...extra }); }, [stage, extra]);
  return null;
}
