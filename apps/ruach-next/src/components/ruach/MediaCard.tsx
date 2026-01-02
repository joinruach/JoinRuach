"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next-intl/link";
import { imgUrl } from "@/lib/strapi";
import LiveIndicator from "@/components/livestream/LiveIndicator";
import { useMediaPlayer } from "@/hooks/useMediaPlayer";
import type { MediaItem, VideoSource } from "@/contexts/MediaPlayerContext";

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
  isLive?: boolean;
  // For global player integration
  mediaId?: string | number;
  videoSource?: VideoSource;
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
  isLive,
  mediaId,
  videoSource,
}: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { actions } = useMediaPlayer();
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

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!mediaId || !videoSource) return;

    const mediaItem: MediaItem = {
      id: mediaId,
      title,
      source: videoSource,
      thumbnail: src,
      durationSec,
    };

    actions.loadMedia(mediaItem, true);
  };

  const showPlayButton = Boolean(mediaId && videoSource && !isLive);

  return (
    <Link href={href}>
      <div
        className="group overflow-hidden rounded-xl ring-1 ring-black/5 transition hover:ring-amber-400"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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

        {/* Live badge overlay */}
        {isLive && (
          <div className="absolute left-3 top-3">
            <LiveIndicator isLive={true} size="sm" />
          </div>
        )}

        {/* Play button overlay (hover state) */}
        {showPlayButton && isHovered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity">
            <button
              onClick={handlePlayClick}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition hover:bg-amber-600 hover:scale-110"
              aria-label="Play video"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="ml-1 h-8 w-8"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
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
    </div>
    </Link>
  );
}
