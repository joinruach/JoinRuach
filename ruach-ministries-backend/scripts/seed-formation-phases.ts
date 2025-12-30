import 'dotenv/config';
import * as crypto from 'crypto';
import { STRAPI_API_TOKEN, STRAPI_URL } from './strapi-env';
import {
  CANONICAL_FORMATION_PHASES,
  formatPhaseDescription,
} from './formation-phase-definitions';

interface PhaseRecord {
  id: number;
  slug: string;
  phaseId?: string | null;
}

function generateChecksum(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex');
}

async function fetchExistingPhases(): Promise<PhaseRecord[]> {
  const response = await fetch(`${STRAPI_URL}/api/formation-phases?pagination[pageSize]=100`, {
    headers: {
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch formation phases (${response.status}): ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.data || [];
}

async function createPhase(payload: any): Promise<void> {
  const response = await fetch(`${STRAPI_URL}/api/formation-phases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({ data: payload }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create phase ${payload.slug}: ${await response.text()}`);
  }
}

async function updatePhase(id: number, payload: any): Promise<void> {
  const response = await fetch(`${STRAPI_URL}/api/formation-phases/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({ data: payload }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update phase ${payload.slug}: ${await response.text()}`);
  }
}

async function main() {
  console.log('📘 Seeding canonical Formation Phases...');

  const existingPhases = await fetchExistingPhases();
  const existingBySlug = new Map<string, PhaseRecord>();

  existingPhases.forEach(phase => {
    const slug = phase.slug || phase.phaseId;
    if (slug) {
      existingBySlug.set(slug, phase);
    }
  });

  for (const definition of CANONICAL_FORMATION_PHASES) {
    const description = formatPhaseDescription(definition);
    const payload = {
      phaseId: definition.slug,
      name: definition.name,
      slug: definition.slug,
      description,
      order: definition.order,
      notionPageId: `phase-${definition.slug}`,
      checksum: generateChecksum(description),
    };

    try {
      if (existingBySlug.has(definition.slug)) {
        const existing = existingBySlug.get(definition.slug);
        await updatePhase(existing.id, payload);
        console.log(`  🔄 Updated phase: ${definition.name}`);
      } else {
        await createPhase(payload);
        console.log(`  ✅ Created phase: ${definition.name}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to seed phase ${definition.name}:`, error);
    }
  }
}

main().catch(error => {
  console.error('Seed failed:', error);
  process.exit(1);
});
