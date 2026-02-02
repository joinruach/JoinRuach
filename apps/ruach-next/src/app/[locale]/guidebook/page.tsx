/**
 * Guidebook Landing Page
 * Entry point for the formation journey
 */

import { getCurrentFormationState } from "@/lib/formation/state";
import { FormationPhase } from "@ruach/formation";
import Link from "next/link";
import { Suspense } from "react";
import ResumeJourneyCard from "@/components/guidebook/ResumeJourneyCard";
import RelatedCoursesSection from "@/components/guidebook/RelatedCoursesSection";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function CoursesSkeleton() {
  return (
    <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
      <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-white/10 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-200 dark:bg-white/10" />
        ))}
      </div>
    </section>
  );
}

export default async function GuidebookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Check if user has started formation journey
  const state = await getCurrentFormationState();

  // New user - show welcome and covenant entry
  if (!state) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              The Ruach Guidebook
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              A journey of spiritual formation through immersive teaching
            </p>
          </div>

          {/* Journey Overview */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">What is the Guidebook?</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              The Ruach Guidebook is a structured spiritual formation experience designed to
              deepen your understanding of Scripture, the Holy Spirit, and walking in covenant
              with God.
            </p>
            <p className="text-zinc-700 dark:text-zinc-300">
              Through carefully crafted phases, you'll engage with teaching, reflection, and
              practical application to grow in wisdom and discernment.
            </p>
          </div>

          {/* Formation Phases */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-xl font-bold mb-2 text-blue-900 dark:text-blue-100">
                Phase 1: Awakening
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Introduction to covenant thinking and spiritual foundations
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800 opacity-50">
              <h3 className="text-xl font-bold mb-2 text-purple-900 dark:text-purple-100">
                Phase 2: Separation
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Unlocked after completing Awakening
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800 opacity-50">
              <h3 className="text-xl font-bold mb-2 text-indigo-900 dark:text-indigo-100">
                Phases 3-5
              </h3>
              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                Discernment, Commission, Stewardship
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Link
              href="/guidebook/enter"
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg transition-colors"
            >
              Begin Your Journey →
            </Link>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Free • Self-paced • Covenant-based
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Existing user - show progress and continue button
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Welcome Back */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Continue your formation journey
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3 mb-12">
          {/* Left: Resume Journey (2 cols) */}
          <div className="lg:col-span-2">
            <ResumeJourneyCard state={state} locale={locale} />
          </div>

          {/* Right: Related Courses */}
          <div>
            <Suspense fallback={<CoursesSkeleton />}>
              <RelatedCoursesSection currentPhase={state.currentPhase} locale={locale} />
            </Suspense>
          </div>
        </div>


        {/* Available Phases */}
        <div>
          <h2 className="text-xl font-bold mb-4">Formation Phases</h2>
          <div className="space-y-4">
            <PhaseCard
              phase="awakening"
              title="Phase 1: Awakening"
              description="Introduction to covenant thinking and spiritual foundations"
              isUnlocked={true}
              isCurrent={state.currentPhase === FormationPhase.Awakening}
              href="/guidebook/awakening"
            />
            <PhaseCard
              phase="separation"
              title="Phase 2: Separation"
              description="Understanding separation from the world's systems"
              isUnlocked={false}
              isCurrent={state.currentPhase === FormationPhase.Separation}
              href="/guidebook/separation"
            />
            <PhaseCard
              phase="discernment"
              title="Phase 3: Discernment"
              description="Developing spiritual discernment and wisdom"
              isUnlocked={false}
              isCurrent={state.currentPhase === FormationPhase.Discernment}
              href="/guidebook/discernment"
            />
            <PhaseCard
              phase="commission"
              title="Phase 4: Commission"
              description="Receiving and walking in your calling"
              isUnlocked={false}
              isCurrent={state.currentPhase === FormationPhase.Commission}
              href="/guidebook/commission"
            />
            <PhaseCard
              phase="stewardship"
              title="Phase 5: Stewardship"
              description="Living as a faithful steward of God's kingdom"
              isUnlocked={false}
              isCurrent={state.currentPhase === FormationPhase.Stewardship}
              href="/guidebook/stewardship"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

// Helper to determine continue URL based on current phase
function getContinueUrl(phase: FormationPhase): string {
  switch (phase) {
    case FormationPhase.Awakening:
      return "/guidebook/awakening";
    case FormationPhase.Separation:
      return "/guidebook/separation";
    case FormationPhase.Discernment:
      return "/guidebook/discernment";
    case FormationPhase.Commission:
      return "/guidebook/commission";
    case FormationPhase.Stewardship:
      return "/guidebook/stewardship";
    default:
      return "/guidebook/awakening";
  }
}

// Phase Card Component
function PhaseCard({
  phase,
  title,
  description,
  isUnlocked,
  isCurrent,
  href,
}: {
  phase: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  isCurrent: boolean;
  href: string;
}) {
  const colors = {
    awakening: "blue",
    separation: "purple",
    discernment: "indigo",
    commission: "green",
    stewardship: "amber",
  } as const;

  const color = colors[phase as keyof typeof colors] || "blue";

  return (
    <Link
      href={isUnlocked ? href : "#"}
      className={`block p-6 rounded-lg border transition-all ${
        isUnlocked
          ? `bg-${color}-50 dark:bg-${color}-900/20 border-${color}-200 dark:border-${color}-800 hover:shadow-md`
          : "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">{title}</h3>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCurrent && (
            <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
              IN PROGRESS
            </span>
          )}
          {isUnlocked ? (
            <span className="text-2xl">→</span>
          ) : (
            <span className="text-2xl">🔒</span>
          )}
        </div>
      </div>
    </Link>
  );
}
