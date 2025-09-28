import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ipFromHeaders, reportsLimiter } from "@/lib/ratelimit";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export async function POST(req: NextRequest){
  const ip = ipFromHeaders(req.headers);
  const { success } = await reportsLimiter.limit(ip);
  if (!success) return NextResponse.json({ error: "Too many reports. Try later." }, { status: 429 });

  const session = await getServerSession(authOptions as any);
  const jwt = (session as any)?.strapiJwt as string | undefined;
  if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId, reason } = await req.json().catch(()=>({}));
  if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  const r = await fetch(`${STRAPI}/api/comment-reports`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ data: { commentId, reason: reason ?? "" } })
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) return NextResponse.json({ error: "Create failed", details: j }, { status: 500 });

  return NextResponse.json({ ok: true, id: j.data?.id });
}
