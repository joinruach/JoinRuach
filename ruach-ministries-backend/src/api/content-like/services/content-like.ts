/**
 * Content Like Service
 *
 * Business logic for the like system. Toggle is idempotent —
 * calling toggle twice = unlike. Unique constraint enforced at query level.
 */

const VALID_CONTENT_TYPES = ['media', 'course', 'series', 'event'] as const;
type ContentType = (typeof VALID_CONTENT_TYPES)[number];

interface ToggleResult {
  liked: boolean;
  count: number;
}

export default () => ({
  async toggle(
    userId: number,
    contentType: ContentType,
    contentId: string
  ): Promise<ToggleResult> {
    const existing = await strapi.db.query('api::content-like.content-like').findOne({
      where: {
        contentType,
        contentId,
        user: userId,
      },
    });

    if (existing) {
      await strapi.db.query('api::content-like.content-like').delete({
        where: { id: existing.id },
      });
    } else {
      await strapi.db.query('api::content-like.content-like').create({
        data: {
          contentType,
          contentId,
          user: userId,
        },
      });
    }

    const count = await strapi.db.query('api::content-like.content-like').count({
      where: { contentType, contentId },
    });

    return { liked: !existing, count };
  },

  async count(contentType: ContentType, contentId: string): Promise<number> {
    return strapi.db.query('api::content-like.content-like').count({
      where: { contentType, contentId },
    });
  },

  async isLiked(
    userId: number,
    contentType: ContentType,
    contentId: string
  ): Promise<boolean> {
    const count = await strapi.db.query('api::content-like.content-like').count({
      where: { contentType, contentId, user: userId },
    });
    return count > 0;
  },

  async getUserLikes(
    userId: number,
    contentType?: ContentType
  ): Promise<{ contentType: string; contentId: string }[]> {
    const where: Record<string, unknown> = { user: userId };
    if (contentType) where.contentType = contentType;

    const likes = await strapi.db.query('api::content-like.content-like').findMany({
      where,
      select: ['contentType', 'contentId'],
      orderBy: { createdAt: 'desc' },
      limit: 100,
    });

    return likes.map((l: { contentType: string; contentId: string }) => ({
      contentType: l.contentType,
      contentId: l.contentId,
    }));
  },
});
