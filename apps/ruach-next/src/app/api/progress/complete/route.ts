import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export async function POST(req: NextRequest){
  const session = await getServerSession(authOptions as any);
  const jwt = (session as any)?.strapiJwt as string | undefined;
  if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseSlug, lessonSlug, secondsWatched, completed } = await req.json().catch(()=>({}));
  if (!courseSlug || !lessonSlug) return NextResponse.json({ error: "Missing slugs" }, { status: 400 });

  const r = await fetch(`${STRAPI}/api/lesson-progresses`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ data: { courseSlug, lessonSlug, secondsWatched: secondsWatched||0, completed: !!completed } })
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) return NextResponse.json({ error: "Save failed", details: j }, { status: 500 });
  return NextResponse.json({ ok: true });
}
