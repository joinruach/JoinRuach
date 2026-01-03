/**
 * Guidebook Node Lifecycle Hooks
 *
 * Enforces Canon Law axiom hierarchy rules on all Guidebook Node operations.
 * This is the non-negotiable gate that prevents malformed formation content
 * from entering the Formation Engine.
 *
 * @version 1.0.0
 * @date 2025-12-29
 * @status Production Ready
 */

'use strict';

const { validateAxiomHierarchy, formatValidationError } = require('../../../../validators/axiom-hierarchy');
const { validateFormationScope, formatScopeValidationError } = require('../../../../validators/formation-scope');
const { ValidationError } = require('@strapi/utils').errors;

const IMPORT_MODE_ENABLED = ['true', '1'].includes(
  (process.env.IMPORT_MODE || '').toLowerCase()
);

function shouldSkipValidationForImport(hookName) {
  if (!IMPORT_MODE_ENABLED) {
    return false;
  }

  console.log(`[Guidebook Node] ${hookName}: Import mode active, skipping validation only`);
  return true;
}

module.exports = {
  /**
   * Before Create Hook
   *
   * Validates axiom hierarchy before creating a new Guidebook Node.
   * Rejects creation if validation fails.
   *
   * @param {Object} event - Lifecycle event
   * @param {Object} event.params - Event parameters
   * @param {Object} event.params.data - Node data being created
   */
  async beforeCreate(event) {
    const { data } = event.params;

    // Guard against illegal UPDATE-only relation operators during CREATE
    const illegalRelationKeys = ['set', 'disconnect'];
    for (const key of illegalRelationKeys) {
      if (JSON.stringify(data).includes(`"${key}"`)) {
        throw new ValidationError(
          'Invalid relation operation during create',
          { message: `Relation operator "${key}" is not allowed during create.` }
        );
      }
    }

    if (shouldSkipValidationForImport('beforeCreate')) {
      return;
    }

    try {
      // Validate axiom hierarchy
      console.log('[Guidebook Node] beforeCreate: Validating axiom hierarchy...');

      const axiomResult = await validateAxiomHierarchy(data);

      if (!axiomResult.valid) {
        const errorDetails = formatValidationError(axiomResult);

        console.error('[Guidebook Node] beforeCreate: Axiom validation failed', errorDetails);

        throw new ValidationError(
          'Axiom hierarchy validation failed',
          errorDetails
        );
      }

      // Validate formation scope
      console.log('[Guidebook Node] beforeCreate: Validating formation scope...');

      const scopeResult = await validateFormationScope(data);

      if (!scopeResult.valid) {
        const errorDetails = formatScopeValidationError(scopeResult);

        console.error('[Guidebook Node] beforeCreate: Scope validation failed', errorDetails);

        throw new ValidationError(
          'Formation scope validation failed',
          errorDetails
        );
      }

      console.log(`[Guidebook Node] beforeCreate: All validations passed for node "${data.title}"`);
    } catch (error) {
      // Re-throw ValidationError as-is
      if (error instanceof ValidationError) {
        throw error;
      }

      // Wrap unexpected errors
      console.error('[Guidebook Node] beforeCreate: Unexpected error during validation', error);
      throw new ValidationError(
        'Node validation encountered an error',
        {
          originalError: error.message,
          stack: error.stack
        }
      );
    }
  },

  /**
   * Before Update Hook
   *
   * Validates axiom hierarchy before updating a Guidebook Node.
   * Only validates if Node Type or Canon Axioms are being modified.
   *
   * @param {Object} event - Lifecycle event
   * @param {Object} event.params - Event parameters
   * @param {Object} event.params.data - Node data being updated
   */
  async beforeUpdate(event) {
    const { data } = event.params;

    // Guard against destructive relation ops during import updates
    if (IMPORT_MODE_ENABLED && JSON.stringify(data).includes('"disconnect"')) {
      throw new ValidationError(
        'Invalid relation operation during import update',
        { message: 'Relation operator "disconnect" is not allowed during import updates.' }
      );
    }

    // Only validate if relevant fields are being modified
    const shouldValidate =
      data.nodeType !== undefined ||
      data.canonAxioms !== undefined ||
      data.formationScope !== undefined;

    if (!shouldValidate) {
      console.log('[Guidebook Node] beforeUpdate: Skipping validation (no relevant fields changed)');
      return;
    }
    if (shouldSkipValidationForImport('beforeUpdate')) {
      return;
    }

    try {
      // Validate axiom hierarchy (if nodeType or canonAxioms changed)
      if (data.nodeType !== undefined || data.canonAxioms !== undefined) {
        console.log('[Guidebook Node] beforeUpdate: Validating axiom hierarchy...');

        const axiomResult = await validateAxiomHierarchy(data);

        if (!axiomResult.valid) {
          const errorDetails = formatValidationError(axiomResult);

          console.error('[Guidebook Node] beforeUpdate: Axiom validation failed', errorDetails);

          throw new ValidationError(
            'Axiom hierarchy validation failed',
            errorDetails
          );
        }
      }

      // Validate formation scope (if formationScope changed)
      if (data.formationScope !== undefined) {
        console.log('[Guidebook Node] beforeUpdate: Validating formation scope...');

        const scopeResult = await validateFormationScope(data);

        if (!scopeResult.valid) {
          const errorDetails = formatScopeValidationError(scopeResult);

          console.error('[Guidebook Node] beforeUpdate: Scope validation failed', errorDetails);

          throw new ValidationError(
            'Formation scope validation failed',
            errorDetails
          );
        }
      }

      console.log(`[Guidebook Node] beforeUpdate: All validations passed for node "${data.title || 'unknown'}"`);
    } catch (error) {
      // Re-throw ValidationError as-is
      if (error instanceof ValidationError) {
        throw error;
      }

      // Wrap unexpected errors
      console.error('[Guidebook Node] beforeUpdate: Unexpected error during validation', error);
      throw new ValidationError(
        'Node validation encountered an error',
        {
          originalError: error.message,
          stack: error.stack
        }
      );
    }
  },

  /**
   * After Create Hook (Optional)
   *
   * Logs successful creation for monitoring.
   *
   * @param {Object} event - Lifecycle event
   */
  async afterCreate(event) {
    // IMPORTANT: Lifecycle hooks must remain side‑effect free.
    // Do NOT perform entityService.create/update here.

    const { result } = event;

    if (result) {
      console.log(`[Guidebook Node] afterCreate: Successfully created node "${result.title}" (ID: ${result.id})`);

      // Optional: Track axiom compliance metrics
      if (result.canon_axioms && result.canon_axioms.length > 0) {
        console.log(`[Guidebook Node] afterCreate: Node has ${result.canon_axioms.length} axioms attached`);
      }
    }
  },

  /**
   * After Update Hook (Optional)
   *
   * Logs successful updates for monitoring.
   *
   * @param {Object} event - Lifecycle event
   */
  async afterUpdate(event) {
    // IMPORTANT: Lifecycle hooks must remain side‑effect free.
    // Do NOT perform entityService.create/update here.

    const { result } = event;

    if (result) {
      console.log(`[Guidebook Node] afterUpdate: Successfully updated node "${result.title}" (ID: ${result.id})`);
    }
  }
};
