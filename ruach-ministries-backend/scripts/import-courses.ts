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
import { STRAPI_URL, STRAPI_API_TOKEN } from './strapi-env'
import { loadContract, validateEntity } from './contract'
import { transformEntity } from './notion/transformEntity'
import {
  fetchNotionCourseById,
  fetchNotionLessons,
  fetchNotionAssignments,
  fetchNotionResources,
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

assert(courseId, 'Missing --courseId')

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

async function fetchByNotionId(
  type: string,
  notionPageId: string
) {
  const res = await fetch(
    `${STRAPI_URL}/api/${type}?filters[notionPageId][$eq]=${encodeURIComponent(
      notionPageId
    )}`,
    { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` } }
  )
  if (!res.ok) return null
  const json = (await res.json()) as { data?: any[] }
  return json.data?.[0] ?? null
}

async function upsert(
  type: string,
  notionPageId: string,
  payload: any
): Promise<number | null> {
  if (payload.syncLock) {
    throw new Error(`syncLock enabled for ${type}:${notionPageId}`)
  }

  const existing = await fetchByNotionId(type, notionPageId)
  const existingChecksum =
    existing?.attributes?.checksum ?? existing?.checksum

  if (!force && existingChecksum === payload.checksum) {
    return existing?.id ?? null
  }

  if (dryRun) {
    console.log(
      `[DRY RUN] ${existing ? 'UPDATE' : 'CREATE'} ${type}`,
      payload.name ?? payload.lessonTitle ?? payload.title
    )
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

/* ───────────────────────────────────────────── */
/* Main                                          */
/* ───────────────────────────────────────────── */

async function main() {
  console.log(`\n🎓 Importing course: ${courseId}`)
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`)

  const contract = loadContract()
  const errors: string[] = []

  /* 1️⃣ Fetch Notion course */
  const notionCourse = await fetchNotionCourseById(courseId)
  assert(notionCourse, 'Course not found in Notion')

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
  assert(notionCourse.phase, 'Course must be linked to a Formation Phase')

  /* 2️⃣ Phase */
  const phase = transformEntity('Phase', notionCourse.phase)
  phase.checksum = checksum(phase)
  phase.syncedToStrapi = true

  const phaseId = await upsert(
    'formation-phases',
    phase.notionPageId,
    validateEntity('Phase', phase, contract, { mode: 'IMPORT' })
  )

  assert(phaseId, 'Phase import failed')

  /* 3️⃣ Course */
  const course = transformEntity('Course', notionCourse)
  course.phase = phaseId
  course.checksum = checksum(course)
  course.syncedToStrapi = true

  const courseStrapiId = await upsert(
    'courses',
    course.notionPageId,
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
        lesson.notionPageId,
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
        assignment.notionPageId,
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
        resource.notionPageId,
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
