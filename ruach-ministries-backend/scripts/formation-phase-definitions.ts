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
    summary: 'Recognition, conviction, and exposure to covenant truth',
    purpose: 'Wake the conscience and ignite hunger for holiness',
    typicalNodes: ['calls to repent', 'warnings', 'revelation moments'],
    order: 1,
  },
  {
    slug: 'separation',
    name: 'Separation',
    summary: 'Detachment from false systems, coverings, and comfort',
    purpose: 'Break alignment with Babylon so obedience can take root',
    typicalNodes: ['come out', 'renouncing false peace', 'count the cost'],
    order: 2,
  },
  {
    slug: 'discernment',
    name: 'Discernment',
    summary: 'Rebuilding on scripture, discipline, and spiritual sight',
    purpose: 'Establish a plumb line of truth through testing and prayer',
    typicalNodes: [
      'gospel clarity',
      'fear of YHWH',
      'identity in Messiah',
      'testing spirits',
      'conviction vs condemnation',
      'prayer',
    ],
    order: 3,
  },
  {
    slug: 'commission',
    name: 'Commission',
    summary: 'Alignment of authority, obedience, and sentness',
    purpose: 'Equip and send disciples for kingdom assignments',
    typicalNodes: [
      'obedience',
      'submission',
      'right love/right hatred',
      'the call',
      'distributed kingdom order',
    ],
    order: 4,
  },
  {
    slug: 'stewardship',
    name: 'Stewardship',
    summary: 'Perseverance under pressure and multiplication of truth',
    purpose: 'Live as faithful stewards who release others',
    typicalNodes: [
      'fewness/remnant',
      'endurance',
      'watchfulness',
      'teaching',
      'discipling',
      'distributed order',
    ],
    order: 5,
  },
];

export const NOTION_PHASE_SLUGS: Record<string, string> = {
  awakening: 'awakening',
  separation: 'separation',
  discernment: 'discernment',
  foundation: 'discernment',
  formation: 'discernment',
  alignment: 'commission',
  commissioning: 'commission',
  commission: 'commission',
  perseverance: 'stewardship',
  multiplication: 'stewardship',
  stewardship: 'stewardship',
};

export function formatPhaseDescription(definition: FormationPhaseDefinition): string {
  const nodes = definition.typicalNodes.join(', ');
  return `${definition.summary}.
Purpose: ${definition.purpose}.
Typical nodes: ${nodes}.`;
}
