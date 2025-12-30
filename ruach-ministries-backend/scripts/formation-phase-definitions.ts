export interface FormationPhaseDefinition {
  slug: string;
  name: string;
  summary: string;
  purpose: string;
  typicalNodes: string[];
  order: number;
}

export const CANONICAL_FORMATION_PHASES: FormationPhaseDefinition[] = [
  {
    slug: 'awakening',
    name: 'Awakening',
    summary: 'Recognition, conviction, exposure to truth',
    purpose: 'Wake the conscience',
    typicalNodes: ['calls to repent', 'warnings', 'revelation moments'],
    order: 1,
  },
  {
    slug: 'separation',
    name: 'Separation',
    summary: 'Detachment from false systems, identities, and coverings',
    purpose: 'Break alignment with Babylon',
    typicalNodes: ['come out', 'renouncing false peace', 'count the cost'],
    order: 2,
  },
  {
    slug: 'foundation',
    name: 'Foundation',
    summary: 'Rebuilding on truth, scripture, and obedience',
    purpose: 'Establish plumb line',
    typicalNodes: ['gospel clarity', 'fear of YHWH', 'identity in Messiah'],
    order: 3,
  },
  {
    slug: 'formation',
    name: 'Formation',
    summary: 'Character shaping, discipline, discernment',
    purpose: 'Internal transformation',
    typicalNodes: ['testing spirits', 'conviction vs condemnation', 'prayer'],
    order: 4,
  },
  {
    slug: 'alignment',
    name: 'Alignment',
    summary: 'Unity of belief, action, and authority',
    purpose: 'Order the inner life',
    typicalNodes: ['obedience', 'submission', 'right love/right hatred'],
    order: 5,
  },
  {
    slug: 'commissioning',
    name: 'Commissioning',
    summary: 'Release into service with authority',
    purpose: 'External fruit',
    typicalNodes: ['calling', 'sending', 'stewardship'],
    order: 6,
  },
  {
    slug: 'perseverance',
    name: 'Perseverance',
    summary: 'Endurance under pressure and opposition',
    purpose: 'Remain faithful',
    typicalNodes: ['fewness/remnant', 'endurance', 'watchfulness'],
    order: 7,
  },
  {
    slug: 'multiplication',
    name: 'Multiplication',
    summary: 'Reproduction of truth in others',
    purpose: 'Kingdom expansion',
    typicalNodes: ['teaching', 'discipling', 'distributed order'],
    order: 8,
  },
];

export const NOTION_PHASE_SLUGS: Record<string, string> = {
  awakening: 'awakening',
  separation: 'separation',
  foundation: 'foundation',
  formation: 'formation',
  alignment: 'alignment',
  commissioning: 'commissioning',
  perseverance: 'perseverance',
  multiplication: 'multiplication',
  commission: 'commissioning',
  discernment: 'formation',
  stewardship: 'alignment',
};

export function formatPhaseDescription(definition: FormationPhaseDefinition): string {
  const nodes = definition.typicalNodes.join(', ');
  return `${definition.summary}.
Purpose: ${definition.purpose}.
Typical nodes: ${nodes}.`;
}
