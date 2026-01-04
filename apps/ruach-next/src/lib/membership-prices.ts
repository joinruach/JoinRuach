import type { MembershipTier } from "@/lib/memberships";
export type { MembershipTier } from "@/lib/memberships";

export type BillingInterval = "monthly" | "annual";

type MembershipConfig = {
  monthlyPriceId: string;
  annualPriceId: string;
  accessLevel: "basic" | "full" | "leader";
  rank: number;
};

export type AccessLevel = MembershipConfig["accessLevel"];
export type MembershipPrices = Partial<Record<MembershipTier, MembershipConfig>>;

export function getMembershipPrices(): MembershipPrices | null {
  try {
    const PARTNER_MONTHLY =
      process.env.STRIPE_PARTNER_PRICE_MONTHLY ||
      process.env.STRIPE_PARTNER_PRICE_ID ||
      process.env.STRIPE_PRICE_ID;
    const PARTNER_ANNUAL = process.env.STRIPE_PARTNER_PRICE_ANNUAL || PARTNER_MONTHLY;

    const BUILDER_MONTHLY =
      process.env.STRIPE_BUILDER_PRICE_MONTHLY || process.env.STRIPE_BUILDER_PRICE_ID;
    const BUILDER_ANNUAL = process.env.STRIPE_BUILDER_PRICE_ANNUAL || BUILDER_MONTHLY;

    const STEWARD_MONTHLY =
      process.env.STRIPE_STEWARD_PRICE_MONTHLY || process.env.STRIPE_STEWARD_PRICE_ID;
    const STEWARD_ANNUAL = process.env.STRIPE_STEWARD_PRICE_ANNUAL || STEWARD_MONTHLY;

    if (
      !PARTNER_MONTHLY ||
      !BUILDER_MONTHLY ||
      !STEWARD_MONTHLY ||
      !PARTNER_ANNUAL ||
      !BUILDER_ANNUAL ||
      !STEWARD_ANNUAL
    ) {
      return null;
    }

    const prices: MembershipPrices = {
      partner: {
        monthlyPriceId: PARTNER_MONTHLY,
        annualPriceId: PARTNER_ANNUAL,
        accessLevel: "full",
        rank: 2,
      },
      builder: {
        monthlyPriceId: BUILDER_MONTHLY,
        annualPriceId: BUILDER_ANNUAL,
        accessLevel: "leader",
        rank: 3,
      },
      steward: {
        monthlyPriceId: STEWARD_MONTHLY,
        annualPriceId: STEWARD_ANNUAL,
        accessLevel: "leader",
        rank: 4,
      },
    };

    const SUPPORTER_MONTHLY =
      process.env.STRIPE_SUPPORTER_PRICE_MONTHLY || process.env.STRIPE_SUPPORTER_PRICE_ID;
    const SUPPORTER_ANNUAL = process.env.STRIPE_SUPPORTER_PRICE_ANNUAL || SUPPORTER_MONTHLY;
    if (SUPPORTER_MONTHLY && SUPPORTER_ANNUAL) {
      prices.supporter = {
        monthlyPriceId: SUPPORTER_MONTHLY,
        annualPriceId: SUPPORTER_ANNUAL,
        accessLevel: "basic",
        rank: 1,
      };
    }

    return prices;
  } catch {
    return null;
  }
}

export function resolveMembershipPriceId(
  membershipPrices: MembershipPrices,
  tier: MembershipTier,
  interval: BillingInterval
): string {
  const config = membershipPrices[tier];
  if (!config) {
    throw new Error(`Membership tier "${tier}" is not configured.`);
  }
  return interval === "annual" ? config.annualPriceId : config.monthlyPriceId;
}
