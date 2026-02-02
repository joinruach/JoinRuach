'use strict';

/**
 * ai-usage service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::ai-usage.ai-usage');
