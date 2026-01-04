import { NotionPage } from './notionTypes';

interface NotionDatabaseQueryResponse {
  results?: any[];
  has_more?: boolean;
  next_cursor?: string | null;
}

const DATABASE_ENV_MAP = {
  courses: 'NOTION_DB_COURSES',
  lessons: 'NOTION_DB_LESSONS',
  assignments: 'NOTION_DB_ASSIGNMENTS',
  resources: 'NOTION_DB_RESOURCES',
} as const;

const isDryRun = process.argv.includes('--dry-run');

const courseCache = new Map<string, NotionPage | null>();

type DatabaseKey = keyof typeof DATABASE_ENV_MAP;

export async function fetchNotionCourseById(courseIdOrPageId: string): Promise<NotionPage | null> {
  if (courseCache.has(courseIdOrPageId)) {
    return courseCache.get(courseIdOrPageId) ?? null;
  }

  const pageId = extractNotionId(courseIdOrPageId);
  if (pageId) {
    const match = await fetchNotionPage(formatNotionId(pageId));
    const enrichedPage = await enrichCoursePage(match);
    courseCache.set(courseIdOrPageId, enrichedPage);
    if (enrichedPage.courseId) {
      courseCache.set(enrichedPage.courseId, enrichedPage);
    }
    return enrichedPage;
  }

  const normalizedCourseId = courseIdOrPageId.trim().toLowerCase();
  const pages = await queryNotionDatabase(getDatabaseId('courses'));
  const matchIndex = pages.findIndex((page) => {
    const candidate = getCourseIdText(page.properties);
    return candidate?.toLowerCase() === normalizedCourseId;
  });

  if (matchIndex === -1) {
    courseCache.set(courseIdOrPageId, null);
    return null;
  }

  const match = pages[matchIndex];
  const enrichedPage = await enrichCoursePage(match);
  courseCache.set(courseIdOrPageId, enrichedPage);
  if (enrichedPage.courseId) {
    courseCache.set(enrichedPage.courseId, enrichedPage);
  }
  return enrichedPage;
}

export async function listNotionCourses(): Promise<
  Array<{ pageId: string; courseId?: string; title?: string; status?: string }>
> {
  const pages = await queryNotionDatabase(getDatabaseId('courses'));
  return pages.map((page) => {
    const titleProperty =
      page.properties['courseName'] ??
      page.properties['Course Name'] ??
      page.properties['name'] ??
      page.properties['Name'] ??
      page.properties['title'] ??
      page.properties['Title'];

    return {
      pageId: page.id,
      courseId: getCourseIdText(page.properties),
      title: getPlainText(titleProperty),
      status: getStatusText(page.properties),
    };
  });
}

export async function fetchNotionLessons(courseId: string): Promise<NotionPage[]> {
  const coursePage = await ensureCoursePage(courseId);
  const pages = await queryNotionDatabase(getDatabaseId('lessons'));
  return pages.filter((page) => matchesCourse(page, courseId, coursePage.id));
}

export async function fetchNotionAssignments(courseId: string): Promise<NotionPage[]> {
  const coursePage = await ensureCoursePage(courseId);
  const pages = await queryNotionDatabase(getDatabaseId('assignments'));
  return pages.filter((page) => matchesCourse(page, courseId, coursePage.id));
}

export async function fetchNotionResources(courseId: string): Promise<NotionPage[]> {
  const coursePage = await ensureCoursePage(courseId);
  const pages = await queryNotionDatabase(getDatabaseId('resources'));
  return pages.filter((page) => matchesCourse(page, courseId, coursePage.id));
}

export async function writeBackToNotion(
  pageId: string,
  updates: Record<string, unknown>
): Promise<void> {
  if (isDryRun) {
    console.log('[SYNC] Dry run skipping Notion write-back');
    return;
  }

  const formattedPageId = formatNotionId(pageId);
  const page = await fetchNotionPage(formattedPageId);
  const propertyEntries: Record<string, any> = {};

  for (const [field, value] of Object.entries(updates)) {
    if (value === undefined || value === null) {
      continue;
    }

    const propertyDefinition = page.properties[field];
    if (!propertyDefinition) {
      console.warn(`[SYNC] Notion property "${field}" not found on page ${formattedPageId}`);
      continue;
    }

    const payload = buildPropertyPayload(propertyDefinition, value);
    if (payload) {
      propertyEntries[field] = payload;
    }
  }

  if (!Object.keys(propertyEntries).length) {
    return;
  }

  const response = await fetch(`https://api.notion.com/v1/pages/${formattedPageId}`, {
    method: 'PATCH',
    headers: getNotionHeaders(),
    body: JSON.stringify({ properties: propertyEntries }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion write-back failed for ${formattedPageId}: ${text}`);
  }
}

async function ensureCoursePage(courseId: string): Promise<NotionPage> {
  const page = await fetchNotionCourseById(courseId);
  if (!page) {
    throw new Error(`Course ${courseId} not found in Notion`);
  }
  return page;
}

async function enrichCoursePage(page: NotionPage): Promise<NotionPage> {
  const titleProperty =
    page.properties['courseName'] ??
    page.properties['Course Name'] ??
    page.properties['name'] ??
    page.properties['Name'] ??
    page.properties['title'] ??
    page.properties['Title'];

  const title = getPlainText(titleProperty);
  if (title) {
    page.title = title;
  }

  page.status = getStatusText(page.properties);
  page.courseId = getCourseIdText(page.properties);
  page.phase = page.phase ?? (await resolvePhaseRelation(page));
  return page;
}

async function resolvePhaseRelation(page: NotionPage): Promise<NotionPage | null> {
  const keys = [
    'linkedPhase',
    'Linked Phase',
    'phase',
    'Phase',
    'formationPhase',
    'Formation Phase',
    'Formation phase',
    'formation phase',
    'formation_phases',
    'Formation Phases',
  ];

  for (const key of keys) {
    const relationId = getFirstRelationId(page.properties[key]);
    if (relationId) {
      return fetchNotionPage(formatNotionId(relationId));
    }
  }

  return null;
}

function getFirstRelationId(property: any): string | undefined {
  if (!property) return undefined;

  const relations = Array.isArray(property.relation)
    ? property.relation
    : Array.isArray(property.relations)
    ? property.relations
    : [];

  const directId = relations[0]?.id;
  if (directId) return directId;

  const rollupArray = property?.rollup?.array;
  if (Array.isArray(rollupArray) && rollupArray.length) {
    for (const entry of rollupArray) {
      const nested = Array.isArray(entry?.relation)
        ? entry.relation
        : Array.isArray(entry?.relations)
        ? entry.relations
        : [];
      const nestedId = nested[0]?.id;
      if (nestedId) return nestedId;
    }
  }

  return undefined;
}

async function queryNotionDatabase(databaseId: string): Promise<NotionPage[]> {
  const formattedId = formatNotionId(databaseId);
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = {};
    if (cursor) {
      body.start_cursor = cursor;
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${formattedId}/query`,
      {
        method: 'POST',
        headers: getNotionHeaders(),
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const hint =
        response.status === 404 && errorText.includes('"object_not_found"')
          ? `\n\nTroubleshooting:\n- Confirm ${DATABASE_ENV_MAP.courses} / ${DATABASE_ENV_MAP.lessons} / ${DATABASE_ENV_MAP.assignments} / ${DATABASE_ENV_MAP.resources} point to the correct Notion database IDs.\n- In Notion, open the database → Share → Connections, and share it with the integration for your token.\n- Ensure your token is set in NOTION_TOKEN (preferred) or NOTION_API_KEY and matches the integration connected to those databases.`
          : '';
      throw new Error(`Notion query failed for ${formattedId}: ${response.status} ${errorText}${hint}`);
    }

    const result = (await response.json()) as NotionDatabaseQueryResponse;
    const items = Array.isArray(result.results) ? result.results : [];
    for (const raw of items) {
      pages.push({
        id: raw.id,
        properties: raw.properties ?? {},
      });
    }

    cursor = result.has_more ? result.next_cursor ?? undefined : undefined;
  } while (cursor);

  return pages;
}

async function fetchNotionPage(pageId: string): Promise<NotionPage> {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: getNotionHeaders(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load Notion page ${pageId}: ${text}`);
  }
  const data = (await response.json()) as { id: string; properties?: Record<string, any> };
  return {
    id: data.id,
    properties: data.properties ?? {},
  };
}

function matchesCourse(page: NotionPage, courseId: string, notionCourseId: string): boolean {
  const lowerCourseId = courseId.toLowerCase();
  const plainCourseId = getCourseIdText(page.properties);
  if (plainCourseId?.toLowerCase() === lowerCourseId) {
    return true;
  }

  const relationProps = ['course', 'Course', 'linkedCourse', 'relatedCourse'];
  for (const propName of relationProps) {
    if (relationReferencesCourse(page.properties[propName], notionCourseId)) {
      return true;
    }
  }

  const pageCourseId = getPlainText(page.properties['course']);
  if (pageCourseId?.toLowerCase() === lowerCourseId) {
    return true;
  }

  return false;
}

function getCourseIdText(properties: Record<string, any>): string | undefined {
  const keys = ['courseId', 'Course ID', 'Course Id', 'CourseId', 'course id'];
  for (const key of keys) {
    const value = getPlainText(properties[key]);
    if (value) return value;
  }
  return undefined;
}

function getStatusText(properties: Record<string, any>): string | undefined {
  const keys = ['status', 'Status', 'Import Status', 'importStatus'];
  for (const key of keys) {
    const value = getPlainText(properties[key]);
    if (value) return value;
  }
  return undefined;
}

function extractNotionId(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const uuidMatch = trimmed.match(
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i
  );
  if (uuidMatch) return uuidMatch[0];

  const hex32Match = trimmed.match(/[a-f0-9]{32}/i);
  if (hex32Match) return hex32Match[0];

  return null;
}

function relationReferencesCourse(prop: any, notionCourseId: string): boolean {
  if (!prop) return false;

  const relations = Array.isArray(prop.relation)
    ? prop.relation
    : Array.isArray(prop.relations)
    ? prop.relations
    : [];

  const targetId = normalizeId(notionCourseId);
  return relations.some((entry) => normalizeId(entry.id) === targetId);
}

function buildPropertyPayload(property: any, value: unknown): object | undefined {
  const type = property?.type ?? 'rich_text';
  if (type === 'checkbox') {
    return { checkbox: Boolean(value) };
  }

  if (type === 'select') {
    return { select: { name: String(value) } };
  }

  if (type === 'multi_select') {
    const items = Array.isArray(value)
      ? value.map((entry) => ({ name: String(entry) }))
      : [{ name: String(value) }];
    return { multi_select: items };
  }

  if (type === 'number') {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return undefined;
    return { number: numeric };
  }

  if (type === 'date') {
    if (typeof value === 'string') {
      return { date: { start: value } };
    }
    if (typeof value === 'object' && value !== null && 'start' in value) {
      return { date: value };
    }
    return { date: { start: String(value) } };
  }

  if (type === 'title') {
    return {
      title: [
        {
          type: 'text',
          text: { content: String(value) },
        },
      ],
    };
  }

  return {
    rich_text: [
      {
        type: 'text',
        text: {
          content: String(value),
        },
      },
    ],
  };
}

function getPlainText(property: any): string | undefined {
  if (!property) return undefined;

  if (property.select?.name) {
    return property.select.name;
  }

  if (Array.isArray(property.rich_text) && property.rich_text.length) {
    return property.rich_text.map((block: any) => block.plain_text || '').join('');
  }

  if (Array.isArray(property.title) && property.title.length) {
    return property.title.map((block: any) => block.plain_text || '').join('');
  }

  if (typeof property.number !== 'undefined') {
    return String(property.number);
  }

  if (property.type === 'checkbox') {
    return property.checkbox ? 'true' : 'false';
  }

  return undefined;
}

function getDatabaseId(key: DatabaseKey): string {
  const envName = DATABASE_ENV_MAP[key];
  return requireEnvVar(envName);
}

function formatNotionId(id: string): string {
  const cleaned = id.replace(/[^a-f0-9]/gi, '');
  if (cleaned.length === 32) {
    return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}-${cleaned.slice(16, 20)}-${cleaned.slice(20)}`;
  }
  return id;
}

function normalizeId(id: string): string {
  return id.replace(/-/g, '').toLowerCase();
}

let cachedHeaders: Record<string, string> | null = null;

function getNotionHeaders(): Record<string, string> {
  if (!cachedHeaders) {
    const token = requireNotionToken();
    cachedHeaders = {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };
  }
  return cachedHeaders;
}

function requireNotionToken(): string {
  const value = process.env.NOTION_TOKEN ?? process.env.NOTION_API_KEY;
  if (!value) {
    throw new Error(
      'Missing required Notion environment variable: set NOTION_TOKEN (preferred) or NOTION_API_KEY.'
    );
  }
  return value;
}

function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required Notion environment variable "${name}". Refer to NOTION documentation.`
    );
  }
  return value;
}
