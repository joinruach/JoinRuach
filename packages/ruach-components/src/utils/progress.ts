export type ProgressInput = {
  courseSlug: string;
  lessonSlug: string;
  secondsWatched?: number;
  completed?: boolean;
};

export async function markProgress(input: ProgressInput): Promise<void> {
  try {
    await fetch("/api/progress/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // Ignore syncing failures; UI shouldn't break on network hiccups.
  }
}
