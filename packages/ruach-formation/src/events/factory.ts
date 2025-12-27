/**
 * Formation Event Factory
 *
 * Helper functions to create well-formed formation events.
 * Ensures all events have required fields and proper timestamps.
 */

import { randomUUID } from 'node:crypto';
import {
  FormationEvent,
  FormationEventType,
  CovenantEnteredEvent,
  PhaseStartedEvent,
  SectionViewedEvent,
  CheckpointReachedEvent,
  CheckpointCompletedEvent,
  ReflectionSubmittedEvent,
  PauseTriggeredEvent,
  EventMetadata,
} from './types';
import { FormationPhase } from '../types/phase';
import { CovenantType } from '../types/state';
import { ReflectionType } from '../types/checkpoint';

/**
 * Base event creator.
 * All specific event creators use this internally.
 */
function createBaseEvent<T extends FormationEventType>(
  userId: string,
  eventType: T,
  metadata?: EventMetadata
) {
  return {
    id: randomUUID(),
    userId,
    timestamp: new Date(),
    eventType,
    metadata,
  } as const;
}

// ============================================================================
// COVENANT & ENTRY EVENT FACTORIES
// ============================================================================

export function createCovenantEnteredEvent(
  userId: string,
  covenantType: CovenantType,
  acknowledgedTerms: boolean,
  metadata?: EventMetadata
): CovenantEnteredEvent {
  return {
    ...createBaseEvent(userId, FormationEventType.CovenantEntered, metadata),
    data: {
      covenantType,
      acknowledgedTerms,
    },
  };
}

// ============================================================================
// PHASE EVENT FACTORIES
// ============================================================================

export function createPhaseStartedEvent(
  userId: string,
  phase: FormationPhase,
  previousPhase?: FormationPhase,
  metadata?: EventMetadata
): PhaseStartedEvent {
  return {
    ...createBaseEvent(userId, FormationEventType.PhaseStarted, metadata),
    data: {
      phase,
      previousPhase,
    },
  };
}

// ============================================================================
// SECTION EVENT FACTORIES
// ============================================================================

export function createSectionViewedEvent(
  userId: string,
  sectionId: string,
  phase: FormationPhase,
  dwellTimeSeconds: number,
  metadata?: EventMetadata
): SectionViewedEvent {
  return {
    ...createBaseEvent(userId, FormationEventType.SectionViewed, metadata),
    data: {
      sectionId,
      phase,
      dwellTimeSeconds,
    },
  };
}

// ============================================================================
// CHECKPOINT EVENT FACTORIES
// ============================================================================

export function createCheckpointReachedEvent(
  userId: string,
  checkpointId: string,
  sectionId: string,
  phase: FormationPhase,
  metadata?: EventMetadata
): CheckpointReachedEvent {
  return {
    ...createBaseEvent(userId, FormationEventType.CheckpointReached, metadata),
    data: {
      checkpointId,
      sectionId,
      phase,
    },
  };
}

export function createCheckpointCompletedEvent(
  userId: string,
  checkpointId: string,
  sectionId: string,
  phase: FormationPhase,
  reflectionId: string,
  timeSinceReached: number,
  metadata?: EventMetadata
): CheckpointCompletedEvent {
  return {
    ...createBaseEvent(userId, FormationEventType.CheckpointCompleted, metadata),
    data: {
      checkpointId,
      sectionId,
      phase,
      reflectionId,
      timeSinceReached,
    },
  };
}

// ============================================================================
// REFLECTION EVENT FACTORIES
// ============================================================================

export function createReflectionSubmittedEvent(
  userId: string,
  reflectionId: string,
  checkpointId: string,
  type: ReflectionType,
  wordCount: number,
  timeSinceCheckpointReached: number,
  metadata?: EventMetadata
): ReflectionSubmittedEvent {
  return {
    ...createBaseEvent(userId, FormationEventType.ReflectionSubmitted, metadata),
    data: {
      reflectionId,
      checkpointId,
      type,
      wordCount,
      timeSinceCheckpointReached,
    },
  };
}

// ============================================================================
// SYSTEM INTERVENTION EVENT FACTORIES
// ============================================================================

export function createPauseTriggeredEvent(
  userId: string,
  reason: string,
  context: string,
  severity: 'suggestion' | 'warning' | 'gate',
  metadata?: EventMetadata
): PauseTriggeredEvent {
  return {
    ...createBaseEvent(userId, FormationEventType.PauseTriggered, metadata),
    data: {
      reason: reason as any, // Type assertion for now
      context,
      severity,
    },
  };
}

/**
 * Utility: Extract event type from event object.
 * Useful for pattern matching in reducers.
 */
export function getEventType(event: FormationEvent): FormationEventType {
  return event.eventType;
}

/**
 * Utility: Filter events by type.
 */
export function filterEventsByType<T extends FormationEvent>(
  events: FormationEvent[],
  eventType: FormationEventType
): T[] {
  return events.filter((e) => e.eventType === eventType) as T[];
}

/**
 * Utility: Get events for a specific user.
 */
export function filterEventsByUser(
  events: FormationEvent[],
  userId: string
): FormationEvent[] {
  return events.filter((e) => e.userId === userId);
}

/**
 * Utility: Sort events by timestamp (ascending).
 */
export function sortEventsByTimestamp(events: FormationEvent[]): FormationEvent[] {
  return [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
