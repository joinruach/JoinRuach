import { factories } from '@strapi/strapi';
import formidable from 'formidable';
import { uploadToS3 } from '../uploadProvider'; // Ensure correct path

export default factories.createCoreController('api::video.video', ({ strapi }) => ({
  async upload(ctx) {
    const { files } = ctx.request;
    if (!files || !files.video) {
      return ctx.badRequest('No video file provided');
    }

    // Handle multiple or single file upload
    const file: formidable.File = Array.isArray(files.video) ? files.video[0] : files.video;

    if (!file.originalFilename || !file.mimetype || !file.filepath) {
      return ctx.badRequest('Invalid file format.');
    }

    try {
      // Map the formidable file properties to match the expected structure
      const fileData = {
        name: file.originalFilename,
        type: file.mimetype,
        filepath: file.filepath,
      };

      const uploadResponse = await uploadToS3(fileData);
      const videoUrl = uploadResponse.file.url;

      const video = await strapi.entityService.create('api::video.video', {
        data: { title: file.originalFilename, videoUrl },
      });

      return { message: 'Video uploaded successfully', data: video };
    } catch (error) {
      strapi.log.error('Upload error:', error);
      return ctx.internalServerError('Failed to upload video');
    }
  },
}));