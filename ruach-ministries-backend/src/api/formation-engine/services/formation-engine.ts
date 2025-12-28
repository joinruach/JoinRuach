/**
 * Formation Engine Service
 * Handles event sourcing, state computation, and access gating for the formation journey
 */

import type { Strapi } from '@strapi/strapi';

type FormationPhase = 'awakening' | 'separation' | 'discernment' | 'commission' | 'stewardship';

type FormationEventType =
  | 'covenant_entered'
  | 'phase_started'
  | 'phase_completed'
  | 'section_viewed'
  | 'section_completed'
  | 'checkpoint_reached'
  | 'checkpoint_completed'
  | 'reflection_submitted'
  | 'reflection_analyzed'
  | 'canon_definition_viewed'
  | 'canon_axiom_cited'
  | 'pause_triggered'
  | 'recommendation_issued'
  | 'content_unlocked'
  | 'content_gated'
  | 'readiness_level_changed'
  | 'formation_gap_detected';

interface FormationEvent {
  eventId: string;
  eventType: FormationEventType;
  eventData: Record<string, any>;
  eventMetadata?: Record<string, any>;
  timestamp: Date;
  user?: number;
  anonymousUserId?: string;
}

interface FormationState {
  userId: string;
  currentPhase: FormationPhase;
  covenantType: 'formation_journey' | 'resource_explorer';
  covenantEnteredAt: Date;
  phaseEnteredAt: Date | null;
  lastActivityAt: Date;
  sectionsViewed: string[];
  checkpointsReached: string[];
  checkpointsCompleted: string[];
  reflectionsSubmitted: number;
  unlockedCanonAxioms: string[];
  unlockedCourses: string[];
  unlockedCannonReleases: string[];
  readinessLevel?: 'emerging' | 'forming' | 'maturing' | 'established';
  canSubmitInsights: boolean;
  canValidateInsights: boolean;
}

export default ({ strapi }: { strapi: Strapi }) => ({
  /**
   * Emit a formation event to the append-only event store
   */
  async emitFormationEvent(event: FormationEvent): Promise<any> {
    try {
      const eventData = {
        eventId: event.eventId,
        eventType: event.eventType,
        eventData: event.eventData,
        eventMetadata: event.eventMetadata || {},
        timestamp: event.timestamp,
        user: event.user,
        anonymousUserId: event.anonymousUserId,
      };

      const created = await strapi.entityService.create('api::formation-event.formation-event', {
        data: eventData,
      });

      // Trigger async state recomputation via BullMQ
      if (strapi.service('api::formation-engine.bull-queue')) {
        await strapi.service('api::formation-engine.bull-queue').enqueueStateRecomputation({
          userId: event.user ? String(event.user) : event.anonymousUserId!,
          eventId: event.eventId,
        });
      }

      return created;
    } catch (error) {
      strapi.log.error('Error emitting formation event:', error);
      throw error;
    }
  },

  /**
   * Recompute formation state from all events for a user
   */
  async recomputeFormationState(userId: string | number): Promise<FormationState> {
    try {
      // Fetch all events for this user
      const filters: any = {};

      if (typeof userId === 'number') {
        filters.user = { id: userId };
      } else {
        filters.anonymousUserId = { $eq: userId };
      }

      const events = await strapi.entityService.findMany('api::formation-event.formation-event', {
        filters,
        sort: { timestamp: 'asc' },
      });

      // Reduce events to current state
      const state = this.reduceEventsToState(events as any);

      // Compute privileges based on state
      state.canSubmitInsights = this.computeCanSubmitInsights(state);
      state.canValidateInsights = this.computeCanValidateInsights(state);

      // Update formation journey record
      const journeyFilters: any = typeof userId === 'number'
        ? { user: { id: userId } }
        : { anonymousUserId: { $eq: userId } };

      const existingJourney = await strapi.entityService.findMany('api::formation-journey.formation-journey', {
        filters: journeyFilters,
      });

      const journeyData = {
        covenantType: state.covenantType,
        currentPhase: state.currentPhase,
        phaseEnteredAt: state.phaseEnteredAt,
        covenantEnteredAt: state.covenantEnteredAt,
        lastActivityAt: state.lastActivityAt,
        sectionsViewed: state.sectionsViewed,
        checkpointsReached: state.checkpointsReached,
        checkpointsCompleted: state.checkpointsCompleted,
        reflectionsSubmitted: state.reflectionsSubmitted,
        unlockedCanonAxioms: state.unlockedCanonAxioms,
        unlockedCourses: state.unlockedCourses,
        unlockedCannonReleases: state.unlockedCannonReleases,
        user: typeof userId === 'number' ? userId : null,
        anonymousUserId: typeof userId === 'string' ? userId : null,
      };

      if (Array.isArray(existingJourney) && existingJourney.length > 0) {
        await strapi.entityService.update('api::formation-journey.formation-journey', existingJourney[0].id, {
          data: journeyData,
        });
      } else {
        await strapi.entityService.create('api::formation-journey.formation-journey', {
          data: journeyData,
        });
      }

      return state;
    } catch (error) {
      strapi.log.error('Error recomputing formation state:', error);
      throw error;
    }
  },

  /**
   * Event reducer - deterministic state folding
   */
  reduceEventsToState(events: any[]): FormationState {
    const initialState: FormationState = {
      userId: '',
      currentPhase: 'awakening',
      covenantType: 'resource_explorer',
      covenantEnteredAt: new Date(),
      phaseEnteredAt: null,
      lastActivityAt: new Date(),
      sectionsViewed: [],
      checkpointsReached: [],
      checkpointsCompleted: [],
      reflectionsSubmitted: 0,
      unlockedCanonAxioms: [],
      unlockedCourses: [],
      unlockedCannonReleases: [],
      canSubmitInsights: false,
      canValidateInsights: false,
    };

    return events.reduce((state, event) => {
      const { eventType, eventData, timestamp, user, anonymousUserId } = event;

      // Set userId if not set
      if (!state.userId) {
        state.userId = user ? String(user) : anonymousUserId;
      }

      // Update last activity
      if (new Date(timestamp) > state.lastActivityAt) {
        state.lastActivityAt = new Date(timestamp);
      }

      // Apply event-specific state changes
      switch (eventType) {
        case 'covenant_entered':
          state.covenantType = eventData.covenantType || 'formation_journey';
          state.covenantEnteredAt = new Date(timestamp);
          state.currentPhase = 'awakening';
          state.phaseEnteredAt = new Date(timestamp);
          break;

        case 'phase_started':
          state.currentPhase = eventData.phase;
          state.phaseEnteredAt = new Date(timestamp);
          break;

        case 'section_viewed':
          if (!state.sectionsViewed.includes(eventData.sectionId)) {
            state.sectionsViewed.push(eventData.sectionId);
          }
          break;

        case 'checkpoint_reached':
          if (!state.checkpointsReached.includes(eventData.checkpointId)) {
            state.checkpointsReached.push(eventData.checkpointId);
          }
          break;

        case 'checkpoint_completed':
          if (!state.checkpointsCompleted.includes(eventData.checkpointId)) {
            state.checkpointsCompleted.push(eventData.checkpointId);
          }
          break;

        case 'reflection_submitted':
          state.reflectionsSubmitted += 1;
          break;

        case 'content_unlocked':
          if (eventData.contentType === 'canon_axiom' && !state.unlockedCanonAxioms.includes(eventData.contentId)) {
            state.unlockedCanonAxioms.push(eventData.contentId);
          }
          if (eventData.contentType === 'course' && !state.unlockedCourses.includes(eventData.contentId)) {
            state.unlockedCourses.push(eventData.contentId);
          }
          if (eventData.contentType === 'cannon_release' && !state.unlockedCannonReleases.includes(eventData.contentId)) {
            state.unlockedCannonReleases.push(eventData.contentId);
          }
          break;

        case 'readiness_level_changed':
          state.readinessLevel = eventData.readinessLevel;
          break;
      }

      return state;
    }, initialState);
  },

  /**
   * Check if user can access a specific guidebook node
   */
  async canAccessNode(userId: string | number, nodeId: string): Promise<{ canAccess: boolean; reason?: string }> {
    try {
      // Get node unlock requirements
      const node = await strapi.entityService.findMany('api::guidebook-node.guidebook-node', {
        filters: { id: nodeId },
      });

      if (!Array.isArray(node) || node.length === 0) {
        return { canAccess: false, reason: 'Node not found' };
      }

      const nodeData = node[0];
      const unlockRequirements = nodeData.unlockRequirements || {};

      // If no requirements, it's freely accessible
      if (Object.keys(unlockRequirements).length === 0) {
        return { canAccess: true };
      }

      // Get user's current state
      const filters: any = typeof userId === 'number'
        ? { user: { id: userId } }
        : { anonymousUserId: { $eq: userId } };

      const journey = await strapi.entityService.findMany('api::formation-journey.formation-journey', {
        filters,
      });

      if (!Array.isArray(journey) || journey.length === 0) {
        return { canAccess: false, reason: 'User has not entered covenant' };
      }

      const userState = journey[0];

      // Check requirements
      if (unlockRequirements.minimumPhase) {
        const phaseOrder: Record<FormationPhase, number> = {
          awakening: 1,
          separation: 2,
          discernment: 3,
          commission: 4,
          stewardship: 5,
        };

        const currentPhaseOrder = phaseOrder[userState.currentPhase as FormationPhase];
        const requiredPhaseOrder = phaseOrder[unlockRequirements.minimumPhase as FormationPhase];

        if (currentPhaseOrder < requiredPhaseOrder) {
          return { canAccess: false, reason: `Requires ${unlockRequirements.minimumPhase} phase` };
        }
      }

      if (unlockRequirements.requiredCheckpoints) {
        const completed = userState.checkpointsCompleted || [];
        const required = unlockRequirements.requiredCheckpoints;

        const hasAll = required.every((cp: string) => completed.includes(cp));
        if (!hasAll) {
          return { canAccess: false, reason: 'Required checkpoints not completed' };
        }
      }

      return { canAccess: true };
    } catch (error) {
      strapi.log.error('Error checking node access:', error);
      return { canAccess: false, reason: 'Error checking access' };
    }
  },

  /**
   * Compute if user can submit insights to Iron Chamber
   */
  computeCanSubmitInsights(state: FormationState): boolean {
    // Must have completed at least one checkpoint
    return state.checkpointsCompleted.length > 0;
  },

  /**
   * Compute if user can validate others' insights
   */
  computeCanValidateInsights(state: FormationState): boolean {
    // Must be in at least Discernment phase and have submitted 5+ reflections
    const phaseOrder: Record<FormationPhase, number> = {
      awakening: 1,
      separation: 2,
      discernment: 3,
      commission: 4,
      stewardship: 5,
    };

    return phaseOrder[state.currentPhase] >= 3 && state.reflectionsSubmitted >= 5;
  },
});
