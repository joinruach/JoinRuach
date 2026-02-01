"use client";

import { useMemo } from "react";
import { FormationState } from "@ruach/formation";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

interface ProgressGridProps {
  state: FormationState;
  locale: string;
}

/**
 * Checkpoint completion visualization grid
 * Shows all checkpoints in a grid with completion status
 */
export function ProgressGrid({ state, locale }: ProgressGridProps) {
  // Mock checkpoint data - in production, this would come from content
  const mockCheckpoints = useMemo(() => {
    const checkpoints = [];
    const phases = [
      {
        phase: "awakening",
        name: "Awakening",
        count: 4,
      },
    ];

    for (const phaseData of phases) {
      for (let i = 1; i <= phaseData.count; i++) {
        const checkpointId = `checkpoint-${phaseData.phase}-${i}`;
        checkpoints.push({
          id: checkpointId,
          phase: phaseData.phase,
          phaseName: phaseData.name,
          order: i,
          title: `${phaseData.name} ${i}`,
          isCompleted: state.checkpointsCompleted.includes(checkpointId),
          isReached: state.checkpointsReached.includes(checkpointId),
        });
      }
    }
    return checkpoints;
  }, [state]);

  // Group by phase
  const groupedByPhase = useMemo(() => {
    return mockCheckpoints.reduce(
      (acc, cp) => {
        if (!acc[cp.phase]) {
          acc[cp.phase] = {
            name: cp.phaseName,
            checkpoints: [],
          };
        }
        acc[cp.phase].checkpoints.push(cp);
        return acc;
      },
      {} as Record<
        string,
        { name: string; checkpoints: (typeof mockCheckpoints)[0][] }
      >
    );
  }, [mockCheckpoints]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = mockCheckpoints.filter((cp) => cp.isCompleted).length;
    const total = mockCheckpoints.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }, [mockCheckpoints]);

  const phases = ["awakening"];

  return (
    <div className="space-y-6">
      {/* Overall Progress Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Completed
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
            {stats.completed}
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            of {stats.total} checkpoints
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Progress
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
            {stats.percentage}%
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Current Phase
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
            {state.currentPhase.charAt(0).toUpperCase() +
              state.currentPhase.slice(1)}
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {state.daysInPhase} days in phase
          </div>
        </div>
      </div>

      {/* Checkpoint Grid by Phase */}
      {phases.map((phase) => {
        const phaseGroup = groupedByPhase[phase];
        if (!phaseGroup) return null;

        return (
          <div key={phase}>
            <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
              {phaseGroup.name}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {phaseGroup.checkpoints.map((checkpoint) => (
                <Link
                  key={checkpoint.id}
                  href={`/${locale}/guidebook/${phase}/${checkpoint.phase}-${checkpoint.order}`}
                  className="group rounded-lg border-2 transition-all hover:shadow-md"
                  style={{
                    borderColor: checkpoint.isCompleted
                      ? "rgb(34, 197, 94)"
                      : checkpoint.isReached
                        ? "rgb(251, 191, 36)"
                        : "rgb(229, 231, 235)",
                  }}
                >
                  <div
                    className="px-4 py-4"
                    style={{
                      backgroundColor: checkpoint.isCompleted
                        ? "rgba(34, 197, 94, 0.05)"
                        : checkpoint.isReached
                          ? "rgba(251, 191, 36, 0.05)"
                          : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                          {phaseGroup.name} {checkpoint.order}
                        </div>
                        <div className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          {checkpoint.title}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {checkpoint.isCompleted ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                          <Circle
                            className={`h-6 w-6 ${
                              checkpoint.isReached
                                ? "text-amber-500"
                                : "text-neutral-300 dark:text-neutral-700"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
