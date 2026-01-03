export type CourseSlug = string;

const RAW = process.env.STRIPE_COURSE_PRICE_IDS;
const COURSE_PRICE_IDS: Record<CourseSlug, string> = (() => {
  if (!RAW) {
    return {};
  }
  try {
    return JSON.parse(RAW) as Record<CourseSlug, string>;
  } catch {
    return {};
  }
})();

export function getCoursePriceId(slug: CourseSlug): string | null {
  return COURSE_PRICE_IDS[slug] ?? null;
}

export function hasCoursePrice(slug: CourseSlug): boolean {
  return Boolean(getCoursePriceId(slug));
}
