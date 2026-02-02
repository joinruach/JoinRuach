"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllPlaybackPositions, type PlaybackProgress } from "@/lib/media-progress";

type MediaItem = {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  progress: PlaybackProgress;
  progressPercent: number;
};

type Props = {
  jwt: string | undefined;
  locale: string;
};

export default function ContinueWatchingSection({ jwt, locale }: Props) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get all in-progress media from localStorage
    const positions = getAllPlaybackPositions();

    // Convert to array and calculate progress percentage
    const items = Object.entries(positions)
      .map(([id, progress]) => {
        const progressPercent = progress.duration > 0
          ? Math.round((progress.currentTime / progress.duration) * 100)
          : 0;

        return {
          id,
          slug: id, // For now, assume id is the slug
          title: `Media ${id}`, // Placeholder - would fetch from API
          progress,
          progressPercent,
        };
      })
      .filter((item) => item.progressPercent < 95 && item.progressPercent > 5) // Exclude nearly complete/barely started
      .sort((a, b) => new Date(b.progress.lastUpdated).getTime() - new Date(a.progress.lastUpdated).getTime())
      .slice(0, 4); // Show max 4 items

    setMediaItems(items);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
      </section>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Continue Watching</h2>
        <p className="mt-4 text-sm text-zinc-600 dark:text-white/70">
          You haven't started watching any content yet.
        </p>
        <Link
          href={`/${locale}/media`}
          className="mt-4 inline-flex items-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
        >
          Browse Media
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Continue Watching</h2>
        <Link
          href={`/${locale}/media`}
          className="text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
        >
          View all →
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {mediaItems.map((item) => (
          <Link
            key={item.id}
            href={`/${locale}/media/${item.slug}`}
            className="group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 transition hover:border-amber-400"
          >
            <div className="aspect-video bg-zinc-200 dark:bg-white/10">
              {item.thumbnail && (
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/50">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${item.progressPercent}%` }}
              />
            </div>

            <div className="p-3">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                {item.title}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/60">
                {item.progressPercent}% complete
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
