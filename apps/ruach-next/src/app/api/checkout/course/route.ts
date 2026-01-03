"use server";

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { getCoursePriceId } from "@/lib/course-prices";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

type CourseCheckoutRequest = {
  courseSlug?: string;
  locale?: string;
};

export async function POST(request: Request) {
  try {
    const body: CourseCheckoutRequest =
      (await request.json().catch(() => ({}))) ?? {};

    const courseSlug = body.courseSlug?.trim();
    if (!courseSlug) {
      return NextResponse.json(
        { error: "Missing courseSlug parameter." },
        { status: 400 }
      );
    }

    const priceId = getCoursePriceId(courseSlug);
    if (!priceId) {
      return NextResponse.json(
        { error: "Unknown course price id for the requested course." },
        { status: 400 }
      );
    }

    const locale =
      typeof body.locale === "string" && body.locale.trim().length
        ? body.locale.trim()
        : "en";

    const successUrl = `${SITE_URL}/${locale}/courses/${courseSlug}?checkout=success`;
    const cancelUrl = `${SITE_URL}/${locale}/courses/${courseSlug}`;

    const stripe = getStripeClient();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: "course",
        courseSlug,
        locale,
      },
      payment_method_types: ["card"],
      allow_promotion_codes: false,
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    if (!checkoutSession.url) {
      throw new Error("Stripe checkout did not return a URL.");
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create course checkout session.";
    console.error("[stripe] checkout/course error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
