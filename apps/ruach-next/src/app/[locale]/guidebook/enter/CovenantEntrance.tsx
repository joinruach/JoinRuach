"use client";

import { useActionState } from "react";
import { enterCovenant } from "./actions";
import { CovenantType } from "@ruach/formation";

interface CovenantEntranceProps {
  locale: string;
}

interface FormState {
  ok: boolean;
  message?: string;
  redirectTo?: string;
}

const initialState: FormState = { ok: false };

export function CovenantEntrance({ locale }: CovenantEntranceProps) {
  const [state, action, pending] = useActionState(enterCovenant, initialState);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
          The Remnant Guidebook
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Before you enter, choose your path.
        </p>
      </header>

      {/* Who This Is For */}
      <section className="mb-12 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:shadow-none">
        <h2 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-white">
          Who This Is For
        </h2>
        <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
          <p>
            This is for those willing to have their foundations tested. For
            believers who sense that much of what they've been taught may not
            align with Scripture. For the spiritually hungry who are tired of
            being fed entertainment instead of truth.
          </p>
          <p>
            This is for the remnant—those who will submit to the Word over
            popular teaching, who value formation over information, and who
            understand that depth requires time.
          </p>
        </div>
      </section>

      {/* Who This Is NOT For */}
      <section className="mb-12 rounded-2xl border border-amber-200 bg-amber-50 p-8 dark:border-amber-900/30 dark:bg-amber-950/20">
        <h2 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-white">
          Who This Is NOT For
        </h2>
        <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
          <p>
            This is not for those seeking quick inspiration or spiritual
            productivity hacks. This is not a course to complete or a
            certification to earn. This is not entertainment.
          </p>
          <p>
            If you're looking for content to consume on your own timeline
            without accountability, choose the Resource Explorer path below.
          </p>
        </div>
      </section>

      {/* Covenant Choices */}
      <form action={action} className="space-y-8">
        <fieldset disabled={pending} className="space-y-6">
          <legend className="mb-6 text-xl font-semibold text-neutral-900 dark:text-white">
            Choose Your Path
          </legend>

          {/* Formation Journey Option */}
          <label
            className={`block cursor-pointer rounded-2xl border-2 p-8 transition-all ${
              pending ? "opacity-50" : "hover:border-amber-400 dark:hover:border-amber-600"
            } border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900`}
          >
            <div className="flex items-start gap-4">
              <input
                type="radio"
                name="covenantType"
                value={CovenantType.FormationJourney}
                required
                disabled={pending}
                className="mt-1 h-5 w-5 border-neutral-300 text-amber-600 focus:ring-amber-500 dark:border-neutral-700"
              />
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">
                  Formation Journey
                </h3>
                <p className="mb-4 text-neutral-600 dark:text-neutral-400">
                  Full engagement with the formation process. This path includes:
                </p>
                <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-500">•</span>
                    <span>Paced progression through five formation phases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-500">•</span>
                    <span>Reflection checkpoints that require thoughtful engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-500">•</span>
                    <span>Adaptive content based on your spiritual readiness</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-500">•</span>
                    <span>
                      System interventions when speed-running or surface engagement is
                      detected
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-500">•</span>
                    <span>Full journey tracking and formation analysis</span>
                  </li>
                </ul>
                <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                  This is the recommended path for those serious about formation.
                </p>
              </div>
            </div>
          </label>

          {/* Resource Explorer Option */}
          <label
            className={`block cursor-pointer rounded-2xl border-2 p-8 transition-all ${
              pending ? "opacity-50" : "hover:border-neutral-400 dark:hover:border-neutral-600"
            } border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900`}
          >
            <div className="flex items-start gap-4">
              <input
                type="radio"
                name="covenantType"
                value={CovenantType.ResourceExplorer}
                required
                disabled={pending}
                className="mt-1 h-5 w-5 border-neutral-300 text-neutral-600 focus:ring-neutral-500 dark:border-neutral-700"
              />
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">
                  Resource Explorer
                </h3>
                <p className="mb-4 text-neutral-600 dark:text-neutral-400">
                  Browse content freely without formation tracking. This path offers:
                </p>
                <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>Access to all Guidebook content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>No reflection requirements or pacing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>No formation analysis or tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>Static content access (no adaptive unlocking)</span>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                  Choose this if you prefer to explore at your own pace without
                  accountability.
                </p>
              </div>
            </div>
          </label>
        </fieldset>

        {/* Acknowledgment Checkbox */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-white/10 dark:bg-neutral-900/50">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="acknowledgedTerms"
              required
              disabled={pending}
              className="mt-0.5 h-5 w-5 rounded border-neutral-300 text-amber-600 focus:ring-amber-500 dark:border-neutral-700"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              I understand that{" "}
              <strong className="font-semibold text-neutral-900 dark:text-white">
                formation requires submission to Scripture and the Canon
              </strong>
              , not just information consumption. I acknowledge that this system may
              slow me down, challenge me, or recommend revisiting foundational
              content if my engagement suggests I am not ready to proceed.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-amber-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-700 dark:hover:bg-amber-600 sm:w-auto"
          >
            {pending ? "Entering..." : "Enter the Guidebook"}
          </button>

          {/* Error Message */}
          {state.message && !state.ok && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200">
              {state.message}
            </div>
          )}
        </div>
      </form>

      {/* Footer Note */}
      <footer className="mt-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <p>
          This is not a transaction. This is a covenant.
          <br />
          Enter accordingly.
        </p>
      </footer>
    </div>
  );
}
