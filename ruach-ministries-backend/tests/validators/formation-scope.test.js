/**
 * Formation Scope Validator Tests
 *
 * Validates scope progression gating, node type compatibility,
 * and phase-scope constraints for formation journeys.
 *
 * @version 1.0.0
 * @date 2026-02-26
 */

'use strict';

const {
  validateFormationScope,
  formatScopeValidationError,
  checkScopePrerequisites,
  FORMATION_SCOPES,
  PHASE_SCOPE_CONSTRAINTS,
  NODE_TYPE_SCOPE_RULES
} = require('../../src/validators/formation-scope');

// Mock Strapi global
global.strapi = {
  entityService: {
    findOne: jest.fn()
  },
  db: {
    query: jest.fn()
  }
};

describe('Formation Scope Validator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the db.query mock to return a findMany-able object
    strapi.db.query.mockReturnValue({
      findMany: jest.fn()
    });
  });

  // ---------------------------------------------------------------------------
  // validateFormationScope
  // ---------------------------------------------------------------------------
  describe('validateFormationScope', () => {
    it('should return valid for no scope specified (draft)', async () => {
      const data = {
        title: 'Draft Node',
        nodeId: 'draft-1'
        // no formationScope
      };

      const result = await validateFormationScope(data);

      expect(result.valid).toBe(true);
    });

    it('should return error for invalid scope name', async () => {
      const data = {
        formationScope: 'Galactic',
        nodeType: 'Teaching',
        title: 'Bad Scope Node',
        nodeId: 'bad-scope-1'
      };

      const result = await validateFormationScope(data);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe('INVALID_FORMATION_SCOPE');
      expect(result.violations[0].severity).toBe('error');
      expect(result.violations[0].message).toContain('Galactic');
    });

    it('should return error for Confrontation node type with Ecclesia scope', async () => {
      const data = {
        formationScope: 'Ecclesia',
        nodeType: 'Confrontation',
        title: 'Confrontation in Ecclesia',
        nodeId: 'confront-1'
      };

      const result = await validateFormationScope(data);

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'SCOPE_NODE_TYPE_MISMATCH',
          severity: 'error'
        })
      );
      expect(result.violations[0].message).toContain('Confrontation');
      expect(result.violations[0].message).toContain('Ecclesia');
    });

    it('should return valid for Teaching node type with any scope', async () => {
      for (const scope of FORMATION_SCOPES) {
        const data = {
          formationScope: scope,
          nodeType: 'Teaching',
          title: `Teaching in ${scope}`,
          nodeId: `teaching-${scope}`
        };

        const result = await validateFormationScope(data);

        expect(result.valid).toBe(true);
      }
    });

    it('should return warning for scope-phase mismatch (phase as string)', async () => {
      // Household is NOT allowed in 'awakening' phase per constraints
      const data = {
        formationScope: 'Household',
        nodeType: 'Teaching',
        title: 'Household in Awakening',
        nodeId: 'phase-mismatch-1',
        phase: 'awakening'
      };

      const result = await validateFormationScope(data);

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'SCOPE_PHASE_MISMATCH',
          severity: 'warning'
        })
      );
    });

    it('should return warning for scope-phase mismatch (phase as object)', async () => {
      // Network is NOT allowed in 'awakening' phase
      const data = {
        formationScope: 'Network',
        nodeType: 'Teaching',
        title: 'Network in Awakening',
        nodeId: 'phase-mismatch-2',
        phase: { slug: 'awakening' }
      };

      const result = await validateFormationScope(data);

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'SCOPE_PHASE_MISMATCH',
          severity: 'warning'
        })
      );
    });

    it('should return warning for scope-phase mismatch (phase as numeric ID)', async () => {
      // Phase is a numeric ID; strapi.entityService.findOne resolves it
      strapi.entityService.findOne.mockResolvedValue({
        slug: 'warfare',
        phaseId: 'warfare'
      });

      // Household is NOT allowed in 'warfare' phase
      const data = {
        formationScope: 'Household',
        nodeType: 'Teaching',
        title: 'Household in Warfare',
        nodeId: 'phase-mismatch-3',
        phase: 42
      };

      const result = await validateFormationScope(data);

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'SCOPE_PHASE_MISMATCH',
          severity: 'warning'
        })
      );
      expect(strapi.entityService.findOne).toHaveBeenCalledWith(
        'api::formation-phase.formation-phase',
        42,
        { fields: ['slug', 'phaseId'] }
      );
    });

    it('should return valid when scope and phase are compatible', async () => {
      // Individual is allowed in 'awakening'
      const data = {
        formationScope: 'Individual',
        nodeType: 'Teaching',
        title: 'Individual in Awakening',
        nodeId: 'compat-1',
        phase: 'awakening'
      };

      const result = await validateFormationScope(data);

      expect(result.valid).toBe(true);
    });

    it('should return error for Reflection with Household scope', async () => {
      const data = {
        formationScope: 'Household',
        nodeType: 'Reflection',
        title: 'Reflection in Household',
        nodeId: 'reflect-1'
      };

      const result = await validateFormationScope(data);

      expect(result.valid).toBe(false);
      expect(result.violations[0].code).toBe('SCOPE_NODE_TYPE_MISMATCH');
    });

    it('should return error for Assessment with Network scope', async () => {
      const data = {
        formationScope: 'Network',
        nodeType: 'Assessment',
        title: 'Assessment in Network',
        nodeId: 'assess-1'
      };

      const result = await validateFormationScope(data);

      expect(result.valid).toBe(false);
      expect(result.violations[0].code).toBe('SCOPE_NODE_TYPE_MISMATCH');
    });

    it('should skip node type check for unknown node types', async () => {
      const data = {
        formationScope: 'Network',
        nodeType: 'CustomType',
        title: 'Custom Node',
        nodeId: 'custom-1'
      };

      const result = await validateFormationScope(data);

      // No entry in NODE_TYPE_SCOPE_RULES for CustomType, so no violation
      expect(result.valid).toBe(true);
    });

    it('should accumulate both node-type and phase violations', async () => {
      // Confrontation only allows Individual; awakening does not allow Household
      // But we set scope to Household and nodeType Confrontation
      const data = {
        formationScope: 'Household',
        nodeType: 'Confrontation',
        title: 'Double Violation',
        nodeId: 'double-1',
        phase: 'awakening'
      };

      const result = await validateFormationScope(data);

      expect(result.valid).toBe(false);
      const codes = result.violations.map(v => v.code);
      expect(codes).toContain('SCOPE_NODE_TYPE_MISMATCH');
      expect(codes).toContain('SCOPE_PHASE_MISMATCH');
    });
  });

  // ---------------------------------------------------------------------------
  // checkScopePrerequisites
  // ---------------------------------------------------------------------------
  describe('checkScopePrerequisites', () => {
    /** Helper to set up the mock for strapi.db.query().findMany() */
    function mockJourneyProgress(journeys) {
      const findManyMock = jest.fn().mockResolvedValue(journeys);
      strapi.db.query.mockReturnValue({ findMany: findManyMock });
      return findManyMock;
    }

    function mockJourneyError(error) {
      const findManyMock = jest.fn().mockRejectedValue(error);
      strapi.db.query.mockReturnValue({ findMany: findManyMock });
      return findManyMock;
    }

    it('should always return eligible for Individual scope', async () => {
      const result = await checkScopePrerequisites(1, 'Individual');

      expect(result.eligible).toBe(true);
      // Should not query the database at all
      expect(strapi.db.query).not.toHaveBeenCalled();
    });

    it('should return eligible for Household when Individual >= 70%', async () => {
      mockJourneyProgress([
        { formationScope: 'Individual', completedNodes: 7, totalNodes: 10 }
      ]);

      const result = await checkScopePrerequisites(1, 'Household');

      expect(result.eligible).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.completedScopes.Individual).toBe(70);
    });

    it('should return ineligible for Household when Individual < 70%', async () => {
      mockJourneyProgress([
        { formationScope: 'Individual', completedNodes: 5, totalNodes: 10 }
      ]);

      const result = await checkScopePrerequisites(1, 'Household');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('70%');
      expect(result.reason).toContain('50%');
      expect(result.completedScopes.Individual).toBe(50);
    });

    it('should return eligible for Ecclesia when Individual=100% and Household>=50%', async () => {
      mockJourneyProgress([
        { formationScope: 'Individual', completedNodes: 10, totalNodes: 10 },
        { formationScope: 'Household', completedNodes: 5, totalNodes: 10 }
      ]);

      const result = await checkScopePrerequisites(1, 'Ecclesia');

      expect(result.eligible).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.completedScopes.Individual).toBe(100);
      expect(result.completedScopes.Household).toBe(50);
    });

    it('should return ineligible for Ecclesia when Individual < 100%', async () => {
      mockJourneyProgress([
        { formationScope: 'Individual', completedNodes: 9, totalNodes: 10 },
        { formationScope: 'Household', completedNodes: 8, totalNodes: 10 }
      ]);

      const result = await checkScopePrerequisites(1, 'Ecclesia');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Individual');
    });

    it('should return ineligible for Ecclesia when Household < 50%', async () => {
      mockJourneyProgress([
        { formationScope: 'Individual', completedNodes: 10, totalNodes: 10 },
        { formationScope: 'Household', completedNodes: 4, totalNodes: 10 }
      ]);

      const result = await checkScopePrerequisites(1, 'Ecclesia');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Household');
    });

    it('should return eligible for Network when Individual=100% and Ecclesia=100%', async () => {
      mockJourneyProgress([
        { formationScope: 'Individual', completedNodes: 10, totalNodes: 10 },
        { formationScope: 'Ecclesia', completedNodes: 10, totalNodes: 10 }
      ]);

      const result = await checkScopePrerequisites(1, 'Network');

      expect(result.eligible).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return ineligible for Network when Individual < 100%', async () => {
      mockJourneyProgress([
        { formationScope: 'Individual', completedNodes: 9, totalNodes: 10 },
        { formationScope: 'Ecclesia', completedNodes: 10, totalNodes: 10 }
      ]);

      const result = await checkScopePrerequisites(1, 'Network');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Individual');
    });

    it('should return ineligible for Network when Ecclesia < 100%', async () => {
      mockJourneyProgress([
        { formationScope: 'Individual', completedNodes: 10, totalNodes: 10 },
        { formationScope: 'Ecclesia', completedNodes: 8, totalNodes: 10 }
      ]);

      const result = await checkScopePrerequisites(1, 'Network');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Ecclesia');
    });

    it('should return eligible=true for Household when progress check fails (fail open)', async () => {
      mockJourneyError(new Error('Database connection lost'));

      const result = await checkScopePrerequisites(1, 'Household');

      expect(result.eligible).toBe(true);
      expect(result.reason).toContain('defaulting open');
    });

    it('should return eligible=false for Network when progress check fails (fail closed)', async () => {
      mockJourneyError(new Error('Database connection lost'));

      const result = await checkScopePrerequisites(1, 'Network');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Unable to verify');
    });

    it('should return eligible=false for Ecclesia when progress check fails (fail closed)', async () => {
      mockJourneyError(new Error('Database timeout'));

      const result = await checkScopePrerequisites(1, 'Ecclesia');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Unable to verify');
    });

    it('should return ineligible for unknown scope', async () => {
      mockJourneyProgress([]);

      const result = await checkScopePrerequisites(1, 'Cosmic');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Unknown scope');
    });

    it('should handle zero totalNodes gracefully (avoid divide-by-zero)', async () => {
      mockJourneyProgress([
        { formationScope: 'Individual', completedNodes: 0, totalNodes: 0 }
      ]);

      // totalNodes defaults to 1 in the source to avoid division by zero
      // 0/1 = 0%, so Household should be ineligible
      const result = await checkScopePrerequisites(1, 'Household');

      expect(result.eligible).toBe(false);
    });

    it('should query with correct user ID and select fields', async () => {
      const findManyMock = mockJourneyProgress([]);

      await checkScopePrerequisites(42, 'Household');

      expect(strapi.db.query).toHaveBeenCalledWith('api::formation-journey.formation-journey');
      expect(findManyMock).toHaveBeenCalledWith({
        where: { user: 42 },
        select: ['formationScope', 'completedNodes', 'totalNodes']
      });
    });
  });

  // ---------------------------------------------------------------------------
  // formatScopeValidationError
  // ---------------------------------------------------------------------------
  describe('formatScopeValidationError', () => {
    it('should format violations correctly', () => {
      const result = {
        valid: false,
        nodeTitle: 'Bad Node',
        nodeId: 'bad-1',
        formationScope: 'Ecclesia',
        nodeType: 'Confrontation',
        violations: [
          {
            code: 'SCOPE_NODE_TYPE_MISMATCH',
            message: 'Node Type "Confrontation" cannot use Formation Scope "Ecclesia"',
            severity: 'error'
          }
        ]
      };

      const formatted = formatScopeValidationError(result);

      expect(formatted).toEqual({
        node: {
          title: 'Bad Node',
          id: 'bad-1',
          formationScope: 'Ecclesia',
          nodeType: 'Confrontation'
        },
        violations: result.violations
      });
    });

    it('should include all violation entries', () => {
      const result = {
        valid: false,
        nodeTitle: 'Multi-Violation',
        nodeId: 'multi-1',
        formationScope: 'Household',
        nodeType: 'Confrontation',
        violations: [
          { code: 'SCOPE_NODE_TYPE_MISMATCH', message: 'type mismatch', severity: 'error' },
          { code: 'SCOPE_PHASE_MISMATCH', message: 'phase mismatch', severity: 'warning' }
        ]
      };

      const formatted = formatScopeValidationError(result);

      expect(formatted.violations).toHaveLength(2);
      expect(formatted.violations[0].code).toBe('SCOPE_NODE_TYPE_MISMATCH');
      expect(formatted.violations[1].code).toBe('SCOPE_PHASE_MISMATCH');
    });
  });

  // ---------------------------------------------------------------------------
  // Exported Constants
  // ---------------------------------------------------------------------------
  describe('Exported Constants', () => {
    it('should export all four formation scopes', () => {
      expect(FORMATION_SCOPES).toEqual(['Individual', 'Household', 'Ecclesia', 'Network']);
    });

    it('should have phase-scope constraints for all six phases', () => {
      const phases = Object.keys(PHASE_SCOPE_CONSTRAINTS);
      expect(phases).toHaveLength(6);
      expect(phases).toContain('awakening');
      expect(phases).toContain('separation');
      expect(phases).toContain('discernment');
      expect(phases).toContain('warfare');
      expect(phases).toContain('commissioning');
      expect(phases).toContain('stewardship');
    });

    it('should have node type scope rules for restricted types', () => {
      expect(NODE_TYPE_SCOPE_RULES['Confrontation']).toEqual(['Individual']);
      expect(NODE_TYPE_SCOPE_RULES['Reflection']).toEqual(['Individual']);
      expect(NODE_TYPE_SCOPE_RULES['Assessment']).toEqual(['Individual']);
      expect(NODE_TYPE_SCOPE_RULES['Exercise']).toEqual(['Individual', 'Household', 'Ecclesia']);
      expect(NODE_TYPE_SCOPE_RULES['Teaching']).toEqual(['Individual', 'Household', 'Ecclesia', 'Network']);
    });
  });
});
