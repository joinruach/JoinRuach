/**
 * Seed a formation protocol (with phases + diagnostics) into Strapi via REST.
 *
 * Usage:
 *   pnpm tsx scripts/seed-remnant-protocol.ts scripts/seeds/remnant-protocol.v1.json
 *
 * Env:
 *   STRAPI_URL (default http://localhost:1337)
 *   STRAPI_API_TOKEN (required)
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { STRAPI_API_TOKEN, STRAPI_URL } from './strapi-env';

type SeedFile = {
  protocol: Record<string, any>;
  phases: Array<Record<string, any>>;
  diagnostics?: Array<Record<string, any>>;
};

function requireArgFilePath(): string {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error(
      'Missing seed file path.\n' +
        'Usage: pnpm tsx scripts/seed-remnant-protocol.ts scripts/seeds/remnant-protocol.v1.json'
    );
  }
  return inputPath;
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

async function getByUniqueField(
  contentType: string,
  field: string,
  value: string
): Promise<any | null> {
  const response = await fetch(
    `${STRAPI_URL}/api/${contentType}?filters[${field}][$eq]=${encode(value)}`,
    { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` } }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET ${contentType} failed: ${response.status} ${response.statusText}\n${text}`);
  }

  const payload = (await response.json()) as { data?: any[] };
  return payload.data?.[0] ?? null;
}

async function upsert(
  contentType: string,
  uniqueField: string,
  data: Record<string, any>
): Promise<any> {
  const uniqueValue = String(data[uniqueField] ?? '');
  if (!uniqueValue) {
    throw new Error(`Missing unique field "${uniqueField}" for ${contentType}`);
  }

  const existing = await getByUniqueField(contentType, uniqueField, uniqueValue);

  if (existing) {
    const response = await fetch(`${STRAPI_URL}/api/${contentType}/${existing.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `PUT ${contentType}/${existing.id} failed: ${response.status} ${response.statusText}\n${text}`
      );
    }

    return response.json();
  }

  const response = await fetch(`${STRAPI_URL}/api/${contentType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST ${contentType} failed: ${response.status} ${response.statusText}\n${text}`);
  }

  return response.json();
}

async function main() {
  const inputFile = requireArgFilePath();
  const absolutePath = path.resolve(process.cwd(), inputFile);
  const seed = JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as SeedFile;

  const createdProtocol = await upsert('formation-protocols', 'protocolId', seed.protocol);
  const protocolId = createdProtocol?.data?.id;
  if (!protocolId) {
    throw new Error('Failed to resolve protocol id after upsert.');
  }
  const protocolKey = String(seed.protocol.protocolId ?? seed.protocol.slug ?? protocolId);

  const slugToPhaseId = new Map<string, number>();
  for (const phase of seed.phases) {
    const createdPhase = await upsert('protocol-phases', 'slug', { ...phase, protocol: protocolId });
    const phaseId = createdPhase?.data?.id;
    const phaseSlug = createdPhase?.data?.attributes?.slug;
    if (!phaseId || !phaseSlug) {
      throw new Error(`Failed to upsert phase "${phase.title ?? phase.slug ?? 'unknown'}"`);
    }
    slugToPhaseId.set(phaseSlug, phaseId);
  }

  for (const diagnostic of seed.diagnostics ?? []) {
    const recommendedSlug = String(diagnostic.recommendedPhaseSlug ?? '');
    if (!recommendedSlug) {
      throw new Error(`Diagnostic "${diagnostic.trigger}" missing recommendedPhaseSlug`);
    }

    const recommendedPhaseId = slugToPhaseId.get(recommendedSlug);
    if (!recommendedPhaseId) {
      throw new Error(`Diagnostic "${diagnostic.trigger}" references unknown phase slug: ${recommendedSlug}`);
    }

    const diagnosticKey = String(diagnostic.diagnosticKey ?? `${protocolKey}:${diagnostic.order}`);

    await upsert('protocol-diagnostics', 'diagnosticKey', {
      ...diagnostic,
      diagnosticKey,
      protocol: protocolId,
      recommendedPhase: recommendedPhaseId,
    });
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete:', seed.protocol.title);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
