import { NextResponse } from "next/server";
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
} from "@/lib/membership-prices";

// Extended session type with Strapi JWT
interface ExtendedSession {
  strapiJwt?: string;
  [key: string]: unknown;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

type CheckoutRequest = {
  interval?: BillingInterval;
};
const SUCCESS_URL =
  process.env.STRIPE_CHECKOUT_SUCCESS_URL ||
  `${SITE_URL}/members/account?checkout=success`;
const CANCEL_URL =
  process.env.STRIPE_CHECKOUT_CANCEL_URL ||
  `${SITE_URL}/give?checkout=cancelled`;

const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due", "paused"]);

export async function POST(req: Request) {
  try {
    const membershipPrices = getMembershipPrices();
    if (!membershipPrices) {
      return NextResponse.json(
        { error: "Membership pricing is not configured." },
        { status: 500 },
      );
    }

    const body: CheckoutRequest = (await req.json().catch(() => ({}))) ?? {};
    const interval: BillingInterval =
      body.interval === "annual" ? "annual" : "monthly";

    const priceId = resolveMembershipPriceId(membershipPrices, "partner", interval);

    const session = await auth();
    const jwt = (session as ExtendedSession | null)?.strapiJwt;
    const user = await fetchStrapiMembership(jwt);
    const billing = await fetchStrapiBillingIdentifiers(jwt);

    if (user?.membershipStatus && ACTIVE_STATUSES.has(user.membershipStatus)) {
      return NextResponse.json(
        {
          error:
            "You already have an active membership. Use the billing portal to manage your plan.",
        },
        { status: 409 },
      );
    }

    const stripe = getStripeClient();

    const metadata: Record<string, string> = {};
    if (user?.id) {
      metadata.strapiUserId = String(user.id);
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      allow_promotion_codes: true,
      ...(Object.keys(metadata).length
        ? { subscription_data: { metadata } }
        : {}),
      customer: billing?.stripeCustomerId || undefined,
      customer_email: user?.email || session?.user?.email || undefined,
      metadata: {
        ...(Object.keys(metadata).length ? metadata : {}),
        source: "ruach-next",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create checkout session.";
    console.error("[stripe] create-checkout-session error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
