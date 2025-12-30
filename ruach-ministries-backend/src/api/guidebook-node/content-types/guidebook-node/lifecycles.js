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
const { ValidationError } = require('@strapi/utils').errors;

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

    try {
      console.log('[Guidebook Node] beforeCreate: Validating axiom hierarchy...');

      const result = await validateAxiomHierarchy(data);

      if (!result.valid) {
        const errorDetails = formatValidationError(result);

        console.error('[Guidebook Node] beforeCreate: Validation failed', errorDetails);

        throw new ValidationError(
          'Axiom hierarchy validation failed',
          errorDetails
        );
      }

      console.log(`[Guidebook Node] beforeCreate: Validation passed for node "${data.title}"`);
    } catch (error) {
      // Re-throw ValidationError as-is
      if (error instanceof ValidationError) {
        throw error;
      }

      // Wrap unexpected errors
      console.error('[Guidebook Node] beforeCreate: Unexpected error during validation', error);
      throw new ValidationError(
        'Axiom hierarchy validation encountered an error',
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

    // Only validate if Node Type or Canon Axioms are being modified
    const shouldValidate = data.nodeType !== undefined || data.canonAxioms !== undefined;

    if (!shouldValidate) {
      console.log('[Guidebook Node] beforeUpdate: Skipping validation (nodeType and canonAxioms unchanged)');
      return;
    }

    try {
      console.log('[Guidebook Node] beforeUpdate: Validating axiom hierarchy...');

      const result = await validateAxiomHierarchy(data);

      if (!result.valid) {
        const errorDetails = formatValidationError(result);

        console.error('[Guidebook Node] beforeUpdate: Validation failed', errorDetails);

        throw new ValidationError(
          'Axiom hierarchy validation failed',
          errorDetails
        );
      }

      console.log(`[Guidebook Node] beforeUpdate: Validation passed for node "${data.title}"`);
    } catch (error) {
      // Re-throw ValidationError as-is
      if (error instanceof ValidationError) {
        throw error;
      }

      // Wrap unexpected errors
      console.error('[Guidebook Node] beforeUpdate: Unexpected error during validation', error);
      throw new ValidationError(
        'Axiom hierarchy validation encountered an error',
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
    const { result } = event;

    if (result) {
      console.log(`[Guidebook Node] afterUpdate: Successfully updated node "${result.title}" (ID: ${result.id})`);
    }
  }
};
