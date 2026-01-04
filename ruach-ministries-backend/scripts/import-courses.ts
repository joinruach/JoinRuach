/**
 * Import Courses + Lessons + Assignments + Resources
 * Notion → Strapi (Contract-complete)
 *
 * Usage:
 *   pnpm tsx scripts/import-courses.ts --courseId come-out-of-her --dry-run
 */

import 'dotenv/config'
import assert from 'node:assert'
import crypto from 'node:crypto'
import { loadContract, validateEntity } from './contract'
import { transformEntity } from './notion/transformEntity'
import {
  fetchNotionCourseById,
  fetchNotionLessons,
  fetchNotionAssignments,
  fetchNotionResources,
  listNotionCourses,
  writeBackToNotion,
} from './notion/course-helpers'

/* ───────────────────────────────────────────── */
/* CLI                                           */
/* ───────────────────────────────────────────── */

const args = process.argv.slice(2)
const get = (k: string) => {
  const i = args.indexOf(`--${k}`)
  return i !== -1 ? args[i + 1] : undefined
}

const courseId = get('courseId')
const dryRun = args.includes('--dry-run')
const force = args.includes('--force')
const help = args.includes('--help') || args.includes('-h')
const listCourses = args.includes('--list-courses')

function printHelp() {
  console.log(`
Import Courses + Lessons + Assignments + Resources (Notion → Strapi)

Usage:
  pnpm tsx scripts/import-courses.ts --courseId <courseId|notionPageId|notionUrl> [--dry-run] [--force]
  pnpm tsx scripts/import-courses.ts --list-courses

Options:
  --courseId        Course identifier from Notion (courseId property), OR a Notion page ID/URL for the course page
  --dry-run         Print actions without writing to Strapi/Notion
  --force           Import even if checksums/status would skip
  --list-courses    List courses discovered in the Notion Courses database
  --help, -h        Show this help
`.trim())
}

/* ───────────────────────────────────────────── */
/* Constants                                     */
/* ───────────────────────────────────────────── */

const ALLOWED_IMPORT_STATUSES = ['Ready', 'Synced', 'Published'] as const

/* ───────────────────────────────────────────── */
/* Helpers                                       */
/* ───────────────────────────────────────────── */

function checksum(value: unknown): string {
  return crypto
    .createHash('md5')
    .update(JSON.stringify(value))
    .digest('hex')
}

/* ───────────────────────────────────────────── */
/* Main                                          */
/* ───────────────────────────────────────────── */

async function main() {
  if (help) {
    printHelp()
    return
  }

  if (listCourses) {
    const courses = await listNotionCourses()
    const rows = courses
      .filter(c => c.courseId || c.title || c.status)
      .sort((a, b) => (a.courseId ?? '').localeCompare(b.courseId ?? ''))

    if (!rows.length) {
      console.log('No courses found in Notion.')
      return
    }

    for (const course of rows) {
      const label = [
        course.courseId ? `courseId=${course.courseId}` : null,
        course.status ? `status=${course.status}` : null,
        course.title ? `title=${course.title}` : null,
        `pageId=${course.pageId}`,
      ]
        .filter(Boolean)
        .join(' | ')
      console.log(label)
    }
    return
  }

  assert(courseId, 'Missing --courseId (run with --list-courses or --help)')
  console.log(`\n🎓 Importing course: ${courseId}`)
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`)

  const fakeIdForNotionPageId = (notionPageId: string): number => {
    const hex = crypto
      .createHash('md5')
      .update(notionPageId)
      .digest('hex')
      .slice(0, 8)
    const numeric = Number.parseInt(hex, 16)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
  }

  const strapiEnv = dryRun ? null : await import('./strapi-env')
  const STRAPI_URL = strapiEnv?.STRAPI_URL
  const STRAPI_API_TOKEN = strapiEnv?.STRAPI_API_TOKEN

  async function fetchByField(type: string, field: string, value: string) {
    if (dryRun) return null
    const res = await fetch(
      `${STRAPI_URL}/api/${type}?filters[${encodeURIComponent(field)}][$eq]=${encodeURIComponent(
        value
      )}`,
      { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` } }
    )
    if (!res.ok) return null
    const json = (await res.json()) as { data?: any[] }
    return json.data?.[0] ?? null
  }

  async function upsert(
    type: string,
    identityField: string,
    identityValue: string,
    payload: any
  ): Promise<number | null> {
    if (payload.syncLock) {
      throw new Error(`syncLock enabled for ${type}:${identityValue}`)
    }

    if (dryRun) {
      console.log(
        `[DRY RUN] UPSERT ${type}`,
        payload.name ?? payload.lessonTitle ?? payload.title
      )
      return fakeIdForNotionPageId(`${type}:${identityField}:${identityValue}`)
    }

    const existing = await fetchByField(type, identityField, identityValue)
    const existingChecksum =
      existing?.attributes?.checksum ?? existing?.checksum

    if (!force && existingChecksum === payload.checksum) {
      return existing?.id ?? null
    }

    const url = existing
      ? `${STRAPI_URL}/api/${type}/${existing.id}`
      : `${STRAPI_URL}/api/${type}`

    const res = await fetch(url, {
      method: existing ? 'PUT' : 'POST',
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: payload }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`${type} upsert failed: ${err}`)
    }

    const json = (await res.json()) as { data?: { id?: number } }
    return json.data?.id ?? null
  }

  const contract = loadContract()
  const errors: string[] = []

  /* 1️⃣ Fetch Notion course */
  const notionCourse = await fetchNotionCourseById(courseId)
  if (!notionCourse) {
    throw new Error(
      `Course not found in Notion for --courseId "${courseId}". ` +
        `Tip: --courseId accepts the Notion courseId field OR the Notion page ID/URL for the course page.`
    )
  }

  if (
    !ALLOWED_IMPORT_STATUSES.includes(notionCourse.status) &&
    !force
  ) {
    console.log(
      `⏭️  Course status is "${notionCourse.status}". ` +
        `Allowed: ${ALLOWED_IMPORT_STATUSES.join(', ')}`
    )
    console.log('💡 Use --force to import anyway')
    process.exit(0)
  }

  assert(notionCourse.courseId, 'Missing Course ID in Notion')
  if (!notionCourse.phase) {
    const propertyKeys = Object.keys(notionCourse.properties ?? {})
      .sort()
      .join(', ')
    throw new Error(
      [
        'Course must be linked to a Formation Phase (Notion relation).',
        '',
        'Troubleshooting:',
        '- Confirm the course has a Formation Phase relation set (e.g. Awakening).',
        '- Share the Formation Phases database with your Notion integration (Connections → enable integration).',
        '- If the relation property has a custom name, ensure it matches one of: linkedPhase, phase, Formation Phase.',
        '',
        `Course page property keys seen: ${propertyKeys || '(none)'}`,
      ].join('\n')
    )
  }

  /* 2️⃣ Phase */
  const phase = transformEntity('FormationPhase', notionCourse.phase)
  phase.checksum = checksum(phase)
  phase.syncedToStrapi = true

  const phaseId = await upsert(
    'formation-phases',
    'phaseId',
    phase.phaseId,
    validateEntity('FormationPhase', phase, contract, { mode: 'IMPORT' })
  )

  assert(phaseId, 'Phase import failed')

  /* 3️⃣ Course */
  const course = transformEntity('Course', notionCourse)
  course.phase = phaseId
  course.checksum = checksum(course)
  course.syncedToStrapi = true

  const courseStrapiId = await upsert(
    'courses',
    'courseId',
    course.courseId,
    validateEntity('Course', course, contract, { mode: 'IMPORT' })
  )

  assert(courseStrapiId, 'Course import failed')

  await writeBackToNotion(course.notionPageId, {
    strapiEntryId: courseStrapiId,
    lastSyncedAt: new Date().toISOString(),
    checksum: course.checksum,
    syncedToStrapi: true,
    status: 'Synced',
    syncErrors: '',
  })

  /* 4️⃣ Lessons */
  const lessons = await fetchNotionLessons(courseId)
  for (let i = 0; i < lessons.length; i++) {
    const page = lessons[i]
    try {
      console.log(
        `📖 Lesson ${i + 1}/${lessons.length}: ${page.title}`
      )
      const lesson = transformEntity('Lesson', page)
      lesson.course = courseStrapiId
      lesson.checksum = checksum(lesson)

      const id = await upsert(
        'lessons',
        'slug',
        lesson.slug,
        validateEntity('Lesson', lesson, contract, { mode: 'IMPORT' })
      )

      await writeBackToNotion(page.id, {
        strapiEntryId: id ?? undefined,
        checksum: lesson.checksum,
        syncedToStrapi: true,
        syncErrors: '',
        lastSyncedAt: new Date().toISOString(),
      })
    } catch (err: any) {
      errors.push(`Lesson failed: ${page.title}`)
      await writeBackToNotion(page.id, {
        syncErrors: err.message,
      })
    }
  }

  /* 5️⃣ Assignments */
  const assignments = await fetchNotionAssignments(courseId)
  for (const page of assignments) {
    try {
      const assignment = transformEntity('Assignment', page)
      assignment.course = courseStrapiId
      assignment.checksum = checksum(assignment)

      const id = await upsert(
        'assignments',
        'assignmentId',
        assignment.assignmentId,
        validateEntity('Assignment', assignment, contract, {
          mode: 'IMPORT',
        })
      )

      await writeBackToNotion(page.id, {
        strapiEntryId: id ?? undefined,
        checksum: assignment.checksum,
        syncedToStrapi: true,
        syncErrors: '',
        lastSyncedAt: new Date().toISOString(),
      })
    } catch (err: any) {
      errors.push(`Assignment failed: ${page.title}`)
      await writeBackToNotion(page.id, {
        syncErrors: err.message,
      })
    }
  }

  /* 6️⃣ Resources */
  const resources = await fetchNotionResources(courseId)
  for (const page of resources) {
    try {
      const resource = transformEntity('Resource', page)
      resource.course = courseStrapiId
      resource.checksum = checksum(resource)

      const id = await upsert(
        'resources',
        'resourceId',
        resource.resourceId,
        validateEntity('Resource', resource, contract, {
          mode: 'IMPORT',
        })
      )

      await writeBackToNotion(page.id, {
        strapiEntryId: id ?? undefined,
        checksum: resource.checksum,
        syncedToStrapi: true,
        syncErrors: '',
        lastSyncedAt: new Date().toISOString(),
      })
    } catch (err: any) {
      errors.push(`Resource failed: ${page.title}`)
      await writeBackToNotion(page.id, {
        syncErrors: err.message,
      })
    }
  }

  /* Summary */
  console.log('\n✅ Import complete')
  if (errors.length) {
    console.log(`⚠️  Completed with ${errors.length} errors`)
    errors.forEach(e => console.log(`  - ${e}`))
  }

  if (dryRun) {
    console.log('💡 No data was written (dry run)')
  }
}

main().catch(err => {
  console.error('\n❌ Import failed')
  console.error(err)
  process.exit(1)
})
