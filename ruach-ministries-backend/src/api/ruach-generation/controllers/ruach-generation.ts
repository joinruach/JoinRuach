/**
 * Ruach Generation Controller
 * API endpoints for scripture-anchored content generation
 */

import type { Core } from '@strapi/strapi';

/**
 * POST /api/ruach-generation/generate
 * Main content generation endpoint
 */
export async function generate(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  // Check access (requires authentication)
  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const {
      query,
      outputType,
      mode = 'scripture_library',
      templateId,
      filters,
      retrievalLimit,
      relevanceThreshold,
      strictMode = false,
    } = ctx.request.body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return ctx.badRequest('Query parameter is required');
    }

    if (!outputType || !['sermon', 'study', 'qa_answer', 'doctrine_page'].includes(outputType)) {
      return ctx.badRequest('Valid outputType is required (sermon, study, qa_answer, doctrine_page)');
    }

    // Call generation service
    const result = await strapi
      .service('api::library.ruach-generation')
      .generateContent({
        query,
        outputType,
        mode,
        templateId,
        filters,
        retrievalLimit,
        relevanceThreshold,
        strictMode,
      });

    ctx.body = result;
  } catch (error: any) {
    strapi.log.error('[ruach-generation] Generation failed', error);

    // Return structured error
    ctx.status = 500;
    ctx.body = {
      status: 'failed',
      error: error.message || 'Generation failed',
      details: error.stack,
    };
  }
}

/**
 * GET /api/ruach-generation/templates
 * List available prompt templates
 */
export async function listTemplates(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { outputType } = ctx.query;
    const entityService = strapi.entityService as any;

    const filters: any = {};
    if (outputType) {
      filters.outputType = outputType;
    }

    const templates = await entityService.findMany('api::ruach-prompt-template.ruach-prompt-template', {
      filters,
      populate: ['guardrails'],
      publicationState: 'live',
    });

    ctx.body = {
      data: templates,
      meta: {
        total: templates?.length || 0,
      },
    };
  } catch (error) {
    strapi.log.error('[ruach-generation] Failed to list templates', error);
    ctx.internalServerError('Failed to list templates');
  }
}

/**
 * GET /api/ruach-generation/templates/:templateId
 * Get a specific template
 */
export async function getTemplate(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { templateId } = ctx.params;
    const entityService = strapi.entityService as any;

    const templates = await entityService.findMany('api::ruach-prompt-template.ruach-prompt-template', {
      filters: { templateId },
      populate: ['guardrails'],
    });

    const template = templates?.[0];

    if (!template) {
      return ctx.notFound('Template not found');
    }

    ctx.body = { data: template };
  } catch (error) {
    strapi.log.error('[ruach-generation] Failed to get template', error);
    ctx.internalServerError('Failed to get template');
  }
}

/**
 * POST /api/ruach-generation/verify-citations/:nodeId
 * Re-verify citations for an existing generated node
 */
export async function verifyCitations(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { nodeId } = ctx.params;
    const entityService = strapi.entityService as any;

    // Load generated node
    const nodes = await entityService.findMany('api::library-generated-node.library-generated-node', {
      filters: { nodeId },
      populate: ['citations'],
    });

    const node = nodes?.[0];

    if (!node) {
      return ctx.notFound('Generated node not found');
    }

    // Re-verify citations
    const citationValidator = strapi.service('api::library.ruach-citation-validator');

    const coverage = await citationValidator.calculateCitationCoverage(
      node.content,
      node.citations
    );

    const report = await citationValidator.generateQualityReport(
      node.content,
      node.citations,
      {
        minScripture: 2,
        minLibrary: 1,
        coverage: 0.7,
      }
    );

    // Update node with new metrics
    await entityService.update('api::library-generated-node.library-generated-node', node.id, {
      data: {
        citationCoverage: coverage,
        qualityScore: report.qualityScore,
        verificationLog: {
          lastVerified: new Date().toISOString(),
          report,
        },
      },
    });

    ctx.body = {
      nodeId,
      coverage,
      report,
    };
  } catch (error) {
    strapi.log.error('[ruach-generation] Citation verification failed', error);
    ctx.internalServerError('Citation verification failed');
  }
}

/**
 * GET /api/ruach-generation/guardrails
 * List active guardrails
 */
export async function listGuardrails(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { category } = ctx.query;
    const entityService = strapi.entityService as any;

    const filters: any = {
      isActive: true,
    };

    if (category) {
      filters.category = category;
    }

    const guardrails = await entityService.findMany('api::ruach-guardrail.ruach-guardrail', {
      filters,
      sort: { priority: 'asc' },
      publicationState: 'live',
    });

    ctx.body = {
      data: guardrails,
      meta: {
        total: guardrails?.length || 0,
      },
    };
  } catch (error) {
    strapi.log.error('[ruach-generation] Failed to list guardrails', error);
    ctx.internalServerError('Failed to list guardrails');
  }
}

/**
 * POST /api/ruach-generation/check-guardrails
 * Check content against guardrails (utility endpoint)
 */
export async function checkGuardrails(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { content, guardrailIds } = ctx.request.body;

    if (!content || typeof content !== 'string') {
      return ctx.badRequest('Content parameter is required');
    }

    const guardrailEngine = strapi.service('api::library.ruach-guardrail-engine');
    const result = await guardrailEngine.checkGuardrails(content, guardrailIds);

    ctx.body = result;
  } catch (error) {
    strapi.log.error('[ruach-generation] Guardrail check failed', error);
    ctx.internalServerError('Guardrail check failed');
  }
}

/**
 * POST /api/ruach-generation/initialize
 * Initialize starter guardrails (admin only)
 */
export async function initialize(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  // Require admin access
  const isAdmin = ctx.state.admin;
  if (!isAdmin) {
    return ctx.unauthorized('Admin access required');
  }

  try {
    const guardrailEngine = strapi.service('api::library.ruach-guardrail-engine');
    await guardrailEngine.initializeStarterGuardrails();

    ctx.body = {
      message: 'Starter guardrails initialized successfully',
    };
  } catch (error) {
    strapi.log.error('[ruach-generation] Initialization failed', error);
    ctx.internalServerError('Initialization failed');
  }
}

export default {
  generate,
  listTemplates,
  getTemplate,
  verifyCitations,
  listGuardrails,
  checkGuardrails,
  initialize,
};
