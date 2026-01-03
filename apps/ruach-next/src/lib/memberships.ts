export const TIER_SEQUENCE = ["supporter", "partner", "builder"] as const;
export type MembershipTier = (typeof TIER_SEQUENCE)[number];

export const TIER_LABELS: Record<MembershipTier, string> = {
  supporter: "Supporter",
  partner: "Partner",
  builder: "Builder",
};

export const TIER_SUMMARIES: Record<MembershipTier, string> = {
  supporter:
    "Supporters receive devotionals, community updates, and encouragement to keep their faith burning.",
  partner:
    "Partners unlock the full course catalog, member livestreams, and discipleship resources.",
  builder:
    "Builders gain inner-circle access, leadership study, and curated coaching from the Ruach team.",
};

export const ACCESS_FEATURES: ReadonlyArray<{ label: string; tiers: readonly MembershipTier[] }> = [
  {
    label: "Public devotionals, testimonies, and community updates",
    tiers: TIER_SEQUENCE,
  },
  {
    label: "All courses, downloads, and member livestream teachings",
    tiers: ["partner", "builder"] as const,
  },
  {
    label: "Builder-only strategy sessions and leadership resources",
    tiers: ["builder"] as const,
  },
];

export function detectTierFromName(name?: string | null): MembershipTier | null {
  if (!name) return null;
  const normalized = name.toLowerCase();
  if (normalized.includes("builder")) return "builder";
  if (normalized.includes("partner")) return "partner";
  if (normalized.includes("supporter")) return "supporter";
  return null;
}
