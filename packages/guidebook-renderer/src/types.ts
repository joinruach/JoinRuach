import type { SectionMeta } from '@ruach/guidebook-parser';

export interface GuidebookNode {
  title: string;
  nodeType: string;
  formationStage: string;
  formationScope: string;
  formationFocus: string;
  content: string;
  sectionMetadata?: Record<string, SectionMeta>;
}
