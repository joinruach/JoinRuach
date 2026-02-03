import Link from "next/link";
import type { FormationState } from "@ruach/formation";
import { FormationPhase } from "@ruach/formation";

type Props = {
  state: FormationState;
  locale: string;
};

export default function ResumeJourneyCard({ state, locale }: Props) {
  const getPhaseInfo = (phase: FormationPhase) => {
    const phases = {
      [FormationPhase.Awakening]: {
        title: "Awakening",
        color: "blue",
        description: "Reorient your beliefs around Scripture",
        href: `/guidebook/awakening`,
      },
      [FormationPhase.Separation]: {
        title: "Separation",
        color: "purple",
        description: "Understand separation from worldly systems",
        href: `/guidebook/separation`,
      },
      [FormationPhase.Discernment]: {
        title: "Discernment",
        color: "indigo",
        description: "Develop spiritual discernment",
        href: `/guidebook/discernment`,
      },
      [FormationPhase.Commission]: {
        title: "Commission",
        color: "green",
        description: "Receive and walk in your calling",
        href: `/guidebook/commission`,
      },
      [FormationPhase.Stewardship]: {
        title: "Stewardship",
        color: "amber",
        description: "Live as a faithful steward",
        href: `/guidebook/stewardship`,
      },
    };

    return phases[phase] || phases[FormationPhase.Awakening];
  };

  const phaseInfo = getPhaseInfo(state.currentPhase);
  const progressPercent = Math.round(
    (state.checkpointsCompleted.length / (state.checkpointsCompleted.length + 10)) * 100
  );
  const dwellTimeMinutes =
    (state as { dwellTimeMinutes?: number }).dwellTimeMinutes ??
    Math.round(((state as { dwellTimeSeconds?: number }).dwellTimeSeconds ?? 0) / 60);

  // Derived minutes from seconds when not provided by formation state
  const dwellMinutes = Math.round((state as any).dwellTimeSeconds ? (state as any).dwellTimeSeconds / 60 : 0);

  return (
    <section className="rounded-3xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-white/5 p-8 shadow-lg">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Resume Your Journey
          </h2>
          <p className="text-sm text-zinc-600 dark:text-white/70">
            Pick up where you left off in your formation
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Current Phase */}
      <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Current Phase
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">
              {phaseInfo.title}
            </div>
          </div>
          <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            In Progress
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-white/70 mb-4">
          {phaseInfo.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-white/60 mb-1">
            <span>{state.checkpointsCompleted.length} checkpoints completed</span>
            <span>{state.daysInPhase} days active</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg bg-white dark:bg-white/5 p-3 border border-amber-100 dark:border-amber-900/30">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {state.reflectionsSubmitted}
          </div>
          <div className="text-xs text-zinc-600 dark:text-white/60">
            Reflections
          </div>
        </div>
        <div className="rounded-lg bg-white dark:bg-white/5 p-3 border border-amber-100 dark:border-amber-900/30">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {dwellTimeMinutes}m
          </div>
          <div className="text-xs text-zinc-600 dark:text-white/60">
            Time Invested
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <Link
        href={`/${locale}${phaseInfo.href}`}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
      >
        Continue Formation
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </Link>
    </section>
  );
}
