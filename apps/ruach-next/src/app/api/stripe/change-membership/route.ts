import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchStrapiMembership } from "@/lib/strapi-membership";
import { getStripeClient } from "@/lib/stripe";
import {
  getMembershipPrices,
  type MembershipTier,
  type MembershipPrices,
} from "@/lib/membership-prices";
import { postStripeSync } from "@/lib/stripe-sync";

type MembershipChangeRequest = {
  tier?: MembershipTier;
};

function normalizeTier(
  value: string | null | undefined,
  membershipPrices: MembershipPrices,
): MembershipTier | null {
  if (!value) return null;
  return value in membershipPrices ? (value as MembershipTier) : null;
}

export async function POST(req: Request) {
  try {
    const membershipPrices = getMembershipPrices();
    if (!membershipPrices) {
      return NextResponse.json(
        { error: "Membership pricing is not configured." },
        { status: 500 },
      );
    }

    const session = await auth();
    const jwt = session?.strapiJwt;
    if (!jwt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: MembershipChangeRequest =
      (await req.json().catch(() => ({}))) ?? {};
    const targetTier = normalizeTier(payload.tier ?? null, membershipPrices);
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

    const currentTier = normalizeTier(
      membership.membershipTier ?? null,
      membershipPrices,
    );
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

    const targetConfig = membershipPrices[targetTier];
    const currentRank = currentTier ? membershipPrices[currentTier].rank : 0;
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
