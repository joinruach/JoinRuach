"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { ObedienceCardTemplate } from "@/lib/types/strapi-types";

type OneStepContractProps = {
  template?: ObedienceCardTemplate;
};

export default function OneStepContract({ template }: OneStepContractProps) {
  const [pattern, setPattern] = useState("");
  const [oneStep, setOneStep] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [witness, setWitness] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const patternLabel = template?.patternLabel ?? "Pattern";
  const oneStepLabel = template?.oneStepLabel ?? "One step";
  const scheduledLabel = template?.scheduledTimeLabel ?? "Scheduled time";
  const witnessLabel = template?.witnessLabel ?? "Witness";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pattern.trim() || !oneStep.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white/90 p-5 text-neutral-900">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">One Step Contract</p>
        <p className="text-sm text-neutral-600">
          Choose obedience, not analysis. Capture the pattern, name the step, lock it in, and tell a witness.
        </p>
      </div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block text-xs uppercase tracking-[0.3em] text-neutral-500">
          {patternLabel}
        </label>
        <input
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
          placeholder="Name the compromised pattern"
        />
        <label className="block text-xs uppercase tracking-[0.3em] text-neutral-500">
          {oneStepLabel}
        </label>
        <textarea
          value={oneStep}
          onChange={(event) => setOneStep(event.target.value)}
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
          rows={3}
          placeholder="Spell out the tiny obedience step"
        />
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
          <button
            type="button"
            onClick={() => setScheduledTime("Within 15 minutes")}
            className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-900 transition hover:border-neutral-400"
          >
            Do now
          </button>
          <button
            type="button"
            onClick={() => setScheduledTime("Scheduled later today")}
            className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-900 transition hover:border-neutral-400"
          >
            Schedule
          </button>
          <button
            type="button"
            onClick={() => setWitness("Shared with a witness")}
            className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-900 transition hover:border-neutral-400"
          >
            Tell a witness
          </button>
        </div>
        <label className="block text-xs uppercase tracking-[0.3em] text-neutral-500">
          {scheduledLabel}
        </label>
        <input
          value={scheduledTime}
          onChange={(event) => setScheduledTime(event.target.value)}
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
          placeholder="Pick a time (today / tomorrow / date)"
        />
        <label className="block text-xs uppercase tracking-[0.3em] text-neutral-500">
          {witnessLabel}
        </label>
        <input
          value={witness}
          onChange={(event) => setWitness(event.target.value)}
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
          placeholder="Who will hear this? (name or email)"
        />
        <button
          type="submit"
          className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
        >
          Lock it in
        </button>
      </form>
      {submitted ? (
        <div className="space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-neutral-900">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{patternLabel}</p>
          <p className="text-base font-semibold">{pattern}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{oneStepLabel}</p>
          <p className="text-base font-semibold">{oneStep}</p>
          {scheduledTime ? (
            <>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{scheduledLabel}</p>
              <p className="text-sm font-semibold">{scheduledTime}</p>
            </>
          ) : null}
          {witness ? (
            <>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{witnessLabel}</p>
              <p className="text-sm font-semibold">{witness}</p>
            </>
          ) : null}
          {template?.shareInstructions ? (
            <p className="text-xs text-neutral-600">{template.shareInstructions}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
