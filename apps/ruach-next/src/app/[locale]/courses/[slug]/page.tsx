import LocalizedLink from "@/components/navigation/LocalizedLink";
import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { notFound } from "next/navigation";
import CertificateButton from "@/components/ruach/CertificateButton";
import SEOHead from "@/components/ruach/SEOHead";
import { authOptions } from "@/lib/auth";
import { getCourseBySlug, imgUrl } from "@/lib/strapi";

// Extended session type with Strapi JWT
interface ExtendedSession {
  strapiJwt?: string;
  [key: string]: unknown;
}

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

interface LessonProgressRow {
  attributes?: {
    lessonSlug?: string | null;
  };
}

interface LessonProgressResponse {
  data?: LessonProgressRow[];
}

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
    .map((row) => row?.attributes?.lessonSlug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  return new Set(slugs);
}

export const dynamic = "auto";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  const a: any = course?.attributes || {};
  const title = a.seoTitle || a.title || "Course";
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
  const course = await getCourseBySlug(slug);
  if (!course) return notFound();

  const session = await getServerSession(authOptions as AuthOptions);
  const jwt = (session as ExtendedSession | null)?.strapiJwt;
  const completedLessons = jwt ? await getCompletedLessons(jwt, slug) : new Set<string>();

  const a = course.attributes;
  if (!a) {
    return notFound();
  }

  const lessonsRaw = Array.isArray(a.lessons?.data) ? a.lessons.data : [];
  const lessons = lessonsRaw
    .map((d) => (d as { attributes?: unknown })?.attributes)
    .filter((attrs): attrs is Record<string, unknown> => Boolean(attrs))
    .sort((x, y) => ((x.order as number | undefined) || 0) - ((y.order as number | undefined) || 0));

  const total = lessons.length;
  const completed = lessons.filter((lesson) => completedLessons.has(lesson.slug as string)).length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const firstLesson = lessons[0];
  const isAuthenticated = Boolean(jwt);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ruachministries.org";

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: a.title,
    description: a.description,
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
                alt={a.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-col gap-4 p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-neutral-500">Ruach Academy</span>
            <h1 className="text-3xl font-semibold text-neutral-900">{a.title}</h1>
            {a.description ? (
              <p className="text-neutral-600">{a.description}</p>
            ) : null}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-neutral-700">Progress</div>
              <div className="h-2 rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {completed} of {total} lessons complete
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-3">
              {isAuthenticated && firstLesson ? (
                <LocalizedLink href={`/courses/${slug}/${firstLesson.slug}`}>
                  <span className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
                    Resume Course
                  </span>
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
                completed={completed}
                total={total}
                courseSlug={slug}
                courseTitle={a.title}
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
            {total} lessons
          </div>
        </div>
        <ol className="mt-6 space-y-3">
          {lessons.map((lesson:any, index:number)=>(
            <li key={lesson.slug} className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 transition hover:border-amber-300/60">
              <LocalizedLink href={`/courses/${slug}/${lesson.slug}`}>
                <span className="flex items-center gap-4 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-white/10 text-sm font-semibold text-zinc-900 dark:text-white">
                    {lesson.order || index + 1}
                  </span>
                <div className="flex-1">
                  <div className="text-base font-semibold text-zinc-900 dark:text-white">{lesson.title}</div>
                  {lesson.summary ? (
                    <p className="text-sm text-zinc-500 dark:text-white/60">{lesson.summary}</p>
                  ) : null}
                </div>
                  <span className={`text-xs font-semibold ${completedLessons.has(lesson.slug) ? "text-emerald-300" : "text-zinc-400 dark:text-white/40"}`}>
                    {completedLessons.has(lesson.slug) ? "Completed" : "Start Lesson"}
                  </span>
                </span>
              </LocalizedLink>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
