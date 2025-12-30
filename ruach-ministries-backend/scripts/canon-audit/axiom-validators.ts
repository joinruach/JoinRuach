/**
 * Canon Axiom Validators
 * Detection functions for axiom conflicts and misalignments
 */

import type {
  NotionNode,
  AxiomConflict,
  FormationPhase,
  PHASE_CONSTRAINTS
} from './types';

/**
 * Keyword patterns for axiom detection
 */
const AXIOM_PATTERNS = {
  grace: [
    /\bgrace\b/gi,
    /\bunconditional love\b/gi,
    /\bgod's love\b/gi,
    /\bfreely given\b/gi,
    /\bgift of god\b/gi,
    /\bno works\b/gi,
    /\bby faith alone\b/gi
  ],
  cost: [
    /\bcost\b/gi,
    /\bcount the cost\b/gi,
    /\bsacrifice\b/gi,
    /\bsurrender\b/gi,
    /\bgive up everything\b/gi,
    /\bdie to self\b/gi,
    /\btake up.*cross\b/gi,
    /\bnarrow.*road\b/gi,
    /\bfew.*find it\b/gi
  ],
  identity: [
    /\bidentity in christ\b/gi,
    /\bwho you are\b/gi,
    /\bson of god\b/gi,
    /\bdaughter of god\b/gi,
    /\bchosen\b/gi,
    /\bbeloved\b/gi,
    /\bin him you are\b/gi,
    /\byour identity\b/gi
  ],
  warfare: [
    /\bspiritual warfare\b/gi,
    /\bfight.*enemy\b/gi,
    /\bbattle\b/gi,
    /\bwarfare\b/gi,
    /\bbind.*loose\b/gi,
    /\bcast out.*demon\b/gi,
    /\battack.*enemy\b/gi,
    /\btake.*territory\b/gi
  ],
  favor: [
    /\bfavor\b/gi,
    /\bblessing\b/gi,
    /\bprosperity\b/gi,
    /\bgod.*bless you\b/gi,
    /\bincrease\b/gi,
    /\bbreakthrough\b/gi,
    /\byou deserve\b/gi
  ],
  obedience: [
    /\bobey\b/gi,
    /\bobedience\b/gi,
    /\bsubmit\b/gi,
    /\bfollow.*commands\b/gi,
    /\bkeep.*commandments\b/gi,
    /\bdo what.*says\b/gi,
    /\bif you love.*keep\b/gi
  ]
};

/**
 * Detect Grace vs Cost conflicts
 * Grace should not be emphasized without proper understanding of cost
 */
export function detectGraceVsCost(node: NotionNode): AxiomConflict[] {
  const conflicts: AxiomConflict[] = [];
  const content = node.content;

  const graceMatches = countMatches(content, AXIOM_PATTERNS.grace);
  const costMatches = countMatches(content, AXIOM_PATTERNS.cost);

  // If grace is mentioned significantly more than cost (3:1 ratio)
  if (graceMatches > 3 && costMatches === 0) {
    conflicts.push({
      type: 'grace-vs-cost',
      severity: 'error',
      message: 'Grace emphasized without any mention of cost/sacrifice',
      context: `Found ${graceMatches} grace references, 0 cost references`
    });
  } else if (graceMatches > costMatches * 3 && costMatches > 0) {
    conflicts.push({
      type: 'grace-vs-cost',
      severity: 'warning',
      message: 'Grace over-emphasized compared to cost (3:1 ratio)',
      context: `Grace: ${graceMatches}, Cost: ${costMatches}`
    });
  }

  // Check order: cost should come before grace in content
  const firstGrace = findFirstMatch(content, AXIOM_PATTERNS.grace);
  const firstCost = findFirstMatch(content, AXIOM_PATTERNS.cost);

  if (firstGrace !== -1 && firstCost !== -1 && firstGrace < firstCost) {
    conflicts.push({
      type: 'grace-vs-cost',
      severity: 'warning',
      message: 'Grace introduced before cost is established',
      context: 'Cost should be taught before grace to prevent presumption'
    });
  }

  return conflicts;
}

/**
 * Detect Identity vs Warfare conflicts
 * Identity must be established before warfare assignments
 */
export function detectIdentityVsWarfare(node: NotionNode): AxiomConflict[] {
  const conflicts: AxiomConflict[] = [];
  const content = node.content;

  const identityMatches = countMatches(content, AXIOM_PATTERNS.identity);
  const warfareMatches = countMatches(content, AXIOM_PATTERNS.warfare);

  // If warfare is mentioned without identity foundation
  if (warfareMatches > 0 && identityMatches === 0) {
    conflicts.push({
      type: 'identity-vs-warfare',
      severity: 'error',
      message: 'Warfare teaching without identity foundation',
      context: `Found ${warfareMatches} warfare references, 0 identity references`
    });
  }

  // Check order: identity should come before warfare
  const firstIdentity = findFirstMatch(content, AXIOM_PATTERNS.identity);
  const firstWarfare = findFirstMatch(content, AXIOM_PATTERNS.warfare);

  if (firstWarfare !== -1 && firstIdentity !== -1 && firstWarfare < firstIdentity) {
    conflicts.push({
      type: 'identity-vs-warfare',
      severity: 'warning',
      message: 'Warfare introduced before identity is established',
      context: 'Identity in Christ must be secure before engaging in spiritual warfare'
    });
  }

  return conflicts;
}

/**
 * Detect Favor vs Obedience conflicts
 * Obedience must be established before favor is emphasized
 */
export function detectFavorVsObedience(node: NotionNode): AxiomConflict[] {
  const conflicts: AxiomConflict[] = [];
  const content = node.content;

  const favorMatches = countMatches(content, AXIOM_PATTERNS.favor);
  const obedienceMatches = countMatches(content, AXIOM_PATTERNS.obedience);

  // If favor is mentioned significantly more than obedience
  if (favorMatches > 3 && obedienceMatches === 0) {
    conflicts.push({
      type: 'favor-vs-obedience',
      severity: 'error',
      message: 'Favor emphasized without mention of obedience',
      context: `Found ${favorMatches} favor references, 0 obedience references`
    });
  } else if (favorMatches > obedienceMatches * 2 && obedienceMatches > 0) {
    conflicts.push({
      type: 'favor-vs-obedience',
      severity: 'warning',
      message: 'Favor over-emphasized compared to obedience (2:1 ratio)',
      context: `Favor: ${favorMatches}, Obedience: ${obedienceMatches}`
    });
  }

  // Check order: obedience should come before favor
  const firstFavor = findFirstMatch(content, AXIOM_PATTERNS.favor);
  const firstObedience = findFirstMatch(content, AXIOM_PATTERNS.obedience);

  if (firstFavor !== -1 && firstObedience !== -1 && firstFavor < firstObedience) {
    conflicts.push({
      type: 'favor-vs-obedience',
      severity: 'warning',
      message: 'Favor introduced before obedience is established',
      context: 'Obedience must be foundation before favor to prevent entitlement'
    });
  }

  return conflicts;
}

/**
 * Detect Phase Progression violations
 * Advanced concepts should not appear in early phases
 */
export function detectPhaseViolations(
  node: NotionNode,
  phaseConstraints: typeof PHASE_CONSTRAINTS
): AxiomConflict[] {
  const conflicts: AxiomConflict[] = [];

  if (!node.phase) {
    conflicts.push({
      type: 'phase-progression',
      severity: 'warning',
      message: 'Node has no phase assignment',
      context: 'All nodes should be assigned to a formation phase'
    });
    return conflicts;
  }

  const constraints = phaseConstraints.find(c => c.phase === node.phase);
  if (!constraints) {
    return conflicts;
  }

  const content = node.content.toLowerCase();

  // Check for prohibited themes
  for (const prohibitedTheme of constraints.prohibitedThemes) {
    if (content.includes(prohibitedTheme.toLowerCase())) {
      conflicts.push({
        type: 'phase-progression',
        severity: 'error',
        message: `Prohibited theme "${prohibitedTheme}" found in ${node.phase} phase`,
        context: `This concept requires higher maturity than ${node.phase} phase provides`
      });
    }
  }

  // Check warfare specifically for early phases
  if (['awakening', 'separation'].includes(node.phase)) {
    const warfareMatches = countMatches(node.content, AXIOM_PATTERNS.warfare);
    if (warfareMatches > 0) {
      conflicts.push({
        type: 'phase-progression',
        severity: 'error',
        message: `Spiritual warfare content in ${node.phase} phase`,
        context: 'Warfare requires identity + discernment foundations (commission+ phases)'
      });
    }
  }

  return conflicts;
}

/**
 * Helper: Count pattern matches in content
 */
function countMatches(content: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }
  return count;
}

/**
 * Helper: Find first match position in content
 */
function findFirstMatch(content: string, patterns: RegExp[]): number {
  let firstIndex = -1;
  for (const pattern of patterns) {
    const match = pattern.exec(content);
    if (match && (firstIndex === -1 || match.index < firstIndex)) {
      firstIndex = match.index;
    }
  }
  return firstIndex;
}

/**
 * Run all validators on a node
 */
export function validateNode(
  node: NotionNode,
  phaseConstraints: typeof PHASE_CONSTRAINTS
): AxiomConflict[] {
  return [
    ...detectGraceVsCost(node),
    ...detectIdentityVsWarfare(node),
    ...detectFavorVsObedience(node),
    ...detectPhaseViolations(node, phaseConstraints)
  ];
}
