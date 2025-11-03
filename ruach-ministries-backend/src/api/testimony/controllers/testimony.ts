/**
 * testimony controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::testimony.testimony', ({ strapi }) => ({
  /**
   * Custom submit action for testimony form
   * Validates required fields and creates testimony entry
   */
  async submit(ctx) {
    try {
      const body = ctx.request.body;

      // Validate required fields
      if (!body.name || !body.email || !body.story_before || !body.story_encounter || !body.story_after) {
        return ctx.badRequest('Missing required fields: name, email, story_before, story_encounter, story_after', {
          code: 'VALIDATION_ERROR',
          details: {
            received: Object.keys(body),
            required: ['name', 'email', 'story_before', 'story_encounter', 'story_after']
          }
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return ctx.badRequest('Invalid email address', {
          code: 'INVALID_EMAIL'
        });
      }

      // Create testimony entry
      const entry = await strapi.entityService.create('api::testimony.testimony', {
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          location: body.location || null,
          ageRange: body.ageRange || null,
          socialHandles: body.socialHandles || null,
          story_before: body.story_before,
          story_encounter: body.story_encounter,
          story_after: body.story_after,
          scripture_anchor: body.scripture_anchor || null,
          core_message: body.core_message || null,
          on_camera: !!body.on_camera,
          media_consent: !!body.media_consent,
          referral_source: body.referral_source || null,
          join_future_projects: !!body.join_future_projects,
          prayer_request: body.prayer_request || null,
          contact_preference: body.contact_preference || null,
        }
      });

      strapi.log.info(`Testimony submitted successfully`, {
        id: entry.id,
        timestamp: new Date().toISOString()
      });

      return ctx.send({
        success: true,
        message: 'Testimony submitted successfully',
        data: { id: entry.id }
      });
    } catch (err) {
      strapi.log.error('Failed to submit testimony:', {
        error: err.message,
        timestamp: new Date().toISOString()
      });

      return ctx.internalServerError('Failed to submit testimony', {
        code: 'SUBMISSION_ERROR',
        error: err.message
      });
    }
  }
}));
