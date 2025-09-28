import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export async function POST(req: NextRequest, { params }:{ params: { id: string }}){
  const session = await getServerSession(authOptions as any);
  const jwt = (session as any)?.strapiJwt as string | undefined;
  const email = session?.user?.email;
  const allow = (process.env.MODERATOR_EMAILS||"").split(",").map(s=>s.trim()).filter(Boolean);
  if (!jwt || !email || !allow.includes(email!)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = params.id;
  const res = await fetch(`${STRAPI}/api/lesson-comments/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${jwt}`
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const details = await res.json().catch(() => ({}));
    return NextResponse.json({ error: "Reject failed", details }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
