import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchStrapiMembership } from "@/lib/strapi-membership";
import { getStripeClient } from "@/lib/stripe";
import { MEMBERSHIP_PRICES, type MembershipTier } from "@/lib/membership-prices";
import { postStripeSync } from "@/lib/stripe-sync";

type MembershipChangeRequest = {
  tier?: MembershipTier;
};

function normalizeTier(value: string | null | undefined): MembershipTier | null {
  if (!value) return null;
  return value in MEMBERSHIP_PRICES ? (value as MembershipTier) : null;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const jwt = session?.strapiJwt;
    if (!jwt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: MembershipChangeRequest =
      (await req.json().catch(() => ({}))) ?? {};
    const targetTier = normalizeTier(payload.tier ?? null);
    if (!targetTier) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const membership = await fetchStrapiMembership(jwt);
    const subscriptionId = membership?.stripeSubscriptionId;
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 },
      );
    }

    const currentTier = normalizeTier(membership.membershipTier ?? null);
    if (currentTier === targetTier) {
      return NextResponse.json(
        { error: "Already on the requested tier" },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"],
    });

    const item = subscription.items?.data?.[0];
    if (!item || !item.id) {
      return NextResponse.json(
        { error: "Unable to read subscription line item" },
        { status: 500 },
      );
    }

    const targetConfig = MEMBERSHIP_PRICES[targetTier];
    const currentRank = currentTier
      ? MEMBERSHIP_PRICES[currentTier].rank
      : 0;
    const isUpgrade = targetConfig.rank > currentRank;
    const prorationBehavior = isUpgrade ? "create_prorations" : "none";

    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: item.id,
          price: targetConfig.priceId,
        },
      ],
      proration_behavior: prorationBehavior,
    });

    await postStripeSync(jwt, "sync-latest");

    return NextResponse.json({
      success: true,
      tier: targetTier,
      upgrade: isUpgrade,
    });
  } catch (error) {
    console.error("[stripe] change-membership error:", error);
    const message =
      error instanceof Error ? error.message : "Unable to change membership";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
