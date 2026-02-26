/**
 * Iron Chamber API Routes
 *
 * POST routes require authentication; GET routes are public (rate-limited).
 */

import { writeRateLimit, readRateLimit, moderateRateLimit } from '../../../middlewares/rate-limit';

export default {
  routes: [
    // Margin Reflections (public scripture notes)
    {
      method: 'POST',
      path: '/iron-chamber/margin-reflection',
      handler: 'iron-chamber.submitMarginReflection',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [writeRateLimit],
      },
    },
    {
      method: 'GET',
      path: '/iron-chamber/margin-reflections/:verseId',
      handler: 'iron-chamber.getMarginReflections',
      config: {
        auth: false,
        middlewares: [readRateLimit],
      },
    },

    // Iron Insights (AI-sharpened reflections)
    {
      method: 'GET',
      path: '/iron-chamber/insights',
      handler: 'iron-chamber.getInsights',
      config: {
        auth: false,
        middlewares: [readRateLimit],
      },
    },
    {
      method: 'GET',
      path: '/iron-chamber/insights/:insightId',
      handler: 'iron-chamber.getInsight',
      config: {
        auth: false,
        middlewares: [readRateLimit],
      },
    },
    {
      method: 'POST',
      path: '/iron-chamber/insights/:insightId/vote',
      handler: 'iron-chamber.voteOnInsight',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [writeRateLimit],
      },
    },

    // Living Commentary (curated wisdom)
    {
      method: 'GET',
      path: '/iron-chamber/living-commentary/:verseId',
      handler: 'iron-chamber.getLivingCommentary',
      config: {
        auth: false,
        middlewares: [readRateLimit],
      },
    },
    {
      method: 'POST',
      path: '/iron-chamber/curate-commentary',
      handler: 'iron-chamber.curateCommentary',
      config: {
        policies: ['global::is-curator-or-admin'],
        middlewares: [moderateRateLimit],
      },
    },

    // Admin endpoints
    {
      method: 'POST',
      path: '/iron-chamber/analyze-reflection/:reflectionId',
      handler: 'iron-chamber.analyzeReflection',
      config: {
        policies: ['global::is-curator-or-admin'],
        middlewares: [moderateRateLimit],
      },
    },
  ],
};
