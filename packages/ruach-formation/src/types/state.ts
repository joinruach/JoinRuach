/**
 * Formation State Types
 *
 * Represents the current formation state of a user.
 * This is a PROJECTION of FormationEvents, not the source of truth.
 * Can be rebuilt from events at any time.
 */

import { FormationPhase } from './phase';

/**
 * Readiness indicators computed from user behavior.
 * These are NOT manually set—they are derived from events.
 */
export interface ReadinessIndicators {
  reflectionDepth: ReadinessLevel; // Based on reflection length, coherence
  pace: PaceStatus; // Based on time-in-phase vs expected
  canonEngagement: ReadinessLevel; // Based on canon definition views, citations
  redFlags: RedFlag[]; // Detected concerning patterns
}

export enum ReadinessLevel {
  Emerging = 'emerging',
  Developing = 'developing',
  Maturing = 'maturing',
  Established = 'established',
}

export enum PaceStatus {
  TooFast = 'too_fast', // Speed-running, insufficient dwell time
  Appropriate = 'appropriate',
  Stalled = 'stalled', // No activity in expected timeframe
}

export enum RedFlag {
  SpeedRunning = 'speed_running', // Consuming without reflection
  MissingReflections = 'missing_reflections', // Skipping checkpoints
  SurfaceEngagement = 'surface_engagement', // Short, regurgitative reflections
  Disengaged = 'disengaged', // No activity in 30+ days
}

/**
 * Formation State Snapshot
 * The current state of a user's formation journey.
 * This is rebuilt from events, not stored as source of truth.
 */
export interface FormationState {
  userId: string;
  currentPhase: FormationPhase;
  phaseEnteredAt: Date;
  daysInPhase: number;

  // Progress tracking
  sectionsViewed: string[]; // Section IDs
  checkpointsReached: string[]; // Checkpoint IDs
  checkpointsCompleted: string[]; // Checkpoints with reflection submitted
  reflectionsSubmitted: number;

  // Readiness assessment (computed)
  readiness: ReadinessIndicators;

  // Access control (what content is unlocked)
  unlockedCanonAxioms: string[]; // Canon axiom IDs
  unlockedCourses: string[]; // Course IDs
  unlockedCannonReleases: string[]; // Cannon release IDs

  // Formation gaps (areas requiring attention)
  formationGaps: FormationGap[];

  // Computed metadata
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormationGap {
  type: 'theological' | 'practical' | 'relational';
  area: string; // e.g., "Identity in Christ", "Discernment practice"
  severity: 'minor' | 'moderate' | 'critical';
  recommendation: string; // e.g., "Return to Awakening.4"
}

/**
 * Covenant choice made at entrance.
 * Formation Journey = full tracking + adaptive system.
 * Resource Explorer = static access, no progression.
 */
export enum CovenantType {
  FormationJourney = 'formation_journey',
  ResourceExplorer = 'resource_explorer',
}

/**
 * Initial formation entry state.
 */
export interface FormationEntry {
  userId: string;
  covenantType: CovenantType;
  enteredAt: Date;
  acknowledgedTerms: boolean;
}
