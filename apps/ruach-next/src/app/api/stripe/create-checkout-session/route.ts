import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";
import { fetchStrapiMembership } from "@/lib/strapi-membership";

// Extended session type with Strapi JWT
interface ExtendedSession {
  strapiJwt?: string;
  [key: string]: unknown;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

const PRICE_ID =
  process.env.STRIPE_PARTNER_PRICE_ID || process.env.STRIPE_PRICE_ID || "";
const SUCCESS_URL =
  process.env.STRIPE_CHECKOUT_SUCCESS_URL ||
  `${SITE_URL}/members/account?checkout=success`;
const CANCEL_URL =
  process.env.STRIPE_CHECKOUT_CANCEL_URL ||
  `${SITE_URL}/give?checkout=cancelled`;

const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due", "paused"]);

export async function POST() {
  try {
    if (!PRICE_ID) {
      return NextResponse.json(
        { error: "Stripe partner price is not configured." },
        { status: 500 },
      );
    }

    const session = await getServerSession(authOptions as AuthOptions);
    const jwt = (session as ExtendedSession | null)?.strapiJwt;
    const user = await fetchStrapiMembership(jwt);

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
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      allow_promotion_codes: true,
      ...(Object.keys(metadata).length
        ? { subscription_data: { metadata } }
        : {}),
      customer: user?.stripeCustomerId || undefined,
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
