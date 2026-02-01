/**
 * Library Transcription Controller
 * Standard CRUD operations for transcription content type
 */

import type { Core } from '@strapi/strapi';

/**
 * GET /api/library-transcriptions
 * List all transcriptions with pagination and filters
 */
export async function find(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  try {
    const entityService = strapi.entityService as any;

    // Get pagination params from query
    const { _limit = 25, _start = 0, _sort = 'createdAt:desc', status } = ctx.query;

    const filters: any = {};
    if (status) {
      filters.status = status;
    }

    const transcriptions = await entityService.findMany('api::library-transcription.library-transcription', {
      filters,
      sort: _sort.split(',').map((s: string) => {
        const [field, direction] = s.split(':');
        return { [field]: direction === 'asc' ? 'asc' : 'desc' };
      }),
      limit: parseInt(_limit),
      offset: parseInt(_start),
      populate: ['sourceMediaId'],
    });

    const total = await entityService.count('api::library-transcription.library-transcription', {
      filters,
    });

    ctx.body = {
      data: transcriptions,
      meta: {
        pagination: {
          start: parseInt(_start),
          limit: parseInt(_limit),
          total,
        },
      },
    };
  } catch (error) {
    strapi.log.error('[library-transcription] Failed to list transcriptions', error);
    ctx.internalServerError('Failed to list transcriptions');
  }
}

/**
 * GET /api/library-transcriptions/:id
 * Get a single transcription
 */
export async function findOne(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  try {
    const { id } = ctx.params;
    const entityService = strapi.entityService as any;

    const transcription = await entityService.findOne('api::library-transcription.library-transcription', id, {
      populate: ['sourceMediaId'],
    });

    if (!transcription) {
      return ctx.notFound('Transcription not found');
    }

    ctx.body = { data: transcription };
  } catch (error) {
    strapi.log.error('[library-transcription] Failed to get transcription', error);
    ctx.internalServerError('Failed to get transcription');
  }
}

/**
 * POST /api/library-transcriptions
 * Create a new transcription (typically called internally after processing)
 */
export async function create(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { sourceMediaId, status = 'pending', ...data } = ctx.request.body;

    if (!sourceMediaId) {
      return ctx.badRequest('sourceMediaId is required');
    }

    const entityService = strapi.entityService as any;

    const transcription = await entityService.create('api::library-transcription.library-transcription', {
      data: {
        sourceMediaId,
        status,
        ...data,
      },
    });

    ctx.body = { data: transcription };
  } catch (error: any) {
    strapi.log.error('[library-transcription] Failed to create transcription', error);
    ctx.status = 500;
    ctx.body = { error: error.message || 'Failed to create transcription' };
  }
}

/**
 * PUT /api/library-transcriptions/:id
 * Update a transcription
 */
export async function update(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { id } = ctx.params;
    const { sourceMediaId, ...data } = ctx.request.body;

    // Prevent updating the source media relationship
    const entityService = strapi.entityService as any;

    const transcription = await entityService.update(
      'api::library-transcription.library-transcription',
      id,
      {
        data,
      }
    );

    ctx.body = { data: transcription };
  } catch (error: any) {
    strapi.log.error('[library-transcription] Failed to update transcription', error);
    ctx.status = 500;
    ctx.body = { error: error.message || 'Failed to update transcription' };
  }
}

/**
 * DELETE /api/library-transcriptions/:id
 * Delete a transcription
 */
export async function remove(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('Authentication required');
  }

  try {
    const { id } = ctx.params;
    const entityService = strapi.entityService as any;

    const transcription = await entityService.delete('api::library-transcription.library-transcription', id);

    ctx.body = { data: transcription };
  } catch (error: any) {
    strapi.log.error('[library-transcription] Failed to delete transcription', error);
    ctx.status = 500;
    ctx.body = { error: error.message || 'Failed to delete transcription' };
  }
}

export default {
  find,
  findOne,
  create,
  update,
  remove,
};
