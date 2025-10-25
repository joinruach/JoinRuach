/**
 * Ruach Publisher Plugin - Server Configuration
 *
 * Auto-publishes media items to connected social platforms
 * when they are published in Strapi.
 */

'use strict';

const services = require('./server/services');
const routes = require('./server/routes');
const bootstrap = require('./server/bootstrap');

module.exports = () => ({
  register({ strapi }) {
    strapi.log.info('Ruach Publisher plugin: Registering...');
  },

  bootstrap,
  services,
  routes,
});
