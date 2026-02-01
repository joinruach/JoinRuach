"use client";

import { useEffect, useState } from "react";
import { AxiomUnlockResult } from "@/lib/formation/AxiomUnlockService";
import { Lock, Unlock, BookOpen } from "lucide-react";

interface AxiomLibraryProps {
  locale: string;
  onSelectAxiom?: (axiomId: string) => void;
}

interface GroupedAxioms {
  [phase: string]: AxiomUnlockResult[];
}

export function AxiomLibrary({ locale, onSelectAxiom }: AxiomLibraryProps) {
  const [axioms, setAxioms] = useState<AxiomUnlockResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAxiom, setExpandedAxiom] = useState<string | null>(null);
  const [filterUnlocked, setFilterUnlocked] = useState(false);

  useEffect(() => {
    const fetchAxioms = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/axioms/list", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Please sign in to view axioms");
          } else {
            setError("Failed to load axioms");
          }
          return;
        }

        const data = await response.json();
        setAxioms(data.axioms || []);
      } catch (err) {
        console.error("[AxiomLibrary] Fetch error:", err);
        setError("Network error while loading axioms");
      } finally {
        setLoading(false);
      }
    };

    fetchAxioms();
  }, []);

  // Group axioms by phase
  const groupedAxioms: GroupedAxioms = axioms.reduce((acc, axiom) => {
    // Extract phase from axiomId or use a default
    const phase = axiom.axiomId.includes("awakening")
      ? "Awakening"
      : axiom.axiomId.includes("separation")
        ? "Separation"
        : axiom.axiomId.includes("discernment")
          ? "Discernment"
          : axiom.axiomId.includes("commission")
            ? "Commission"
            : "Stewardship";

    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(axiom);
    return acc;
  }, {} as GroupedAxioms);

  // Filter axioms if toggle is active
  const filteredGroups = filterUnlocked
    ? Object.fromEntries(
        Object.entries(groupedAxioms).map(([phase, items]) => [
          phase,
          items.filter((a) => a.isUnlocked),
        ])
      )
    : groupedAxioms;

  const phases = ["Awakening", "Separation", "Discernment", "Commission", "Stewardship"];
  const phaseOrder = phases.reduce(
    (acc, phase, idx) => ({ ...acc, [phase]: idx }),
    {} as Record<string, number>
  );

  const orderedPhases = Object.keys(filteredGroups).sort(
    (a, b) => (phaseOrder[a] ?? 99) - (phaseOrder[b] ?? 99)
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/20">
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (axioms.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-950">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-neutral-400 dark:text-neutral-600" />
        <p className="text-neutral-600 dark:text-neutral-400">
          No axioms available yet. Complete checkpoints to unlock them.
        </p>
      </div>
    );
  }

  const unlockedCount = axioms.filter((a) => a.isUnlocked).length;
  const totalCount = axioms.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Canon Axiom Library
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {unlockedCount} of {totalCount} axioms unlocked
          </p>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setFilterUnlocked(!filterUnlocked)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filterUnlocked
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              : "bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          }`}
        >
          {filterUnlocked ? "All Axioms" : "Unlocked Only"}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="h-2 bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Axioms by Phase */}
      <div className="space-y-8">
        {orderedPhases.map((phase) => (
          <div key={phase}>
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
              {phase}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {(filteredGroups[phase] || []).map((axiom) => (
                <AxiomCard
                  key={axiom.axiomId}
                  axiom={axiom}
                  isExpanded={expandedAxiom === axiom.axiomId}
                  onToggleExpand={() =>
                    setExpandedAxiom(
                      expandedAxiom === axiom.axiomId
                        ? null
                        : axiom.axiomId
                    )
                  }
                  onSelect={() => onSelectAxiom?.(axiom.axiomId)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Individual axiom card component
 */
interface AxiomCardProps {
  axiom: AxiomUnlockResult;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}

function AxiomCard({
  axiom,
  isExpanded,
  onToggleExpand,
  onSelect,
}: AxiomCardProps) {
  const unmetPrereqs = axiom.prerequisites.filter((p) => !p.satisfied);

  return (
    <div
      className={`rounded-lg border-2 transition-all ${
        axiom.isUnlocked
          ? "border-amber-200 bg-white dark:border-amber-900/30 dark:bg-neutral-900"
          : "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
      }`}
    >
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-4 text-left hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {axiom.isUnlocked ? (
                <Unlock className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-600" />
              )}
              <h4 className="font-semibold text-neutral-900 dark:text-white">
                {axiom.title}
              </h4>
            </div>

            {!axiom.isUnlocked && unmetPrereqs.length > 0 && (
              <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                {unmetPrereqs.length} requirement{unmetPrereqs.length !== 1 ? "s" : ""} remaining
              </div>
            )}
          </div>

          <svg
            className={`h-5 w-5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            } text-neutral-400`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-neutral-200 px-4 py-4 dark:border-neutral-800">
          {/* Prerequisites */}
          {axiom.prerequisites.length > 0 && (
            <div className="mb-4">
              <h5 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Prerequisites
              </h5>
              <div className="space-y-2">
                {axiom.prerequisites.map((prereq, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 text-sm ${
                      prereq.satisfied
                        ? "text-green-700 dark:text-green-300"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    <span className="mt-0.5">
                      {prereq.satisfied ? "✓" : "○"}
                    </span>
                    <span>{prereq.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onSelect}
            disabled={!axiom.isUnlocked}
            className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              axiom.isUnlocked
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
                : "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {axiom.isUnlocked ? "View Axiom" : "Locked"}
          </button>
        </div>
      )}
    </div>
  );
}
