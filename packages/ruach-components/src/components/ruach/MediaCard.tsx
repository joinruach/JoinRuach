import Image from "next/image";
import Link from "next/link";
import { imgUrl } from "../../utils/strapi";

export type MediaCardProps = {
  title: string; href: string; excerpt?: string; category?: string;
  thumbnail?: { src?: string; alt?: string };
};

export default function MediaCard({ title, href, excerpt, category, thumbnail }: MediaCardProps) {
  const src = thumbnail?.src ? imgUrl(thumbnail.src) : undefined;
  return (
    <Link href={href} className="group overflow-hidden rounded-xl ring-1 ring-black/5 hover:ring-amber-400 transition">
      <div className="relative aspect-video">
        {src ? <Image src={src!} alt={thumbnail?.alt || title} fill className="object-cover transition-transform group-hover:scale-[1.02]" /> : <div className="h-full w-full bg-neutral-200" />}
      </div>
      <div className="p-4">
        {category && <div className="text-xs uppercase tracking-wide text-neutral-500">{category}</div>}
        <h3 className="mt-1 font-semibold">{title}</h3>
        {excerpt && <p className="mt-1 line-clamp-2 text-sm text-neutral-700">{excerpt}</p>}
      </div>
    </Link>
  );
}
