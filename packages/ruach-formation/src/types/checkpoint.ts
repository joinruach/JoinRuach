/**
 * Checkpoint Types
 *
 * Checkpoints are formation gates within sections.
 * They require pause, reflection, and readiness before proceeding.
 */

import { FormationPhase } from './phase';
import { ReadinessLevel } from './state';

/**
 * A checkpoint within a formation section.
 * Checkpoints gate content and require reflection.
 */
export interface Checkpoint {
  id: string;
  sectionId: string;
  phase: FormationPhase;
  order: number; // Position within section

  // Checkpoint content
  prompt: string; // The reflection question/prompt
  context: string; // Why this checkpoint matters (displayed to user)

  // Gating logic
  requiresReflection: boolean;
  minimumDwellSeconds: number; // Minimum time before checkpoint can be attempted

  // Metadata
  createdAt: Date;
}

/**
 * Type of reflection submission.
 * Text = typed response (default for Phase 1).
 * Voice = transcribed audio (future enhancement).
 */
export enum ReflectionType {
  Text = 'text',
  Voice = 'voice',
}

/**
 * User's reflection submission at a checkpoint.
 * This is the primary data for readiness analysis.
 */
export interface Reflection {
  id: string;
  userId: string;
  checkpointId: string;

  // Reflection content
  type: ReflectionType;
  content: string; // Text or transcription
  audioUrl?: string; // If voice reflection

  // Analysis metadata (computed, not user-entered)
  wordCount: number;
  submittedAt: Date;
  timeSinceCheckpointReached: number; // Seconds between reaching checkpoint and submitting

  // AI analysis results (optional, added later)
  depthScore?: number; // 0-1, computed by AI
  indicators?: ReflectionIndicators;
  analysisScores?: {
    depth: number; // 0-1
    specificity: number; // 0-1
    honesty: number; // 0-1
    alignment: number; // 0-1
  };
  analysisSummary?: string; // Feedback from AI analysis
  sharpeningQuestions?: Array<{
    question: string;
    context: string;
  }>;
}

/**
 * Analysis results from AI reflection processing.
 * These are suggestions, not verdicts.
 */
export interface ReflectionIndicators {
  isRegurgitation: boolean; // Repeating content vs personal application
  showsWrestling: boolean; // Evidence of genuine engagement with truth
  doctrinalSoundness: 'sound' | 'unclear' | 'concerning';
  emotionalReadiness: ReadinessLevel;
  recommendedAction: ReflectionAction;
}

export enum ReflectionAction {
  UnlockNext = 'unlock_next', // Proceed to next section
  SuggestResource = 'suggest_resource', // Recommend additional content first
  RecommendRevisit = 'recommend_revisit', // Suggest returning to foundation
  GateAdvanced = 'gate_advanced', // Lock advanced content until maturity improves
}

/**
 * Routing decision based on depth score.
 * Determines where the reflection goes next.
 */
export enum ReflectionRouting {
  Publish = 'publish', // depth >= 0.8, share publicly
  Journal = 'journal', // 0.6 <= depth < 0.8, private
  Thread = 'thread', // 0.4 <= depth < 0.6, continue with prompts
  Review = 'review', // depth < 0.4, needs revision
}

/**
 * Formation event for reflection routing decision.
 * Persists the AI analysis and routing outcome.
 */
export interface ReflectionRoutingEvent {
  type: 'reflection_routed';
  reflectionId: string;
  checkpointId: string;
  sectionId: string;
  phase: string;
  depthScore: number;
  routing: ReflectionRouting;
  scores: {
    depth: number;
    specificity: number;
    honesty: number;
    alignment: number;
  };
  summary: string;
  sharpeningQuestions?: Array<{
    question: string;
    context: string;
  }>;
  timestamp: string;
}
