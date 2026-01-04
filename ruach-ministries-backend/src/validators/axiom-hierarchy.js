/**
 * Axiom Hierarchy Validator
 *
 * Enforcement layer for Canon Law axiom governance rules.
 * Rejects any Guidebook Node that violates tier requirements.
 *
 * @version 1.0.0
 * @date 2025-12-29
 * @status Production Ready
 */

'use strict';

/**
 * Constitutional Law Constants
 * Mirror of Canon Law minimum tier requirements
 *
 * AUTHORITY: Canon Law v1.0
 * MODIFICATION: Requires theological review
 */
const MINIMUM_TIER_BY_NODE_TYPE = {
  'Awakening': 2,      // Tier 2 (Identity & Alignment) - Must invite response, not crush
  'Healing': 2,        // Tier 2 (Identity & Alignment) - Healing without identity = shame
  'Formation': 2,      // Tier 2 (Identity & Alignment) - Requires stability before discipline
  'Warfare': 1,        // Tier 1 (Foundational) - Without authority = fear and obsession
  'Commissioning': 2   // Tier 2 (Identity & Alignment) - Sending flows from belonging
};

/**
 * Axiom Ceiling Configuration
 * Maximum number of axioms allowed per node
 */
const AXIOM_CEILING_MAX = parseInt(process.env.AXIOM_CEILING_MAX || '4', 10);

const isTestEnv = process.env.NODE_ENV === 'test';

function warn(...args) {
  if (isTestEnv) return;
  console.warn(...args);
}

function log(...args) {
  if (isTestEnv) return;
  console.log(...args);
}

/**
 * Get minimum tier requirement for a given Node Type
 *
 * @param {string} nodeType - The Node Type (e.g., "Awakening", "Warfare")
 * @returns {number} Minimum tier number (1-4)
 * @throws {Error} If Node Type is unknown
 */
function getMinimumTierForNodeType(nodeType) {
  const minTier = MINIMUM_TIER_BY_NODE_TYPE[nodeType];

  if (!minTier) {
    throw new Error(`Unknown Node Type: ${nodeType}. Valid types: ${Object.keys(MINIMUM_TIER_BY_NODE_TYPE).join(', ')}`);
  }

  return minTier;
}

/**
 * Parse tier string to number
 *
 * @param {string} tierString - Tier string (e.g., "Tier 1", "Tier 2")
 * @returns {number} Tier number (1-4)
 */
function parseTierNumber(tierString) {
  if (!tierString) return null;

  const match = tierString.match(/Tier (\d)/);
  if (!match) {
    warn(`[Axiom Validator] Invalid tier format: ${tierString}`);
    return null;
  }

  return parseInt(match[1], 10);
}

/**
 * Check tier compliance for a node
 *
 * @param {string} nodeType - Node Type
 * @param {Array} canonAxiomIds - Array of Canon Axiom IDs
 * @param {string} nodeTitle - Node title (for error messages)
 * @param {string} nodeId - Node ID (for error messages)
 * @returns {Promise<Object>} Validation result
 */
async function checkTierCompliance(nodeType, canonAxiomIds, nodeTitle, nodeId) {
  // Fetch all related Canon Axiom entries
  const axioms = await strapi.entityService.findMany('api::canon-axiom.canon-axiom', {
    filters: { id: { $in: canonAxiomIds } },
    fields: ['hierarchy_tier', 'title']
  });

  if (!axioms || axioms.length === 0) {
    warn(`[Axiom Validator] No axioms found for IDs: ${canonAxiomIds.join(', ')}`);
    return { valid: true }; // Skip validation if axioms not found (draft state)
  }

  // Extract tier values
  const tiers = axioms.map(a => a.hierarchy_tier).filter(Boolean);
  const axiomCount = tiers.length;

  // Parse tier numbers for analysis
  const tierNumbers = tiers.map(parseTierNumber).filter(n => n !== null);

  if (tierNumbers.length === 0) {
    warn(`[Axiom Validator] No valid tier numbers found for node: ${nodeTitle}`);
    return { valid: true }; // Skip if no valid tiers
  }

  const uniqueTiers = [...new Set(tierNumbers)].sort();
  const highestTier = Math.min(...tierNumbers); // Lower number = higher authority
  const lowestTier = Math.max(...tierNumbers);

  // Check for violations
  const violations = [];

  // 1. Check axiom count ceiling
  if (axiomCount > AXIOM_CEILING_MAX) {
    violations.push({
      code: 'AXIOM_CEILING_EXCEEDED',
      message: `Node has ${axiomCount} axioms (maximum ${AXIOM_CEILING_MAX} allowed)`,
      severity: 'error'
    });
  }

  // 2. Check for ungoverned pressure/discernment (Tier 3 or 4 alone)
  const hasTier1or2 = tierNumbers.some(t => t === 1 || t === 2);
  const hasTier3or4 = tierNumbers.some(t => t === 3 || t === 4);

  if (hasTier3or4 && !hasTier1or2) {
    violations.push({
      code: 'PRESSURE_WITHOUT_ANCHOR',
      message: 'Node contains Tier 3 (pressure) or Tier 4 (discernment) without Tier 1 (foundational) or Tier 2 (identity) anchor',
      detail: `Tiers present: ${tiers.join(', ')}`,
      severity: 'error',
      fix: 'Add at least one Tier 1 or Tier 2 axiom before including Tier 3 or 4'
    });
  }

  // 3. Check minimum tier requirement for Node Type
  const minTierRequired = getMinimumTierForNodeType(nodeType);

  if (highestTier > minTierRequired) {
    violations.push({
      code: 'INSUFFICIENT_GOVERNING_TIER',
      message: `Node Type "${nodeType}" requires at least Tier ${minTierRequired}, but highest tier present is Tier ${highestTier}`,
      detail: `Tiers present: ${tiers.join(', ')}`,
      severity: 'error',
      fix: `Add at least one Tier ${minTierRequired} axiom`
    });
  }

  // Return validation result
  if (violations.length > 0) {
    return {
      valid: false,
      nodeTitle,
      nodeId,
      nodeType,
      violations,
      axiomCount,
      tiersPresent: tiers,
      highestTier: `Tier ${highestTier}`
    };
  }

  return { valid: true };
}

/**
 * Main validation function
 * Validates axiom hierarchy for a Guidebook Node
 *
 * @param {Object} data - Node data from lifecycle hook
 * @returns {Promise<Object>} Validation result
 */
async function validateAxiomHierarchy(data) {
  const nodeType = data.nodeType;
  const canonAxiomIds = data.canonAxioms || [];
  const nodeTitle = data.title || 'Untitled';
  const nodeId = data.nodeId || data.id || 'unknown';

  // Skip validation if no axioms attached (allow drafts)
  if (!canonAxiomIds || canonAxiomIds.length === 0) {
    log(`[Axiom Validator] Skipping validation for node "${nodeTitle}" (no axioms attached)`);
    return { valid: true };
  }

  // Skip validation if no node type specified
  if (!nodeType) {
    log(`[Axiom Validator] Skipping validation for node "${nodeTitle}" (no node type specified)`);
    return { valid: true };
  }

  log(`[Axiom Validator] Validating node "${nodeTitle}" (Type: ${nodeType}, Axioms: ${canonAxiomIds.length})`);

  // Proceed to tier analysis
  return await checkTierCompliance(nodeType, canonAxiomIds, nodeTitle, nodeId);
}

/**
 * Format validation error for Strapi
 *
 * @param {Object} result - Validation result
 * @returns {Object} Formatted error details
 */
function formatValidationError(result) {
  return {
    node: {
      title: result.nodeTitle,
      id: result.nodeId,
      type: result.nodeType
    },
    violations: result.violations,
    axiomCount: result.axiomCount,
    tiersPresent: result.tiersPresent,
    highestTier: result.highestTier
  };
}

module.exports = {
  validateAxiomHierarchy,
  formatValidationError,
  getMinimumTierForNodeType,
  MINIMUM_TIER_BY_NODE_TYPE,
  AXIOM_CEILING_MAX
};
