/**
 * Formation Engine Controller
 * Handles HTTP requests for formation events and state management
 */

import type { Core } from '@strapi/strapi';
import { EmitEventRequestSchema } from '../validators/formation-validators';
import { validateRequest } from '../../../utils/validate-request';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Emit a formation event
   * POST /api/formation/emit-event
   */
  async emitEvent(ctx: any) {
    try {
      const data = validateRequest(ctx, EmitEventRequestSchema, ctx.request.body);
      if (!data) return;

      const { eventType, eventData, userId, anonymousUserId } = data;

      const event = {
        eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventType,
        eventData,
        eventMetadata: ctx.request.body.eventMetadata || {},
        timestamp: new Date(),
        user: userId || undefined,
        anonymousUserId: anonymousUserId || undefined,
      };

      const created = await strapi.service('api::formation-engine.formation-engine').emitFormationEvent(event);

      ctx.status = 201;
      ctx.body = { data: created };
    } catch (error) {
      strapi.log.error('Error in emitEvent controller:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  },

  /**
   * Get formation state for a user
   * GET /api/formation/state/:userId
   */
  async getState(ctx: any) {
    try {
      const { userId } = ctx.params;

      if (!userId) {
        ctx.status = 400;
        ctx.body = { error: 'userId is required' };
        return;
      }

      // Check if userId is numeric (Strapi user ID) or string (anonymous)
      const parsedUserId = isNaN(Number(userId)) ? userId : Number(userId);

      const state = await strapi.service('api::formation-engine.formation-engine').recomputeFormationState(parsedUserId);

      ctx.status = 200;
      ctx.body = { data: state };
    } catch (error) {
      strapi.log.error('Error in getState controller:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  },

  /**
   * Manually trigger state recomputation
   * POST /api/formation/recompute/:userId
   */
  async recomputeState(ctx: any) {
    try {
      const { userId } = ctx.params;

      if (!userId) {
        ctx.status = 400;
        ctx.body = { error: 'userId is required' };
        return;
      }

      const parsedUserId = isNaN(Number(userId)) ? userId : Number(userId);

      // Enqueue job
      await strapi.service('api::formation-engine.bull-queue').enqueueStateRecomputation({
        userId: parsedUserId,
        eventId: 'manual-recompute',
      });

      ctx.status = 202;
      ctx.body = { message: 'State recomputation enqueued' };
    } catch (error) {
      strapi.log.error('Error in recomputeState controller:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  },

  /**
   * Check if user can access a node
   * GET /api/formation/can-access/:nodeId?userId=xxx
   */
  async checkAccess(ctx: any) {
    try {
      const { nodeId } = ctx.params;
      const { userId } = ctx.query;

      if (!nodeId || !userId) {
        ctx.status = 400;
        ctx.body = { error: 'nodeId and userId are required' };
        return;
      }

      const parsedUserId = isNaN(Number(userId)) ? userId : Number(userId);

      const result = await strapi.service('api::formation-engine.formation-engine').canAccessNode(parsedUserId, nodeId);

      ctx.status = 200;
      ctx.body = { data: result };
    } catch (error) {
      strapi.log.error('Error in checkAccess controller:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  },

  /**
   * Get queue statistics
   * GET /api/formation/queue-stats
   */
  async getQueueStats(ctx: any) {
    try {
      const stats = await strapi.service('api::formation-engine.bull-queue').getStats();

      ctx.status = 200;
      ctx.body = { data: stats };
    } catch (error) {
      strapi.log.error('Error in getQueueStats controller:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  },
});
