import Image from "next/image";
import Link from "next-intl/link";
import { requireActiveMembership } from "@/lib/require-membership";
import { getBlogPosts, imgUrl, type BlogPostEntity } from "@/lib/strapi";
import TrackedLink from "@/components/ruach/TrackedLink";

export const dynamic = "force-dynamic";

interface RichTextElement {
  text?: unknown;
  children?: Array<RichTextElement | string>;
}

function isRichTextElement(value: unknown): value is RichTextElement {
  return typeof value === "object" && value !== null;
}

function hasRichTextChildren(
  value: RichTextElement
): value is RichTextElement & { children: Array<RichTextElement | string> } {
  return Array.isArray(value.children);
}

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (!isRichTextElement(node)) return "";
  if (typeof node.text === "string") return node.text;
  if (hasRichTextChildren(node)) {
    return node.children.map((child) => extractText(child)).join("");
  }
  return "";
}

function summarizeBlocks(blocks: unknown): string | undefined {
  if (!Array.isArray(blocks)) return undefined;
  for (const block of blocks) {
    const text = extractText(block);
    if (text.trim()) {
      return text.trim();
    }
  }
  return undefined;
}

function formatPublishedDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function resolveFeaturedImage(post: BlogPostEntity) {
  const url = post.attributes?.featuredImage?.data?.attributes?.url;
  if (!url) return undefined;
  return {
    src: imgUrl(url),
    alt: post.attributes?.title ?? "Featured image",
  };
}

export default async function MemberPostsPage() {
  const path = "/members/posts";
  await requireActiveMembership(path);

  const { data: posts } = await getBlogPosts({ pageSize: 24 });

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">Member Library</span>
        <h1 className="text-3xl font-semibold text-white">Partner-Only Posts</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Read the latest ministry briefings, prophetic encouragements, and behind-the-scenes stories released exclusively to active partners.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.length ? (
          posts.map((post) => {
            const title = post.attributes?.title ?? "Untitled post";
            const slug = post.attributes?.slug;
            const href = slug ? `/members/posts/${slug}` : undefined;
            const summary = summarizeBlocks(post.attributes?.content) ?? "Stay tuned—full post coming soon.";
            const published = formatPublishedDate(post.attributes?.publishedDate);
            const image = resolveFeaturedImage(post);

            return (
              <article
                key={post.id}
                className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5"
              >
                <div className="relative aspect-[4/3] bg-black/20">
                  {image?.src ? (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1280px) 360px, (min-width: 768px) 45vw, 90vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-6 text-white">
                  {published ? (
                    <span className="text-xs uppercase tracking-wide text-white/60">{published}</span>
                  ) : null}
                  {href ? (
                    <Link href={href} className="mt-2 text-lg font-semibold text-white hover:text-amber-300">
                      {title}
                    </Link>
                  ) : (
                    <p className="mt-2 text-lg font-semibold text-white">{title}</p>
                  )}
                  <p className="mt-3 text-sm text-white/70">{summary}</p>
                  {href && slug ? (
                    <TrackedLink
                      href={href}
                      className="mt-6 inline-flex items-center text-sm font-semibold text-amber-300 hover:text-amber-200"
                      event="MemberPostClick"
                      eventProps={{ slug, title }}
                    >
                      Continue reading →
                    </TrackedLink>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/70">
            No member posts are published yet. Check back soon to catch the latest partner briefings.
          </div>
        )}
      </section>
    </div>
  );
}
