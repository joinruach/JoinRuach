import LocalizedLink from "@/components/navigation/LocalizedLink";
import { notFound } from "next/navigation";
import CertificateButton from "@/components/ruach/CertificateButton";
import SEOHead from "@/components/ruach/SEOHead";
import { getCourseBySlug, imgUrl } from "@/lib/strapi";
import { parseAccessLevel } from "@/lib/access-level";
import type { AccessLevel as CourseAccessLevel } from "@ruach/components/components/ruach/CourseCard";
import { getCourseProgress } from "@/lib/api/courseProgress";
import { cn } from "@/lib/cn";
import { requireCourseLicense } from "@/lib/require-course-license";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

interface LessonProgressRow {
  attributes?: {
    lessonSlug?: string | null;
  };
  lessonSlug?: string | null;
}

interface LessonProgressResponse {
  data?: LessonProgressRow[];
}

const ACCESS_LEVEL_RANK: Record<CourseAccessLevel, number> = {
  basic: 1,
  full: 2,
  leader: 3,
};

const ACCESS_LEVEL_LABEL: Record<CourseAccessLevel, string> = {
  basic: "Supporter",
  full: "Partner",
  leader: "Builder",
};

async function getCompletedLessons(jwt: string, courseSlug: string) {
  const params = new URLSearchParams({
    "filters[courseSlug][$eq]": courseSlug,
    "filters[completed][$eq]": "true",
    "pagination[pageSize]": "200"
  });
  const res = await fetch(`${STRAPI}/api/lesson-progresses?${params.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store"
  });
  if (!res.ok) return new Set<string>();
  const json = (await res.json()) as LessonProgressResponse;
  const data: LessonProgressRow[] = Array.isArray(json?.data) ? json.data : [];
  const slugs = data
    .map((row) => row?.attributes?.lessonSlug ?? row?.lessonSlug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  return new Set(slugs);
}

export const dynamic = "auto";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  const a: any = course?.attributes || {};
  const title = a.seoTitle || a.name || "Course";
  const desc = a.seoDescription || a.description || "";
  const image = imgUrl(a.seoImage?.data?.attributes?.url || a.cover?.data?.attributes?.url);
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: image ? [image] : [] }
  };
}

export default async function CourseDetail({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params;
  const { jwt, membership } = await requireCourseLicense(slug, `/courses/${slug}`);
  const course = await getCourseBySlug(slug, jwt);
  if (!course) return notFound();
  const completedLessons = jwt ? await getCompletedLessons(jwt, slug) : new Set<string>();
  const progressData = jwt ? await getCourseProgress(slug, jwt) : null;

  const a = course.attributes;
  if (!a) {
    return notFound();
  }

  const courseTitle =
    (typeof (a as any).name === "string" && (a as any).name.trim()) ||
    (typeof (a as any).seoTitle === "string" && (a as any).seoTitle.trim()) ||
    (typeof (a as any).excerpt === "string" && (a as any).excerpt.trim()) ||
    titleFromSlug(slug);

  type ParsedLesson = {
    slug: string;
    title: string;
    summary?: string;
    order?: number;
    requiredAccessLevel: CourseAccessLevel;
  };

  const lessonsRaw = Array.isArray(a.lessons?.data) ? a.lessons.data : [];
  const lessons: ParsedLesson[] = lessonsRaw
    .map((item) => (item as { attributes?: Record<string, unknown> })?.attributes)
    .filter((attrs): attrs is Record<string, unknown> => Boolean(attrs && typeof attrs.slug === "string"))
    .map((attrs) => {
      const slugValue = (attrs.slug as string) ?? "";
      const rawTitle = attrs.title as string | undefined;
      const rawOrder = attrs.order;
      const rawSummary = attrs.summary as string | undefined;
      const rawAccess = parseAccessLevel((attrs.requiredAccessLevel as string | undefined) ?? undefined);
      return {
        slug: slugValue,
        title: rawTitle && rawTitle.trim() ? rawTitle : titleFromSlug(slugValue),
        summary: rawSummary && rawSummary.trim() ? rawSummary : undefined,
        order: typeof rawOrder === "number" ? rawOrder : undefined,
        requiredAccessLevel: rawAccess,
      };
    })
    .sort((x, y) => ((x.order ?? 0) || 0) - ((y.order ?? 0) || 0));

  const totalLessons = lessons.length;
  const completedLessonsCount = progressData?.completedLessons ?? lessons.filter((lesson) => completedLessons.has(lesson.slug)).length;
  const totalFromProgress = progressData?.totalLessons ?? totalLessons;
  const progressPercent =
    progressData?.percentComplete ??
    (totalFromProgress > 0 ? Math.round((completedLessonsCount / totalFromProgress) * 100) : 0);
  const firstLesson = lessons[0];
  const nextLesson =
    lessons.find((lesson) => !completedLessons.has(lesson.slug)) ?? firstLesson;
  const resumeLesson = nextLesson ?? firstLesson;
  const isAuthenticated = Boolean(jwt);
  const continueUrl =
    resumeLesson && resumeLesson.slug ? `/courses/${slug}/${resumeLesson.slug}` : `/courses/${slug}`;
  const continueLabel =
    totalFromProgress > 0 && completedLessonsCount >= totalFromProgress ? "Review course" : "Resume course";
  const membershipAccessLevel = parseAccessLevel(membership?.accessLevel ?? undefined);
  const membershipRank = ACCESS_LEVEL_RANK[membershipAccessLevel];
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ruachministries.org";

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: courseTitle,
    description: a.description || (a as any).excerpt,
    provider: {
      "@type": "Organization",
      name: "Ruach Ministries",
      url: site
    },
    url: `${site}/courses/${slug}`,
    numberOfCredits: lessons.length ? String(lessons.length) : undefined
  };

  return (
    <div className="space-y-12">
      <SEOHead jsonLd={courseSchema} />
      <section className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-white text-neutral-900 shadow-xl">
        <div className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
          <div className="relative min-h-[240px] bg-neutral-200">
            {a.cover?.data?.attributes?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl(a.cover?.data?.attributes?.url)!}
              alt={courseTitle}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-col gap-4 p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-neutral-500">Ruach Academy</span>
            <h1 className="text-3xl font-semibold text-neutral-900">{courseTitle}</h1>
            {a.description || (a as any).excerpt ? (
              <p className="text-neutral-600">{a.description || (a as any).excerpt}</p>
            ) : null}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-neutral-700">Progress</div>
              <div className="h-2 rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-500">
                <span>
                  {completedLessonsCount} of {totalFromProgress} lessons complete
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">{progressPercent}%</span>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-3">
              {isAuthenticated && resumeLesson ? (
                <LocalizedLink href={continueUrl} className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
                  {continueLabel}
                </LocalizedLink>
              ) : (
                <>
                  <LocalizedLink href="/login">
                    <span className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
                      Login to start
                    </span>
                  </LocalizedLink>
                  <LocalizedLink href="/signup">
                    <span className="inline-flex items-center rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-500">
                      Create an account
                    </span>
                  </LocalizedLink>
                </>
              )}
              <CertificateButton
                completed={completedLessonsCount}
                total={totalFromProgress}
                courseSlug={slug}
                courseTitle={a.name}
                href={`/api/certificate/${slug}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Course Outline</h2>
            <p className="text-sm text-zinc-600 dark:text-white/70">Work through each lesson to unlock your completion certificate.</p>
          </div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/50">
            {totalLessons} lessons
          </div>
        </div>
        {lessons.length ? (
          <ol className="mt-6 space-y-3">
            {lessons.map((lesson, index) => {
              const hasCompleted = completedLessons.has(lesson.slug);
              const lessonRank = ACCESS_LEVEL_RANK[lesson.requiredAccessLevel];
              const lessonLabel = ACCESS_LEVEL_LABEL[lesson.requiredAccessLevel];
              const isLocked = lessonRank > membershipRank;
              const statusText = isLocked ? "Locked" : hasCompleted ? "Completed" : "Start lesson";
              const statusClasses = isLocked
                ? "text-amber-400"
                : hasCompleted
                  ? "text-emerald-400"
                  : "text-zinc-400 dark:text-white/40";

              return (
                <li
                  key={lesson.slug}
                  className={cn(
                    "rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 transition",
                    isLocked ? "cursor-not-allowed opacity-70" : "hover:border-amber-300/60"
                  )}
                >
                  <LocalizedLink
                    href={`/courses/${slug}/${lesson.slug}`}
                    className={cn(
                      "flex items-center gap-4 p-5",
                      isLocked ? "cursor-not-allowed" : ""
                    )}
                    aria-disabled={isLocked}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-white/10 text-sm font-semibold text-zinc-900 dark:text-white">
                      {lesson.order ?? index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-base font-semibold text-zinc-900 dark:text-white">{lesson.title}</div>
                        {lesson.requiredAccessLevel !== "basic" ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-600">
                            {lessonLabel} tier
                          </span>
                        ) : null}
                      </div>
                      {lesson.summary ? (
                        <p className="text-sm text-zinc-500 dark:text-white/60">{lesson.summary}</p>
                      ) : null}
                    </div>
                    <span className={`text-xs font-semibold ${statusClasses}`}>{statusText}</span>
                  </LocalizedLink>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5 text-sm text-zinc-600 dark:text-white/70">
            Lessons will be published soon. Check back later.
          </div>
        )}
      </section>
    </div>
  );
}
