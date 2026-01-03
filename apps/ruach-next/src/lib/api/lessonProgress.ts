export async function getLessonProgress(lessonSlug: string) {
  const res = await fetch(`/api/lessons/${lessonSlug}/progress`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to load lesson progress");
  }
  return res.json();
}

export async function saveLessonProgress(
  lessonSlug: string,
  payload: {
    secondsWatched?: number;
    progressPercent?: number;
    courseSlug?: string;
  }
) {
  const res = await fetch(`/api/lessons/${lessonSlug}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to save lesson progress");
  }
  return res.json();
}
