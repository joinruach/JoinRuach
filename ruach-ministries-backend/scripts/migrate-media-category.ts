type BootstrapArgs = {
  // Using any keeps the script portable regardless of Strapi version typings
  strapi: any;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default async ({ strapi }: BootstrapArgs) => {
  const pageSize = 100;

  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const mediaItems = await strapi.entityService.findMany('api::media-item.media-item', {
      fields: ['id', 'legacyCategory'],
      populate: { category: { fields: ['id'] } },
      filters: {
        $or: [
          { legacyCategory: { $notNull: true } },
          { category: { id: { $null: true } } },
        ],
      },
      pagination: { page, pageSize },
    });

    if (!mediaItems.length) {
      break;
    }

    for (const mediaItem of mediaItems) {
      const legacyCategory = (mediaItem as any).legacyCategory as string | null;
      const hasRelation = Boolean((mediaItem as any).category);

      if ((!legacyCategory || legacyCategory.trim().length === 0) && hasRelation) {
        continue;
      }

      if (!legacyCategory || legacyCategory.trim().length === 0) {
        await strapi.entityService.update('api::media-item.media-item', mediaItem.id, {
          data: { legacyCategory: null },
        });
        continue;
      }

      const name = legacyCategory.trim();
      const [existingCategory] = await strapi.entityService.findMany('api::category.category', {
        fields: ['id', 'name'],
        filters: { name: { $eqi: name } },
        limit: 1,
      });

      const categoryEntity =
        existingCategory ??
        (await strapi.entityService.create('api::category.category', {
          data: {
            name,
            slug: slugify(name),
          },
        }));

      await strapi.entityService.update('api::media-item.media-item', mediaItem.id, {
        data: {
          category: categoryEntity.id,
          legacyCategory: null,
        },
      });
    }

    page += 1;
  }
};
