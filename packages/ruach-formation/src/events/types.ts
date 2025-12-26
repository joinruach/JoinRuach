/**
 * Formation Event Types
 *
 * Event Sourcing - Source of Truth
 * All formation state is derived from these immutable events.
 * Events are append-only and never modified or deleted.
 *
 * Design Principle:
 * - Events capture WHAT HAPPENED, not what should happen
 * - Events are past-tense (UserEnteredCovenant, not EnterCovenant)
 * - Events contain all data needed to rebuild state
 * - Events are never deleted (only new compensating events added)
 */

import { FormationPhase } from '../types/phase';
import { CovenantType } from '../types/state';
import { ReflectionType } from '../types/checkpoint';

/**
 * Base event structure.
 * All formation events extend this.
 */
export interface BaseFormationEvent {
  id: string; // Unique event ID (UUID)
  userId: string; // User this event applies to
  timestamp: Date; // When event occurred
  eventType: FormationEventType; // Discriminator for event type
  metadata?: EventMetadata; // Optional contextual data
}

/**
 * Optional metadata attached to events for debugging/analysis.
 */
export interface EventMetadata {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  sourceUrl?: string;
}

/**
 * All possible formation event types.
 * This enum is the event catalog.
 */
export enum FormationEventType {
  // Covenant & Entry
  CovenantEntered = 'covenant_entered',

  // Phase Transitions
  PhaseStarted = 'phase_started',
  PhaseCompleted = 'phase_completed',

  // Section & Content
  SectionViewed = 'section_viewed',
  SectionCompleted = 'section_completed',

  // Checkpoints
  CheckpointReached = 'checkpoint_reached',
  CheckpointCompleted = 'checkpoint_completed',

  // Reflections
  ReflectionSubmitted = 'reflection_submitted',
  ReflectionAnalyzed = 'reflection_analyzed',

  // Canon Engagement
  CanonDefinitionViewed = 'canon_definition_viewed',
  CanonAxiomCited = 'canon_axiom_cited',

  // System Interventions
  PauseTriggered = 'pause_triggered',
  RecommendationIssued = 'recommendation_issued',
  ContentUnlocked = 'content_unlocked',
  ContentGated = 'content_gated',

  // Formation Milestones
  ReadinessLevelChanged = 'readiness_level_changed',
  FormationGapDetected = 'formation_gap_detected',
}

// ============================================================================
// COVENANT & ENTRY EVENTS
// ============================================================================

export interface CovenantEnteredEvent extends BaseFormationEvent {
  eventType: FormationEventType.CovenantEntered;
  data: {
    covenantType: CovenantType;
    acknowledgedTerms: boolean;
  };
}

// ============================================================================
// PHASE EVENTS
// ============================================================================

export interface PhaseStartedEvent extends BaseFormationEvent {
  eventType: FormationEventType.PhaseStarted;
  data: {
    phase: FormationPhase;
    previousPhase?: FormationPhase;
  };
}

export interface PhaseCompletedEvent extends BaseFormationEvent {
  eventType: FormationEventType.PhaseCompleted;
  data: {
    phase: FormationPhase;
    daysInPhase: number;
    checkpointsCompleted: number;
    reflectionsSubmitted: number;
  };
}

// ============================================================================
// SECTION EVENTS
// ============================================================================

export interface SectionViewedEvent extends BaseFormationEvent {
  eventType: FormationEventType.SectionViewed;
  data: {
    sectionId: string;
    phase: FormationPhase;
    dwellTimeSeconds: number; // How long spent in section
  };
}

export interface SectionCompletedEvent extends BaseFormationEvent {
  eventType: FormationEventType.SectionCompleted;
  data: {
    sectionId: string;
    phase: FormationPhase;
    totalDwellTimeSeconds: number;
  };
}

// ============================================================================
// CHECKPOINT EVENTS
// ============================================================================

export interface CheckpointReachedEvent extends BaseFormationEvent {
  eventType: FormationEventType.CheckpointReached;
  data: {
    checkpointId: string;
    sectionId: string;
    phase: FormationPhase;
  };
}

export interface CheckpointCompletedEvent extends BaseFormationEvent {
  eventType: FormationEventType.CheckpointCompleted;
  data: {
    checkpointId: string;
    sectionId: string;
    phase: FormationPhase;
    reflectionId: string; // Links to reflection that completed it
    timeSinceReached: number; // Seconds between reaching and completing
  };
}

// ============================================================================
// REFLECTION EVENTS
// ============================================================================

export interface ReflectionSubmittedEvent extends BaseFormationEvent {
  eventType: FormationEventType.ReflectionSubmitted;
  data: {
    reflectionId: string;
    checkpointId: string;
    type: ReflectionType;
    wordCount: number;
    timeSinceCheckpointReached: number;
  };
}

export interface ReflectionAnalyzedEvent extends BaseFormationEvent {
  eventType: FormationEventType.ReflectionAnalyzed;
  data: {
    reflectionId: string;
    depthScore: number; // 0-1
    isRegurgitation: boolean;
    showsWrestling: boolean;
    doctrinalSoundness: 'sound' | 'unclear' | 'concerning';
    recommendedAction: string; // unlock_next, suggest_resource, etc.
  };
}

// ============================================================================
// CANON ENGAGEMENT EVENTS
// ============================================================================

export interface CanonDefinitionViewedEvent extends BaseFormationEvent {
  eventType: FormationEventType.CanonDefinitionViewed;
  data: {
    axiomId: string;
    term: string;
    context?: string; // Where in the content they viewed it
  };
}

export interface CanonAxiomCitedEvent extends BaseFormationEvent {
  eventType: FormationEventType.CanonAxiomCited;
  data: {
    axiomId: string;
    citationContext: string; // e.g., "in reflection", "in discussion"
  };
}

// ============================================================================
// SYSTEM INTERVENTION EVENTS
// ============================================================================

export interface PauseTriggeredEvent extends BaseFormationEvent {
  eventType: FormationEventType.PauseTriggered;
  data: {
    reason: PauseTriggerReason;
    context: string; // Human-readable explanation
    severity: 'suggestion' | 'warning' | 'gate';
  };
}

export enum PauseTriggerReason {
  SpeedRunDetected = 'speed_run_detected',
  InsufficientDwellTime = 'insufficient_dwell_time',
  MissingReflections = 'missing_reflections',
  SurfaceEngagement = 'surface_engagement',
}

export interface RecommendationIssuedEvent extends BaseFormationEvent {
  eventType: FormationEventType.RecommendationIssued;
  data: {
    recommendationType: 'resource' | 'revisit' | 'pause' | 'connect';
    targetId?: string; // ID of recommended resource/section
    reason: string;
  };
}

export interface ContentUnlockedEvent extends BaseFormationEvent {
  eventType: FormationEventType.ContentUnlocked;
  data: {
    contentType: 'canon' | 'course' | 'cannon' | 'section';
    contentId: string;
    reason: string; // e.g., "consistent_engagement_threshold"
  };
}

export interface ContentGatedEvent extends BaseFormationEvent {
  eventType: FormationEventType.ContentGated;
  data: {
    contentType: 'canon' | 'course' | 'cannon' | 'section';
    contentId: string;
    reason: string; // e.g., "maturity_threshold_not_met"
    requirementsNeeded: string[];
  };
}

// ============================================================================
// READINESS & GAP EVENTS
// ============================================================================

export interface ReadinessLevelChangedEvent extends BaseFormationEvent {
  eventType: FormationEventType.ReadinessLevelChanged;
  data: {
    dimension: 'reflection_depth' | 'pace' | 'canon_engagement';
    previousLevel: string;
    newLevel: string;
    reason: string;
  };
}

export interface FormationGapDetectedEvent extends BaseFormationEvent {
  eventType: FormationEventType.FormationGapDetected;
  data: {
    gapType: 'theological' | 'practical' | 'relational';
    area: string;
    severity: 'minor' | 'moderate' | 'critical';
    recommendation: string;
  };
}

// ============================================================================
// DISCRIMINATED UNION TYPE
// ============================================================================

/**
 * Union type of all formation events.
 * Enables exhaustive type checking in reducers.
 */
export type FormationEvent =
  | CovenantEnteredEvent
  | PhaseStartedEvent
  | PhaseCompletedEvent
  | SectionViewedEvent
  | SectionCompletedEvent
  | CheckpointReachedEvent
  | CheckpointCompletedEvent
  | ReflectionSubmittedEvent
  | ReflectionAnalyzedEvent
  | CanonDefinitionViewedEvent
  | CanonAxiomCitedEvent
  | PauseTriggeredEvent
  | RecommendationIssuedEvent
  | ContentUnlockedEvent
  | ContentGatedEvent
  | ReadinessLevelChangedEvent
  | FormationGapDetectedEvent;

/**
 * Type guard to check if an object is a valid FormationEvent.
 */
export function isFormationEvent(obj: unknown): obj is FormationEvent {
  if (typeof obj !== 'object' || obj === null) return false;

  const event = obj as Partial<BaseFormationEvent>;
  return (
    typeof event.id === 'string' &&
    typeof event.userId === 'string' &&
    event.timestamp instanceof Date &&
    typeof event.eventType === 'string' &&
    Object.values(FormationEventType).includes(event.eventType as FormationEventType)
  );
}
