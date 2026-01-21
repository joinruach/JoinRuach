/**
 * Ruach Guardrail Engine Service
 * Checks content against doctrinal boundaries and provides correction guidance
 */

import type { Core } from '@strapi/strapi';

type EnforcementLevel = 'blocking' | 'warning' | 'guidance';
type GuardrailCategory = 'doctrine' | 'interpretation' | 'application';

interface Guardrail {
  guardrailId: string;
  category: GuardrailCategory;
  title: string;
  description: string;
  enforcementLevel: EnforcementLevel;
  detectionPatterns: {
    regex?: string[];
    keywords?: string[];
    phrases?: string[];
  };
  correctionGuidance: string;
  isActive: boolean;
  priority: number;
}

interface Violation {
  guardrailId: string;
  guardrailTitle: string;
  category: GuardrailCategory;
  enforcementLevel: EnforcementLevel;
  matches: string[];
  correctionGuidance: string;
  detectedAt: string[];
}

interface GuardrailCheckResult {
  passed: boolean;
  violations: Violation[];
  warnings: Violation[];
  guidanceItems: Violation[];
  score: number;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Check content against active guardrails
   */
  async checkGuardrails(
    content: string,
    guardrailIds?: string[]
  ): Promise<GuardrailCheckResult> {
    // Load guardrails
    const guardrails = await this.loadActiveGuardrails(guardrailIds);

    if (guardrails.length === 0) {
      return {
        passed: true,
        violations: [],
        warnings: [],
        guidanceItems: [],
        score: 1.0,
      };
    }

    // Check each guardrail
    const violations: Violation[] = [];
    const warnings: Violation[] = [];
    const guidanceItems: Violation[] = [];

    for (const guardrail of guardrails) {
      const detected = await this.detectViolations(content, guardrail);

      if (detected.matches.length > 0) {
        // Categorize by enforcement level
        if (guardrail.enforcementLevel === 'blocking') {
          violations.push(detected);
        } else if (guardrail.enforcementLevel === 'warning') {
          warnings.push(detected);
        } else {
          guidanceItems.push(detected);
        }
      }
    }

    // Calculate score (0-1, lower is worse)
    const score = this.calculateGuardrailScore(violations, warnings, guidanceItems);

    return {
      passed: violations.length === 0,
      violations,
      warnings,
      guidanceItems,
      score,
    };
  },

  /**
   * Detect violations for a specific guardrail
   */
  async detectViolations(content: string, guardrail: Guardrail): Promise<Violation> {
    const matches: string[] = [];
    const detectedAt: string[] = [];

    // Check regex patterns
    if (guardrail.detectionPatterns.regex) {
      for (const pattern of guardrail.detectionPatterns.regex) {
        const regex = new RegExp(pattern, 'gi');
        const found = content.match(regex);

        if (found) {
          matches.push(...found);
          detectedAt.push(`regex: ${pattern}`);
        }
      }
    }

    // Check keyword patterns
    if (guardrail.detectionPatterns.keywords) {
      for (const keyword of guardrail.detectionPatterns.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const found = content.match(regex);

        if (found) {
          matches.push(...found);
          detectedAt.push(`keyword: ${keyword}`);
        }
      }
    }

    // Check phrase patterns
    if (guardrail.detectionPatterns.phrases) {
      for (const phrase of guardrail.detectionPatterns.phrases) {
        const regex = new RegExp(phrase, 'gi');
        const found = content.match(regex);

        if (found) {
          matches.push(...found);
          detectedAt.push(`phrase: ${phrase}`);
        }
      }
    }

    return {
      guardrailId: guardrail.guardrailId,
      guardrailTitle: guardrail.title,
      category: guardrail.category,
      enforcementLevel: guardrail.enforcementLevel,
      matches: [...new Set(matches)], // Remove duplicates
      correctionGuidance: guardrail.correctionGuidance,
      detectedAt,
    };
  },

  /**
   * Load active guardrails from database
   */
  async loadActiveGuardrails(guardrailIds?: string[]): Promise<Guardrail[]> {
    const entityService = strapi.entityService as any;

    const filters: any = {
      isActive: true,
    };

    if (guardrailIds && guardrailIds.length > 0) {
      filters.guardrailId = { $in: guardrailIds };
    }

    const guardrails = await entityService.findMany('api::ruach-guardrail.ruach-guardrail', {
      filters,
      sort: { priority: 'asc' },
    });

    return guardrails || [];
  },

  /**
   * Calculate guardrail compliance score
   * Score: 1.0 = perfect, 0.0 = major violations
   */
  calculateGuardrailScore(
    violations: Violation[],
    warnings: Violation[],
    guidanceItems: Violation[]
  ): number {
    const violationPenalty = 0.3;
    const warningPenalty = 0.1;
    const guidancePenalty = 0.05;

    let score = 1.0;

    // Apply penalties
    score -= violations.length * violationPenalty;
    score -= warnings.length * warningPenalty;
    score -= guidanceItems.length * guidancePenalty;

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, score));
  },

  /**
   * Initialize minimal starter guardrails (called during setup)
   */
  async initializeStarterGuardrails(): Promise<void> {
    const entityService = strapi.entityService as any;
    const crypto = await import('crypto');

    const starterGuardrails: Omit<Guardrail, 'guardrailId'>[] = [
      {
        category: 'doctrine',
        title: 'Scripture Citation Required',
        description: 'Every doctrinal claim must cite scripture',
        enforcementLevel: 'blocking',
        detectionPatterns: {
          // Detect doctrinal claims without nearby citations
          keywords: [
            'salvation',
            'justification',
            'sanctification',
            'atonement',
            'trinity',
            'deity of Christ',
            'resurrection',
            'eternal life',
          ],
          phrases: [
            'God is',
            'Jesus is',
            'the Bible says',
            'scripture teaches',
            'we believe',
          ],
        },
        correctionGuidance:
          'Every doctrinal claim must cite scripture. Add [Scripture: Book Chapter:Verse] after claims.',
        isActive: true,
        priority: 10,
      },
      {
        category: 'interpretation',
        title: 'No External Theology',
        description: 'Only use approved library sources - no external references',
        enforcementLevel: 'warning',
        detectionPatterns: {
          phrases: [
            'according to',
            'as taught by',
            'following the tradition of',
            'in the school of',
          ],
          keywords: [
            'Wikipedia',
            'Google',
            'ChatGPT',
            'external source',
            'popular belief',
          ],
        },
        correctionGuidance:
          'Only cite sources from the approved library. Remove references to external sources.',
        isActive: true,
        priority: 20,
      },
      {
        category: 'interpretation',
        title: 'Synthesis Labeling',
        description: 'Label interpretive synthesis clearly',
        enforcementLevel: 'guidance',
        detectionPatterns: {
          // Missing synthesis labels before interpretation
          phrases: [
            'this means',
            'we can conclude',
            'therefore',
            'it follows that',
            'this suggests',
          ],
        },
        correctionGuidance:
          'Label synthesis clearly with phrases like "Based on these passages...", "These verses suggest...", or "Combining these texts..."',
        isActive: true,
        priority: 30,
      },
    ];

    // Check if guardrails already exist
    const existing = await entityService.findMany('api::ruach-guardrail.ruach-guardrail', {
      filters: {
        title: {
          $in: starterGuardrails.map(g => g.title),
        },
      },
    });

    if (existing && existing.length > 0) {
      strapi.log.info('Starter guardrails already exist, skipping initialization');
      return;
    }

    // Create starter guardrails
    for (const guardrail of starterGuardrails) {
      try {
        await entityService.create('api::ruach-guardrail.ruach-guardrail', {
          data: {
            guardrailId: crypto.randomUUID(),
            ...guardrail,
            publishedAt: new Date(),
          },
        });
        strapi.log.info(`Created starter guardrail: ${guardrail.title}`);
      } catch (error) {
        strapi.log.error(`Error creating guardrail ${guardrail.title}:`, error);
      }
    }
  },

  /**
   * Generate guardrail violation report
   */
  generateViolationReport(result: GuardrailCheckResult): string {
    const lines: string[] = [];

    lines.push('=== Guardrail Check Report ===\n');
    lines.push(`Overall Score: ${(result.score * 100).toFixed(1)}%`);
    lines.push(`Status: ${result.passed ? 'PASSED' : 'FAILED'}\n`);

    if (result.violations.length > 0) {
      lines.push('🚫 BLOCKING VIOLATIONS:');
      for (const violation of result.violations) {
        lines.push(`  - ${violation.guardrailTitle}`);
        lines.push(`    Category: ${violation.category}`);
        lines.push(`    Matches: ${violation.matches.slice(0, 3).join(', ')}${violation.matches.length > 3 ? '...' : ''}`);
        lines.push(`    Guidance: ${violation.correctionGuidance}\n`);
      }
    }

    if (result.warnings.length > 0) {
      lines.push('⚠️  WARNINGS:');
      for (const warning of result.warnings) {
        lines.push(`  - ${warning.guardrailTitle}`);
        lines.push(`    Matches: ${warning.matches.slice(0, 2).join(', ')}${warning.matches.length > 2 ? '...' : ''}`);
        lines.push(`    Guidance: ${warning.correctionGuidance}\n`);
      }
    }

    if (result.guidanceItems.length > 0) {
      lines.push('💡 GUIDANCE:');
      for (const guidance of result.guidanceItems) {
        lines.push(`  - ${guidance.guardrailTitle}`);
        lines.push(`    Guidance: ${guidance.correctionGuidance}\n`);
      }
    }

    return lines.join('\n');
  },

  /**
   * Update guardrail violation count (for analytics)
   */
  async recordViolation(guardrailId: string): Promise<void> {
    try {
      const entityService = strapi.entityService as any;

      const guardrails = await entityService.findMany('api::ruach-guardrail.ruach-guardrail', {
        filters: { guardrailId },
      });

      const guardrail = guardrails?.[0];
      if (!guardrail) {
        return;
      }

      await entityService.update('api::ruach-guardrail.ruach-guardrail', guardrail.id, {
        data: {
          violationCount: (guardrail.violationCount || 0) + 1,
        },
      });
    } catch (error) {
      strapi.log.error('Error recording guardrail violation:', error);
    }
  },
});
