import Link from "next/link";
import Image from "next/image";
import { FormationPhase } from "@ruach/formation";
import { getCourses, imgUrl } from "@/lib/strapi";
import { extractAttributes, extractSingleRelation } from "@/lib/strapi-normalize";
import type { CourseEntity } from "@/lib/types/strapi-types";

type Props = {
  currentPhase: FormationPhase;
  locale: string;
};

// Map phases to relevant course topics/keywords
const PHASE_COURSE_KEYWORDS = {
  [FormationPhase.Awakening]: ["foundation", "covenant", "scripture", "truth"],
  [FormationPhase.Separation]: ["separation", "holiness", "worldliness", "sanctification"],
  [FormationPhase.Discernment]: ["discernment", "spiritual", "wisdom", "prophetic"],
  [FormationPhase.Commission]: ["calling", "mission", "purpose", "commission"],
  [FormationPhase.Stewardship]: ["stewardship", "faithfulness", "kingdom", "multiplication"],
};

export default async function RelatedCoursesSection({ currentPhase, locale }: Props) {
  // Fetch all courses
  const courses = await getCourses();
  if (!courses || courses.length === 0) return null;

  // Get keywords for current phase
  const keywords = PHASE_COURSE_KEYWORDS[currentPhase] || [];

  // Filter courses by relevance to phase keywords
  const relevantCourses = courses
    .map((course) => {
      const attributes = extractAttributes<CourseEntity["attributes"]>(course);
      if (!attributes) return null;

      const slug = typeof attributes.slug === "string" ? attributes.slug : null;
      if (!slug) return null;

      const name = String(attributes.name || "");
      const description = String(attributes.description || "");
      const searchText = `${name} ${description}`.toLowerCase();

      // Calculate relevance score
      const relevanceScore = keywords.reduce((score, keyword) => {
        return searchText.includes(keyword) ? score + 1 : score;
      }, 0);

      if (relevanceScore === 0) return null;

      const coverMedia = extractSingleRelation<{ url?: string }>(attributes.cover);

      return {
        slug,
        name,
        description,
        coverUrl: coverMedia?.url ? imgUrl(coverMedia.url) : null,
        relevanceScore,
      };
    })
    .filter((course): course is NonNullable<typeof course> => course !== null)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3); // Show top 3 most relevant

  if (relevantCourses.length === 0) return null;

  return (
    <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Deepen Your Learning
          </h2>
          <p className="text-sm text-zinc-600 dark:text-white/70 mt-1">
            Courses that complement your current phase
          </p>
        </div>
        <Link
          href={`/${locale}/courses`}
          className="text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-4">
        {relevantCourses.map((course) => (
          <Link
            key={course.slug ?? course.name}
            href={`/${locale}/courses/${course.slug}`}
            className="group flex gap-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 transition hover:border-amber-400"
          >
            {course.coverUrl && (
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-white/10">
                <Image
                  src={course.coverUrl}
                  alt={course.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                {course.name}
              </h3>
              {course.description && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-white/60 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center">
              <svg
                className="h-5 w-5 text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 p-4 border border-amber-100 dark:border-amber-900/30">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          <strong>Tip:</strong> Formation happens through the Guidebook. Courses provide deeper topical study to supplement your journey.
        </p>
      </div>
    </section>
  );
}
