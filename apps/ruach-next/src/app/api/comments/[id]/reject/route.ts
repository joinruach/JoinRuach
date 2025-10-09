import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }){
  const session = await getServerSession(authOptions);
  const jwt = session?.strapiJwt;
  const email = session?.user?.email ?? undefined;
  const allow = (process.env.MODERATOR_EMAILS||"").split(",").map(s=>s.trim()).filter(Boolean);
  if (!jwt || !email || !allow.includes(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
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
