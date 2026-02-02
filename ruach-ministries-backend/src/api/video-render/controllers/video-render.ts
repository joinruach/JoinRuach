/**
 * Video Render Controller
 * API endpoints for video generation
 */

import type { Core } from "@strapi/strapi";

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Queue a new video render
   * POST /api/video-renders
   */
  async create(ctx: any) {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return ctx.unauthorized("Authentication required");
    }

    const { compositionId, inputProps, outputFormat, quality } = ctx.request.body;

    if (!compositionId || !inputProps) {
      return ctx.badRequest("compositionId and inputProps are required");
    }

    // Validate composition ID
    const validCompositions = [
      "ScriptureOverlay",
      "TestimonyClip",
      "QuoteReel",
      "TeachingVideo",
      "PodcastEnhanced",
      "DeclarationVideo",
      "DailyScripture",
      "ScriptureThumbnail",
      "QuoteThumbnail",
    ];

    if (!validCompositions.includes(compositionId)) {
      return ctx.badRequest(`Invalid compositionId. Valid options: ${validCompositions.join(", ")}`);
    }

    try {
      const videoRenderService = strapi.service("api::video-render.video-render") as any;

      const result = await videoRenderService.queueRender({
        compositionId,
        inputProps,
        outputFormat: outputFormat || "mp4",
        quality: quality || "standard",
        userId,
      });

      ctx.body = {
        data: {
          renderId: result.renderId,
          jobId: result.jobId,
          status: "queued",
          message: "Video render queued successfully",
        },
      };
    } catch (error) {
      strapi.log.error("Error queueing video render:", error);
      ctx.throw(500, "Failed to queue video render");
    }
  },

  /**
   * Get render status
   * GET /api/video-renders/:renderId/status
   */
  async status(ctx: any) {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return ctx.unauthorized("Authentication required");
    }

    const { renderId } = ctx.params;

    try {
      const videoRenderService = strapi.service("api::video-render.video-render") as any;
      const status = await videoRenderService.getRenderStatus(renderId, userId);

      if (!status) {
        return ctx.notFound("Render not found");
      }

      ctx.body = { data: status };
    } catch (error) {
      strapi.log.error("Error getting render status:", error);
      ctx.throw(500, "Failed to get render status");
    }
  },

  /**
   * List user's renders
   * GET /api/video-renders
   */
  async find(ctx: any) {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return ctx.unauthorized("Authentication required");
    }

    const { status, limit, offset } = ctx.query;

    try {
      const videoRenderService = strapi.service("api::video-render.video-render") as any;
      const result = await videoRenderService.listUserRenders(userId, {
        status,
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
      });

      ctx.body = {
        data: result.renders.map((r: any) => ({
          renderId: r.renderId,
          compositionId: r.compositionId,
          status: r.status,
          progress: r.progress,
          outputUrl: r.outputUrl,
          thumbnailUrl: r.thumbnailUrl,
          createdAt: r.createdAt,
        })),
        meta: {
          total: result.total,
        },
      };
    } catch (error) {
      strapi.log.error("Error listing renders:", error);
      ctx.throw(500, "Failed to list renders");
    }
  },

  /**
   * Cancel a render
   * POST /api/video-renders/:renderId/cancel
   */
  async cancel(ctx: any) {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return ctx.unauthorized("Authentication required");
    }

    const { renderId } = ctx.params;

    try {
      const videoRenderService = strapi.service("api::video-render.video-render") as any;
      const cancelled = await videoRenderService.cancelRender(renderId, userId);

      if (!cancelled) {
        return ctx.notFound("Render not found");
      }

      ctx.body = {
        data: {
          renderId,
          status: "cancelled",
          message: "Render cancelled successfully",
        },
      };
    } catch (error) {
      strapi.log.error("Error cancelling render:", error);
      ctx.throw(500, "Failed to cancel render");
    }
  },

  /**
   * Get queue statistics (admin only)
   * GET /api/video-renders/queue/stats
   */
  async queueStats(ctx: any) {
    try {
      const videoRenderService = strapi.service("api::video-render.video-render") as any;
      const stats = await videoRenderService.getQueueStats();

      ctx.body = { data: stats };
    } catch (error) {
      strapi.log.error("Error getting queue stats:", error);
      ctx.throw(500, "Failed to get queue stats");
    }
  },

  /**
   * Quick render endpoints for common templates
   */

  /**
   * Generate Scripture overlay video
   * POST /api/video-renders/scripture
   */
  async scripture(ctx: any) {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return ctx.unauthorized("Authentication required");
    }

    const { reference, text, translation, theme, animationStyle, backgroundUrl, musicUrl } =
      ctx.request.body;

    if (!reference || !text) {
      return ctx.badRequest("reference and text are required");
    }

    try {
      const videoRenderService = strapi.service("api::video-render.video-render") as any;

      const result = await videoRenderService.queueRender({
        compositionId: "ScriptureOverlay",
        inputProps: {
          reference,
          text,
          translation: translation || "NIV",
          theme: theme || "dark",
          animationStyle: animationStyle || "typewriter",
          backgroundType: backgroundUrl ? "image" : "gradient",
          backgroundUrl: backgroundUrl || "",
          musicUrl: musicUrl || "",
        },
        outputFormat: "mp4",
        quality: "standard",
        userId,
      });

      ctx.body = {
        data: {
          renderId: result.renderId,
          status: "queued",
        },
      };
    } catch (error) {
      strapi.log.error("Error creating scripture video:", error);
      ctx.throw(500, "Failed to create scripture video");
    }
  },

  /**
   * Generate quote reel video
   * POST /api/video-renders/quote
   */
  async quote(ctx: any) {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return ctx.unauthorized("Authentication required");
    }

    const { quote, author, source, backgroundUrl, theme } = ctx.request.body;

    if (!quote || !author) {
      return ctx.badRequest("quote and author are required");
    }

    try {
      const videoRenderService = strapi.service("api::video-render.video-render") as any;

      const result = await videoRenderService.queueRender({
        compositionId: "QuoteReel",
        inputProps: {
          quote,
          author,
          source: source || "",
          backgroundUrl: backgroundUrl || "",
          theme: theme || "elegant",
          animationType: "fade",
        },
        outputFormat: "mp4",
        quality: "standard",
        userId,
      });

      ctx.body = {
        data: {
          renderId: result.renderId,
          status: "queued",
        },
      };
    } catch (error) {
      strapi.log.error("Error creating quote video:", error);
      ctx.throw(500, "Failed to create quote video");
    }
  },

  /**
   * Generate daily scripture video
   * POST /api/video-renders/daily
   */
  async daily(ctx: any) {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return ctx.unauthorized("Authentication required");
    }

    const { reference, text, reflection, theme, backgroundUrl } = ctx.request.body;

    if (!reference || !text) {
      return ctx.badRequest("reference and text are required");
    }

    try {
      const videoRenderService = strapi.service("api::video-render.video-render") as any;

      const result = await videoRenderService.queueRender({
        compositionId: "DailyScripture",
        inputProps: {
          date: new Date().toISOString(),
          reference,
          text,
          reflection: reflection || "",
          theme: theme || "morning",
          backgroundUrl: backgroundUrl || "",
        },
        outputFormat: "mp4",
        quality: "standard",
        userId,
      });

      ctx.body = {
        data: {
          renderId: result.renderId,
          status: "queued",
        },
      };
    } catch (error) {
      strapi.log.error("Error creating daily scripture video:", error);
      ctx.throw(500, "Failed to create daily scripture video");
    }
  },

  /**
   * Generate declaration video
   * POST /api/video-renders/declaration
   */
  async declaration(ctx: any) {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return ctx.unauthorized("Authentication required");
    }

    const { declarations, style, typography, audioUrl } = ctx.request.body;

    if (!declarations || !Array.isArray(declarations) || declarations.length === 0) {
      return ctx.badRequest("declarations array is required");
    }

    try {
      const videoRenderService = strapi.service("api::video-render.video-render") as any;

      const result = await videoRenderService.queueRender({
        compositionId: "DeclarationVideo",
        inputProps: {
          declarations,
          style: style || "prophetic",
          typography: typography || "bold",
          paceMode: "rhythmic",
          audioUrl: audioUrl || "",
        },
        outputFormat: "mp4",
        quality: "standard",
        userId,
      });

      ctx.body = {
        data: {
          renderId: result.renderId,
          status: "queued",
        },
      };
    } catch (error) {
      strapi.log.error("Error creating declaration video:", error);
      ctx.throw(500, "Failed to create declaration video");
    }
  },
});
