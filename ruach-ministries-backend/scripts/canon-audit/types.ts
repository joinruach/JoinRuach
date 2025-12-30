/**
 * Canon Audit Types
 * TypeScript definitions for axiom validation and audit reporting
 */

export type FormationPhase = 'awakening' | 'separation' | 'discernment' | 'commission' | 'stewardship';

export type AxiomCategory =
  | 'covenant'
  | 'kingdom'
  | 'holiness'
  | 'redemption'
  | 'ecclesiology'
  | 'eschatology'
  | 'pneumatology';

export type AuditSeverity = 'safe' | 'warning' | 'error';

export interface NotionNode {
  id: string;
  title: string;
  phase?: FormationPhase;
  content: string;
  axioms?: string[];
  order?: number;
  properties?: Record<string, any>;
}

export interface AxiomConflict {
  type: 'grace-vs-cost' | 'identity-vs-warfare' | 'favor-vs-obedience' | 'phase-progression';
  severity: AuditSeverity;
  message: string;
  context?: string;
  line?: number;
}

export interface AuditResult {
  nodeId: string;
  nodeTitle: string;
  phase?: FormationPhase;
  severity: AuditSeverity;
  conflicts: AxiomConflict[];
  summary: string;
}

export interface AuditReport {
  timestamp: string;
  totalNodes: number;
  safeNodes: number;
  warningNodes: number;
  errorNodes: number;
  results: AuditResult[];
}

/**
 * Axiom Hierarchy Rules
 * Defines which axioms take precedence when multiple are present
 */
export interface AxiomHierarchyRule {
  primary: string;
  secondary: string;
  condition: string;
  reasoning: string;
}

export const AXIOM_HIERARCHY: AxiomHierarchyRule[] = [
  {
    primary: 'Cost/Obedience',
    secondary: 'Grace',
    condition: 'When both are present, cost must be established before grace is offered',
    reasoning: 'Grace without understanding cost leads to presumption'
  },
  {
    primary: 'Identity',
    secondary: 'Warfare',
    condition: 'Identity must be taught before warfare assignments',
    reasoning: 'Warfare without identity leads to striving in flesh'
  },
  {
    primary: 'Obedience',
    secondary: 'Favor',
    condition: 'Obedience must be established before favor is emphasized',
    reasoning: 'Favor without obedience creates entitlement mentality'
  }
];

/**
 * Phase Progression Rules
 * Defines which concepts are appropriate for each phase
 */
export interface PhaseConstraints {
  phase: FormationPhase;
  allowedThemes: string[];
  prohibitedThemes: string[];
  ceilingAxioms: string[];
}

export const PHASE_CONSTRAINTS: PhaseConstraints[] = [
  {
    phase: 'awakening',
    allowedThemes: ['identity', 'calling', 'holiness', 'separation from world', 'truth vs comfort'],
    prohibitedThemes: ['advanced spiritual warfare', 'leadership commissioning', 'stewarding inheritance'],
    ceilingAxioms: ['You are chosen', 'Truth over comfort', 'Cost of following', 'Holiness requirement']
  },
  {
    phase: 'separation',
    allowedThemes: ['consecration', 'pruning', 'wilderness', 'testing', 'death to self', 'learning obedience'],
    prohibitedThemes: ['public ministry', 'stewarding others', 'releasing inheritance'],
    ceilingAxioms: ['Dying to self', 'Pruning process', 'Wilderness testing', 'Radical obedience']
  },
  {
    phase: 'discernment',
    allowedThemes: ['spiritual sight', 'testing spirits', 'wisdom', 'discerning truth', 'recognizing deception'],
    prohibitedThemes: ['premature commissioning', 'stewarding inheritance before testing'],
    ceilingAxioms: ['Discerning spirits', 'Testing all things', 'Wisdom from above', 'Recognizing wolves']
  },
  {
    phase: 'commission',
    allowedThemes: ['authority', 'assignment', 'spiritual warfare', 'building', 'leading others'],
    prohibitedThemes: ['none - most themes available after proper formation'],
    ceilingAxioms: ['Spiritual authority', 'Kingdom assignment', 'Warfare responsibility', 'Building mandate']
  },
  {
    phase: 'stewardship',
    allowedThemes: ['inheritance', 'legacy', 'multiplication', 'releasing others', 'wisdom transfer'],
    prohibitedThemes: ['none - all themes available at this maturity'],
    ceilingAxioms: ['Stewarding inheritance', 'Releasing sons/daughters', 'Legacy building', 'Wisdom transfer']
  }
];
