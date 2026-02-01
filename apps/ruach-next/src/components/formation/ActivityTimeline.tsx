"use client";

import { useMemo } from "react";
import { FormationState } from "@ruach/formation";
import {
  CheckCircle2,
  BookOpen,
  Award,
  Zap,
  Navigation,
} from "lucide-react";

interface ActivityTimelineProps {
  state: FormationState;
}

/**
 * Recent formation activity timeline
 * Shows key events in the user's formation journey
 */
export function ActivityTimeline({ state }: ActivityTimelineProps) {
  // Build activity timeline from state
  const activities = useMemo(() => {
    const items = [];

    // Entry event
    if (state.createdAt) {
      items.push({
        id: "entry",
        type: "entry",
        timestamp: state.createdAt,
        title: "Formation Journey Started",
        description: `Entered ${state.currentPhase} phase`,
        icon: Navigation,
      });
    }

    // Phase entered
    if (state.phaseEnteredAt) {
      items.push({
        id: "phase",
        type: "phase",
        timestamp: state.phaseEnteredAt,
        title: `Entered ${state.currentPhase.charAt(0).toUpperCase() + state.currentPhase.slice(1)} Phase`,
        description: `Began formation in ${state.currentPhase}`,
        icon: Zap,
      });
    }

    // Checkpoint completions (most recent 5)
    if (state.checkpointsCompleted.length > 0) {
      const recentCheckpoints = state.checkpointsCompleted.slice(-5);
      recentCheckpoints.forEach((checkpointId, idx) => {
        items.push({
          id: `checkpoint-${idx}`,
          type: "checkpoint",
          timestamp: new Date(
            state.updatedAt.getTime() - (recentCheckpoints.length - idx) * 86400000
          ), // Approximate timestamps
          title: "Checkpoint Completed",
          description: `Completed ${checkpointId}`,
          icon: CheckCircle2,
        });
      });
    }

    // Reflections submitted
    if (state.reflectionsSubmitted > 0) {
      items.push({
        id: "reflections",
        type: "reflection",
        timestamp: new Date(state.updatedAt),
        title: "Reflections Submitted",
        description: `${state.reflectionsSubmitted} reflection${state.reflectionsSubmitted !== 1 ? "s" : ""} recorded`,
        icon: BookOpen,
      });
    }

    // Unlocked axioms
    if (state.unlockedCanonAxioms.length > 0) {
      items.push({
        id: "axioms",
        type: "axiom",
        timestamp: new Date(state.updatedAt),
        title: "Canon Axioms Unlocked",
        description: `${state.unlockedCanonAxioms.length} axiom${state.unlockedCanonAxioms.length !== 1 ? "s" : ""} unlocked`,
        icon: Award,
      });
    }

    // Sort by timestamp descending (newest first)
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [state]);

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      const hours = Math.floor(diff / 3600000);
      if (hours === 0) {
        const minutes = Math.floor(diff / 60000);
        return minutes === 0 ? "Just now" : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    }

    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-neutral-600 dark:text-neutral-400">
          Your formation journey activity will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {activities.map((activity, idx) => {
        const Icon = activity.icon;
        const isLast = idx === activities.length - 1;

        return (
          <div key={activity.id} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[23px] top-[48px] h-8 w-0.5 bg-neutral-200 dark:bg-neutral-800" />
            )}

            {/* Activity item */}
            <div className="flex gap-4 px-4 py-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
              {/* Icon */}
              <div className="relative z-10 flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <Icon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {activity.title}
                  </h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                    {formatDate(activity.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {activity.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
