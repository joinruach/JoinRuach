import LocalizedLink from "@/components/navigation/LocalizedLink";
import { auth } from "@/lib/auth";
import LessonPlayer from "@/components/ruach/LessonPlayer";
import LessonTranscript from "@/components/ruach/LessonTranscript";
import LessonDiscussion, { type Comment } from "@/components/ruach/LessonDiscussion";
import SEOHead from "@/components/ruach/SEOHead";
import MiniCourseTabs from "@/components/ruach/MiniCourseTabs";
import RenunciationHoldButton from "@/components/ruach/RenunciationHoldButton";
import OneStepContract from "@/components/ruach/OneStepContract";
import { getCourseBySlug, imgUrl } from "@/lib/strapi";

export const dynamic = "force-dynamic";

interface ExtendedSession {
  strapiJwt?: string;
  [key: string]: unknown;
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

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
  return (j.data ?? []).map((row:any)=>{
    const attrs = row?.attributes ?? row ?? {};
    const user = attrs?.user?.data?.attributes ?? attrs?.user?.attributes ?? attrs?.user ?? {};
    return {
      id: row.id,
      author: user?.username || user?.email || "User",
      text: attrs?.text,
      createdAt: attrs?.createdAt
    };
  });
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonSlug: string }> }){
  const { slug, lessonSlug } = await params;
  const session = await auth();
  const jwt = (session as ExtendedSession | null)?.strapiJwt;
  const course = await getCourseBySlug(slug, jwt);
  const lessonsRaw = (course?.attributes?.lessons?.data ?? []).map((d:any)=>d.attributes).sort((x:any,y:any)=>(x.order||0)-(y.order||0));
  const lesson = lessonsRaw.find((x:any)=>x.slug===lessonSlug);
  const totalLessons = lessonsRaw.length;
  if (!course || !lesson) {
    return <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 text-zinc-600 dark:text-white/70">Lesson not found.</div>;
  }

  const courseTitle =
    (typeof (course.attributes as any)?.name === "string" && (course.attributes as any).name.trim()) ||
    (typeof (course.attributes as any)?.seoTitle === "string" && (course.attributes as any).seoTitle.trim()) ||
    titleFromSlug(slug);

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
      name: courseTitle,
      url: `${site}/courses/${slug}`
    },
    provider: {
      "@type": "Organization",
      name: "Ruach Ministries",
      url: site
    }
  };

  const miniLanding = course.attributes?.landingConfig;
  const playerConfig = course.attributes?.playerConfig;
  const auditConfig = course.attributes?.auditConfig;
  const deliverable = miniLanding?.deliverable;
  const isMiniCourse = Boolean(miniLanding);
  const freedomLabels =
    playerConfig?.freedomMeterLabels?.filter(Boolean) ?? ["Clarity", "Separation", "Replacement", "Witness"];
  const normalizedProgress = totalLessons > 0 ? (currentIndex + 1) / totalLessons : 0;
  const convictionHours = playerConfig?.convictionTimerHours ?? 24;
  const windowLabel = playerConfig?.windowOfObedienceLabel ?? "Window of Obedience";
  const isActivationLesson =
    typeof lesson.order === "number" ? lesson.order >= totalLessons : currentIndex >= totalLessons - 1;

  return (
    <div className="space-y-12">
      <SEOHead jsonLd={lessonSchema} />
      <nav className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-white/50">
        <LocalizedLink href="/courses"><span className="text-zinc-500 dark:text-white/60 transition hover:text-zinc-900 dark:hover:text-white">Courses</span></LocalizedLink>
        <span>/</span>
        <LocalizedLink href={`/courses/${slug}`}><span className="text-zinc-500 dark:text-white/60 transition hover:text-zinc-900 dark:hover:text-white">{courseTitle}</span></LocalizedLink>
        <span>/</span>
        <span className="text-zinc-900 dark:text-white">{lesson.title}</span>
      </nav>

      {isMiniCourse ? (
        <section className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 text-neutral-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-amber-500">
              <span>Freedom meter</span>
              <span className="text-xs font-semibold text-neutral-600 dark:text-white/70">{Math.round(normalizedProgress * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${Math.min(100, normalizedProgress * 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              {freedomLabels.map((label, index) => {
                const milestone = (index + 1) / freedomLabels.length;
                const status = normalizedProgress >= milestone ? "Complete" : "Next";
                return (
                  <div
                    key={`${label}-${index}`}
                    className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 font-semibold text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <span>{label}</span>
                    <span className="text-amber-500">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-neutral-900">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-500">{windowLabel}</p>
            <p className="text-lg font-semibold">{convictionHours} hours</p>
            <p className="text-xs text-neutral-600">
              {isActivationLesson
                ? "This timer begins after Activation—don’t delay what He made clear."
                : "Keep the obedience window soft and responsive until the step lands."}
            </p>
          </div>
          <MiniCourseTabs lessonTitle={lesson.title} lessonSummary={lesson.summary} playerConfig={playerConfig} />
          <RenunciationHoldButton seconds={auditConfig?.renunciationHoldSeconds ?? 5} />
          <OneStepContract template={auditConfig?.obedienceCardTemplate} />
          {deliverable?.auditWizardUrl ? (
            <LocalizedLink href={deliverable.auditWizardUrl}>
              <span className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-700">
                {deliverable.title ? `Start ${deliverable.title}` : "Start the Audit Wizard"}
              </span>
            </LocalizedLink>
          ) : null}
        </section>
      ) : null}

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
