export type Mutability = 'immutable' | 'contextual';

export type Confidence = 'authoritative' | 'liturgical' | 'illustrative' | 'suggestive';

export interface SectionMeta {
  mutability: Mutability;
  confidence: Confidence;
}

export interface ParsedSection {
  key: string;
  title: string;
  mutability: Mutability;
  confidence: Confidence;
  startLine: number;
  endLine: number;
  content: string;
}
