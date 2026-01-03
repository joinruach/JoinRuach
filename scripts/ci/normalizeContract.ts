const RELATION_TYPES = new Set(['oneToOne', 'oneToMany', 'manyToOne', 'manyToMany']);

type Contract = {
  enums?: Record<string, string[]>;
  entities?: Record<string, Record<string, unknown>>;
};

type NormalizedField = {
  type: string;
  enum?: string[];
  required: boolean;
  target?: string;
};

export function normalizeContractEntity(entityName: string, contract: Contract) {
  const entity = contract.entities?.[entityName] as Record<string, unknown> | undefined;
  if (!entity) throw new Error(`Entity "${entityName}" missing from contract`);

  const fields: Record<string, NormalizedField> = {};

  for (const section of Object.values(entity)) {
    if (typeof section !== 'object' || section === null) continue;

    for (const [key, rules] of Object.entries(section as Record<string, unknown>)) {
      if (typeof rules !== 'object' || rules === null) continue;
      const rule = rules as Record<string, unknown>;

      const type = String(rule.type ?? '');
      if (!type) continue;

      const normalized: NormalizedField = {
        type,
        required: Boolean(rule.required),
      };

      if (type === 'enum') {
        const enumKey = rule.enum;
        if (typeof enumKey !== 'string') throw new Error(`${entityName}.${key}: enum key missing`);
        const values = contract.enums?.[enumKey];
        if (!Array.isArray(values)) throw new Error(`${entityName}.${key}: enum "${enumKey}" missing`);
        normalized.enum = values;
      }

      if (RELATION_TYPES.has(type) && typeof rule.target === 'string') {
        normalized.target = rule.target;
      }

      fields[key] = normalized;
    }
  }

  return { entity: entityName, fields };
}
