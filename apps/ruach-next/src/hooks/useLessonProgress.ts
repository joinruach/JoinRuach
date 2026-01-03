"use client";

import { useEffect, useRef, useState } from "react";
import { getLessonProgress, saveLessonProgress } from "@/lib/api/lessonProgress";

const AUTOSAVE_INTERVAL = 15_000; // 15 seconds

type UseLessonProgressOptions = {
  lessonSlug: string;
  courseSlug: string;
  durationSeconds?: number;
};

export function useLessonProgress({
  lessonSlug,
  courseSlug,
  durationSeconds,
}: UseLessonProgressOptions) {
  const [loaded, setLoaded] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [secondsWatched, setSecondsWatched] = useState(0);

  const lastSavedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    getLessonProgress(lessonSlug)
      .then((data) => {
        if (!mounted) return;
        setCompleted(Boolean(data.completed));
        setSecondsWatched(data.secondsWatched ?? 0);
        lastSavedRef.current = data.secondsWatched ?? 0;
        setLoaded(true);
      })
      .catch(() => {
        if (mounted) {
          setLoaded(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [lessonSlug]);

  useEffect(() => {
    if (!loaded) return;

    timerRef.current = setInterval(() => {
      flushProgress();
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loaded, secondsWatched]);

  useEffect(() => {
    const handler = () => flushProgress(true);

    window.addEventListener("visibilitychange", handler);
    window.addEventListener("beforeunload", handler);

    return () => {
      window.removeEventListener("visibilitychange", handler);
      window.removeEventListener("beforeunload", handler);
    };
  }, [secondsWatched]);

  async function flushProgress(force = false) {
    if (!loaded) return;

    if (!force && Math.abs(secondsWatched - lastSavedRef.current) < 5) {
      return;
    }

    lastSavedRef.current = secondsWatched;

    const progressPercent =
      durationSeconds && durationSeconds > 0
        ? Math.round((secondsWatched / durationSeconds) * 100)
        : undefined;

    try {
      const res = await saveLessonProgress(lessonSlug, {
        secondsWatched,
        progressPercent,
        courseSlug,
      });
      setCompleted(Boolean(res.completed));
    } catch {
      // silent fail—next autosave retries
    }
  }

  async function markComplete() {
    await saveLessonProgress(lessonSlug, {
      progressPercent: 100,
      secondsWatched,
      courseSlug,
    });
    setCompleted(true);
  }

  return {
    loaded,
    completed,
    secondsWatched,
    setSecondsWatched,
    markComplete,
  };
}
