import type { StrapiApp } from '@strapi/strapi/admin';

/**
 * Ruach Video Uploader Admin Extension
 *
 * Registers the large video upload custom field under the new
 * `ruach-video-uploader` plugin namespace so the admin bundle
 * can load it without crashing.
 */
export default {
  register(app: StrapiApp) {
    app.customFields.register({
      name: 'video-upload-large',
      pluginId: 'ruach-video-uploader',
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
        Input: () => import('./extensions/upload/VideoUploadWidget'),
      },
      options: {
        base: {},
        advanced: {},
        validator: () => {},
      },
    });
  },
  bootstrap() {},
};
