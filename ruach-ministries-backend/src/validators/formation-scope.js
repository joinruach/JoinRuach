/**
 * Formation Scope Validator
 *
 * Enforces scope progression and gating rules.
 * Prevents nodes from being assigned to scopes they shouldn't be in.
 *
 * AUTHORITY: Formation Scope Assignment (2025-12-30)
 * MODIFICATION: Requires theological + product review
 *
 * @version 1.0.0
 * @date 2025-12-30
 * @status Production Ready
 */

'use strict';

/**
 * Formation Scope Definitions
 *
 * Individual: Personal conscience formation, repentance, discernment, obedience
 * Household: Family/household alignment, shared rhythms, domestic order
 * Ecclesia: Remnant recognition, mutual accountability, shared identity
 * Network: Structure, authority distribution, multiplication without control
 */
const FORMATION_SCOPES = ['Individual', 'Household', 'Ecclesia', 'Network'];

/**
 * Phase-based scope constraints
 * Defines which scopes are allowed per formation phase
 */
const PHASE_SCOPE_CONSTRAINTS = {
  'awakening': ['Individual', 'Ecclesia'],
  'separation': ['Individual', 'Household', 'Ecclesia'],
  'discernment': ['Individual', 'Household', 'Ecclesia'],
  'warfare': ['Individual', 'Ecclesia'],
  'commissioning': ['Individual', 'Ecclesia', 'Network'],
  'stewardship': ['Individual', 'Household', 'Ecclesia', 'Network']
};

/**
 * Node Type → Formation Scope compatibility matrix
 * Some node types are only appropriate for certain scopes
 */
const NODE_TYPE_SCOPE_RULES = {
  'Teaching': ['Individual', 'Household', 'Ecclesia', 'Network'], // All scopes
  'Confrontation': ['Individual'], // Personal only
  'Exercise': ['Individual', 'Household', 'Ecclesia'], // Not Network
  'Reflection': ['Individual'], // Personal only
  'Assessment': ['Individual'] // Personal only
};

/**
 * Validate formation scope assignment
 *
 * @param {Object} data - Node data
 * @returns {Object} Validation result
 */
async function validateFormationScope(data) {
  const formationScope = data.formationScope;
  const nodeType = data.nodeType;
  const nodeTitle = data.title || 'Untitled';
  const nodeId = data.nodeId || data.id || 'unknown';

  // Skip validation if no scope specified (draft)
  if (!formationScope) {
    console.log(`[Formation Scope] Skipping validation for node "${nodeTitle}" (no scope specified)`);
    return { valid: true };
  }

  // Validate scope is recognized
  if (!FORMATION_SCOPES.includes(formationScope)) {
    return {
      valid: false,
      nodeTitle,
      nodeId,
      violations: [{
        code: 'INVALID_FORMATION_SCOPE',
        message: `Invalid formation scope: "${formationScope}". Must be one of: ${FORMATION_SCOPES.join(', ')}`,
        severity: 'error'
      }]
    };
  }

  const violations = [];

  // Check node type compatibility
  if (nodeType && NODE_TYPE_SCOPE_RULES[nodeType]) {
    const allowedScopes = NODE_TYPE_SCOPE_RULES[nodeType];

    if (!allowedScopes.includes(formationScope)) {
      violations.push({
        code: 'SCOPE_NODE_TYPE_MISMATCH',
        message: `Node Type "${nodeType}" cannot use Formation Scope "${formationScope}"`,
        detail: `Allowed scopes for ${nodeType}: ${allowedScopes.join(', ')}`,
        severity: 'error',
        fix: `Change formation scope to one of: ${allowedScopes.join(', ')}`
      });
    }
  }

  // Check phase compatibility (if phase is available)
  if (data.phase) {
    // Fetch phase to get its slug/identifier
    let phaseSlug = null;

    if (typeof data.phase === 'number') {
      // Phase is an ID, need to fetch it
      try {
        const phase = await strapi.entityService.findOne(
          'api::formation-phase.formation-phase',
          data.phase,
          { fields: ['slug', 'phaseId'] }
        );
        phaseSlug = phase?.slug || phase?.phaseId;
      } catch (error) {
        console.warn(`[Formation Scope] Could not fetch phase ${data.phase}:`, error);
      }
    } else if (typeof data.phase === 'string') {
      // Phase is already a slug
      phaseSlug = data.phase;
    } else if (data.phase?.slug || data.phase?.phaseId) {
      // Phase is an object
      phaseSlug = data.phase.slug || data.phase.phaseId;
    }

    if (phaseSlug) {
      const allowedScopes = PHASE_SCOPE_CONSTRAINTS[phaseSlug.toLowerCase()];

      if (allowedScopes && !allowedScopes.includes(formationScope)) {
        violations.push({
          code: 'SCOPE_PHASE_MISMATCH',
          message: `Formation Scope "${formationScope}" not allowed in phase "${phaseSlug}"`,
          detail: `Allowed scopes for ${phaseSlug}: ${allowedScopes.join(', ')}`,
          severity: 'warning',
          fix: `Change formation scope to one of: ${allowedScopes.join(', ')}, or move to a different phase`
        });
      }
    }
  }

  // Return validation result
  if (violations.length > 0) {
    return {
      valid: false,
      nodeTitle,
      nodeId,
      formationScope,
      nodeType,
      violations
    };
  }

  return { valid: true };
}

/**
 * Format validation error for Strapi
 *
 * @param {Object} result - Validation result
 * @returns {Object} Formatted error details
 */
function formatScopeValidationError(result) {
  return {
    node: {
      title: result.nodeTitle,
      id: result.nodeId,
      formationScope: result.formationScope,
      nodeType: result.nodeType
    },
    violations: result.violations
  };
}

/**
 * Check if user has completed prerequisites for a given scope.
 *
 * Gating rules:
 * - Individual: always accessible
 * - Household: requires ≥70% Individual completion
 * - Ecclesia: requires Individual complete + ≥50% Household
 * - Network: requires Individual + Ecclesia complete
 *
 * @param {number} userId - User ID
 * @param {string} targetScope - Target formation scope
 * @returns {Promise<{eligible: boolean, reason?: string, completedScopes: Object}>}
 */
async function checkScopePrerequisites(userId, targetScope) {
  const completedScopes = {
    Individual: 0,
    Household: 0,
    Ecclesia: 0,
    Network: 0,
  };

  // Individual is always open
  if (targetScope === 'Individual') {
    return { eligible: true, completedScopes };
  }

  // Query formation journey progress per scope
  try {
    const journeys = await strapi.db.query('api::formation-journey.formation-journey').findMany({
      where: { user: userId },
      select: ['formationScope', 'completedNodes', 'totalNodes'],
    });

    for (const journey of journeys) {
      const scope = journey.formationScope;
      const total = journey.totalNodes || 1;
      const completed = journey.completedNodes || 0;
      const pct = Math.round((completed / total) * 100);
      if (scope && completedScopes.hasOwnProperty(scope)) {
        completedScopes[scope] = pct;
      }
    }
  } catch (error) {
    console.warn(`[Formation Scope] Could not fetch journey progress for user ${userId}:`, error);
    // If we can't check, fail open for Household (safe), closed for Network (risky)
    if (targetScope === 'Household') {
      return { eligible: true, reason: 'Progress check unavailable — defaulting open', completedScopes };
    }
    return { eligible: false, reason: 'Unable to verify prerequisites', completedScopes };
  }

  switch (targetScope) {
    case 'Household': {
      const eligible = completedScopes.Individual >= 70;
      return {
        eligible,
        reason: eligible
          ? undefined
          : `Individual formation must be at least 70% complete (currently ${completedScopes.Individual}%)`,
        completedScopes,
      };
    }

    case 'Ecclesia': {
      const indComplete = completedScopes.Individual >= 100;
      const householdHalf = completedScopes.Household >= 50;
      const eligible = indComplete && householdHalf;
      const reasons = [];
      if (!indComplete) reasons.push(`Individual formation must be complete (currently ${completedScopes.Individual}%)`);
      if (!householdHalf) reasons.push(`Household formation must be at least 50% complete (currently ${completedScopes.Household}%)`);
      return {
        eligible,
        reason: eligible ? undefined : reasons.join('; '),
        completedScopes,
      };
    }

    case 'Network': {
      const indDone = completedScopes.Individual >= 100;
      const ecclDone = completedScopes.Ecclesia >= 100;
      const eligible = indDone && ecclDone;
      const reasons = [];
      if (!indDone) reasons.push(`Individual formation must be complete (currently ${completedScopes.Individual}%)`);
      if (!ecclDone) reasons.push(`Ecclesia formation must be complete (currently ${completedScopes.Ecclesia}%)`);
      return {
        eligible,
        reason: eligible ? undefined : reasons.join('; '),
        completedScopes,
      };
    }

    default:
      return { eligible: false, reason: `Unknown scope: ${targetScope}`, completedScopes };
  }
}

module.exports = {
  validateFormationScope,
  formatScopeValidationError,
  checkScopePrerequisites,
  FORMATION_SCOPES,
  PHASE_SCOPE_CONSTRAINTS,
  NODE_TYPE_SCOPE_RULES
};
