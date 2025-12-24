/**
 * Cache Revalidation Service
 *
 * Triggers Next.js ISR cache revalidation when content is published, updated, or deleted.
 * This ensures the frontend always reflects the latest CMS state.
 */

interface RevalidationPayload {
  model: string;
  entry: {
    slug?: string;
    category?: string;
    [key: string]: any;
  };
  tags?: string[];
  paths?: string[];
}

/**
 * Trigger frontend cache revalidation for a content entry
 */
export async function revalidateContent(
  model: string,
  entry: Record<string, any>,
  additionalTags: string[] = [],
  additionalPaths: string[] = []
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL;
  const revalidateSecret = process.env.STRAPI_REVALIDATE_SECRET;

  if (!frontendUrl || !revalidateSecret) {
    strapi.log.debug('Cache revalidation skipped: FRONTEND_URL or STRAPI_REVALIDATE_SECRET not set');
    return;
  }

  const revalidateUrl = `${frontendUrl.replace(/\/$/, '')}/api/strapi-revalidate`;

  const payload: RevalidationPayload = {
    model,
    entry: {
      slug: entry.slug,
      category: entry.category,
      id: entry.id,
    },
    tags: additionalTags,
    paths: additionalPaths,
  };

  try {
    const response = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ruach-signature': revalidateSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Revalidation failed: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as { tags?: string[]; paths?: string[] };
    strapi.log.info(`✅ Cache revalidated for ${model}:${entry.slug || entry.id}`, {
      tags: result.tags,
      paths: result.paths,
    });
  } catch (error) {
    // Log but don't throw - cache revalidation failures should not block content operations
    strapi.log.error(`❌ Cache revalidation failed for ${model}:${entry.slug || entry.id}`, error);
  }
}

/**
 * Create a lifecycle hook that triggers revalidation on publish/update/delete
 */
export function createRevalidationLifecycle(contentType: string, getAdditionalTags?: (entry: any) => string[]) {
  return {
    async afterCreate(event: any) {
      const { result } = event;
      if (result.publishedAt) {
        const additionalTags = getAdditionalTags ? getAdditionalTags(result) : [];
        await revalidateContent(contentType, result, additionalTags);
      }
    },

    async afterUpdate(event: any) {
      const { result } = event;
      if (result.publishedAt) {
        const additionalTags = getAdditionalTags ? getAdditionalTags(result) : [];
        await revalidateContent(contentType, result, additionalTags);
      }
    },

    async afterDelete(event: any) {
      const { result } = event;
      const additionalTags = getAdditionalTags ? getAdditionalTags(result) : [];
      await revalidateContent(contentType, result, additionalTags);
    },
  };
}
