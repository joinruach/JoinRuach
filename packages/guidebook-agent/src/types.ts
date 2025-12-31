import type { SectionMeta } from '@ruach/guidebook-parser';

export interface GuidebookNode {
  title: string;
  content: string;
  sectionMetadata?: Record<string, SectionMeta>;
}
