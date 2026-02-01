"use client";

import { FormationState, ReadinessLevel, PaceStatus } from "@ruach/formation";
import { AlertCircle, TrendingUp, Zap } from "lucide-react";

interface PhaseReadinessProps {
  state: FormationState;
}

/**
 * Phase readiness indicators and progress visualization
 */
export function PhaseReadiness({ state }: PhaseReadinessProps) {
  const readiness = state.readiness;

  // Map readiness levels to percentages
  const levelToPercent = (level: ReadinessLevel): number => {
    switch (level) {
      case ReadinessLevel.Emerging:
        return 25;
      case ReadinessLevel.Developing:
        return 50;
      case ReadinessLevel.Maturing:
        return 75;
      case ReadinessLevel.Established:
        return 100;
    }
  };

  // Get readable level name
  const getLevelName = (level: ReadinessLevel): string => {
    switch (level) {
      case ReadinessLevel.Emerging:
        return "Emerging";
      case ReadinessLevel.Developing:
        return "Developing";
      case ReadinessLevel.Maturing:
        return "Maturing";
      case ReadinessLevel.Established:
        return "Established";
    }
  };

  // Get color for level
  const getLevelColor = (level: ReadinessLevel): string => {
    switch (level) {
      case ReadinessLevel.Emerging:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case ReadinessLevel.Developing:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case ReadinessLevel.Maturing:
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case ReadinessLevel.Established:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    }
  };

  // Get pace status info
  const getPaceInfo = (pace: PaceStatus) => {
    switch (pace) {
      case PaceStatus.TooFast:
        return {
          label: "Speed Running",
          desc: "Slow down for deeper formation",
          color: "text-red-600 dark:text-red-400",
        };
      case PaceStatus.Appropriate:
        return {
          label: "On Track",
          desc: "Maintain current pace",
          color: "text-green-600 dark:text-green-400",
        };
      case PaceStatus.Stalled:
        return {
          label: "Stalled",
          desc: "Consider re-engaging",
          color: "text-orange-600 dark:text-orange-400",
        };
    }
  };

  const paceInfo = getPaceInfo(readiness.pace);

  return (
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Reflection Depth */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Reflection Depth
          </h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getLevelColor(
              readiness.reflectionDepth
            )}`}
          >
            {getLevelName(readiness.reflectionDepth)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
            style={{ width: `${levelToPercent(readiness.reflectionDepth)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          Quality and depth of your reflections at checkpoints
        </p>
      </div>

      {/* Canon Engagement */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Canon Engagement
          </h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getLevelColor(
              readiness.canonEngagement
            )}`}
          >
            {getLevelName(readiness.canonEngagement)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
            style={{ width: `${levelToPercent(readiness.canonEngagement)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          Interaction with canonical texts and axioms
        </p>
      </div>

      {/* Pace Status */}
      <div className="rounded-lg border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex items-start gap-3">
          <Zap className={`h-5 w-5 flex-shrink-0 ${paceInfo.color}`} />
          <div className="flex-1">
            <h4 className="font-medium text-neutral-900 dark:text-white">
              {paceInfo.label}
            </h4>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              {paceInfo.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Red Flags */}
      {readiness.redFlags.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h4 className="font-medium text-red-900 dark:text-red-100">
              Areas to Address
            </h4>
          </div>
          <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
            {readiness.redFlags.map((flag, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
              Formation continues to deepen through consistent engagement and honest
              reflection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
