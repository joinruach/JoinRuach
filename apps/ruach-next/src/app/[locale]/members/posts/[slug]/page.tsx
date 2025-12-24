import Image from "next/image";
import { notFound } from "next/navigation";
import { requireActiveMembership } from "@/lib/require-membership";
import { getBlogPostBySlug, imgUrl, type BlogPostEntity } from "@/lib/strapi";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  const title = post?.attributes?.title ?? "Partner Post";
  const description =
    extractSummary(post?.attributes?.content) ??
    "Exclusive update for Ruach Ministries partners.";
  const image = post?.attributes?.featuredImage?.data?.attributes?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [imgUrl(image)] : undefined,
    },
  };
}

type BlockNode = {
  type?: string;
  level?: number;
  format?: string;
  text?: string;
  children?: BlockNode[];
};

function extractText(node: BlockNode | string | null | undefined): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.children)) {
    return node.children.map((child) => extractText(child)).join("");
  }
  return "";
}

function extractSummary(blocks: unknown): string | undefined {
  if (!Array.isArray(blocks)) return undefined;
  for (const block of blocks as BlockNode[]) {
    const text = extractText(block);
    if (text.trim()) return text.trim();
  }
  return undefined;
}

function renderBlocks(blocks: unknown) {
  if (!Array.isArray(blocks)) return null;

  return (blocks as BlockNode[]).map((block, index) => {
    const key = `${block?.type ?? "block"}-${index}`;
    const text = extractText(block).trim();
    if (!text) return null;

    switch (block.type) {
      case "heading":
      case "heading-one":
      case "heading-one-bold":
      case "heading-two":
      case "heading-three": {
        const level = Math.min(Math.max(Number(block.level ?? 2), 2), 4);
        if (level === 4) {
          return (
            <h4 key={key} className="mt-6 text-lg font-semibold text-zinc-900 dark:text-white">
              {text}
            </h4>
          );
        }
        if (level === 3) {
          return (
            <h3 key={key} className="mt-7 text-xl font-semibold text-zinc-900 dark:text-white">
              {text}
            </h3>
          );
        }
        return (
          <h2 key={key} className="mt-8 text-2xl font-semibold text-zinc-900 dark:text-white">
            {text}
          </h2>
        );
      }
      case "quote":
        return (
          <blockquote
            key={key}
            className="mt-6 border-l-4 border-amber-400/80 pl-4 text-lg italic text-zinc-700 dark:text-white/80"
          >
            {text}
          </blockquote>
        );
      case "list": {
        const items = Array.isArray(block.children)
          ? block.children
              .map((child) => extractText(child).trim())
              .filter((value) => Boolean(value))
          : [];
        if (!items.length) return null;
        const isOrdered = block.format === "ordered";
        return isOrdered ? (
          <ol key={key} className="mt-4 list-decimal space-y-2 pl-5 text-zinc-700 dark:text-white/80">
            {items.map((item: string, itemIndex: number) => (
              <li key={`${key}-${itemIndex}`}>{item}</li>
            ))}
          </ol>
        ) : (
          <ul key={key} className="mt-4 list-disc space-y-2 pl-5 text-zinc-700 dark:text-white/80">
            {items.map((item: string, itemIndex: number) => (
              <li key={`${key}-${itemIndex}`}>{item}</li>
            ))}
          </ul>
        );
      }
      default:
        return (
          <p key={key} className="mt-5 text-base leading-relaxed text-zinc-700 dark:text-white/80">
            {text}
          </p>
        );
    }
  });
}

function featuredImage(post: BlogPostEntity) {
  const attributes = post.attributes;
  const image = attributes?.featuredImage?.data?.attributes?.url;
  if (!image) return null;
  const alt = attributes?.title ?? "Featured image";
  const src = imgUrl(image);
  if (!src) return null;
  return { src, alt };
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

export default async function MemberPostDetail({ params }: Props) {
  const { slug, locale } = await params;
  const path = `/members/posts/${slug}`;
  await requireActiveMembership(path, locale);

  const post = await getBlogPostBySlug(slug);
  if (!post || !post.attributes) {
    notFound();
  }

  const title = post.attributes.title ?? "Partner Post";
  const published = formatPublishedDate(post.attributes.publishedDate);
  const image = featuredImage(post);
  const content = renderBlocks(post.attributes.content);

  return (
    <div className="space-y-10">
      <header className="space-y-3 text-zinc-900 dark:text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Member Post</span>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {published ? <p className="text-sm text-zinc-500 dark:text-white/60">{published}</p> : null}
      </header>

      {image ? (
        <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10">
          <Image
            src={image.src}
            alt={image.alt}
            width={1600}
            height={900}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
      ) : null}

      <article className="prose prose-invert max-w-none prose-headings:text-zinc-900 dark:prose-headings:text-white prose-p:text-zinc-700 dark:prose-p:text-white/80 prose-strong:text-zinc-900 dark:prose-strong:text-white">
        {content ?? (
          <p className="text-zinc-600 dark:text-white/70">
            This post will be available shortly. Please check back for the full update.
          </p>
        )}
      </article>
    </div>
  );
}
