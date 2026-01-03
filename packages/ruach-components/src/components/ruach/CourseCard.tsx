'use client';

import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import { imgUrl } from "../../utils/strapi";
import { useCourseProgress } from "../../hooks/useCourseProgress";

export type AccessLevel = "basic" | "full" | "leader";

export type CourseProgress = {
  percentComplete: number;
  completedLessons: number;
  totalLessons: number;
};

export type Course = {
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  ctaLabel?: string;
  unlockRequirements?: string;
  requiredAccessLevel?: AccessLevel;
  viewerAccessLevel?: AccessLevel;
  progress?: CourseProgress;
};

const ACCESS_LEVEL_RANK: Record<AccessLevel, number> = {
  basic: 1,
  full: 2,
  leader: 3,
};

const ACCESS_LEVEL_LABEL: Record<AccessLevel, string> = {
  basic: "Supporter",
  full: "Partner",
  leader: "Builder",
};

export function CourseCard({
  title,
  slug,
  description,
  coverUrl,
  ctaLabel,
  unlockRequirements,
  requiredAccessLevel,
  viewerAccessLevel,
  progress,
}: Course): ReactElement {
  const initialProgress = progress
    ? {
        courseSlug: slug,
        percentComplete: progress.percentComplete,
        completedLessons: progress.completedLessons,
        totalLessons: progress.totalLessons,
      }
    : undefined;

  const { loading, percentComplete, started, completed } = useCourseProgress(slug, initialProgress);

  const viewerLevel: AccessLevel = viewerAccessLevel ?? "basic";
  const courseLevel: AccessLevel = requiredAccessLevel ?? "basic";
  const isLocked = ACCESS_LEVEL_RANK[viewerLevel] < ACCESS_LEVEL_RANK[courseLevel];

  const ctaText = isLocked
    ? `Upgrade to unlock`
    : completed
      ? "Review course"
      : started
        ? "Continue course"
        : ctaLabel ?? "Start course";

  return (
    <Link
      href={`/courses/${slug}`}
      className={`group overflow-hidden rounded-xl ring-1 ring-black/5 transition ${
        isLocked ? "cursor-not-allowed opacity-80 hover:ring-black/10" : "hover:ring-amber-400"
      }`}
      aria-disabled={isLocked}
    >
      <div className="relative aspect-[16/9] bg-neutral-200">
        {coverUrl && (
          <Image
            src={imgUrl(coverUrl)!}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        )}
        {isLocked ? (
          <span className="absolute right-3 top-3 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">
            {ACCESS_LEVEL_LABEL[courseLevel]} tier
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{title}</h3>
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.35em] ${
              isLocked ? "text-amber-500" : "text-emerald-500"
            }`}
          >
            {isLocked ? "Locked" : completed ? "Complete" : started ? "In progress" : "New"}
          </span>
        </div>
        {description && <p className="mt-1 line-clamp-2 text-sm text-neutral-700">{description}</p>}
        {unlockRequirements && (
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
            {unlockRequirements}
          </p>
        )}
        {!isLocked && (
          <div className="mt-4 space-y-1">
            {loading ? (
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Loading progress…</p>
            ) : percentComplete !== null ? (
              <>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className={`h-full rounded-full bg-amber-400 transition-all ${
                      completed ? "bg-emerald-400" : ""
                    }`}
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                  {percentComplete}% complete
                </p>
              </>
            ) : null}
          </div>
        )}
        <div className="mt-4">
          <span
            className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isLocked
                ? "border-amber-300 bg-amber-50 text-amber-600"
                : "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            {ctaText}
          </span>
        </div>
      </div>
    </Link>
  );
}
