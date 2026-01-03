import type { AccessLevel } from "@ruach/components/components/ruach/CourseCard";

export function parseAccessLevel(value?: string | null): AccessLevel {
  if (!value) return "basic";
  const normalized = value.toLowerCase();
  if (normalized === "full") return "full";
  if (normalized === "leader") return "leader";
  return "basic";
}
