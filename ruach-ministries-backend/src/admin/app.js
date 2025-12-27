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
  register(app) {
    // Register custom video upload widget
    app.customFields.register({
      name: 'video-upload-large',
      pluginId: 'ruach-video-uploader', // Changed from 'admin' to custom plugin ID
      type: 'text',
      intlLabel: {
        id: 'custom-field.video-upload-large.label',
        defaultMessage: 'Large Video Upload (Resumable)',
      },
      intlDescription: {
        id: 'custom-field.video-upload-large.description',
        defaultMessage: 'Upload large video files (up to 10GB) with progress tracking and resumption support',
      },
      components: {
        // FIXED: Use async import function instead of direct reference
        Input: async () => import('./extensions/upload/VideoUploadWidget'),
      },
      options: {
        base: {},
        advanced: {},
        validator: () => {},
      },
    });
  },
};
