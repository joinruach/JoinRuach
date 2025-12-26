/**
 * @ruach/formation
 *
 * Formation Engine - Event-sourced spiritual discipleship system
 *
 * Core Concepts:
 * - Events are the source of truth (immutable, append-only)
 * - State is derived from events (can be rebuilt at any time)
 * - Formation is tracked through phases, checkpoints, and reflections
 * - Readiness is computed from behavior patterns, not self-reported
 * - AI provides suggestions, not verdicts (humans decide)
 */

// ============================================================================
// TYPES
// ============================================================================

export * from './types/phase';
export * from './types/state';
export * from './types/checkpoint';

// ============================================================================
// EVENTS
// ============================================================================

export * from './events/types';
export * from './events/factory';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export * from './state/reducer';

// ============================================================================
// CONTENT
// ============================================================================

export * from './content';

// ============================================================================
// PERSISTENCE
// ============================================================================

export * from './persistence';

// ============================================================================
// VERSION
// ============================================================================

export const FORMATION_ENGINE_VERSION = '0.1.0';
