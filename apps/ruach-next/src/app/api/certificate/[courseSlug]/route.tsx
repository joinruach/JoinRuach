import { NextRequest } from "next/server";
import satori from "satori";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function readFontBuffer(filePath: string): Promise<Buffer> {
  const data = await readFile(filePath);
  return typeof data === "string" ? Buffer.from(data) : data;
}

async function getCourseWithLessons(slug: string){
  const qs = new URLSearchParams({ "filters[slug][$eq]": slug, "populate": "lessons", "pagination[pageSize]": "1" }).toString();
  const r = await fetch(`${STRAPI}/api/courses?${qs}`, { cache: "no-store" });
  if (!r.ok) return null; const j = await r.json(); const row = j?.data?.[0]; if (!row) return null;
  const a = row.attributes; const lessons = (a?.lessons?.data ?? []).map((d:any)=>d.attributes?.slug).filter(Boolean);
  return { title: a?.title ?? slug, lessonsSlugs: lessons as string[] };
}

async function getCompletedLessonSlugsForUser(jwt: string, courseSlug: string){
  const qs = new URLSearchParams({ "filters[courseSlug][$eq]": courseSlug, "filters[completed][$eq]": "true", "fields[0]": "lessonSlug", "pagination[pageSize]": "500" }).toString();
  const r = await fetch(`${STRAPI}/api/lesson-progresses?${qs}`, { headers: { Authorization: `Bearer ${jwt}` }, cache: "no-store" });
  if (!r.ok) return []; const j = await r.json();
  const slugs = (j?.data ?? []).map((row:any)=>row?.attributes?.lessonSlug).filter(Boolean);
  return Array.from(new Set(slugs));
}

export async function GET(req: NextRequest, context: { params: Promise<{ courseSlug: string }> }){
  const { courseSlug } = await context.params;
  const session = await auth();
  const jwt = session?.strapiJwt;
  const userName = session?.user?.name || session?.user?.email || "Student";
  if (!jwt) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const course = await getCourseWithLessons(courseSlug);
  if (!course) return new Response(JSON.stringify({ error: "Course not found" }), { status: 404 });
  const totalLessons = course.lessonsSlugs.length;
  if (totalLessons === 0) return new Response(JSON.stringify({ error: "Course has no lessons" }), { status: 400 });

  const completedSlugs = await getCompletedLessonSlugsForUser(jwt, courseSlug);
  const allCompleted = completedSlugs.length >= totalLessons;
  if (!allCompleted) return new Response(JSON.stringify({ error: "Course not fully completed", details: { completed: completedSlugs.length, total: totalLessons } }), { status: 403 });

  const date = new Date().toLocaleDateString();
  const inter = await readFontBuffer(path.join(process.cwd(), "public/fonts/Inter-Regular.ttf"));
  const interBold = await readFontBuffer(path.join(process.cwd(), "public/fonts/Inter-Bold.ttf"));
  const { Resvg } = await import("@resvg/resvg-js");

  const svg = await satori(
    <div style={{ width:"1123px", height:"794px", display:"flex", background:"#fff", color:"#111", justifyContent:"center", alignItems:"center", padding:"64px" }}>
      <div style={{ width:"100%", height:"100%", border:"2px solid #111", borderRadius:"24px", padding:"48px", position:"relative" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:28, fontWeight:800, letterSpacing:2 }}>RUACH MINISTRIES</div>
          <div style={{ fontSize:14, opacity:0.7 }}>{SITE.replace(/^https?:\/\//,"")}</div>
        </div>
        <div style={{ marginTop:48, textAlign:"center" }}>
          <div style={{ fontSize:20, letterSpacing:2, opacity:0.8 }}>CERTIFICATE OF COMPLETION</div>
          <div style={{ marginTop:20, fontSize:54, fontWeight:700 }}>{userName}</div>
          <div style={{ marginTop:12, fontSize:18, opacity:0.8 }}>has successfully completed</div>
          <div style={{ marginTop:8, fontSize:32, fontWeight:600 }}>{course.title}</div>
          <div style={{ marginTop:28, fontSize:16, opacity:0.7 }}>Date: {date}</div>
        </div>
        <div style={{ position:"absolute", bottom:48, left:48, right:48, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><div style={{ width:220, height:1, background:"#111" }} /><div style={{ marginTop:6, fontSize:14 }}>Authorized Signature</div></div>
          <div style={{ fontSize:14, opacity:0.7 }}>“Teach me your way, O LORD…” — Psalm 86:11</div>
          <div><div style={{ width:220, height:1, background:"#111" }} /><div style={{ marginTop:6, fontSize:14, textAlign:"right" }}>Course Director</div></div>
        </div>
      </div>
    </div>,
    { width:1123, height:794, fonts:[ { name:"Inter", data: inter, weight: 400, style: "normal" }, { name:"Inter", data: interBold, weight:700, style:"normal" } ] }
  );
  const renderResult = new Resvg(svg, {
    fitTo: { mode: "width", value: 1123 },
    background: "#fff"
  }).render();

  const pdf = (renderResult as unknown as { asPdf: () => Uint8Array }).asPdf();
  const body = Buffer.from(pdf);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ruach-certificate-${courseSlug}.pdf"`,
      "Cache-Control": "private, no-store"
    }
  });
}
