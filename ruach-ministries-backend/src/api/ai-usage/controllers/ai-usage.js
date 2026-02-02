'use strict';

/**
 * ai-usage controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::ai-usage.ai-usage', ({ strapi }) => ({
  /**
   * Get daily usage summary for a user
   */
  async dailySummary(ctx) {
    const { userId } = ctx.params;
    const { date } = ctx.query;

    const targetDate = date || new Date().toISOString().split('T')[0];

    const entries = await strapi.entityService.findMany('api::ai-usage.ai-usage', {
      filters: {
        userId,
        requestDate: targetDate,
      },
    });

    const summary = entries.reduce((acc, entry) => ({
      totalTokens: acc.totalTokens + entry.totalTokens,
      totalCost: acc.totalCost + parseFloat(entry.estimatedCostUsd || 0),
      requestCount: acc.requestCount + 1,
    }), { totalTokens: 0, totalCost: 0, requestCount: 0 });

    return {
      userId,
      date: targetDate,
      ...summary,
      totalCost: summary.totalCost.toFixed(4),
    };
  },

  /**
   * Get usage breakdown by tier (admin only)
   */
  async tierBreakdown(ctx) {
    const { startDate, endDate } = ctx.query;

    const entries = await strapi.entityService.findMany('api::ai-usage.ai-usage', {
      filters: {
        requestDate: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    });

    const byTier = entries.reduce((acc, entry) => {
      const tier = entry.userTier || 'free';
      if (!acc[tier]) {
        acc[tier] = { tokens: 0, cost: 0, requests: 0, users: new Set() };
      }
      acc[tier].tokens += entry.totalTokens;
      acc[tier].cost += parseFloat(entry.estimatedCostUsd || 0);
      acc[tier].requests += 1;
      acc[tier].users.add(entry.userId);
      return acc;
    }, {});

    // Convert Sets to counts
    Object.keys(byTier).forEach(tier => {
      byTier[tier].uniqueUsers = byTier[tier].users.size;
      delete byTier[tier].users;
      byTier[tier].cost = byTier[tier].cost.toFixed(4);
    });

    return byTier;
  },
}));
