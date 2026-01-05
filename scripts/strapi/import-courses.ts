#!/usr/bin/env tsx

/**
 * Strapi Course Importer (Upsert)
 * - Upserts: Formation Phases, Courses, Course Profiles, Modules, Lessons
 * - Supports file-based seeds or live Notion exports (requires Notion env vars)
 *
 * Usage:
 *   STRAPI_URL=http://localhost:1337 \
 *   STRAPI_TOKEN=xxx \
 *   pnpm exec tsx scripts/strapi/import-courses.ts --file data/courses.seed.json [--publish true] [--dry-run]
 *
 *   # Or import directly from Notion
 *   NOTION_TOKEN=... \
 *   NOTION_DB_COURSES=... \
 *   NOTION_DB_LESSONS=... \
 *   pnpm exec tsx scripts/strapi/import-courses.ts --notion [--notion-course <courseIdOrPageId>] [--publish true] [--dry-run]
 */

import fs from "node:fs";
import path from "node:path";
import {
  fetchNotionCourseById,
  fetchNotionLessons,
  listNotionCourses
} from "../../ruach-ministries-backend/scripts/notion/course-helpers";
import { transformEntity } from "../../ruach-ministries-backend/scripts/notion/transformEntity";

type PhaseSeed = {
  phase: "awakening" | "separation" | "discernment" | "commission" | "stewardship";
  phaseName: string;
  phaseId: string;
  order: number;
  description: string;
  duration?: string;
  status?: "Draft" | "Review" | "Ready" | "Synced" | "Published" | "Deprecated" | "Needs Revision";
  color?: "blue" | "purple" | "indigo" | "green" | "amber";
  icon?: string;
  estimatedDuration?: string;
};

type CourseSeed = {
  name: string;
  courseId: string;
  notionPageId?: string;
  excerpt?: string;
  slug?: string;
  description?: string;
  status?: "Draft" | "Review" | "Ready" | "Synced" | "Published" | "Deprecated" | "Needs Revision";
  requiredAccessLevel?: "basic" | "full" | "leader";
  unlockRequirements?: string;
  level?: "foundation" | "intermediate" | "advanced";
  estimatedDuration?: string;
  featured?: boolean;
  phase: PhaseSeed["phase"];
  ctaLabel?: string;
  ctaUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  profile?: CourseProfileSeed;
  modules?: ModuleSeed[];
};

type CourseProfileSeed = {
  subtitle?: string;
  format?: string;
  visibility?: "public" | "gated" | "cohort-only" | "private";
  pricingType?: "free" | "paid-core" | "paid-flagship" | "paid-specialty";
  funnelRole?: string;
  authorityLevel?: "introductory" | "pastoral" | "apostolic" | "prophetic";
  commitmentLevel?: "low" | "medium" | "high";
  purpose?: string;
  idealParticipant?: string;
  notFor?: string;
  promisedOutcome?: string;
  scripturalFoundation?: string;
  liesConfronted?: string;
  formationOutcomes?: string;
  practiceComponents?: string;
  distinctiveFeature?: string;
  completionPath?: string;
  prerequisites?: string;
  communityRules?: string;
};

type ModuleSeed = {
  moduleId: string;
  name: string;
  order: number;
  description?: string;
  lessons?: LessonSeed[];
};

type LessonSeed = {
  title: string;
  lessonId: string;
  notionPageId?: string;
  lessonTitle?: string;
  slug?: string;
  summary?: string;
  order: number;
  duration?: number;
  runtime?: number;
  videoUrl?: string;
  lessonType?: string;
  status?: "Draft" | "Review" | "Ready" | "Synced" | "Published" | "Deprecated" | "Needs Revision";
  transcript?: string;
  keyScripture?: string;
  content?: string;
  previewAvailable?: boolean;
  requiredAccessLevel?: "basic" | "full" | "leader";
};

type SeedFile = {
  phases?: PhaseSeed[];
  courses: CourseSeed[];
};

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function assertOneOfEnv(names: readonly string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Missing env var: ${names.join(" or ")}`);
}

const STRAPI_URL = assertEnv("STRAPI_URL").replace(/\/$/, "");
const STRAPI_TOKEN = assertOneOfEnv(["STRAPI_TOKEN", "STRAPI_API_TOKEN"]);

const args = process.argv.slice(2);
const fileIdx = args.indexOf("--file");
const notionIdx = args.indexOf("--notion");
const notionCourseIdx = args.indexOf("--notion-course");
const publishIdx = args.indexOf("--publish");
const dryRunIdx = args.indexOf("--dry-run");

const FILE = fileIdx >= 0 ? args[fileIdx + 1] : null;
const USE_NOTION = notionIdx >= 0;
const notionCourseArg =
  notionCourseIdx >= 0 ? args[notionCourseIdx + 1]?.trim() ?? null : null;

if (!USE_NOTION && !FILE) {
  throw new Error(
    "Usage: --file <path-to-seed.json> [--publish true|false] [--dry-run] OR --notion [--notion-course id]"
  );
}

if (notionCourseIdx >= 0 && !notionCourseArg) {
  throw new Error("--notion-course requires a course identifier (courseId or Notion pageId)");
}

const NOTION_COURSE_FILTERS = notionCourseArg
  ? notionCourseArg.split(",").map((v) => v.trim()).filter(Boolean)
  : [];

const PUBLISH = publishIdx >= 0 ? args[publishIdx + 1] === "true" : false;
const DRY_RUN = dryRunIdx >= 0;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

async function strapiFetch<T>(
  endpoint: string,
  init?: RequestInit & { qs?: Record<string, string> }
): Promise<T> {
  const qs = init?.qs ? "?" + new URLSearchParams(init.qs).toString() : "";
  const url = `${STRAPI_URL}${endpoint}${qs}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Strapi ${res.status} ${res.statusText} for ${url}\n${body}`);
  }

  return (await res.json()) as T;
}

type StrapiListResponse<T> = { data: Array<{ id: number; attributes: T }> };

async function findOneBy<T>(
  collection: string,
  filters: Record<string, string>
): Promise<number | undefined> {
  const qs: Record<string, string> = { "pagination[pageSize]": "1" };
  for (const [field, value] of Object.entries(filters)) {
    qs[`filters[${field}][$eq]`] = value;
  }

  const resp = await strapiFetch<StrapiListResponse<T>>(`/api/${collection}`, { qs });
  return resp.data?.[0]?.id;
}

async function createEntry(collection: string, data: any): Promise<number> {
  if (DRY_RUN) {
    console.log(`[DRY] create ${collection}`, JSON.stringify(data, null, 2));
    return -1;
  }
  const resp = await strapiFetch<{ data: { id: number } }>(`/api/${collection}`, {
    method: "POST",
    body: JSON.stringify({ data })
  });
  return resp.data.id;
}

async function updateEntry(collection: string, id: number, data: any): Promise<void> {
  if (DRY_RUN) {
    console.log(`[DRY] update ${collection}#${id}`, JSON.stringify(data, null, 2));
    return;
  }
  await strapiFetch(`/api/${collection}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data })
  });
}

async function upsertByUnique<T>(
  collection: string,
  uniqueFilters: Record<string, string>,
  payload: any
): Promise<number> {
  const ident = Object.entries(uniqueFilters).map(([k, v]) => `${k}=${v}`).join(", ");
  const existingId = await findOneBy<T>(collection, uniqueFilters);
  if (!existingId) {
    const newId = await createEntry(collection, payload);
    console.log(`✅ created ${collection} (${ident}) -> id=${newId}`);
    return newId;
  }
  await updateEntry(collection, existingId, payload);
  console.log(`♻️ updated ${collection} id=${existingId} (${ident})`);
  return existingId;
}

function applyPublishState(payload: Record<string, unknown>): Record<string, unknown> {
  if (!PUBLISH) {
    payload.publishedAt = null;
  } else {
    payload.publishedAt = new Date().toISOString();
  }
  return payload;
}

async function ensurePhase(phase: PhaseSeed): Promise<number> {
  const payload = applyPublishState({
    phase: phase.phase,
    phaseName: phase.phaseName,
    phaseId: phase.phaseId,
    order: phase.order,
    description: phase.description,
    duration: phase.duration,
    status: phase.status ?? "Draft",
    color: phase.color ?? "blue",
    icon: phase.icon,
    estimatedDuration: phase.estimatedDuration
  });

  return upsertByUnique("formation-phases", { phase: phase.phase }, payload);
}

async function importCourse(course: CourseSeed, phaseId: number): Promise<number> {
  const coursePayload = applyPublishState({
    name: course.name,
    courseId: course.courseId,
    notionPageId: course.notionPageId,
    excerpt: course.excerpt,
    slug: course.slug ?? slugify(course.name),
    description: course.description,
    status: course.status ?? "Draft",
    requiredAccessLevel: course.requiredAccessLevel ?? "basic",
    unlockRequirements: course.unlockRequirements,
    level: course.level ?? "foundation",
    estimatedDuration: course.estimatedDuration,
    featured: course.featured ?? false,
    ctaLabel: course.ctaLabel,
    ctaUrl: course.ctaUrl,
    seoTitle: course.seoTitle,
    seoDescription: course.seoDescription,
    phase: phaseId
  });

  const courseId = await upsertByUnique("courses", { courseId: course.courseId }, coursePayload);

  if (course.profile) {
    await upsertCourseProfile(courseId, course.profile);
  }

  if (course.modules?.length) {
    for (const mod of course.modules) {
      const modulePayload = applyPublishState({
        moduleId: mod.moduleId,
        name: mod.name,
        order: mod.order,
        description: mod.description,
        course: courseId
      });

      const moduleId = await upsertByUnique("modules", { moduleId: mod.moduleId }, modulePayload);

      if (mod.lessons?.length) {
        for (const lesson of mod.lessons) {
          const lessonPayload = applyPublishState({
            title: lesson.title,
            lessonId: lesson.lessonId,
            notionPageId: lesson.notionPageId,
            lessonTitle: lesson.lessonTitle,
            slug: lesson.slug ?? slugify(lesson.title),
            summary: lesson.summary,
            order: lesson.order,
            duration: lesson.duration,
            runtime: lesson.runtime,
            videoUrl: lesson.videoUrl,
            lessonType: lesson.lessonType,
            status: lesson.status ?? "Draft",
            transcript: lesson.transcript,
            keyScripture: lesson.keyScripture,
            content: lesson.content,
            previewAvailable: lesson.previewAvailable ?? false,
            requiredAccessLevel: lesson.requiredAccessLevel ?? course.requiredAccessLevel ?? "basic",
            course: courseId,
            module: moduleId
          });

          await upsertByUnique("lessons", { lessonId: lesson.lessonId }, lessonPayload);
        }
      }
    }
  }

  return courseId;
}

async function upsertCourseProfile(courseId: number, profile: CourseProfileSeed): Promise<number> {
  const resp = await strapiFetch<StrapiListResponse<any>>(`/api/course-profiles`, {
    qs: {
      "pagination[pageSize]": "1",
      "filters[course][id][$eq]": String(courseId)
    }
  });

  const existingProfileId = resp.data?.[0]?.id ?? null;

  const payload = applyPublishState({
    course: courseId,
    subtitle: profile.subtitle,
    format: profile.format,
    visibility: profile.visibility ?? "public",
    pricingType: profile.pricingType ?? "free",
    funnelRole: profile.funnelRole,
    authorityLevel: profile.authorityLevel,
    commitmentLevel: profile.commitmentLevel,
    purpose: profile.purpose,
    idealParticipant: profile.idealParticipant,
    notFor: profile.notFor,
    promisedOutcome: profile.promisedOutcome,
    scripturalFoundation: profile.scripturalFoundation,
    liesConfronted: profile.liesConfronted,
    formationOutcomes: profile.formationOutcomes,
    practiceComponents: profile.practiceComponents,
    distinctiveFeature: profile.distinctiveFeature,
    completionPath: profile.completionPath,
    prerequisites: profile.prerequisites,
    communityRules: profile.communityRules
  });

  if (!existingProfileId) {
    const id = await createEntry("course-profiles", payload);
    console.log(`✅ created course-profiles for courseId=${courseId} -> id=${id}`);
    return id;
  }

  await updateEntry("course-profiles", existingProfileId, payload);
  console.log(`♻️ updated course-profiles id=${existingProfileId} for courseId=${courseId}`);
  return existingProfileId;
}

const NOTION_PHASES: PhaseSeed["phase"][] = [
  "awakening",
  "separation",
  "discernment",
  "commission",
  "stewardship"
];

function normalizePhaseSlug(value?: string): PhaseSeed["phase"] | undefined {
  if (!value) return undefined;
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!cleaned) return undefined;
  const candidate = cleaned as PhaseSeed["phase"];
  return NOTION_PHASES.includes(candidate) ? candidate : undefined;
}

function loadSeedFromFile(filePath: string): SeedFile {
  const abs = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(abs, "utf8");
  return JSON.parse(raw) as SeedFile;
}

function matchesNotionCourse(entry: { courseId?: string; pageId?: string }, filters: string[]): boolean {
  return filters.some((filter) => filter === entry.courseId || filter === entry.pageId);
}

function hasValues(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length > 0;
}

async function loadSeedFromNotion(options: { filters?: string[] } = {}): Promise<SeedFile> {
  console.log("🔄 Building seed from Notion...");
  const courses = await listNotionCourses();
  const filters = options.filters ?? [];
  const selected = filters.length ? courses.filter((entry) => matchesNotionCourse(entry, filters)) : courses;

  if (!selected.length) {
    const message = filters.length
      ? `No Notion courses matched ${filters.join(", ")}.`
      : "No courses found in Notion.";
    throw new Error(message);
  }

  const phaseMap = new Map<PhaseSeed["phase"], PhaseSeed>();
  const seedCourses: CourseSeed[] = [];

  for (const entry of selected) {
    const identifier = entry.courseId ?? entry.pageId;
    if (!identifier) continue;
    console.log(`📦 Fetching Notion course ${identifier}`);
    const notionCourse = await fetchNotionCourseById(identifier);
    if (!notionCourse) {
      console.warn(`⚠️  Course not found for ${identifier}; skipping.`);
      continue;
    }

    if (!notionCourse.courseId) {
      console.warn(`⚠️  Notion course ${identifier} is missing a courseId; skipping.`);
      continue;
    }

    if (!notionCourse.phase) {
      throw new Error(`Notion course ${notionCourse.courseId} is missing a Formation Phase relation.`);
    }

    const courseFields = transformEntity("Course", notionCourse);
    const profileFields = transformEntity("CourseProfile", notionCourse);
    const phaseFields = transformEntity("FormationPhase", notionCourse.phase);
    const canonicalPhase =
      normalizePhaseSlug(phaseFields.phase ?? phaseFields.phaseName) ??
      normalizePhaseSlug(phaseFields.phaseId);
    if (!canonicalPhase) {
      throw new Error(
        `Unsupported phase value for Notion course ${notionCourse.courseId}: ${phaseFields.phase ?? phaseFields.phaseName ?? "unknown"}`
      );
    }

    if (!phaseMap.has(canonicalPhase)) {
      phaseMap.set(canonicalPhase, {
        phase: canonicalPhase,
        phaseName: phaseFields.phaseName ?? canonicalPhase,
        phaseId: phaseFields.phaseId ?? `${canonicalPhase}-notion`,
        order: phaseFields.order ?? 0,
        description: phaseFields.description ?? "",
        status: (phaseFields.status as PhaseSeed["status"]) ?? "Draft",
        color: (phaseFields.color as PhaseSeed["color"]) ?? "blue",
        icon: phaseFields.icon,
        estimatedDuration: phaseFields.estimatedDuration
      });
    }

    const courseName = courseFields.name ?? notionCourse.title ?? `Course ${notionCourse.courseId}`;
    const courseId = courseFields.courseId ?? notionCourse.courseId;
    const courseSlug = courseFields.slug ?? slugify(courseName);
    const profile = hasValues(profileFields) ? (profileFields as CourseProfileSeed) : undefined;

    const lessons = await fetchNotionLessons(courseId);
    const lessonSeeds: LessonSeed[] = lessons.map((page, index) => {
      const lessonFields = transformEntity("Lesson", page);
      const lessonTitle = lessonFields.title ?? page.title ?? `Lesson ${index + 1}`;
      const lessonSlug = (lessonFields.slug ?? slugify(lessonTitle)) as string;
      const lessonId = `${courseId}-${lessonSlug}`;
      return {
        title: lessonTitle,
        lessonId,
        notionPageId: page.id,
        slug: lessonSlug,
        summary: lessonFields.summary,
        order: lessonFields.order ?? index + 1,
        duration: lessonFields.duration,
        videoUrl: lessonFields.videoUrl,
        transcript: lessonFields.transcript,
        content: lessonFields.transcript,
        status: "Draft",
        requiredAccessLevel: "basic"
      };
    });

    const modules = lessonSeeds.length
      ? [
          {
            moduleId: `${courseId}-module`,
            name: `${courseName} Lessons`,
            order: 1,
            description: "Imported lessons (grouped into a single module)",
            lessons: lessonSeeds
          }
        ]
      : undefined;

    seedCourses.push({
      name: courseName,
      courseId,
      notionPageId: notionCourse.id,
      excerpt: courseFields.excerpt,
      slug: courseSlug,
      description: courseFields.description,
      status: courseFields.status as CourseSeed["status"],
      requiredAccessLevel: courseFields.requiredAccessLevel as CourseSeed["requiredAccessLevel"],
      level: courseFields.level as CourseSeed["level"],
      estimatedDuration: courseFields.estimatedDuration,
      featured: courseFields.featured,
      phase: canonicalPhase,
      profile,
      modules
    });
  }

  return {
    phases: Array.from(phaseMap.values()),
    courses: seedCourses
  };
}

async function main() {
  const seed = USE_NOTION ? await loadSeedFromNotion({ filters: NOTION_COURSE_FILTERS }) : loadSeedFromFile(FILE!);

  const phaseMap = new Map<PhaseSeed["phase"], number>();
  if (seed.phases?.length) {
    for (const phase of seed.phases) {
      const id = await ensurePhase(phase);
      phaseMap.set(phase.phase, id);
    }
  }

  for (const course of seed.courses) {
    let phaseId = phaseMap.get(course.phase);
    if (!phaseId) {
      phaseId = await findOneBy<any>("formation-phases", { phase: course.phase });
      if (!phaseId) {
        throw new Error(`Missing formation-phase for phase=${course.phase}. Provide it in seed.phases or create it first.`);
      }
    }

    await importCourse(course, phaseId);
  }

  console.log(`\nDone. publish=${PUBLISH} dryRun=${DRY_RUN}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
