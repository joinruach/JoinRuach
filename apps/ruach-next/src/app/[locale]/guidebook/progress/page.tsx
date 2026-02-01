/**
 * Progress Dashboard
 *
 * Shows formation progress with:
 * - Checkpoint completion grid
 * - Phase readiness indicators
 * - Recent activity timeline
 * - Reflection archive with search
 * - Next checkpoint preview
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentFormationState } from "@/lib/formation/state";
import { ProgressGrid } from "@/components/formation/ProgressGrid";
import { PhaseReadiness } from "@/components/formation/PhaseReadiness";
import { ActivityTimeline } from "@/components/formation/ActivityTimeline";
import { ReflectionArchive } from "@/components/formation/ReflectionArchive";

interface ProgressPageProps {
  params: {
    locale: string;
  };
}

export default async function ProgressPage({ params }: ProgressPageProps) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    redirect(`/${params.locale}/auth/signin`);
  }

  // Get formation state
  const state = await getCurrentFormationState();
  if (!state) {
    redirect(`/${params.locale}/guidebook/enter`);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            Formation Progress
          </h1>
          <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
            Track your journey through the formation phases
          </p>
        </header>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Checkpoint Progress Grid */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
                Checkpoint Progress
              </h2>
              <ProgressGrid state={state} locale={params.locale} />
            </section>

            {/* Activity Timeline */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
                Recent Activity
              </h2>
              <ActivityTimeline state={state} />
            </section>
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-8">
            {/* Phase Readiness */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
                Phase Readiness
              </h2>
              <PhaseReadiness state={state} />
            </section>
          </div>
        </div>

        {/* Full Width Section */}
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
            Reflection Archive
          </h2>
          <ReflectionArchive state={state} locale={params.locale} />
        </section>
      </div>
    </div>
  );
}
