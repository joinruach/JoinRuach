import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }){
  const session = await getServerSession(authOptions);
  const jwt = session?.strapiJwt;
  const email = session?.user?.email ?? undefined;
  const allow = (process.env.MODERATOR_EMAILS||"").split(",").map(s=>s.trim()).filter(Boolean);
  if (!jwt || !email || !allow.includes(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const r = await fetch(`${STRAPI}/api/lesson-comments/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ data: { approved: true } }), cache: "no-store"
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) return NextResponse.json({ error: "Approve failed", details: j }, { status: 500 });
  return NextResponse.json({ ok: true });
}
