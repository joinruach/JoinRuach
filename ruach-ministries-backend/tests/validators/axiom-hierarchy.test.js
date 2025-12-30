/**
 * Axiom Hierarchy Validator Tests
 *
 * Validates the enforcement layer for Canon Law axiom governance.
 * Tests all violation scenarios and edge cases.
 *
 * @version 1.0.0
 * @date 2025-12-29
 */

'use strict';

const {
  validateAxiomHierarchy,
  formatValidationError,
  getMinimumTierForNodeType,
  MINIMUM_TIER_BY_NODE_TYPE,
  AXIOM_CEILING_MAX
} = require('../../src/validators/axiom-hierarchy');

// Mock Strapi global
global.strapi = {
  entityService: {
    findMany: jest.fn()
  }
};

describe('Axiom Hierarchy Validator', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('getMinimumTierForNodeType', () => {
    it('should return correct minimum tier for Awakening', () => {
      expect(getMinimumTierForNodeType('Awakening')).toBe(2);
    });

    it('should return correct minimum tier for Warfare', () => {
      expect(getMinimumTierForNodeType('Warfare')).toBe(1);
    });

    it('should throw error for unknown Node Type', () => {
      expect(() => getMinimumTierForNodeType('Unknown')).toThrow('Unknown Node Type');
    });
  });

  describe('validateAxiomHierarchy - Edge Cases', () => {
    it('should pass validation for nodes with no axioms (drafts)', async () => {
      const data = {
        nodeType: 'Awakening',
        canonAxioms: [],
        title: 'Draft Node',
        nodeId: 'draft-1'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(true);
      expect(strapi.entityService.findMany).not.toHaveBeenCalled();
    });

    it('should pass validation for nodes with no node_type (drafts)', async () => {
      const data = {
        canonAxioms: [1, 2, 3],
        title: 'Draft Node',
        nodeId: 'draft-2'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(true);
      expect(strapi.entityService.findMany).not.toHaveBeenCalled();
    });
  });

  describe('validateAxiomHierarchy - Valid Scenarios', () => {
    it('should pass: Tier 1 only (Warfare)', async () => {
      strapi.entityService.findMany.mockResolvedValue([
        { id: 1, hierarchy_tier: 'Tier 1', title: 'Foundation Axiom' }
      ]);

      const data = {
        nodeType: 'Warfare',
        canonAxioms: [1],
        title: 'Spiritual Authority',
        nodeId: 'warfare-1'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(true);
    });

    it('should pass: Tier 2 only (Awakening)', async () => {
      strapi.entityService.findMany.mockResolvedValue([
        { id: 2, hierarchy_tier: 'Tier 2', title: 'Identity Axiom' }
      ]);

      const data = {
        nodeType: 'Awakening',
        canonAxioms: [2],
        title: 'Who You Are',
        nodeId: 'awakening-1'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(true);
    });

    it('should pass: Tier 1 + Tier 3 (Formation)', async () => {
      strapi.entityService.findMany.mockResolvedValue([
        { id: 1, hierarchy_tier: 'Tier 1', title: 'Foundation' },
        { id: 3, hierarchy_tier: 'Tier 3', title: 'Pressure' },
        { id: 4, hierarchy_tier: 'Tier 3', title: 'More Pressure' }
      ]);

      const data = {
        nodeType: 'Formation',
        canonAxioms: [1, 3, 4],
        title: 'The Narrow Road',
        nodeId: 'formation-1'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(true);
    });

    it('should pass: Tier 2 + Tier 4 (Awakening)', async () => {
      strapi.entityService.findMany.mockResolvedValue([
        { id: 2, hierarchy_tier: 'Tier 2', title: 'Identity' },
        { id: 5, hierarchy_tier: 'Tier 4', title: 'Discernment' }
      ]);

      const data = {
        nodeType: 'Awakening',
        canonAxioms: [2, 5],
        title: 'Testing the Spirits',
        nodeId: 'awakening-2'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateAxiomHierarchy - Invalid Scenarios', () => {
    it('should fail: Tier 3 only (PRESSURE_WITHOUT_ANCHOR)', async () => {
      strapi.entityService.findMany.mockResolvedValue([
        { id: 3, hierarchy_tier: 'Tier 3', title: 'Pressure' },
        { id: 4, hierarchy_tier: 'Tier 3', title: 'More Pressure' }
      ]);

      const data = {
        nodeType: 'Awakening',
        canonAxioms: [3, 4],
        title: 'Bad Node',
        nodeId: 'bad-1'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(2);
      expect(result.violations[0].code).toBe('PRESSURE_WITHOUT_ANCHOR');
      expect(result.violations[1].code).toBe('INSUFFICIENT_GOVERNING_TIER');
    });

    it('should fail: Tier 4 only (PRESSURE_WITHOUT_ANCHOR)', async () => {
      strapi.entityService.findMany.mockResolvedValue([
        { id: 5, hierarchy_tier: 'Tier 4', title: 'Discernment Only' }
      ]);

      const data = {
        nodeType: 'Warfare',
        canonAxioms: [5],
        title: 'Bad Warfare Node',
        nodeId: 'bad-2'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'PRESSURE_WITHOUT_ANCHOR'
        })
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'INSUFFICIENT_GOVERNING_TIER'
        })
      );
    });

    it('should fail: Warfare with Tier 2 only (INSUFFICIENT_GOVERNING_TIER)', async () => {
      strapi.entityService.findMany.mockResolvedValue([
        { id: 2, hierarchy_tier: 'Tier 2', title: 'Identity' },
        { id: 5, hierarchy_tier: 'Tier 4', title: 'Discernment' }
      ]);

      const data = {
        nodeType: 'Warfare',
        canonAxioms: [2, 5],
        title: 'Warfare Without Authority',
        nodeId: 'bad-3'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'INSUFFICIENT_GOVERNING_TIER',
          message: expect.stringContaining('requires at least Tier 1')
        })
      );
    });

    it('should fail: 5 axioms (AXIOM_CEILING_EXCEEDED)', async () => {
      strapi.entityService.findMany.mockResolvedValue([
        { id: 1, hierarchy_tier: 'Tier 1', title: 'Foundation' },
        { id: 2, hierarchy_tier: 'Tier 2', title: 'Identity' },
        { id: 3, hierarchy_tier: 'Tier 3', title: 'Pressure 1' },
        { id: 4, hierarchy_tier: 'Tier 3', title: 'Pressure 2' },
        { id: 5, hierarchy_tier: 'Tier 4', title: 'Discernment' }
      ]);

      const data = {
        nodeType: 'Awakening',
        canonAxioms: [1, 2, 3, 4, 5],
        title: 'Too Many Axioms',
        nodeId: 'bad-4'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'AXIOM_CEILING_EXCEEDED',
          message: `Node has 5 axioms (maximum ${AXIOM_CEILING_MAX} allowed)`
        })
      );
    });
  });

  describe('formatValidationError', () => {
    it('should format error details correctly', () => {
      const validationResult = {
        valid: false,
        nodeTitle: 'Test Node',
        nodeId: 'test-1',
        nodeType: 'Awakening',
        violations: [
          {
            code: 'PRESSURE_WITHOUT_ANCHOR',
            message: 'Test violation',
            severity: 'error'
          }
        ],
        axiomCount: 2,
        tiersPresent: ['Tier 3', 'Tier 3'],
        highestTier: 'Tier 3'
      };

      const formatted = formatValidationError(validationResult);

      expect(formatted).toEqual({
        node: {
          title: 'Test Node',
          id: 'test-1',
          type: 'Awakening'
        },
        violations: validationResult.violations,
        axiomCount: 2,
        tiersPresent: ['Tier 3', 'Tier 3'],
        highestTier: 'Tier 3'
      });
    });
  });

  describe('Integration Test Scenarios', () => {
    it('should handle all violation types together', async () => {
      // 5 axioms (ceiling exceeded) + Tier 4 only (pressure without anchor) + Warfare node (insufficient tier)
      strapi.entityService.findMany.mockResolvedValue([
        { id: 4, hierarchy_tier: 'Tier 4', title: 'D1' },
        { id: 5, hierarchy_tier: 'Tier 4', title: 'D2' },
        { id: 6, hierarchy_tier: 'Tier 4', title: 'D3' },
        { id: 7, hierarchy_tier: 'Tier 4', title: 'D4' },
        { id: 8, hierarchy_tier: 'Tier 4', title: 'D5' }
      ]);

      const data = {
        nodeType: 'Warfare',
        canonAxioms: [4, 5, 6, 7, 8],
        title: 'Maximum Violation Node',
        nodeId: 'max-violation'
      };

      const result = await validateAxiomHierarchy(data);

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBe(3);

      const codes = result.violations.map(v => v.code);
      expect(codes).toContain('AXIOM_CEILING_EXCEEDED');
      expect(codes).toContain('PRESSURE_WITHOUT_ANCHOR');
      expect(codes).toContain('INSUFFICIENT_GOVERNING_TIER');
    });

    it('should handle missing tier data gracefully', async () => {
      strapi.entityService.findMany.mockResolvedValue([
        { id: 1, hierarchy_tier: null, title: 'Missing Tier' }
      ]);

      const data = {
        nodeType: 'Awakening',
        canonAxioms: [1],
        title: 'Node with Missing Tier',
        nodeId: 'missing-tier'
      };

      const result = await validateAxiomHierarchy(data);

      // Should pass (skip validation if no valid tiers)
      expect(result.valid).toBe(true);
    });

    it('should handle axioms not found', async () => {
      strapi.entityService.findMany.mockResolvedValue([]);

      const data = {
        nodeType: 'Awakening',
        canonAxioms: [999],
        title: 'Node with Non-existent Axioms',
        nodeId: 'not-found'
      };

      const result = await validateAxiomHierarchy(data);

      // Should pass (skip validation if axioms not found - draft state)
      expect(result.valid).toBe(true);
    });
  });

  describe('Canon Law Constants', () => {
    it('should have correct minimum tier mappings', () => {
      expect(MINIMUM_TIER_BY_NODE_TYPE).toEqual({
        'Awakening': 2,
        'Healing': 2,
        'Formation': 2,
        'Warfare': 1,
        'Commissioning': 2
      });
    });

    it('should have axiom ceiling defined', () => {
      expect(AXIOM_CEILING_MAX).toBe(4);
    });
  });
});
