import LocalizedLink from "@/components/navigation/LocalizedLink";
import CourseGrid from "@ruach/components/components/ruach/CourseGrid";
import type { Course } from "@ruach/components/components/ruach/CourseCard";
import { getCourses, imgUrl } from "@/lib/strapi";

export const dynamic = "force-static";

export default async function CoursesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  const items = await getCourses();
  const courses: Course[] = (items || [])
    .map((c) => {
      const attributes = c?.attributes;
      if (!attributes) return null;

      const title = attributes.name;
      const slug = attributes.slug;

      if (typeof title !== "string" || typeof slug !== "string") return null;

      const description = attributes.description;
      const coverUrl = attributes.cover?.data?.attributes?.url;

      const course: Course = {
        title,
        slug,
        ...(typeof description === "string" ? { description } : {}),
        ...(typeof coverUrl === "string" ? { coverUrl } : {})
      };

      return course;
    })
    .filter((course): course is Course => course !== null);

  const featuredCourse = (items || [])
    .map((c) => c?.attributes)
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
                alt={featuredCourse.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-neutral-200" />
            )}
          </div>
          <div className="flex flex-col gap-4 p-8">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Featured Series</span>
            <h2 className="text-2xl font-semibold text-neutral-900">{featuredCourse.name}</h2>
            {featuredCourse.description ? (
              <p className="text-neutral-600">{featuredCourse.description}</p>
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
        <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-600 dark:text-white/70">
          Courses will be published soon. Stay tuned!
        </section>
      )}
    </div>
  );
}
