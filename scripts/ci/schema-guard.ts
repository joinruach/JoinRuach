import fs from 'node:fs';
import path from 'node:path';

import { loadContract } from '../contract/loadContract';
import { normalizeContractEntity } from './normalizeContract';
import { normalizeStrapiSchema } from './normalizeStrapiSchema';

function fatal(message: string): never {
  console.error(`❌ SCHEMA GUARD FAILED\n${message}`);
  process.exit(1);
}

const contract = loadContract();
const errors: string[] = [];

function recordError(message: string) {
  errors.push(message);
}

const entityMap: Record<string, string> = {
  Course: 'course',
  CourseProfile: 'course-profile',
  Module: 'module',
  Lesson: 'lesson',
  Assignment: 'assignment',
  FormationPhase: 'formation-phase',
  GuidebookNode: 'guidebook-node',
};

const repoRoot = process.cwd();
const strapiRootCandidates = [
  process.env.STRAPI_ROOT ? path.resolve(repoRoot, process.env.STRAPI_ROOT) : undefined,
  path.resolve(repoRoot, 'ruach-ministries-backend'),
  repoRoot,
].filter(Boolean) as string[];

const strapiRoot = strapiRootCandidates.find((candidate) => fs.existsSync(path.join(candidate, 'src/api')));
if (!strapiRoot) {
  fatal(
    `Unable to locate Strapi root. Tried: ${strapiRootCandidates.join(', ')} (expected a 'src/api' directory)`
  );
}

function targetsMatch(contractTarget: string | undefined, strapiTargetApi: string | undefined): boolean {
  if (!contractTarget) return true;
  const expectedApiName = entityMap[contractTarget] ?? contractTarget;
  return expectedApiName === strapiTargetApi;
}

function typesCompatible(contractType: string, strapiType: string): boolean {
  if (contractType === strapiType) return true;
  if (contractType === 'string' && strapiType === 'uid') return true;
  if (contractType === 'string' && strapiType === 'text') return true;
  if (contractType === 'richtext' && strapiType === 'text') return true;
  return false;
}

for (const [contractEntity, apiName] of Object.entries(entityMap)) {
  const schemaPath = path.resolve(
    strapiRoot,
    `src/api/${apiName}/content-types/${apiName}/schema.json`
  );

  if (!fs.existsSync(schemaPath)) {
    recordError(`Missing Strapi schema for ${contractEntity} at ${schemaPath}`);
    continue;
  }

  const strapi = normalizeStrapiSchema(schemaPath);
  const canonical = normalizeContractEntity(contractEntity, contract);

  for (const key of Object.keys(canonical.fields)) {
    if (!strapi.fields[key]) {
      recordError(`${contractEntity}: field "${key}" missing in Strapi schema`);
      continue;
    }

    const a = canonical.fields[key];
    const b = strapi.fields[key];

    if (!typesCompatible(a.type, b.type)) {
      recordError(`${contractEntity}.${key}: type mismatch (contract=${a.type}, strapi=${b.type})`);
    }

    if (!targetsMatch(a.target, b.target)) {
      recordError(
        `${contractEntity}.${key}: relation target mismatch (contract=${a.target}, strapi=${b.target})`
      );
    }

    if (a.enum || b.enum) {
      const aEnum = a.enum ?? null;
      const bEnum = b.enum ?? null;
      if (JSON.stringify(aEnum) !== JSON.stringify(bEnum)) {
        recordError(`${contractEntity}.${key}: enum mismatch`);
      }
    }

    if (a.required !== b.required) {
      recordError(`${contractEntity}.${key}: required flag mismatch`);
    }
  }
}

if (errors.length) {
  console.error('❌ SCHEMA DRIFT DETECTED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('✅ Schema guard passed. Contract and Strapi are aligned.');
