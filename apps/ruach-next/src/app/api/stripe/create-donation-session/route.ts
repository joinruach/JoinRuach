"use server";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";
import { fetchStrapiBillingIdentifiers } from "@/lib/strapi-membership";
import Stripe from "stripe";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

const SUCCESS_URL =
  process.env.STRIPE_CHECKOUT_SUCCESS_URL ||
  `${SITE_URL}/members/account?checkout=success`;
const CANCEL_URL =
  process.env.STRIPE_CHECKOUT_CANCEL_URL ||
  `${SITE_URL}/give?checkout=cancelled`;

const MIN_DONATION_CENTS = 100;
const MAX_DONATION_CENTS = 2_000_000;

type DonationRequest = {
  amount: number;
  monthly?: boolean;
  campaign?: string;
};

export async function POST(request: Request) {
  try {
    const payload: Partial<DonationRequest> =
      (await request.json().catch(() => ({}))) ?? {};

    const amount = Number(payload.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid donation amount." },
        { status: 400 }
      );
    }

    const cents = Math.min(
      Math.max(Math.round(amount * 100), MIN_DONATION_CENTS),
      MAX_DONATION_CENTS
    );

    const session = await auth();
    const billing = await fetchStrapiBillingIdentifiers(session?.strapiJwt);
    const stripeCustomerId = billing?.stripeCustomerId ?? undefined;

    const stripe = getStripeClient();
    const isMonthly = Boolean(payload.monthly);
    const productName = isMonthly
      ? "Monthly Support for Ruach Ministries"
      : "One-time Gift to Ruach Ministries";

    const metadata: Record<string, string> = {
      type: "donation",
      amount: String(cents),
      monthly: isMonthly ? "true" : "false",
      source: "ruach-next"
    };
    if (payload.campaign) {
      metadata.campaign = payload.campaign;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: isMonthly ? "subscription" : "payment",
        payment_method_types: ["card"],
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL,
        allow_promotion_codes: true,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: productName },
              unit_amount: cents,
              ...(isMonthly ? { recurring: { interval: "month" } } : {}),
            },
            quantity: 1,
          },
        ],
        metadata,
        customer_email: session?.user?.email ?? undefined,
      };

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    if (!checkoutSession.url) {
      throw new Error("Stripe checkout did not return a URL.");
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create donation session.";
    console.error("[stripe] create-donation-session error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
