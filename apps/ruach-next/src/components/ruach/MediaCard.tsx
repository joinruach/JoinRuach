import Image from "next/image";
import Link from "next/link";
import { imgUrl } from "@/lib/strapi";

export type MediaCardProps = {
  title: string;
  href: string;
  excerpt?: string;
  category?: string;
  thumbnail?: { src?: string; alt?: string };
  views?: number;
  durationSec?: number;
  speakers?: string[];
  likes?: number;
  contentId?: string | number;
};

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return undefined;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MediaCard({
  title,
  href,
  excerpt,
  category,
  thumbnail,
  views,
  durationSec,
  speakers,
  likes,
  contentId,
}: MediaCardProps) {
  const src = thumbnail?.src ? imgUrl(thumbnail.src) : undefined;
  const primarySpeaker = speakers?.[0];
  const durationLabel = formatDuration(durationSec);
  const viewLabel =
    typeof views === "number" ? `${new Intl.NumberFormat("en", { notation: "compact" }).format(views)} views` : undefined;
  const likeLabel =
    typeof likes === "number" && likes > 0 ? `${new Intl.NumberFormat("en", { notation: "compact" }).format(likes)} likes` : undefined;

  const meta: string[] = [];
  if (durationLabel) meta.push(durationLabel);
  if (primarySpeaker) meta.push(primarySpeaker);
  if (viewLabel) meta.push(viewLabel);
  if (likeLabel) meta.push(likeLabel);

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-xl ring-1 ring-black/5 transition hover:ring-amber-400"
    >
      <div className="relative aspect-video">
        {src ? (
          <Image
            src={src}
            alt={thumbnail?.alt || title}
            fill
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-neutral-200" />
        )}
      </div>
      <div className="p-4">
        {category ? (
          <div className="text-xs uppercase tracking-wide text-neutral-500">{category}</div>
        ) : null}
        <h3 className="mt-1 font-semibold">{title}</h3>
        {excerpt ? (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-700">{excerpt}</p>
        ) : null}
        {meta.length ? (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
            {meta.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
