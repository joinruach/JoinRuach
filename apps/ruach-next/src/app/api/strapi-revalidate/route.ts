import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

const SIGNATURE_HEADER = "x-ruach-signature";

function unauthorized() {
  return new NextResponse("Unauthorized", { status: 401 });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRAPI_REVALIDATE_SECRET;
  const signature = req.headers.get(SIGNATURE_HEADER);

  if (!secret || !signature || signature !== secret) {
    return unauthorized();
  }

  const body = await req.json().catch(() => ({}));
  const model = body?.model || body?.event || body?.collection || "";
  const entry = body?.entry || body?.data || {};
  const slug = entry?.slug || entry?.attributes?.slug;
  const category = entry?.category || entry?.attributes?.category;
  const tagsFromPayload: string[] = Array.isArray(body?.tags)
    ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : [];
  const pathsFromPayload: string[] = Array.isArray(body?.paths)
    ? body.paths.filter((path: unknown): path is string => typeof path === "string" && path.startsWith("/"))
    : [];

  const tagsRevalidated: string[] = [];
  const pathsRevalidated: string[] = [];

  if (model && slug) {
    if (model.includes("media")) {
      revalidateTag(`media:${slug}`);
      tagsRevalidated.push(`media:${slug}`);
    }
    if (model.includes("course")) {
      revalidateTag(`course:${slug}`);
      tagsRevalidated.push(`course:${slug}`);
    }
  }

  if (model.includes("course") && Array.isArray(entry?.lessons)) {
    revalidateTag("courses");
    tagsRevalidated.push("courses");
  }

  if (model.includes("media")) {
    revalidateTag("media-items");
    tagsRevalidated.push("media-items");
    if (category) {
      revalidateTag(`media-category:${category}`);
      tagsRevalidated.push(`media-category:${category}`);
    }
  }

  for (const tag of tagsFromPayload) {
    revalidateTag(tag);
    tagsRevalidated.push(tag);
  }

  for (const path of pathsFromPayload) {
    revalidatePath(path);
    pathsRevalidated.push(path);
  }

  return NextResponse.json({ ok: true, tags: tagsRevalidated, paths: pathsRevalidated });
}
