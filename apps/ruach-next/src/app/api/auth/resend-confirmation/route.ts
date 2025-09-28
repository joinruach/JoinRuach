import { NextRequest, NextResponse } from "next/server";
import { resendLimiter, ipFromHeaders } from "@/lib/ratelimit";
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export async function POST(req: NextRequest){
  const ip = ipFromHeaders(req.headers);
  const { success } = await resendLimiter.limit(ip);
  if (!success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const { email } = await req.json().catch(()=>({}));
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  // Strapi v4 Email confirmation resend (plugin-dependent). Often requires admin or custom endpoint.
  // Placeholder: call a custom endpoint if you've created one in Strapi.
  return NextResponse.json({ ok: true });
}
