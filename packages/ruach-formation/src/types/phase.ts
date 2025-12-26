/**
 * Formation Phase Types
 *
 * Represents the canonical stages of spiritual formation in the Ruach Guidebook.
 * Phases are sequential and gate-protected (not freely navigable).
 */

/**
 * The five formation phases.
 * Phase 1 (Awakening) is the MVP focus.
 */
export enum FormationPhase {
  Awakening = 'awakening',
  Separation = 'separation',
  Discernment = 'discernment',
  Commission = 'commission',
  Stewardship = 'stewardship',
}

/**
 * Metadata about a formation phase.
 * Stored as content in Strapi, referenced by phase enum.
 */
export interface FormationPhaseMetadata {
  phase: FormationPhase;
  title: string;
  description: string;
  expectedDurationDays: number; // Suggested minimum time in phase
  requiredCheckpoints: number; // Minimum checkpoints to complete phase
  canonReferences: string[]; // Canon axiom IDs relevant to this phase
}

/**
 * A section within a formation phase.
 * Each phase contains multiple sections, each with teaching + checkpoints.
 */
export interface FormationSection {
  id: string;
  phase: FormationPhase;
  order: number; // Sequential order within phase
  slug: string;
  title: string;
  content: string; // Markdown content
  scriptureAnchors: ScriptureReference[];
  estimatedReadingMinutes: number;
  checkpointIds: string[]; // IDs of checkpoints within this section
}

export interface ScriptureReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  translation?: string; // e.g., "ESV", "NASB"
}
