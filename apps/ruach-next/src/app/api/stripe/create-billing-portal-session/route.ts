import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

const RETURN_URL =
  process.env.STRIPE_BILLING_RETURN_URL ||
  `${SITE_URL}/members/account?billing=updated`;

export async function POST() {
  try {
    const session = await auth();
    const jwt = (session as ExtendedSession | null)?.strapiJwt;

    if (!jwt) {
      return NextResponse.json(
        { error: "Sign in to your Ruach account to manage billing." },
        { status: 401 },
      );
    }

    const user = await fetchStrapiMembership(jwt);
    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "We could not find an active Stripe customer for your account. Contact support if you believe this is a mistake.",
        },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: RETURN_URL,
    });

    if (!portalSession.url) {
      throw new Error("Stripe portal session did not return a URL.");
    }

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create a Stripe billing portal session.";
    console.error("[stripe] create-billing-portal-session error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
