/**
 * Health Check Controller
 * Provides health status for monitoring systems
 */

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async healthCheck(ctx: any) {
    try {
      // Check BullMQ queue stats
      const queueService = strapi.service('api::formation-engine.bull-queue') as any;
      const queueStats = await queueService.getQueueStats();

      // Determine health based on failed jobs
      const isHealthy =
        queueStats.stateRecomputation.failed < 10 &&
        queueStats.reflectionAnalysis.failed < 10;

      ctx.status = isHealthy ? 200 : 503;
      ctx.body = {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        queues: queueStats,
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed / 1024 / 1024,
          total: process.memoryUsage().heapTotal / 1024 / 1024,
        },
      };
    } catch (error) {
      strapi.log.error('[Health Check] Error:', error);
      ctx.status = 503;
      ctx.body = {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
