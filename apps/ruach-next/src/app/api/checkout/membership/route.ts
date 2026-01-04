"use server";

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { auth } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";
import {
  fetchStrapiBillingIdentifiers,
  fetchStrapiMembership,
} from "@/lib/strapi-membership";
import {
  getMembershipPrices,
  resolveMembershipPriceId,
  type BillingInterval,
  type MembershipTier,
} from "@/lib/membership-prices";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

type MembershipCheckoutRequest = {
  tier: MembershipTier;
  interval?: BillingInterval;
  locale?: string;
};

const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due", "paused"]);

export async function POST(request: Request) {
  const membershipPrices = getMembershipPrices();
  if (!membershipPrices) {
    return NextResponse.json(
      { error: "Membership pricing is not configured." },
      { status: 500 },
    );
  }

  try {
    const body: Partial<MembershipCheckoutRequest> =
      (await request.json().catch(() => ({}))) ?? {};

    const tier = body.tier;
    if (!tier || !(tier in membershipPrices)) {
      return NextResponse.json(
        { error: "Invalid membership tier." },
        { status: 400 }
      );
    }

    const tierConfig = membershipPrices[tier];
    if (!tierConfig) {
      return NextResponse.json(
        { error: "Membership tier is not configured." },
        { status: 500 },
      );
    }

    const interval: BillingInterval =
      body.interval === "annual" ? "annual" : "monthly";

    const locale =
      typeof body.locale === "string" && body.locale.trim().length
        ? body.locale.trim()
        : "en";

    const session = await auth();
    const strapiMembership = await fetchStrapiMembership(session?.strapiJwt);
    const billing = await fetchStrapiBillingIdentifiers(session?.strapiJwt);

    if (
      strapiMembership?.membershipStatus &&
      ACTIVE_STATUSES.has(strapiMembership.membershipStatus)
    ) {
      return NextResponse.json(
        {
          error:
            "You already have an active membership. Use the billing portal to manage your plan.",
        },
        { status: 409 }
      );
    }

    const stripe = getStripeClient();

    const metadata: Record<string, string> = {
      type: "membership",
      tier,
      interval,
      accessLevel: tierConfig.accessLevel,
      source: "ruach-next",
    };

    if (strapiMembership?.id) {
      metadata.strapiUserId = String(strapiMembership.id);
    }

    const successUrl = `${SITE_URL}/${locale}/members/account?checkout=success`;
    const cancelUrl = `${SITE_URL}/${locale}/join`;

    const priceId = resolveMembershipPriceId(membershipPrices, tier, interval);

    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      customer: billing?.stripeCustomerId || undefined,
      customer_email:
        strapiMembership?.email || session?.user?.email || undefined,
      metadata,
      subscription_data: {
        metadata,
      },
    };

    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create membership checkout session.";
    console.error("[stripe] checkout/membership error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
