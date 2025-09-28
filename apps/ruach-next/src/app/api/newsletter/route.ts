import { NextRequest, NextResponse } from "next/server";
import { ipFromHeaders, newsletterLimiter } from "@/lib/ratelimit";

const FORM_ID = process.env.NEXT_PUBLIC_CONVERTKIT_FORM_ID;
const API_KEY = process.env.NEXT_PUBLIC_CONVERTKIT_API_KEY;
const API_SECRET = process.env.CONVERTKIT_API_SECRET;

export async function POST(req: NextRequest) {
  if (!FORM_ID || !API_SECRET) {
    return NextResponse.json(
      { error: "Newsletter form is not configured." },
      { status: 500 }
    );
  }

  const ip = ipFromHeaders(req.headers);
  const rate = await newsletterLimiter.limit(ip);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many signups. Please try again later." },
      { status: 429 }
    );
  }

  const { email, firstName, tags } = await req.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {
    api_secret: API_SECRET,
    email,
  };

  if (API_KEY) payload.api_key = API_KEY;
  if (firstName && typeof firstName === "string") payload.first_name = firstName;
  if (Array.isArray(tags)) payload.tags = tags.filter((tag) => typeof tag === "number" || typeof tag === "string");

  const response = await fetch(`https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      (json as { message?: string; error?: string })?.message ||
      (json as { message?: string; error?: string })?.error ||
      "Unable to subscribe.";

    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
