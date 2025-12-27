/**
 * Strapi Admin Customization
 *
 * Registers custom components and extensions
 */

export default {
  config: {
    locales: ['en'],
  },
  bootstrap(app) {
    console.log('Strapi admin customization loaded');
  },
};
