export default {
  async debug(ctx: any) {
    try {
      // Use admin-level access to bypass permissions
      const items = await strapi.db.query('api::media-item.media-item').findMany({
        limit: 10,
        select: ['id', 'title', 'itemType', 'visibility', 'publishedAt', 'releasedAt'],
      });

      const series = await strapi.db.query('api::series.series').findMany({
        limit: 10,
        select: ['id', 'title', 'visibility', 'publishedAt'],
      });

      ctx.body = {
        message: 'Debug data (direct DB query)',
        mediaItems: items,
        series: series,
        counts: {
          totalMediaItems: items.length,
          totalSeries: series.length,
        }
      };
    } catch (error) {
      ctx.body = {
        error: error.message,
        stack: error.stack,
      };
    }
  },
};
