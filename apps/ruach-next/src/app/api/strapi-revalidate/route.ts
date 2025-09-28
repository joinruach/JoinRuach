import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest){
  const body = await req.json().catch(()=>({}));
  // Expect Strapi webhook payload with model and entry slug
  const model = body?.model || body?.event || body?.collection || "";
  const entry = body?.entry || body?.data || {};
  const slug = entry?.slug || entry?.attributes?.slug;
  const category = entry?.category || entry?.attributes?.category;

  if (model && slug) {
    if (model.includes("media")) revalidateTag(`media:${slug}`);
    if (model.includes("course")) revalidateTag(`course:${slug}`);
  }
  // Per-model examples
  if (model.includes("course") && Array.isArray(entry?.lessons)) {
    revalidateTag("courses");
  }
  if (model.includes("media")) {
    revalidateTag("media-items");
    if (category) revalidateTag(`media-category:${category}`);
  }

  return NextResponse.json({ ok: true });
}
