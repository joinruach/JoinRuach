"use client";
import { useEffect, useRef, type JSX } from "react";
import { markProgress } from "../../utils/progress";
import { track } from "../../utils/analytics";

type LessonPlayerProps = {
  src?: string;
  courseSlug: string;
  lessonSlug: string;
};

export default function LessonPlayer({ src, courseSlug, lessonSlug }: LessonPlayerProps): JSX.Element {
  const ref = useRef<HTMLVideoElement | null>(null);
  const lastKnownPosition = useRef(0);
  const lastPersistedPosition = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTime = () => { lastKnownPosition.current = Math.floor(el.currentTime); };
    const onPlay = () => track("LessonVideoPlay", { course: courseSlug, lesson: lessonSlug });
    const onEnded = async () => {
      const duration = Math.floor(el.duration);
      try { await markProgress({ courseSlug, lessonSlug, secondsWatched: duration, completed: true }); } catch {}
      lastPersistedPosition.current = duration;
      track("LessonVideoComplete", { course: courseSlug, lesson: lessonSlug });
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("ended", onEnded);
    };
  }, [courseSlug, lessonSlug]);

  useEffect(() => {
    lastKnownPosition.current = 0;
    lastPersistedPosition.current = 0;
    if (!src) return;
    const id = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const currentTime = lastKnownPosition.current || Math.floor(el.currentTime);
      if (!currentTime || currentTime === lastPersistedPosition.current) return;
      lastPersistedPosition.current = currentTime;
      markProgress({ courseSlug, lessonSlug, secondsWatched: currentTime }).catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [courseSlug, lessonSlug, src]);

  if (!src) return <div className="p-8 text-center text-neutral-500">Video coming soon.</div>;
  const isIframe = src.includes("youtube.com") || src.includes("youtu.be") || src.includes("vimeo.com");

  return isIframe ? (
    <iframe src={src} className="h-[56vw] max-h-[70vh] w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Lesson video" />
  ) : (
    <video ref={ref} className="w-full" src={src} controls />
  );
}
