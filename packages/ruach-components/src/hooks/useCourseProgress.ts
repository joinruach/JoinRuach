'use client';

import { useEffect, useMemo, useState } from "react";

type CourseProgressApiResponse = {
  courseSlug: string;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
};

export function useCourseProgress(
  courseSlug: string | null,
  initialData?: CourseProgressApiResponse
) {
  const [loading, setLoading] = useState<boolean>(Boolean(courseSlug && !initialData));
  const [percentComplete, setPercentComplete] = useState<number | null>(initialData?.percentComplete ?? null);
  const [completedLessons, setCompletedLessons] = useState<number>(initialData?.completedLessons ?? 0);
  const [totalLessons, setTotalLessons] = useState<number>(initialData?.totalLessons ?? 0);

  useEffect(() => {
    if (!courseSlug) {
      setLoading(false);
      return;
    }

    if (initialData) {
      setLoading(false);
      setPercentComplete(initialData.percentComplete ?? null);
      setCompletedLessons(initialData.completedLessons ?? 0);
      setTotalLessons(initialData.totalLessons ?? 0);
      return;
    }

    let mounted = true;
    setLoading(true);

    fetch(`/api/courses/${courseSlug}/progress`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load course progress");
        }
        return res.json() as Promise<CourseProgressApiResponse>;
      })
      .then((data) => {
        if (!mounted) return;
        setPercentComplete(data.percentComplete ?? null);
        setCompletedLessons(data.completedLessons ?? 0);
        setTotalLessons(data.totalLessons ?? 0);
      })
      .catch(() => {
        if (!mounted) return;
        setPercentComplete(null);
        setCompletedLessons(0);
        setTotalLessons(0);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [courseSlug, initialData]);

  const started = useMemo(() => percentComplete !== null && completedLessons > 0, [percentComplete, completedLessons]);
  const completed = useMemo(
    () => percentComplete === 100 && totalLessons > 0,
    [percentComplete, totalLessons]
  );

  return {
    loading,
    percentComplete,
    completedLessons,
    totalLessons,
    started,
    completed,
  };
}
