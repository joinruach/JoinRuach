import type { Core } from "@strapi/strapi";
import * as quotesService from "../services/quotes";
import * as annotationsService from "../services/annotations";
import * as patternsService from "../services/patterns";

// ============================================================================
// QUOTES
// ============================================================================

export async function createQuote(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Quote creation requires Builder tier or higher");
  }

  try {
    const quote = await quotesService.createQuote(strapi, user.id, ctx.request.body);
    ctx.body = { data: quote };
  } catch (error) {
    strapi.log.error("[library] Failed to create quote", error);
    ctx.internalServerError("Failed to create quote");
  }
}

export async function listQuotes(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user) {
    return ctx.unauthorized("Authentication required");
  }

  try {
    const { visibilityTier, tagIds, isFeatured } = ctx.query;

    const quotes = await quotesService.listQuotes(
      strapi,
      user.accessLevel || "basic",
      {
        visibilityTier,
        tagIds: tagIds ? JSON.parse(tagIds) : undefined,
        isFeatured: isFeatured === "true",
      }
    );

    ctx.body = { data: quotes };
  } catch (error) {
    strapi.log.error("[library] Failed to list quotes", error);
    ctx.internalServerError("Failed to list quotes");
  }
}

export async function getQuote(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user) {
    return ctx.unauthorized("Authentication required");
  }

  try {
    const { quoteId } = ctx.params;
    const quote = await quotesService.getQuoteById(strapi, quoteId);

    if (!quote) {
      return ctx.notFound("Quote not found");
    }

    ctx.body = { data: quote };
  } catch (error) {
    strapi.log.error("[library] Failed to get quote", error);
    ctx.internalServerError("Failed to get quote");
  }
}

export async function updateQuote(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Quote editing requires Builder tier or higher");
  }

  try {
    const { quoteId } = ctx.params;
    const quote = await quotesService.updateQuote(strapi, quoteId, ctx.request.body);

    if (!quote) {
      return ctx.notFound("Quote not found");
    }

    ctx.body = { data: quote };
  } catch (error) {
    strapi.log.error("[library] Failed to update quote", error);
    ctx.internalServerError("Failed to update quote");
  }
}

export async function deleteQuote(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Quote deletion requires Builder tier or higher");
  }

  try {
    const { quoteId } = ctx.params;
    await quotesService.deleteQuote(strapi, quoteId);
    ctx.body = { message: "Quote deleted successfully" };
  } catch (error) {
    strapi.log.error("[library] Failed to delete quote", error);
    ctx.internalServerError("Failed to delete quote");
  }
}

// ============================================================================
// ANNOTATIONS
// ============================================================================

export async function createAnnotation(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user) {
    return ctx.unauthorized("Authentication required");
  }

  try {
    const annotation = await annotationsService.createAnnotation(
      strapi,
      user.id,
      ctx.request.body
    );
    ctx.body = { data: annotation };
  } catch (error) {
    strapi.log.error("[library] Failed to create annotation", error);
    ctx.internalServerError("Failed to create annotation");
  }
}

export async function listAnnotations(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user) {
    return ctx.unauthorized("Authentication required");
  }

  try {
    const { chunkId, annotationType } = ctx.query;

    const annotations = await annotationsService.listAnnotations(
      strapi,
      user.id,
      user.accessLevel || "basic",
      {
        chunkId: chunkId ? parseInt(chunkId) : undefined,
        annotationType,
      }
    );

    ctx.body = { data: annotations };
  } catch (error) {
    strapi.log.error("[library] Failed to list annotations", error);
    ctx.internalServerError("Failed to list annotations");
  }
}

export async function getAnnotation(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user) {
    return ctx.unauthorized("Authentication required");
  }

  try {
    const { annotationId } = ctx.params;
    const annotation = await annotationsService.getAnnotationById(
      strapi,
      annotationId,
      user.id
    );

    if (!annotation) {
      return ctx.notFound("Annotation not found");
    }

    ctx.body = { data: annotation };
  } catch (error) {
    strapi.log.error("[library] Failed to get annotation", error);
    ctx.internalServerError("Failed to get annotation");
  }
}

export async function updateAnnotation(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user) {
    return ctx.unauthorized("Authentication required");
  }

  try {
    const { annotationId } = ctx.params;
    const annotation = await annotationsService.updateAnnotation(
      strapi,
      annotationId,
      user.id,
      ctx.request.body
    );

    if (!annotation) {
      return ctx.notFound("Annotation not found or you don't have permission");
    }

    ctx.body = { data: annotation };
  } catch (error) {
    strapi.log.error("[library] Failed to update annotation", error);
    ctx.internalServerError("Failed to update annotation");
  }
}

export async function deleteAnnotation(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user) {
    return ctx.unauthorized("Authentication required");
  }

  try {
    const { annotationId } = ctx.params;
    await annotationsService.deleteAnnotation(strapi, annotationId, user.id);
    ctx.body = { message: "Annotation deleted successfully" };
  } catch (error) {
    strapi.log.error("[library] Failed to delete annotation", error);
    ctx.internalServerError("Failed to delete annotation");
  }
}

// ============================================================================
// WRITING PATTERNS
// ============================================================================

export async function createPattern(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Pattern creation requires Builder tier or higher");
  }

  try {
    const pattern = await patternsService.createPattern(strapi, ctx.request.body);
    ctx.body = { data: pattern };
  } catch (error) {
    strapi.log.error("[library] Failed to create pattern", error);
    ctx.internalServerError("Failed to create pattern");
  }
}

export async function listPatterns(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Pattern access requires Builder tier or higher");
  }

  try {
    const { patternType, tagIds } = ctx.query;

    const patterns = await patternsService.listPatterns(strapi, {
      patternType,
      tagIds: tagIds ? JSON.parse(tagIds) : undefined,
    });

    ctx.body = { data: patterns };
  } catch (error) {
    strapi.log.error("[library] Failed to list patterns", error);
    ctx.internalServerError("Failed to list patterns");
  }
}

export async function getPattern(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Pattern access requires Builder tier or higher");
  }

  try {
    const { patternId } = ctx.params;
    const pattern = await patternsService.getPatternById(strapi, patternId);

    if (!pattern) {
      return ctx.notFound("Pattern not found");
    }

    ctx.body = { data: pattern };
  } catch (error) {
    strapi.log.error("[library] Failed to get pattern", error);
    ctx.internalServerError("Failed to get pattern");
  }
}

export async function updatePattern(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Pattern editing requires Builder tier or higher");
  }

  try {
    const { patternId } = ctx.params;
    const pattern = await patternsService.updatePattern(strapi, patternId, ctx.request.body);

    if (!pattern) {
      return ctx.notFound("Pattern not found");
    }

    ctx.body = { data: pattern };
  } catch (error) {
    strapi.log.error("[library] Failed to update pattern", error);
    ctx.internalServerError("Failed to update pattern");
  }
}

export async function deletePattern(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };
  const user = ctx.state.user;

  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Pattern deletion requires Builder tier or higher");
  }

  try {
    const { patternId } = ctx.params;
    await patternsService.deletePattern(strapi, patternId);
    ctx.body = { message: "Pattern deleted successfully" };
  } catch (error) {
    strapi.log.error("[library] Failed to delete pattern", error);
    ctx.internalServerError("Failed to delete pattern");
  }
}

export default {
  // Quotes
  createQuote,
  listQuotes,
  getQuote,
  updateQuote,
  deleteQuote,
  // Annotations
  createAnnotation,
  listAnnotations,
  getAnnotation,
  updateAnnotation,
  deleteAnnotation,
  // Patterns
  createPattern,
  listPatterns,
  getPattern,
  updatePattern,
  deletePattern,
};
