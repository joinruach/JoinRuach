/**
 * comment-report controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::comment-report.comment-report', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const request = ctx.request as typeof ctx.request & {
      body?: { data?: Record<string, unknown> };
    };

    const body = request.body?.data ?? {};
    if (!body.reason || !body.comment) {
      return ctx.badRequest('reason and comment are required');
    }

    if (!request.body) {
      request.body = { data: {} };
    }

    request.body.data = {
      ...body,
      user: user.id,
    };

    return await super.create(ctx);
  },
}));
