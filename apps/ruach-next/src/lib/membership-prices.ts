import type { MembershipTier } from "@/lib/memberships";
export type { MembershipTier } from "@/lib/memberships";

type MembershipConfig = {
  priceId: string;
  accessLevel: "basic" | "full" | "leader";
  rank: number;
};

export type AccessLevel = MembershipConfig["accessLevel"];
export type MembershipPrices = Record<MembershipTier, MembershipConfig>;

export function getMembershipPrices(): MembershipPrices | null {
  const SUPPORTER_PRICE = process.env.STRIPE_SUPPORTER_PRICE_ID;
  const PARTNER_PRICE = process.env.STRIPE_PARTNER_PRICE_ID;
  const BUILDER_PRICE = process.env.STRIPE_BUILDER_PRICE_ID;

  if (!SUPPORTER_PRICE || !PARTNER_PRICE || !BUILDER_PRICE) {
    return null;
  }

  return {
    supporter: {
      priceId: SUPPORTER_PRICE,
      accessLevel: "basic",
      rank: 1,
    },
    partner: {
      priceId: PARTNER_PRICE,
      accessLevel: "full",
      rank: 2,
    },
    builder: {
      priceId: BUILDER_PRICE,
      accessLevel: "leader",
      rank: 3,
    },
  };
}
