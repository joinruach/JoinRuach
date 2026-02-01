/**
 * Library Transcription Service
 * Standard service for library-transcription content type
 */

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Find transcriptions with filters
   */
  async find(filters: any = {}, pagination: any = {}) {
    const entityService = strapi.entityService as any;

    return await entityService.findMany('api::library-transcription.library-transcription', {
      filters,
      limit: pagination.limit || 25,
      offset: pagination.offset || 0,
      populate: ['sourceMediaId'],
    });
  },

  /**
   * Find a single transcription by ID
   */
  async findOne(id: string) {
    const entityService = strapi.entityService as any;

    return await entityService.findOne('api::library-transcription.library-transcription', id, {
      populate: ['sourceMediaId'],
    });
  },

  /**
   * Find transcriptions by source media ID
   */
  async findByMediaId(mediaId: string) {
    const entityService = strapi.entityService as any;

    return await entityService.findMany('api::library-transcription.library-transcription', {
      filters: { sourceMediaId: mediaId },
      populate: ['sourceMediaId'],
      limit: 1,
    });
  },

  /**
   * Create a new transcription
   */
  async create(data: any) {
    const entityService = strapi.entityService as any;

    return await entityService.create('api::library-transcription.library-transcription', {
      data,
    });
  },

  /**
   * Update a transcription
   */
  async update(id: string, data: any) {
    const entityService = strapi.entityService as any;

    return await entityService.update('api::library-transcription.library-transcription', id, {
      data,
    });
  },

  /**
   * Delete a transcription
   */
  async delete(id: string) {
    const entityService = strapi.entityService as any;

    return await entityService.delete('api::library-transcription.library-transcription', id);
  },

  /**
   * Count transcriptions by status
   */
  async countByStatus(status: string) {
    const entityService = strapi.entityService as any;

    return await entityService.count('api::library-transcription.library-transcription', {
      filters: { status },
    });
  },
});
