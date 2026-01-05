import LocalizedLink from "@/components/navigation/LocalizedLink";
import CourseGrid from "@ruach/components/components/ruach/CourseGrid";
import type { Course as CourseCardType } from "@ruach/components/components/ruach/CourseCard";
import { getCourses, imgUrl } from "@/lib/strapi";
import { getCourseProgressMap } from "@/lib/api/courseProgress";
import { getViewerAccessContext } from "@/lib/access-context";
import { normalizeAccessLevel } from "@ruach/utils";

export const dynamic = "force-dynamic";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const { viewer, ownedCourseSlugs, jwt } = await getViewerAccessContext();

  const items = await getCourses();
  const courseSlugs = Array.from(
    new Set(
      (items || [])
        .map((course) => course?.attributes?.slug)
        .filter((slug): slug is string => typeof slug === "string")
    )
  );
  const progressMap = await getCourseProgressMap(courseSlugs, jwt);

  const courses: CourseCardType[] = (items || [])
    .map((course): CourseCardType | null => {
      const attributes = course?.attributes;
      if (!attributes) return null;

      const slug = attributes.slug;
      if (typeof slug !== "string") return null;

      const title =
        (typeof attributes.name === "string" && attributes.name.trim()) ||
        (typeof (attributes as any).seoTitle === "string" && (attributes as any).seoTitle.trim()) ||
        (typeof (attributes as any).excerpt === "string" && (attributes as any).excerpt.trim()) ||
        titleFromSlug(slug);

      const coverSource = attributes.cover as { data?: { attributes?: { url?: string } }; url?: string } | undefined;
      const coverUrl = coverSource?.data?.attributes?.url ?? coverSource?.url;
      const description = attributes.description;
      const progress = progressMap.get(slug);

      const courseCard: CourseCardType = {
        title,
        slug,
        ...(typeof description === "string" ? { description } : {}),
        ...(typeof coverUrl === "string" ? { coverUrl } : {}),
        ...(typeof attributes.unlockRequirements === "string" && attributes.unlockRequirements.trim()
          ? { unlockRequirements: attributes.unlockRequirements }
          : {}),
        progress: progress
          ? {
              percentComplete: progress.percentComplete,
              completedLessons: progress.completedLessons,
              totalLessons: progress.totalLessons,
            }
          : undefined,
        requiredAccessLevel: normalizeAccessLevel(attributes.requiredAccessLevel ?? null),
        viewer: viewer ?? null,
        ownsCourse: ownedCourseSlugs.includes(slug),
      };

      return courseCard;
    })
    .filter((course): course is CourseCardType => course !== null);

  const featuredCourse = (items || [])
    .map((course) => course?.attributes)
    .find((attrs) => Boolean(attrs));

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-10 text-zinc-900 dark:text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Ruach Academy</span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">Courses that disciple nations.</h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-600 dark:text-white/70">
          Engage with cinematic teachings, activation assignments, and community discussion designed to equip believers for deliverance, evangelism, and prophetic ministry.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedLink href="/login">
            <span className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300">
              Login to track progress
            </span>
          </LocalizedLink>
          <LocalizedLink href="/signup">
            <span className="rounded-full border border-zinc-300 dark:border-white/20 px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Create a free account
            </span>
          </LocalizedLink>
        </div>
      </section>

      {featuredCourse ? (
        <section className="grid gap-6 overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-white text-neutral-900 shadow-xl md:grid-cols-[1.2fr,1fr]">
          <div className="relative aspect-video md:aspect-auto">
            {featuredCourse.cover?.data?.attributes?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl(featuredCourse.cover?.data?.attributes?.url)!}
                alt={
                  (typeof featuredCourse.name === "string" && featuredCourse.name.trim()) ||
                  (typeof (featuredCourse as any).seoTitle === "string" && (featuredCourse as any).seoTitle.trim()) ||
                  (typeof featuredCourse.slug === "string" ? titleFromSlug(featuredCourse.slug) : "Course")
                }
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-neutral-200" />
            )}
          </div>
          <div className="flex flex-col gap-4 p-8">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Featured Series</span>
            <h2 className="text-2xl font-semibold text-neutral-900">
              {(typeof featuredCourse.name === "string" && featuredCourse.name.trim()) ||
                (typeof (featuredCourse as any).seoTitle === "string" && (featuredCourse as any).seoTitle.trim()) ||
                (typeof featuredCourse.slug === "string" ? titleFromSlug(featuredCourse.slug) : "Course")}
            </h2>
            {featuredCourse.description ? (
              <p className="text-neutral-600">{featuredCourse.description}</p>
            ) : (featuredCourse as any).excerpt ? (
              <p className="text-neutral-600">{(featuredCourse as any).excerpt}</p>
            ) : null}
            <div className="mt-auto">
              <LocalizedLink href={`/courses/${featuredCourse.slug}`}>
                <span className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
                  Start this course →
                </span>
              </LocalizedLink>
            </div>
          </div>
        </section>
      ) : null}

      {courses.length ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">All Courses</h2>
            <LocalizedLink href="/give">
              <span className="text-sm font-semibold text-amber-300 hover:text-amber-200">Sponsor a student →</span>
            </LocalizedLink>
          </div>
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white p-8 text-neutral-900">
            <CourseGrid courses={courses} />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-600 dark:text-white/70">
          Courses will be published soon. Stay tuned!
        </section>
      )}
    </div>
  );
}
