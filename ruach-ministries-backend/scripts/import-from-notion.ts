/**
 * Import Canon Content from Notion to Strapi
 *
 * This script:
 * 1. Exports content from Notion database
 * 2. Validates against Canon Law axiom hierarchy
 * 3. Transforms to Strapi schema format
 * 4. Creates/updates records in Strapi
 *
 * Usage:
 *   npx tsx scripts/import-from-notion.ts
 *   npx tsx scripts/import-from-notion.ts --dry-run
 *   npx tsx scripts/import-from-notion.ts --skip-validation
 *
 * @version 1.0.0
 * @date 2025-12-30
 */

import 'dotenv/config';
import assert from 'node:assert';
import { exportNotionCanon } from './canon-audit/notion-export';
import { auditAllNodes } from './canon-audit/audit-report';
import { STRAPI_API_TOKEN, STRAPI_URL } from './strapi-env';
import type { NotionNode } from './canon-audit/types';
import * as crypto from 'crypto';
import {
  CANONICAL_FORMATION_PHASES,
  NOTION_PHASE_SLUGS,
  formatPhaseDescription,
} from './formation-phase-definitions';
import { loadContract, validateEntity } from './contract';
import type { Contract } from './contract';
import { transformEntity } from './notion/transformEntity';
import type { NotionPage } from './notion/notionTypes';

interface ImportStats {
  phasesCreated: number;
  phasesUpdated: number;
  phasesSkipped: number;
  axiomsCreated: number;
  axiomsUpdated: number;
  axiomsSkipped: number;
  nodesCreated: number;
  nodesUpdated: number;
  nodesSkipped: number;
  coursesCreated: number;
  coursesUpdated: number;
  coursesSkipped: number;
  courseProfilesCreated: number;
  courseProfilesUpdated: number;
  courseProfilesSkipped: number;
  errors: string[];
}

interface CommandLineArgs {
  dryRun: boolean;
  skipValidation: boolean;
  skipExport: boolean;
}

interface NotionDatabaseConfig {
  formationPhases: string;
  canonAxioms: string;
  guidebookNodes: string;
  courses: string;
  canonReleases: string;
}

function requireEnvVar(name: string, fallback?: string | undefined): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const NOTION_DATABASES: NotionDatabaseConfig = {
  formationPhases: requireEnvVar('NOTION_DB_FORMATION_PHASES'),
  canonAxioms: requireEnvVar('NOTION_DB_CANON_AXIOMS'),
  guidebookNodes: requireEnvVar('NOTION_DB_GUIDEBOOK_NODES', process.env.NOTION_DATABASE_ID),
  courses: requireEnvVar('NOTION_DB_COURSES'),
  canonReleases: requireEnvVar('NOTION_DB_CANON_RELEASES'),
};

const contract = loadContract();

const NODE_TYPES = [
  'Awakening',
  'Healing',
  'Warfare',
  'Formation',
  'Commissioning',
] as const;

/**
 * Parse command line arguments
 */
function parseArgs(): CommandLineArgs {
  return {
    dryRun: process.argv.includes('--dry-run'),
    skipValidation: process.argv.includes('--skip-validation'),
    skipExport: process.argv.includes('--skip-export')
  };
}

/**
 * Generate checksum for content
 */
function generateChecksum(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Fetch existing Strapi record by notionPageId
 */
async function fetchByNotionId(
  contentType: string,
  notionPageId: string
): Promise<any | null> {
  try {
    const encodedNotionPageId = encodeURIComponent(notionPageId);
    const response = await fetch(
      `${STRAPI_URL}/api/${contentType}?filters[notionPageId][$eq]=${encodedNotionPageId}`,
      {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) return null;

    const data: { data?: any[] } = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error(`Error fetching ${contentType} by Notion ID:`, error);
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

type StrapiEntityLike = {
  id?: number;
  attributes?: Record<string, any>;
  checksum?: string;
  [key: string]: any;
};

function unwrapStrapiEntity(entity: unknown): StrapiEntityLike | null {
  if (!entity || typeof entity !== 'object') return null;
  const record = entity as StrapiEntityLike;
  const id = typeof record.id === 'number' ? record.id : undefined;
  const attributes =
    record.attributes && typeof record.attributes === 'object' ? record.attributes : undefined;

  // Normalize v4/v5 shapes to `{ id, ...attributes }` where possible.
  if (id !== undefined && attributes) {
    return { id, ...attributes, attributes };
  }

  if (id !== undefined) {
    return record;
  }

  return null;
}

function normalizeForStrapi(value: unknown): unknown {
  if (value instanceof Set) {
    return Array.from(value, (entry) => normalizeForStrapi(entry));
  }

  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries(), ([key, entry]) => [String(key), normalizeForStrapi(entry)])
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForStrapi(entry));
  }

  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = normalizeForStrapi(entry);
    }
    return output;
  }

  return value;
}

function buildStrapiRequestBody(data: unknown): string {
  const normalized = normalizeForStrapi(data);
  // Strapi v4/v5 REST create/update contract:
  // - collection/single type mutations MUST be wrapped in `{ data: ... }`
  // - callers sometimes pass an already-wrapped `{ data }` object; avoid double-wrapping.
  if (isPlainObject(normalized) && 'data' in normalized && Object.keys(normalized).length === 1) {
    return JSON.stringify(normalized);
  }
  return JSON.stringify({ data: normalized });
}

function getStrapiChecksum(entity: unknown): string | undefined {
  const unwrapped = unwrapStrapiEntity(entity);
  const checksum = unwrapped?.checksum ?? unwrapped?.attributes?.checksum;
  return typeof checksum === 'string' && checksum.length > 0 ? checksum : undefined;
}

function getStrapiId(entity: unknown): number | undefined {
  const unwrapped = unwrapStrapiEntity(entity);
  return typeof unwrapped?.id === 'number' ? unwrapped.id : undefined;
}

const upsertCache = new Map<string, { id: number; checksum?: string }>();

type UpsertStatus = 'created' | 'updated' | 'skipped' | 'error';

interface UpsertResult {
  status: UpsertStatus;
  id?: number;
  checksum?: string;
}

/**
 * Create or update a Strapi record
 */
async function upsertStrapiRecord(
  contentType: string,
  data: any,
  notionPageId: string,
  dryRun: boolean = false
): Promise<UpsertResult> {
  const recordLabel =
    data.title || data.name || data.phaseName || data.slug || data.phaseId || 'record';
  const cacheKey = `${contentType}:${notionPageId}`;

  if (dryRun) {
    console.log(`  [DRY RUN] Would upsert ${contentType}:`, recordLabel);
    return { status: 'skipped' };
  }

  try {
    // Check if record exists
    const cached = upsertCache.get(cacheKey);
    const existing = cached ? { id: cached.id, checksum: cached.checksum } : await fetchByNotionId(contentType, notionPageId);
    const existingId = getStrapiId(existing);
    const existingChecksum = getStrapiChecksum(existing);

    if (existingId) {
      // Check if update needed (compare checksums)
      if (existingChecksum && existingChecksum === data.checksum) {
        console.log(`  ⏭️  Skipped (unchanged): ${recordLabel}`);
        return { status: 'skipped', id: existingId, checksum: existingChecksum };
      }

      // Update existing record
      console.log(
        `\n🔍 Payload for PUT /api/${contentType}/${existingId}:`,
        buildStrapiRequestBody(data)
      );
      const response = await fetch(`${STRAPI_URL}/api/${contentType}/${existingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: buildStrapiRequestBody(data),
      });

      if (response.ok) {
        console.log(`  🔄 Updated: ${recordLabel}`);
        upsertCache.set(cacheKey, { id: existingId, checksum: data.checksum });
        return { status: 'updated', id: existingId, checksum: data.checksum };
      } else {
        const error = await response.text();
        console.error(`  ❌ Update failed (${response.status}): ${error}`);
        return { status: 'error' };
      }
    } else {
      // Create new record
      console.log(`\n🔍 Payload for POST /api/${contentType}:`, buildStrapiRequestBody(data));
      const response = await fetch(`${STRAPI_URL}/api/${contentType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: buildStrapiRequestBody(data),
      });

      if (response.ok) {
        console.log(`  ✅ Created: ${recordLabel}`);
        try {
          const createdPayload: any = await response.json();
          const createdId = getStrapiId(createdPayload?.data ?? createdPayload);
          if (createdId) {
            upsertCache.set(cacheKey, { id: createdId, checksum: data.checksum });
            return { status: 'created', id: createdId, checksum: data.checksum };
          }
        } catch {
          // ignore JSON parse issues; creation still succeeded
        }
        return { status: 'created', checksum: data.checksum };
      } else {
        const error = await response.text();
        console.error(`  ❌ Creation failed (${response.status}): ${error}`);
        return { status: 'error' };
      }
    }
  } catch (error) {
    console.error(`  ❌ Error upserting ${contentType}:`, error);
    return { status: 'error' };
  }
}

/**
 * Import formation phases
 */
async function importPhases(
  nodes: NotionNode[],
  stats: ImportStats,
  dryRun: boolean
): Promise<void> {
  console.log('\n📘 Importing Formation Phases...');

  const referencedPhases = new Set<string>();
  nodes.forEach(node => {
    if (node.phase) {
      referencedPhases.add(node.phase);
    }
  });

  for (const phaseDefinition of CANONICAL_FORMATION_PHASES) {
    const description = formatPhaseDescription(phaseDefinition);
    const phaseData = {
      phaseId: phaseDefinition.slug,
      phaseName: phaseDefinition.name,
      slug: phaseDefinition.slug,
      phase: phaseDefinition.slug,
      description,
      order: phaseDefinition.order,
      notionPageId: `phase-${phaseDefinition.slug}`,
      checksum: generateChecksum(description)
    };

    const result = await upsertStrapiRecord(
      'formation-phases',
      phaseData,
      phaseData.notionPageId,
      dryRun
    );

    if (result.status === 'created') stats.phasesCreated++;
    else if (result.status === 'updated') stats.phasesUpdated++;
    else if (result.status === 'skipped') stats.phasesSkipped++;
  }

  const unknownPhases = Array.from(referencedPhases).filter(phaseName => {
    const normalized = phaseName.trim().toLowerCase();
    const slug = NOTION_PHASE_SLUGS[normalized] ?? normalized;
    return !CANONICAL_FORMATION_PHASES.some(def => def.slug === slug);
  });
  unknownPhases.forEach(phase => {
    console.log(`  ⚠️  Node references unknown phase: ${phase}`);
  });
}

/**
 * Import canon axioms
 */
async function importAxioms(
  nodes: NotionNode[],
  stats: ImportStats,
  dryRun: boolean
): Promise<void> {
  console.log('\n⚖️  Importing Canon Axioms...');

  // Extract unique axioms from nodes
  const axiomSet = new Set<string>();
  nodes.forEach(node => {
    if (node.axioms) {
      node.axioms.forEach(axiom => axiomSet.add(axiom));
    }
  });

  // TODO: In production, you'd fetch actual axiom data from Notion
  // For now, we'll create placeholder axioms
  console.log(`  ℹ️  Found ${axiomSet.size} unique axioms referenced`);
  console.log(`  ⚠️  Axiom import requires additional Notion database configuration`);
  console.log(`  ⚠️  Skipping axiom import for now - implement based on your Notion schema`);
}

/**
 * Transform Notion node to Strapi guidebook-node format
 */
function transformNodeToStrapi(node: NotionNode): any {
  const rawContent = node.content || '';
  const content = rawContent.trim();
  assert(content, `Node "${node.title}" is missing required content`);

  const nodeType = determineNodeType(node);
  assert(nodeType && NODE_TYPES.includes(nodeType as (typeof NODE_TYPES)[number]), `Invalid nodeType "${nodeType}" for node "${node.title}"`);
  const formationScope = determineFormationScope(node) || 'Individual';
  const orderInPhase = node.order ?? 1;
  assert(Number.isInteger(orderInPhase), `Node "${node.title}" is missing required orderInPhase`);

  const checksum = generateChecksum(content);
  assert(checksum, `Node "${node.title}" is missing required checksum`);

  return {
    nodeId: node.id.replace(/-/g, '').substring(0, 32), // Notion ID without dashes
    notionPageId: node.id,
    title: node.title,
    slug: node.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    content,
    checksum,
    orderInPhase,
    nodeType,
    formationScope,
    sensitivity: 'Medium',
    checkpointType: isCheckpoint(node) ? 'Text Response' : 'None',
    syncedToStrapi: true,
    syncLock: false,
  };
}

function sanitizeGuidebookNodePayload(payload: Record<string, any>): Record<string, any> {
  const allowedFields = new Set([
    'nodeId',
    'notionPageId',
    'title',
    'slug',
    'content',
    'checksum',
    'orderInPhase',
    'nodeType',
    'formationScope',
    'sensitivity',
    'checkpointType',
    'checkpointPrompt',
    'scriptureReferences',
    'status',
    'phase',
    'canonAxioms',
    'syncedToStrapi',
    'syncLock',
    'publishedAt',
    'strapiEntryId',
    'lastSyncedAt',
    'syncErrors'
  ]);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!allowedFields.has(key)) continue;
    if (value === undefined || value === null) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

/**
 * Formation Scope Mapping
 * Based on authoritative scope assignment (2025-12-30)
 *
 * Individual: Personal conscience, repentance, discernment, obedience
 * Household: Family alignment, shared rhythms, domestic order
 * Ecclesia: Remnant recognition, mutual accountability, shared identity
 * Network: Structure, authority distribution, multiplication
 */
const FORMATION_SCOPE_MAP: Record<string, string> = {
  // Awakening Phase
  'the narrow gate': 'Individual',
  'come out of her': 'Individual', // Transitions to Household
  'awakening checkpoint': 'Individual',
  'count the cost': 'Individual',
  'the cost of discipleship': 'Individual',
  'fewness': 'Individual', // Transitions to Ecclesia
  'remnant pattern': 'Ecclesia',
  'the remnant pattern': 'Ecclesia',

  // Discernment / Warfare Layer
  'discernment': 'Individual',
  'test the spirits': 'Individual',
  'signs': 'Individual',
  'language can deceive': 'Individual',
  'the word as plumb line': 'Individual', // Transitions to Ecclesia
  'conviction vs condemnation': 'Individual',
  'false peace': 'Individual',
  'true rest': 'Individual',

  // Repentance / Obedience Layer
  'repentance': 'Individual',
  'realignment': 'Individual',
  'obedience': 'Individual',
  'first fruits': 'Individual',
  'renouncing false coverings': 'Individual', // Transitions to Ecclesia
  'prayer': 'Individual',
  'breaks the fog': 'Individual',

  // Identity / Gospel Layer
  'identity': 'Individual',
  'beloved before useful': 'Individual',
  'the gospel': 'Individual',
  'grace not performance': 'Individual',
  'not all who say lord': 'Individual',
  'fear of yhwh': 'Individual',
  'clean not crippling': 'Individual',

  // Commissioning Phase
  'the call': 'Individual', // Transitions to Ecclesia
  'distributed kingdom order': 'Network'
};

/**
 * Determine formation scope from node title and phase
 */
function determineFormationScope(node: NotionNode): string {
  const title = node.title.toLowerCase();

  // Check explicit mapping first
  for (const [key, scope] of Object.entries(FORMATION_SCOPE_MAP)) {
    if (title.includes(key)) {
      return scope;
    }
  }

  // Default scope by phase
  const phase = node.phase?.toLowerCase();

  switch (phase) {
    case 'awakening':
    case 'separation':
    case 'discernment':
      return 'Individual'; // Most awakening/discernment content is personal

    case 'warfare':
      return 'Individual'; // Warfare is always personal first

    case 'commission':
      // Commissioning can be Individual or Ecclesia, default to Individual
      if (title.includes('community') || title.includes('ecclesia') || title.includes('remnant')) {
        return 'Ecclesia';
      }
      if (title.includes('network') || title.includes('distributed')) {
        return 'Network';
      }
      return 'Individual';

    case 'stewardship':
      // Stewardship can span all scopes
      if (title.includes('household') || title.includes('family')) {
        return 'Household';
      }
      if (title.includes('community') || title.includes('ecclesia')) {
        return 'Ecclesia';
      }
      if (title.includes('network') || title.includes('multiplication')) {
        return 'Network';
      }
      return 'Individual';

    default:
      return 'Individual'; // Safe default
  }
}

/**
 * Determine node type from content
 */
function determineNodeType(node: NotionNode): string {
  const title = node.title.toLowerCase();
  const content = (node.content || '').toLowerCase();
  const phase = node.phase?.toLowerCase();

  if (phase === 'awakening' || title.includes('narrow gate') || title.includes('awakening')) {
    return 'Awakening';
  }

  if (title.includes('checkpoint') || title.includes('reflection') || title.includes('healing')) {
    return 'Healing';
  }

  if (content.includes('warning') || content.includes('danger') || title.includes('confront')) {
    return 'Warfare';
  }

  if (
    title.includes('call') ||
    title.includes('distributed') ||
    title.includes('kingdom') ||
    title.includes('order')
  ) {
    return 'Commissioning';
  }

  return 'Formation'; // Default
}

/**
 * Check if node is a checkpoint
 */
function isCheckpoint(node: NotionNode): boolean {
  return node.title.toLowerCase().includes('checkpoint');
}

async function syncNodePhase(
  entryId: number | undefined,
  phaseId: number | null,
  dryRun: boolean,
  node: NotionNode,
  stats: ImportStats
): Promise<void> {
  if (!entryId || phaseId === null) return;

  if (dryRun) {
    console.log(`  [DRY RUN] Would link node "${node.title}" (${node.id}) to phase ${phaseId}`);
    return;
  }

  try {
    const response = await fetch(`${STRAPI_URL}/api/guidebook-nodes/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: buildStrapiRequestBody({ phase: phaseId }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ Failed to link phase for node "${node.title}": ${error}`);
      stats.errors.push(`Failed to link phase for node: ${node.title}`);
    } else {
      console.log(`  🔗 Linked phase ${phaseId} to node "${node.title}"`);
    }
  } catch (error) {
    console.error(`  ❌ Error linking phase for node "${node.title}":`, error);
    stats.errors.push(`Failed to link phase for node: ${node.title}`);
  }
}

/**
 * Import guidebook nodes
 */
async function importNodes(
  nodes: NotionNode[],
  stats: ImportStats,
  dryRun: boolean,
  phaseSlugMap?: Record<string, number>
): Promise<void> {
  console.log('\n📖 Importing Guidebook Nodes...');

  const phaseMap = phaseSlugMap ?? (await buildPhaseSlugToIdMap());

  for (const node of nodes) {
    const phaseKey = node.phase ? node.phase.trim().toLowerCase() : null;
    const normalizedPhaseSlug = phaseKey ? (NOTION_PHASE_SLUGS[phaseKey] ?? phaseKey) : null;
    const phaseId = normalizedPhaseSlug ? phaseMap[normalizedPhaseSlug] : null;

    if (node.phase && !phaseId) {
      console.log(`  ⚠️  Phase not found for node "${node.title}": ${node.phase}`);
      stats.nodesSkipped++;
      continue;
    }

    const rawNodeData = transformNodeToStrapi(node);
    const nodeData = sanitizeGuidebookNodePayload(rawNodeData);

      const result = await upsertStrapiRecord(
        'guidebook-nodes',
        nodeData,
        node.id,
        dryRun
      );

    if (result.status === 'created') stats.nodesCreated++;
    else if (result.status === 'updated') stats.nodesUpdated++;
    else if (result.status === 'skipped') stats.nodesSkipped++;
    else if (result.status === 'error') {
      stats.errors.push(`Failed to import node: ${node.title}`);
    }

    if ((result.status === 'created' || result.status === 'updated') && phaseId !== null) {
      await syncNodePhase(result.id, phaseId, dryRun, node, stats);
    }
  }
}

function resolvePhaseSlug(value?: string): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return NOTION_PHASE_SLUGS[normalized] ?? normalized;
}

async function buildPhaseSlugToIdMap(): Promise<Record<string, number>> {
  const response = await fetch(`${STRAPI_URL}/api/formation-phases?pagination[pageSize]=100`, {
    headers: {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch formation phases (${response.status})`);
  }

  const payload: {
    data?: Array<{ id: number; slug?: string | null; phaseId?: string | null }>;
  } = await response.json();

  const map: Record<string, number> = {};
  payload.data?.forEach((phase) => {
    if (phase.slug) {
      map[phase.slug.toLowerCase()] = phase.id;
    }
    if (phase.phaseId) {
      map[phase.phaseId.toLowerCase()] = phase.id;
    }
  });

  return map;
}

function formatDatabaseId(id: string): string {
  const clean = id.replace(/-/g, '');
  if (clean.length === 32) {
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
  }
  return id;
}

async function fetchNotionCourses(apiKey: string, databaseId: string): Promise<NotionPage[]> {
  const formattedId = formatDatabaseId(databaseId);
  const pages: NotionPage[] = [];
  let hasMore = true;
  let cursor: string | undefined;

  while (hasMore) {
    const body = cursor ? { start_cursor: cursor } : {};
    const response = await fetch(`https://api.notion.com/v1/databases/${formattedId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch Notion courses (${response.status}): ${error}`);
    }

    const json: { results?: any[]; has_more?: boolean; next_cursor?: string | null } = await response.json();
    (json.results ?? []).forEach((result) => {
      if (result?.id && result?.properties) {
        pages.push({ id: result.id, properties: result.properties });
      }
    });

    hasMore = Boolean(json.has_more);
    cursor = json.next_cursor ?? undefined;
  }

  return pages;
}

async function importCourses(
  pages: NotionPage[],
  phaseSlugMap: Record<string, number>,
  contract: Contract,
  stats: ImportStats,
  dryRun: boolean
): Promise<void> {
  console.log('\n🎓 Importing Courses...');

  for (const page of pages) {
    try {
      const coursePayload = transformEntity('Course', page);
      const resolvedPhase = resolvePhaseSlug(coursePayload.phase);

      if (!resolvedPhase) {
        stats.errors.push(`Course ${page.id} missing phase information`);
        continue;
      }

      const phaseId = phaseSlugMap[resolvedPhase];

      if (!phaseId) {
        stats.errors.push(`Phase "${coursePayload.phase}" not found for course ${page.id}`);
        continue;
      }

      coursePayload.phase = phaseId;
      const validatedCourse = validateEntity('Course', coursePayload, contract, { mode: 'IMPORT' });
      const courseResult = await upsertStrapiRecord('courses', validatedCourse, page.id, dryRun);

      if (courseResult.status === 'created') stats.coursesCreated++;
      else if (courseResult.status === 'updated') stats.coursesUpdated++;
      else if (courseResult.status === 'skipped') stats.coursesSkipped++;
      else if (courseResult.status === 'error') {
        stats.errors.push(`Failed to upsert course ${page.id}`);
        continue;
      }

      if (!courseResult.id) {
        stats.errors.push(`Course ${page.id} imported but Strapi ID missing`);
        continue;
      }

      const profilePayload = transformEntity('CourseProfile', page);
      profilePayload.course = courseResult.id;
      const validatedProfile = validateEntity('CourseProfile', profilePayload, contract, { mode: 'IMPORT' });
      const profileResult = await upsertStrapiRecord('course-profiles', validatedProfile, page.id, dryRun);

      if (profileResult.status === 'created') stats.courseProfilesCreated++;
      else if (profileResult.status === 'updated') stats.courseProfilesUpdated++;
      else if (profileResult.status === 'skipped') stats.courseProfilesSkipped++;
      else if (profileResult.status === 'error') {
        stats.errors.push(`Failed to upsert profile for course ${page.id}`);
      }
    } catch (error) {
      stats.errors.push(
        `Course ${page.id} import failed: ${(error as Error)?.message ?? String(error)}`
      );
    }
  }
}

/**
 * Print import summary
 */
function printSummary(stats: ImportStats, dryRun: boolean): void {
  console.log('\n' + '═'.repeat(60));
  console.log(dryRun ? 'DRY RUN SUMMARY' : 'IMPORT SUMMARY');
  console.log('═'.repeat(60));

  console.log('\n📘 Formation Phases:');
  console.log(`  ✅ Created: ${stats.phasesCreated}`);
  console.log(`  🔄 Updated: ${stats.phasesUpdated}`);
  console.log(`  ⏭️  Skipped: ${stats.phasesSkipped}`);

  console.log('\n⚖️  Canon Axioms:');
  console.log(`  ✅ Created: ${stats.axiomsCreated}`);
  console.log(`  🔄 Updated: ${stats.axiomsUpdated}`);
  console.log(`  ⏭️  Skipped: ${stats.axiomsSkipped}`);

  console.log('\n📖 Guidebook Nodes:');
  console.log(`  ✅ Created: ${stats.nodesCreated}`);
  console.log(`  🔄 Updated: ${stats.nodesUpdated}`);
  console.log(`  ⏭️  Skipped: ${stats.nodesSkipped}`);

  console.log('\n🎓 Courses:');
  console.log(`  ✅ Created: ${stats.coursesCreated}`);
  console.log(`  🔄 Updated: ${stats.coursesUpdated}`);
  console.log(`  ⏭️  Skipped: ${stats.coursesSkipped}`);

  console.log('\n📝 Course Profiles:');
  console.log(`  ✅ Created: ${stats.courseProfilesCreated}`);
  console.log(`  🔄 Updated: ${stats.courseProfilesUpdated}`);
  console.log(`  ⏭️  Skipped: ${stats.courseProfilesSkipped}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n' + '═'.repeat(60));
}

/**
 * Main import function
 */
async function main() {
  console.log('🔄 Notion → Strapi Import');
  console.log(`📍 Strapi URL: ${STRAPI_URL}\n`);

  const args = parseArgs();
  const stats: ImportStats = {
    phasesCreated: 0,
    phasesUpdated: 0,
    phasesSkipped: 0,
    axiomsCreated: 0,
    axiomsUpdated: 0,
    axiomsSkipped: 0,
  nodesCreated: 0,
  nodesUpdated: 0,
  nodesSkipped: 0,
  coursesCreated: 0,
  coursesUpdated: 0,
  coursesSkipped: 0,
  courseProfilesCreated: 0,
  courseProfilesUpdated: 0,
  courseProfilesSkipped: 0,
  errors: []
};

  try {
    // Step 1: Export from Notion
    console.log('━'.repeat(60));
    console.log('Step 1: Exporting from Notion');
    console.log('━'.repeat(60));

    const notionApiKey = process.env.NOTION_API_KEY;

    if (!notionApiKey) {
      throw new Error(
        'Missing required environment variable: NOTION_API_KEY\n' +
        'Add it to your .env file or export it in your shell.'
      );
    }

    console.log('📦 Notion DBs:', NOTION_DATABASES);

    const nodes = await exportNotionCanon(
      notionApiKey,
      NOTION_DATABASES.guidebookNodes,
      './scripts/canon-audit/data/notion-export.json'
    );
    const notionCourses = await fetchNotionCourses(notionApiKey, NOTION_DATABASES.courses);

    // Step 2: Validate (unless skipped)
    if (!args.skipValidation) {
      console.log('\n━'.repeat(60));
      console.log('Step 2: Validating Canon Alignment');
      console.log('━'.repeat(60));

      const auditReport = auditAllNodes(nodes);

      if (auditReport.errorNodes > 0) {
        console.error(`\n❌ Canon validation failed: ${auditReport.errorNodes} critical errors found`);
        console.error('Fix errors in Notion before importing. Run: tsx scripts/canon-audit/index.ts');
        process.exit(1);
      }

      console.log(`✅ Validation passed: ${auditReport.safeNodes} safe, ${auditReport.warningNodes} warnings`);
    } else {
      console.log('\n⏭️  Skipping validation (--skip-validation flag)');
    }

    // Step 3: Import to Strapi
    console.log('\n━'.repeat(60));
    console.log(`Step 3: Importing to Strapi${args.dryRun ? ' (DRY RUN)' : ''}`);
    console.log('━'.repeat(60));

    await importPhases(nodes, stats, args.dryRun);
    const phaseSlugMap = await buildPhaseSlugToIdMap();
    await importCourses(notionCourses, phaseSlugMap, contract, stats, args.dryRun);
    await importAxioms(nodes, stats, args.dryRun);
    await importNodes(nodes, stats, args.dryRun, phaseSlugMap);

    // Step 4: Print summary
    printSummary(stats, args.dryRun);

    if (args.dryRun) {
      console.log('\n💡 This was a dry run. Run without --dry-run to actually import data.');
    } else {
      console.log('\n✅ Import complete!');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// CLI help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Notion → Strapi Import Script

Usage:
  npx tsx scripts/import-from-notion.ts [options]

Options:
  --dry-run           Preview changes without actually importing
  --skip-validation   Skip Canon Law validation (not recommended)
  --skip-export       Use cached Notion export (faster for testing)
  --help              Show this help message

Environment Variables (required):
  NOTION_API_KEY              Your Notion integration API key
  NOTION_DB_FORMATION_PHASES  Notion database ID for Formation Phases
  NOTION_DB_CANON_AXIOMS      Notion database ID for Canon Axioms
  NOTION_DB_GUIDEBOOK_NODES   Notion database ID for Guidebook Nodes
  NOTION_DB_COURSES           Notion database ID for Courses
  NOTION_DB_CANON_RELEASES    Notion database ID for Canon Releases
  STRAPI_URL                  Strapi backend URL (default: http://localhost:1337)
  STRAPI_API_TOKEN            Strapi API token with write permissions

Examples:
  # Preview what would be imported
  npx tsx scripts/import-from-notion.ts --dry-run

  # Full import with validation
  npx tsx scripts/import-from-notion.ts

  # Skip validation (dangerous!)
  npx tsx scripts/import-from-notion.ts --skip-validation

Setup:
  See scripts/canon-audit/QUICKSTART.md for Notion integration setup
  `);
  process.exit(0);
}

main();
