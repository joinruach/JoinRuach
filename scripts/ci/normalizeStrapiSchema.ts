import fs from 'node:fs';

type StrapiAttribute = {
  type?: string;
  required?: boolean;
  enum?: string[];
  relation?: string;
  target?: string;
};

function parseTargetApiName(target: string | undefined): string | undefined {
  if (!target) return undefined;
  const match = target.match(/^api::([^.]+)\./);
  return match?.[1];
}

export function normalizeStrapiSchema(schemaPath: string) {
  const raw = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

  const fields: Record<string, any> = {};

  for (const [key, attribute] of Object.entries(raw.attributes || {})) {
    const attr = attribute as StrapiAttribute;
    let type = attr.type;

    const normalized: Record<string, any> = {
      required: attr.required === true,
    };

    if (type === 'relation') {
      type = attr.relation;
      normalized.target = parseTargetApiName(attr.target);
    } else if (type === 'enumeration') {
      type = 'enum';
      normalized.enum = attr.enum;
    }

    normalized.type = type;
    fields[key] = normalized;
  }

  return {
    collection: raw.collectionName || raw.info?.collectionName,
    fields,
  };
}
