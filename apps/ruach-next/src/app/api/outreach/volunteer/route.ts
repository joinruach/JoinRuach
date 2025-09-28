import { NextRequest, NextResponse } from "next/server";
import { ipFromHeaders, volunteerLimiter } from "@/lib/ratelimit";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;
const API_TOKEN = process.env.STRAPI_VOLUNTEER_TOKEN || process.env.STRAPI_API_TOKEN;
const COLLECTION = process.env.STRAPI_VOLUNTEER_COLLECTION || "volunteer-signups";

export async function POST(req: NextRequest) {
  if (!API_TOKEN) {
    return NextResponse.json({ error: "Volunteer collection not configured." }, { status: 500 });
  }

  const ip = ipFromHeaders(req.headers);
  const limited = await volunteerLimiter.limit(ip);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many submissions. Please try again soon." }, { status: 429 });
  }

  const { name, email, phone, availability, message } = await req.json().catch(() => ({}));
  if (!email || !name) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const payload = {
    data: {
      name,
      email,
      phone,
      availability,
      message
    }
  };

  const res = await fetch(`${STRAPI}/api/${COLLECTION}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to submit volunteer form", details: json }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
