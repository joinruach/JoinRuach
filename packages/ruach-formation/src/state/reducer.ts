/**
 * Formation State Reducer
 *
 * Projects FormationEvents into FormationState.
 * This is the core of the event sourcing pattern:
 * - Events are immutable truth
 * - State is a projection (derived, not stored)
 * - State can be rebuilt from events at any time
 *
 * Pattern: Reducer takes current state + new event → returns new state
 */

import {
  FormationEvent,
  FormationEventType,
  CovenantEnteredEvent,
  PhaseStartedEvent,
  SectionViewedEvent,
  CheckpointReachedEvent,
  CheckpointCompletedEvent,
  ReflectionSubmittedEvent,
  CanonDefinitionViewedEvent,
  ContentUnlockedEvent,
  FormationGapDetectedEvent,
  PauseTriggeredEvent,
} from '../events/types';
import { FormationPhase } from '../types/phase';
import {
  FormationState,
  CovenantType,
  ReadinessIndicators,
  ReadinessLevel,
  PaceStatus,
  RedFlag,
  FormationGap,
} from '../types/state';

/**
 * Initial state for a new user.
 */
export function createInitialState(userId: string): FormationState {
  return {
    userId,
    currentPhase: FormationPhase.Awakening,
    phaseEnteredAt: new Date(),
    daysInPhase: 0,
    sectionsViewed: [],
    checkpointsReached: [],
    checkpointsCompleted: [],
    reflectionsSubmitted: 0,
    readiness: {
      reflectionDepth: ReadinessLevel.Emerging,
      pace: PaceStatus.Appropriate,
      canonEngagement: ReadinessLevel.Emerging,
      redFlags: [],
    },
    unlockedCanonAxioms: [],
    unlockedCourses: [],
    unlockedCannonReleases: [],
    formationGaps: [],
    lastActivityAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Main reducer: applies a single event to state.
 * This is a pure function (no side effects).
 */
export function applyEvent(state: FormationState, event: FormationEvent): FormationState {
  // Update lastActivityAt and updatedAt for all events
  const baseUpdate = {
    lastActivityAt: event.timestamp,
    updatedAt: event.timestamp,
  };

  switch (event.eventType) {
    case FormationEventType.CovenantEntered:
      return handleCovenantEntered(state, event as CovenantEnteredEvent, baseUpdate);

    case FormationEventType.PhaseStarted:
      return handlePhaseStarted(state, event as PhaseStartedEvent, baseUpdate);

    case FormationEventType.SectionViewed:
      return handleSectionViewed(state, event as SectionViewedEvent, baseUpdate);

    case FormationEventType.CheckpointReached:
      return handleCheckpointReached(state, event as CheckpointReachedEvent, baseUpdate);

    case FormationEventType.CheckpointCompleted:
      return handleCheckpointCompleted(state, event as CheckpointCompletedEvent, baseUpdate);

    case FormationEventType.ReflectionSubmitted:
      return handleReflectionSubmitted(state, event as ReflectionSubmittedEvent, baseUpdate);

    case FormationEventType.CanonDefinitionViewed:
      return handleCanonDefinitionViewed(state, event as CanonDefinitionViewedEvent, baseUpdate);

    case FormationEventType.ContentUnlocked:
      return handleContentUnlocked(state, event as ContentUnlockedEvent, baseUpdate);

    case FormationEventType.FormationGapDetected:
      return handleFormationGapDetected(state, event as FormationGapDetectedEvent, baseUpdate);

    case FormationEventType.PauseTriggered:
      return handlePauseTriggered(state, event as PauseTriggeredEvent, baseUpdate);

    // Other events don't modify state directly (e.g., analytics events)
    default:
      return { ...state, ...baseUpdate };
  }
}

/**
 * Rebuild state from a list of events.
 * This is the core replay mechanism.
 */
export function rebuildState(userId: string, events: FormationEvent[]): FormationState {
  const sortedEvents = [...events].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  return sortedEvents.reduce((state, event) => applyEvent(state, event), createInitialState(userId));
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function handleCovenantEntered(
  state: FormationState,
  event: CovenantEnteredEvent,
  baseUpdate: Partial<FormationState>
): FormationState {
  return {
    ...state,
    ...baseUpdate,
    createdAt: event.timestamp,
  };
}

function handlePhaseStarted(
  state: FormationState,
  event: PhaseStartedEvent,
  baseUpdate: Partial<FormationState>
): FormationState {
  return {
    ...state,
    ...baseUpdate,
    currentPhase: event.data.phase,
    phaseEnteredAt: event.timestamp,
    daysInPhase: 0,
  };
}

function handleSectionViewed(
  state: FormationState,
  event: SectionViewedEvent,
  baseUpdate: Partial<FormationState>
): FormationState {
  const alreadyViewed = state.sectionsViewed.includes(event.data.sectionId);
  if (alreadyViewed) {
    return { ...state, ...baseUpdate };
  }

  return {
    ...state,
    ...baseUpdate,
    sectionsViewed: [...state.sectionsViewed, event.data.sectionId],
  };
}

function handleCheckpointReached(
  state: FormationState,
  event: CheckpointReachedEvent,
  baseUpdate: Partial<FormationState>
): FormationState {
  const alreadyReached = state.checkpointsReached.includes(event.data.checkpointId);
  if (alreadyReached) {
    return { ...state, ...baseUpdate };
  }

  return {
    ...state,
    ...baseUpdate,
    checkpointsReached: [...state.checkpointsReached, event.data.checkpointId],
  };
}

function handleCheckpointCompleted(
  state: FormationState,
  event: CheckpointCompletedEvent,
  baseUpdate: Partial<FormationState>
): FormationState {
  const alreadyCompleted = state.checkpointsCompleted.includes(event.data.checkpointId);
  if (alreadyCompleted) {
    return { ...state, ...baseUpdate };
  }

  return {
    ...state,
    ...baseUpdate,
    checkpointsCompleted: [...state.checkpointsCompleted, event.data.checkpointId],
  };
}

function handleReflectionSubmitted(
  state: FormationState,
  event: ReflectionSubmittedEvent,
  baseUpdate: Partial<FormationState>
): FormationState {
  return {
    ...state,
    ...baseUpdate,
    reflectionsSubmitted: state.reflectionsSubmitted + 1,
  };
}

function handleCanonDefinitionViewed(
  state: FormationState,
  event: CanonDefinitionViewedEvent,
  baseUpdate: Partial<FormationState>
): FormationState {
  const alreadyUnlocked = state.unlockedCanonAxioms.includes(event.data.axiomId);
  if (alreadyUnlocked) {
    return { ...state, ...baseUpdate };
  }

  return {
    ...state,
    ...baseUpdate,
    unlockedCanonAxioms: [...state.unlockedCanonAxioms, event.data.axiomId],
  };
}

function handleContentUnlocked(
  state: FormationState,
  event: ContentUnlockedEvent,
  baseUpdate: Partial<FormationState>
): FormationState {
  const { contentType, contentId } = event.data;

  switch (contentType) {
    case 'canon':
      return {
        ...state,
        ...baseUpdate,
        unlockedCanonAxioms: state.unlockedCanonAxioms.includes(contentId)
          ? state.unlockedCanonAxioms
          : [...state.unlockedCanonAxioms, contentId],
      };

    case 'course':
      return {
        ...state,
        ...baseUpdate,
        unlockedCourses: state.unlockedCourses.includes(contentId)
          ? state.unlockedCourses
          : [...state.unlockedCourses, contentId],
      };

    case 'cannon':
      return {
        ...state,
        ...baseUpdate,
        unlockedCannonReleases: state.unlockedCannonReleases.includes(contentId)
          ? state.unlockedCannonReleases
          : [...state.unlockedCannonReleases, contentId],
      };

    default:
      return { ...state, ...baseUpdate };
  }
}

function handleFormationGapDetected(
  state: FormationState,
  event: FormationGapDetectedEvent,
  baseUpdate: Partial<FormationState>
): FormationState {
  const newGap: FormationGap = {
    type: event.data.gapType,
    area: event.data.area,
    severity: event.data.severity,
    recommendation: event.data.recommendation,
  };

  return {
    ...state,
    ...baseUpdate,
    formationGaps: [...state.formationGaps, newGap],
  };
}

function handlePauseTriggered(
  state: FormationState,
  event: PauseTriggeredEvent,
  baseUpdate: Partial<FormationState>
): FormationState {
  const redFlag = mapPauseReasonToRedFlag(event.data.reason);

  if (!redFlag) {
    return { ...state, ...baseUpdate };
  }

  const hasFlag = state.readiness.redFlags.includes(redFlag);
  if (hasFlag) {
    return { ...state, ...baseUpdate };
  }

  return {
    ...state,
    ...baseUpdate,
    readiness: {
      ...state.readiness,
      redFlags: [...state.readiness.redFlags, redFlag],
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapPauseReasonToRedFlag(reason: string): RedFlag | null {
  switch (reason) {
    case 'speed_run_detected':
      return RedFlag.SpeedRunning;
    case 'missing_reflections':
      return RedFlag.MissingReflections;
    case 'surface_engagement':
      return RedFlag.SurfaceEngagement;
    default:
      return null;
  }
}

/**
 * Compute days in phase from phaseEnteredAt to now.
 */
export function computeDaysInPhase(state: FormationState): number {
  const now = new Date();
  const msInPhase = now.getTime() - state.phaseEnteredAt.getTime();
  return Math.floor(msInPhase / (1000 * 60 * 60 * 24));
}

/**
 * Update daysInPhase field (should be called periodically or on state read).
 */
export function updateDaysInPhase(state: FormationState): FormationState {
  return {
    ...state,
    daysInPhase: computeDaysInPhase(state),
  };
}
