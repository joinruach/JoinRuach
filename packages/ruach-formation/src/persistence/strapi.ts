/**
 * Strapi Persistence Adapter
 *
 * Handles writing and reading formation events, reflections, and journey state
 * to/from the Strapi v5 backend.
 *
 * Design Principles:
 * - Events are append-only (never updated or deleted)
 * - Reflections are immutable once created
 * - Journey state is updated, not recreated
 * - All operations are idempotent where possible
 */

import { FormationEvent, FormationEventType } from '../events/types';
import { Reflection } from '../types/checkpoint';
import { FormationPhase } from '../types/phase';
import { CovenantType } from '../types/state';

// ============================================================================
// TYPES
// ============================================================================

export interface StrapiFormationEvent {
  id?: number;
  eventId: string;
  eventType: FormationEventType;
  eventData: Record<string, unknown>;
  eventMetadata?: Record<string, unknown>;
  timestamp: string; // ISO date string
  user?: number; // User ID (if authenticated)
  anonymousUserId?: string; // For anonymous users
}

export interface StrapiFormationReflection {
  id?: number;
  reflectionId: string;
  checkpointId: string;
  sectionId: string;
  phase: FormationPhase;
  reflectionType: 'text' | 'voice';
  content: string;
  audioUrl?: string;
  wordCount: number;
  submittedAt: string; // ISO date string
  timeSinceCheckpointReached: number;
  depthScore?: number;
  indicators?: Record<string, unknown>;
  user?: number; // User ID (if authenticated)
  anonymousUserId?: string;
}

export interface StrapiFormationJourney {
  id?: number;
  covenantType: CovenantType;
  currentPhase: FormationPhase;
  phaseEnteredAt?: string;
  covenantEnteredAt: string;
  lastActivityAt: string;
  sectionsViewed: string[];
  checkpointsReached: string[];
  checkpointsCompleted: string[];
  reflectionsSubmitted: number;
  unlockedCanonAxioms: string[];
  unlockedCourses: string[];
  unlockedCannonReleases: string[];
  user?: number;
  anonymousUserId?: string;
}

export interface PersistenceConfig {
  strapiUrl: string;
  strapiToken?: string; // Optional JWT for authenticated requests
}

// ============================================================================
// STRAPI CLIENT
// ============================================================================

export class StrapiFormationClient {
  private config: PersistenceConfig;

  constructor(config: PersistenceConfig) {
    this.config = config;
  }

  // ==========================================================================
  // EVENTS (Append-Only)
  // ==========================================================================

  /**
   * Write a formation event to Strapi.
   * Events are append-only and never modified.
   */
  async writeEvent(
    event: FormationEvent,
    userId?: string,
    userIdNumber?: number
  ): Promise<StrapiFormationEvent> {
    const payload: Omit<StrapiFormationEvent, 'id'> = {
      eventId: event.id,
      eventType: event.eventType,
      eventData: event.data as Record<string, unknown>,
      eventMetadata: event.metadata as Record<string, unknown> | undefined,
      timestamp: event.timestamp.toISOString(),
      user: userIdNumber,
      anonymousUserId: !userIdNumber ? userId : undefined,
    };

    const response = await fetch(`${this.config.strapiUrl}/api/formation-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.strapiToken && {
          Authorization: `Bearer ${this.config.strapiToken}`,
        }),
      },
      body: JSON.stringify({ data: payload }),
    });

    if (!response.ok) {
      throw new Error(`Failed to write formation event: ${response.statusText}`);
    }

    const result = (await response.json()) as { data: StrapiFormationEvent };
    return result.data;
  }

  /**
   * Read all formation events for a user.
   * Returns events in chronological order.
   */
  async getEvents(
    userId: string,
    userIdNumber?: number
  ): Promise<StrapiFormationEvent[]> {
    const filters = userIdNumber
      ? `filters[user][id][$eq]=${userIdNumber}`
      : `filters[anonymousUserId][$eq]=${userId}`;

    const response = await fetch(
      `${this.config.strapiUrl}/api/formation-events?${filters}&sort=timestamp:asc&pagination[limit]=-1`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.strapiToken && {
            Authorization: `Bearer ${this.config.strapiToken}`,
          }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch formation events: ${response.statusText}`);
    }

    const result = (await response.json()) as { data: StrapiFormationEvent[] };
    return result.data;
  }

  // ==========================================================================
  // REFLECTIONS
  // ==========================================================================

  /**
   * Write a reflection to Strapi.
   * Reflections are immutable once created.
   */
  async writeReflection(
    reflection: Reflection,
    phase: FormationPhase,
    sectionId: string,
    userId?: string,
    userIdNumber?: number
  ): Promise<StrapiFormationReflection> {
    const payload: Omit<StrapiFormationReflection, 'id'> = {
      reflectionId: reflection.id,
      checkpointId: reflection.checkpointId,
      sectionId,
      phase,
      reflectionType: reflection.type,
      content: reflection.content,
      audioUrl: reflection.audioUrl,
      wordCount: reflection.wordCount,
      submittedAt: reflection.submittedAt.toISOString(),
      timeSinceCheckpointReached: reflection.timeSinceCheckpointReached,
      depthScore: reflection.depthScore,
      indicators: reflection.indicators as Record<string, unknown> | undefined,
      user: userIdNumber,
      anonymousUserId: !userIdNumber ? userId : undefined,
    };

    const response = await fetch(
      `${this.config.strapiUrl}/api/formation-reflections`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.strapiToken && {
            Authorization: `Bearer ${this.config.strapiToken}`,
          }),
        },
        body: JSON.stringify({ data: payload }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to write formation reflection: ${response.statusText}`);
    }

    const result = (await response.json()) as { data: StrapiFormationReflection };
    return result.data;
  }

  /**
   * Get all reflections for a user.
   */
  async getReflections(
    userId: string,
    userIdNumber?: number
  ): Promise<StrapiFormationReflection[]> {
    const filters = userIdNumber
      ? `filters[user][id][$eq]=${userIdNumber}`
      : `filters[anonymousUserId][$eq]=${userId}`;

    const response = await fetch(
      `${this.config.strapiUrl}/api/formation-reflections?${filters}&sort=submittedAt:asc&pagination[limit]=-1`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.strapiToken && {
            Authorization: `Bearer ${this.config.strapiToken}`,
          }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch formation reflections: ${response.statusText}`);
    }

    const result = (await response.json()) as { data: StrapiFormationReflection[] };
    return result.data;
  }

  // ==========================================================================
  // JOURNEY STATE
  // ==========================================================================

  /**
   * Create or update formation journey for a user.
   * Journey state is mutable (updated as user progresses).
   *
   * SMART MERGING:
   * - Arrays are appended (checkpointsReached, checkpointsCompleted, sectionsViewed, etc.)
   * - Numbers are incremented (reflectionsSubmitted)
   * - Scalars are replaced (currentPhase, covenantType, etc.)
   */
  async upsertJourney(
    journey: Partial<StrapiFormationJourney>,
    userId?: string,
    userIdNumber?: number
  ): Promise<StrapiFormationJourney> {
    // First, check if journey exists
    const existing = await this.getJourney(userId || String(userIdNumber), userIdNumber);

    if (existing) {
      // Smart merge: handle arrays and counters
      const merged: Partial<StrapiFormationJourney> = { ...journey };

      // Append to arrays (avoiding duplicates)
      if (journey.checkpointsReached) {
        merged.checkpointsReached = [
          ...(existing.checkpointsReached || []),
          ...journey.checkpointsReached,
        ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate
      }

      if (journey.checkpointsCompleted) {
        merged.checkpointsCompleted = [
          ...(existing.checkpointsCompleted || []),
          ...journey.checkpointsCompleted,
        ].filter((v, i, a) => a.indexOf(v) === i);
      }

      if (journey.sectionsViewed) {
        merged.sectionsViewed = [
          ...(existing.sectionsViewed || []),
          ...journey.sectionsViewed,
        ].filter((v, i, a) => a.indexOf(v) === i);
      }

      if (journey.unlockedCanonAxioms) {
        merged.unlockedCanonAxioms = [
          ...(existing.unlockedCanonAxioms || []),
          ...journey.unlockedCanonAxioms,
        ].filter((v, i, a) => a.indexOf(v) === i);
      }

      if (journey.unlockedCourses) {
        merged.unlockedCourses = [
          ...(existing.unlockedCourses || []),
          ...journey.unlockedCourses,
        ].filter((v, i, a) => a.indexOf(v) === i);
      }

      if (journey.unlockedCannonReleases) {
        merged.unlockedCannonReleases = [
          ...(existing.unlockedCannonReleases || []),
          ...journey.unlockedCannonReleases,
        ].filter((v, i, a) => a.indexOf(v) === i);
      }

      // Increment counters
      if (typeof journey.reflectionsSubmitted === 'number') {
        merged.reflectionsSubmitted = (existing.reflectionsSubmitted || 0) + journey.reflectionsSubmitted;
      }

      // Update existing journey
      const response = await fetch(
        `${this.config.strapiUrl}/api/formation-journeys/${existing.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.strapiToken && {
              Authorization: `Bearer ${this.config.strapiToken}`,
            }),
          },
          body: JSON.stringify({ data: merged }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update formation journey: ${response.statusText}`);
      }

      const result = (await response.json()) as { data: StrapiFormationJourney };
      return result.data;
    } else {
      // Create new journey
      const payload = {
        ...journey,
        user: userIdNumber,
        anonymousUserId: !userIdNumber ? userId : undefined,
      };

      const response = await fetch(`${this.config.strapiUrl}/api/formation-journeys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.strapiToken && {
            Authorization: `Bearer ${this.config.strapiToken}`,
          }),
        },
        body: JSON.stringify({ data: payload }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create formation journey: ${response.statusText}`);
      }

      const result = (await response.json()) as { data: StrapiFormationJourney };
      return result.data;
    }
  }

  /**
   * Get formation journey for a user.
   */
  async getJourney(
    userId: string,
    userIdNumber?: number
  ): Promise<StrapiFormationJourney | null> {
    const filters = userIdNumber
      ? `filters[user][id][$eq]=${userIdNumber}`
      : `filters[anonymousUserId][$eq]=${userId}`;

    const response = await fetch(
      `${this.config.strapiUrl}/api/formation-journeys?${filters}&pagination[limit]=1`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.strapiToken && {
            Authorization: `Bearer ${this.config.strapiToken}`,
          }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch formation journey: ${response.statusText}`);
    }

    const result = (await response.json()) as { data: StrapiFormationJourney[] };
    return result.data?.[0] || null;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let clientInstance: StrapiFormationClient | null = null;

export function initializeFormationClient(config: PersistenceConfig): StrapiFormationClient {
  clientInstance = new StrapiFormationClient(config);
  return clientInstance;
}

export function getFormationClient(): StrapiFormationClient {
  if (!clientInstance) {
    throw new Error(
      'Formation client not initialized. Call initializeFormationClient() first.'
    );
  }
  return clientInstance;
}
