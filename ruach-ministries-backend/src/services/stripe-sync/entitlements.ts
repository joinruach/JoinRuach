export type MembershipTier = "supporter" | "partner" | "builder" | "steward";

export type Entitlement =
  | "member_base"
  | "member_discounts"
  | "member_livestreams"
  | "member_early_access"
  | "member_community";

const ENTITLEMENTS_BY_TIER: Record<MembershipTier, Entitlement[]> = {
  supporter: ["member_base"],
  partner: ["member_base", "member_discounts"],
  builder: [
    "member_base",
    "member_discounts",
    "member_livestreams",
    "member_early_access",
  ],
  steward: [
    "member_base",
    "member_discounts",
    "member_livestreams",
    "member_early_access",
    "member_community",
  ],
};

export function entitlementsForTier(tier: string | null | undefined): Entitlement[] {
  const normalized = typeof tier === "string" ? tier.trim().toLowerCase() : "";
  if (!normalized) return [];
  if (normalized in ENTITLEMENTS_BY_TIER) {
    return ENTITLEMENTS_BY_TIER[normalized as MembershipTier];
  }
  return [];
}

