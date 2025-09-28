import { NextRequest, NextResponse } from "next/server";
import { signupLimiter, ipFromHeaders } from "@/lib/ratelimit";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;
const CONFIRM_REDIRECT = process.env.STRAPI_EMAIL_CONFIRM_REDIRECT || (process.env.NEXTAUTH_URL + "/confirmed");

export async function POST(req: NextRequest){
  const ip = ipFromHeaders(req.headers);
  const { success } = await signupLimiter.limit(ip);
  if (!success) return NextResponse.json({ error: "Too many signups. Try later." }, { status: 429 });

  const { email, password, username } = await req.json().catch(()=>({}));
  if (!email || !password) return NextResponse.json({ error: "Missing email/password" }, { status: 400 });

  const r = await fetch(`${STRAPI}/api/auth/local/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username: username || email, password })
  });
  const j = await r.json().catch(()=>({}));

  if (!r.ok) return NextResponse.json({ error: j?.error?.message || "Signup failed" }, { status: 400 });
  // Trigger confirmation email by updating email confirmation settings in Strapi.
  return NextResponse.json({ ok: true });
}
