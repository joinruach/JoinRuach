/**
 * Axiom Unlock Service
 *
 * Manages the checking and unlocking of canon axioms based on checkpoint completion
 * and phase progression. Axioms are unlocked when prerequisites are satisfied.
 *
 * Prerequisites can be:
 * - Checkpoint completion (specific or threshold)
 * - Phase progression (entering a specific phase)
 * - Time-based (minimum days in phase)
 * - Readiness-based (achieving certain readiness levels)
 */

import {
  FormationState,
  FormationPhase,
  ReadinessLevel,
  PaceStatus,
} from "@ruach/formation";

/**
 * Represents a canon axiom in the system
 */
export interface CanonAxiom {
  id: string;
  title: string;
  content: string;
  phase: FormationPhase;
  author?: string;
  sourceText?: string;
  prerequisites: AxiomPrerequisite[];
  tags: string[];
  relatedCheckpointIds?: string[];
}

/**
 * Prerequisites for unlocking an axiom
 */
export type AxiomPrerequisite =
  | {
      type: "checkpoint";
      checkpointId: string;
    }
  | {
      type: "phase";
      phase: FormationPhase;
    }
  | {
      type: "phase_duration";
      phase: FormationPhase;
      minimumDays: number;
    }
  | {
      type: "readiness";
      level: ReadinessLevel;
    }
  | {
      type: "pace";
      pace: PaceStatus;
    };

/**
 * Result of axiom unlock check
 */
export interface AxiomUnlockResult {
  axiomId: string;
  title: string;
  isUnlocked: boolean;
  prerequisites: {
    type: string;
    satisfied: boolean;
    description: string;
  }[];
  unlockedAt?: Date;
  message: string;
}

/**
 * Cache for axiom definitions
 * In production, this would be fetched from Strapi
 */
const AXIOM_DEFINITIONS: Record<string, CanonAxiom> = {
  // Awakening phase axioms
  "axiom-awakening-identity": {
    id: "axiom-awakening-identity",
    title: "Identity in Christ",
    content:
      "Your true identity is found not in accomplishments, status, or relationships, but in who you are as a beloved child of God in Christ.",
    phase: FormationPhase.Awakening,
    author: "Ruach Ministries",
    prerequisites: [
      { type: "phase", phase: FormationPhase.Awakening },
      { type: "checkpoint", checkpointId: "checkpoint-awakening-1" },
    ],
    tags: ["identity", "christology", "foundational"],
  },

  "axiom-awakening-authority": {
    id: "axiom-awakening-authority",
    title: "God's Authority Over All",
    content:
      "God exercises sovereign authority over all creation. His reign is characterized by wisdom, justice, and mercy. Submitting to His authority brings freedom, not bondage.",
    phase: FormationPhase.Awakening,
    author: "Ruach Ministries",
    prerequisites: [
      { type: "checkpoint", checkpointId: "checkpoint-awakening-2" },
      { type: "phase_duration", phase: FormationPhase.Awakening, minimumDays: 3 },
    ],
    tags: ["authority", "sovereignty", "submission"],
  },

  "axiom-awakening-invitation": {
    id: "axiom-awakening-invitation",
    title: "The Invitation to Formation",
    content:
      "Formation is not a program to complete but an invitation to join God in transforming your life. It requires patience, honesty, and openness to the Spirit's work.",
    phase: FormationPhase.Awakening,
    prerequisites: [
      { type: "checkpoint", checkpointId: "checkpoint-awakening-3" },
    ],
    tags: ["formation", "invitation", "journey"],
  },

  // Separation phase axioms (unlock after Awakening)
  "axiom-separation-discernment": {
    id: "axiom-separation-discernment",
    title: "Distinguishing God's Voice",
    content:
      "Learning to discern God's voice from other voices requires regular practice, biblical grounding, and trusted community reflection.",
    phase: FormationPhase.Separation,
    prerequisites: [
      { type: "phase", phase: FormationPhase.Separation },
      { type: "readiness", level: ReadinessLevel.Developing },
    ],
    tags: ["discernment", "vocation", "guidance"],
  },
};

/**
 * Service for managing axiom unlocks
 */
export class AxiomUnlockService {
  /**
   * Check prerequisites for a single axiom
   */
  static checkPrerequisites(
    axiom: CanonAxiom,
    state: FormationState
  ): { satisfied: boolean; details: { type: string; satisfied: boolean; description: string }[] } {
    const details = axiom.prerequisites.map((prereq) => {
      let satisfied = false;
      let description = "";

      switch (prereq.type) {
        case "checkpoint": {
          satisfied = state.checkpointsCompleted.includes(prereq.checkpointId);
          description = `Complete checkpoint ${prereq.checkpointId}`;
          break;
        }

        case "phase": {
          satisfied =
            state.currentPhase === prereq.phase ||
            (this.getPhaseOrder(state.currentPhase) >
              this.getPhaseOrder(prereq.phase));
          description = `Reach phase: ${prereq.phase}`;
          break;
        }

        case "phase_duration": {
          satisfied =
            state.currentPhase === prereq.phase && state.daysInPhase >= prereq.minimumDays;
          description = `Spend ${prereq.minimumDays} days in ${prereq.phase} phase (currently: ${state.daysInPhase} days)`;
          break;
        }

        case "readiness": {
          // Check multiple readiness indicators
          const readinessOk =
            state.readiness.reflectionDepth === prereq.level ||
            state.readiness.reflectionDepth > prereq.level ||
            state.readiness.canonEngagement === prereq.level ||
            state.readiness.canonEngagement > prereq.level;
          satisfied = readinessOk;
          description = `Achieve ${prereq.level} readiness level`;
          break;
        }

        case "pace": {
          satisfied = state.readiness.pace === prereq.pace;
          description = `Maintain ${prereq.pace} pace`;
          break;
        }
      }

      return { type: prereq.type, satisfied, description };
    });

    const allSatisfied = details.every((d) => d.satisfied);
    return { satisfied: allSatisfied, details };
  }

  /**
   * Get all axioms that should be unlocked for a user
   */
  static getUnlockedAxioms(state: FormationState): AxiomUnlockResult[] {
    return Object.values(AXIOM_DEFINITIONS).map((axiom) => {
      const prereqCheck = this.checkPrerequisites(axiom, state);
      return {
        axiomId: axiom.id,
        title: axiom.title,
        isUnlocked: prereqCheck.satisfied,
        prerequisites: prereqCheck.details,
        message: prereqCheck.satisfied
          ? `Axiom "${axiom.title}" is now available!`
          : `Complete prerequisites to unlock "${axiom.title}"`,
      };
    });
  }

  /**
   * Get a specific axiom and check if it's unlocked
   */
  static checkAxiomUnlock(
    axiomId: string,
    state: FormationState
  ): AxiomUnlockResult | null {
    const axiom = AXIOM_DEFINITIONS[axiomId];
    if (!axiom) return null;

    const prereqCheck = this.checkPrerequisites(axiom, state);
    return {
      axiomId: axiom.id,
      title: axiom.title,
      isUnlocked: prereqCheck.satisfied,
      prerequisites: prereqCheck.details,
      message: prereqCheck.satisfied
        ? `Axiom "${axiom.title}" is now available!`
        : `Complete prerequisites to unlock "${axiom.title}"`,
    };
  }

  /**
   * Get newly unlocked axioms (those that became unlocked since last check)
   * In a real implementation, this would compare against a stored unlock history
   */
  static getNewlyUnlockedAxioms(
    currentUnlocked: string[],
    previousUnlocked: string[]
  ): string[] {
    return currentUnlocked.filter(
      (axiomId) => !previousUnlocked.includes(axiomId)
    );
  }

  /**
   * Get all axioms filtered by phase
   */
  static getAxiomsByPhase(phase: FormationPhase): CanonAxiom[] {
    return Object.values(AXIOM_DEFINITIONS).filter((axiom) => axiom.phase === phase);
  }

  /**
   * Get all axioms with their unlock status
   */
  static getAllAxiomsWithStatus(state: FormationState): AxiomUnlockResult[] {
    return Object.values(AXIOM_DEFINITIONS)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((axiom) => {
        const prereqCheck = this.checkPrerequisites(axiom, state);
        return {
          axiomId: axiom.id,
          title: axiom.title,
          isUnlocked: prereqCheck.satisfied,
          prerequisites: prereqCheck.details,
          message: prereqCheck.satisfied
            ? `Axiom "${axiom.title}" is now available!`
            : `Complete prerequisites to unlock "${axiom.title}"`,
        };
      });
  }

  /**
   * Helper: Get phase order for comparison
   */
  private static getPhaseOrder(phase: FormationPhase): number {
    const order: Record<FormationPhase, number> = {
      [FormationPhase.Awakening]: 0,
      [FormationPhase.Separation]: 1,
      [FormationPhase.Discernment]: 2,
      [FormationPhase.Commission]: 3,
      [FormationPhase.Stewardship]: 4,
    };
    return order[phase];
  }

  /**
   * Get detailed axiom information
   */
  static getAxiomDetails(axiomId: string): CanonAxiom | null {
    return AXIOM_DEFINITIONS[axiomId] || null;
  }
}
