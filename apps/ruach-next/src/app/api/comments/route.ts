import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

// GET /api/comments?courseSlug=...&lessonSlug=...
export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const courseSlug = searchParams.get("courseSlug");
  const lessonSlug = searchParams.get("lessonSlug");
  if (!courseSlug || !lessonSlug) return NextResponse.json({ error: "Missing slugs" }, { status: 400 });

  const qs = new URLSearchParams({
    "filters[courseSlug][$eq]": courseSlug,
    "filters[lessonSlug][$eq]": lessonSlug,
    "filters[approved][$eq]": "true",
    "sort[0]": "createdAt:desc",
    "pagination[pageSize]": "50",
    "populate": "user"
  }).toString();

  const r = await fetch(`${STRAPI}/api/lesson-comments?${qs}`, { cache: "no-store" });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) return NextResponse.json({ error: "Fetch failed", details: j }, { status: 500 });

  const comments = (j.data ?? []).map((row:any)=>({
    id: row.id,
    author: row.attributes?.user?.data?.attributes?.username || row.attributes?.user?.data?.attributes?.email || "User",
    text: row.attributes?.text, createdAt: row.attributes?.createdAt
  }));
  return NextResponse.json({ comments });
}

// POST /api/comments { courseSlug, lessonSlug, text }
export async function POST(req: NextRequest){
  const session = await getServerSession(authOptions);
  const jwt = session?.strapiJwt;
  if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseSlug, lessonSlug, text } = await req.json().catch(()=>({}));
  if (!courseSlug || !lessonSlug || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const autoApproveEmails = (process.env.MODERATOR_EMAILS||"").split(",").map(s=>s.trim()).filter(Boolean);
  const email = session?.user?.email ?? undefined;
  const isModerator = Boolean(email && autoApproveEmails.includes(email));

  const r = await fetch(`${STRAPI}/api/lesson-comments`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ data: { courseSlug, lessonSlug, text, approved: !!isModerator } })
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) return NextResponse.json({ error: "Create failed", details: j }, { status: 500 });

  return NextResponse.json({ ok: true, id: j.data?.id, approved: !!isModerator });
}
