"use server";

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

type DonationCheckoutRequest = {
  locale?: string;
  source?: string;
};

function normalizeLocale(locale?: string) {
  if (!locale) return "en";
  const cleaned = locale.toLowerCase().trim();
  return cleaned || "en";
}

export async function POST(request: Request) {
  try {
    const body: DonationCheckoutRequest =
      (await request.json().catch(() => ({}))) ?? {};

    const locale = normalizeLocale(body.locale);
    const source = typeof body.source === "string" ? body.source : "give_page";

    const donationPriceId = process.env.STRIPE_DONATION_PRICE_ID;
    if (!donationPriceId) {
      return NextResponse.json(
        { error: "STRIPE_DONATION_PRICE_ID is not configured." },
        { status: 500 }
      );
    }

    const stripe = getStripeClient();

    const successUrl = `${SITE_URL}/${locale}/thank-you?donation=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${SITE_URL}/${locale}/give?checkout=cancelled`;

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: donationPriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: "donation",
        source,
        locale,
      },
    };

    const session = await stripe.checkout.sessions.create(params);

    if (!session.url) {
      throw new Error("Stripe checkout did not return a URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create donation session.";
    console.error("[stripe] checkout/donation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

