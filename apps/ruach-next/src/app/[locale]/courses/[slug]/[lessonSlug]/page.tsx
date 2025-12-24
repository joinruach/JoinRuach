import LocalizedLink from "@/components/navigation/LocalizedLink";
import LessonPlayer from "@/components/ruach/LessonPlayer";
import LessonTranscript from "@/components/ruach/LessonTranscript";
import LessonDiscussion, { type Comment } from "@/components/ruach/LessonDiscussion";
import SEOHead from "@/components/ruach/SEOHead";
import { getCourseBySlug, imgUrl } from "@/lib/strapi";

export const dynamic = "force-dynamic";

async function getComments(courseSlug: string, lessonSlug: string): Promise<Comment[]> {
  const r = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/lesson-comments?` + new URLSearchParams({
    "filters[courseSlug][$eq]": courseSlug,
    "filters[lessonSlug][$eq]": lessonSlug,
    "filters[approved][$eq]": "true",
    "sort[0]": "createdAt:desc",
    "populate": "user",
    "pagination[pageSize]": "50"
  }), { cache: "no-store" });
  const j = await r.json();
  return (j.data ?? []).map((row:any)=>({
    id: row.id,
    author: row.attributes?.user?.data?.attributes?.username || row.attributes?.user?.data?.attributes?.email || "User",
    text: row.attributes?.text,
    createdAt: row.attributes?.createdAt
  }));
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonSlug: string }> }){
  const { slug, lessonSlug } = await params;
  const course = await getCourseBySlug(slug);
  const lessonsRaw = (course?.attributes?.lessons?.data ?? []).map((d:any)=>d.attributes).sort((x:any,y:any)=>(x.order||0)-(y.order||0));
  const lesson = lessonsRaw.find((x:any)=>x.slug===lessonSlug);
  if (!course || !lesson) {
    return <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 text-zinc-600 dark:text-white/70">Lesson not found.</div>;
  }

  const comments = await getComments(slug, lessonSlug);
  const currentIndex = lessonsRaw.findIndex((l:any)=>l.slug===lesson.slug);
  const prevLesson = currentIndex > 0 ? lessonsRaw[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessonsRaw.length - 1 ? lessonsRaw[currentIndex + 1] : null;
  const transcriptHtml = lesson.transcript_html || lesson.transcriptHtml || lesson.transcript;
  const transcriptDownloadRaw = lesson.transcriptDownload || lesson.transcript_download || lesson.transcriptFile?.data?.attributes?.url;
  const transcriptDownload = transcriptDownloadRaw ? imgUrl(transcriptDownloadRaw) : undefined;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ruachministries.org";
  const lessonSchema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary || lesson.title,
    url: `${site}/courses/${slug}/${lessonSlug}`,
    isPartOf: {
      "@type": "Course",
      name: course.attributes?.title,
      url: `${site}/courses/${slug}`
    },
    provider: {
      "@type": "Organization",
      name: "Ruach Ministries",
      url: site
    }
  };

  return (
    <div className="space-y-12">
      <SEOHead jsonLd={lessonSchema} />
      <nav className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-white/50">
        <LocalizedLink href="/courses"><span className="text-zinc-500 dark:text-white/60 transition hover:text-zinc-900 dark:hover:text-white">Courses</span></LocalizedLink>
        <span>/</span>
        <LocalizedLink href={`/courses/${slug}`}><span className="text-zinc-500 dark:text-white/60 transition hover:text-zinc-900 dark:hover:text-white">{course.attributes?.title}</span></LocalizedLink>
        <span>/</span>
        <span className="text-zinc-900 dark:text-white">{lesson.title}</span>
      </nav>

      <section className="space-y-6 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8">
        <div className="space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-white/60">Lesson {lesson.order || currentIndex + 1}</span>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">{lesson.title}</h1>
          {lesson.summary ? (
            <p className="text-sm text-zinc-600 dark:text-white/70">{lesson.summary}</p>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-black">
          <LessonPlayer src={lesson.video_url || lesson.videoUrl} courseSlug={slug} lessonSlug={lessonSlug} />
        </div>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {lesson.duration ? (
            <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/50">
              {lesson.duration} minutes
            </div>
          ) : null}
          <div className="flex gap-3 sm:ml-auto">
            {prevLesson ? (
              <LocalizedLink href={`/courses/${slug}/${prevLesson.slug}`}>
                <span className="inline-flex items-center rounded-full border border-zinc-300 dark:border-white/20 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
                  ← Previous Lesson
                </span>
              </LocalizedLink>
            ) : null}
            {nextLesson ? (
              <LocalizedLink href={`/courses/${slug}/${nextLesson.slug}`}>
                <span className="inline-flex items-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300">
                  Next Lesson →
                </span>
              </LocalizedLink>
            ) : null}
          </div>
        </div>
      </section>

      <LessonTranscript html={transcriptHtml} downloadHref={transcriptDownload} />

      <LessonDiscussion
        comments={comments}
        onSubmit={async (text)=>{
          const r = await fetch("/api/comments",{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ courseSlug: slug, lessonSlug, text })
          });
          const j = await r.json().catch(()=>({}));
          if (r.ok && j?.approved) { /* optionally refetch */ }
          return { approved: !!j?.approved };
        }}
      />
    </div>
  );
}
