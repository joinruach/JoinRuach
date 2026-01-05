"use client";

import { useEffect, useRef, useState } from "react";

type RenunciationHoldButtonProps = {
  seconds?: number;
};

export default function RenunciationHoldButton({ seconds = 5 }: RenunciationHoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const startHold = () => {
    if (completed) return;
    startedAtRef.current = performance.now();
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      const startedAt = startedAtRef.current;
      if (!startedAt) return;
      const elapsed = (performance.now() - startedAt) / 1000;
      const next = Math.min(1, elapsed / seconds);
      setProgress(next);
      if (next >= 1) {
        setCompleted(true);
        stopHold();
      }
    }, 50);
  };

  const stopHold = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startedAtRef.current = null;
    if (!completed) {
      setProgress(0);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  const progressPercent = Math.round(progress * 100);

  return (
    <div className="space-y-2 rounded-3xl border border-neutral-200 bg-white/90 p-4 text-sm text-neutral-900">
      <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">Press-and-hold renunciation</p>
      <button
        type="button"
        className="relative w-full rounded-full border border-neutral-200 bg-neutral-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-neutral-300"
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
      >
        Hold to Renounce ({seconds}s)
        <span className="sr-only">Hold for {seconds} seconds to renounce</span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1">
          <div
            className="h-full bg-amber-400 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </button>
      <p className="text-xs text-neutral-500">
        {completed ? "Agreement broken. Now replace." : "Slowly release the agreement by holding the button."}
      </p>
    </div>
  );
}
