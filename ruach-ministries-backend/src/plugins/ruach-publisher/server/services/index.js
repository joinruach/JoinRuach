/**
 * Ruach Publisher - Services Index
 *
 * Exports all services for the publisher plugin
 */

'use strict';

const publisher = require('./publisher');
const providers = require('./providers');

module.exports = {
  publisher,
  providers,
};
