/*
 * Backfill utility to populate slugs, releasedAt, and other required defaults
 * after tightening schema validations.
 *
 * Run via: pnpm strapi console --file scripts/backfill-slugs-and-defaults.ts
 */

const slugify = (value: string | null | undefined) => {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

async function generateUniqueSlug(strapi: any, uid: string, baseCandidate: string, entityId: number | string) {
  let candidate = baseCandidate && baseCandidate.length ? baseCandidate : `${uid.split('.').pop()}-${entityId}`;
  let attempt = 1;

  while (true) {
    const existing = await strapi.entityService.findMany(uid, {
      filters: {
        slug: { $eq: candidate },
        id: { $ne: entityId },
      },
      fields: ['id'],
      limit: 1,
    });

    if (!existing?.length) {
      return candidate;
    }

    candidate = `${baseCandidate}-${attempt}`;
    attempt += 1;
  }
}

async function backfillMediaItems(strapi: any) {
  const rows = await strapi.entityService.findMany('api::media-item.media-item', {
    filters: {
      $or: [
        { slug: { $null: true } },
        { releasedAt: { $null: true } },
        { type: { $null: true } },
        { featured: { $null: true } },
      ],
    },
    publicationState: 'preview',
    fields: ['id', 'title', 'slug', 'releasedAt', 'type', 'featured'],
  });

  let updated = 0;

  for (const row of rows) {
    const desiredSlug = row.slug ?? slugify(row.title) ?? `media-item-${row.id}`;
    const slug = await generateUniqueSlug(strapi, 'api::media-item.media-item', desiredSlug, row.id);
    const data: Record<string, unknown> = {};

    if (row.slug !== slug) {
      data.slug = slug;
    }

    if (!row.releasedAt) {
      data.releasedAt = new Date().toISOString();
    }

    if (!row.type) {
      data.type = 'testimony';
    }

    if (row.featured === null || row.featured === undefined) {
      data.featured = false;
    }

    if (Object.keys(data).length) {
      await strapi.entityService.update('api::media-item.media-item', row.id, { data });
      updated += 1;
    }
  }

  strapi.log.info(`Media items backfilled: ${updated}`);
}

async function backfillVideoSlugs(strapi: any) {
  const rows = await strapi.entityService.findMany('api::video.video', {
    filters: { slug: { $null: true } },
    publicationState: 'preview',
    fields: ['id', 'title', 'slug', 'uid'],
  });

  for (const row of rows) {
    const legacy = row.uid ? slugify(row.uid) : '';
    const fallback = slugify(row.title) || `video-${row.id}`;
    const base = legacy || fallback;
    const slug = await generateUniqueSlug(strapi, 'api::video.video', base, row.id);
    await strapi.entityService.update('api::video.video', row.id, { data: { slug } });
  }

  strapi.log.info(`Video slugs backfilled: ${rows.length}`);
}

async function backfillGenericSlugs(strapi: any) {
  const targets: Array<[string, string]> = [
    ['api::category.category', 'name'],
    ['api::tag.tag', 'name'],
    ['api::speaker.speaker', 'name'],
    ['api::course.course', 'title'],
    ['api::event.event', 'title'],
    ['api::blog-post.blog-post', 'title'],
    ['api::article.article', 'title'],
    ['api::lesson.lesson', 'title'],
  ];

  for (const [uid, label] of targets) {
    const rows = await strapi.entityService.findMany(uid, {
      filters: { slug: { $null: true } },
      publicationState: 'preview',
      fields: ['id', 'slug', label],
    });

    for (const row of rows) {
      const base = slugify(row[label]) || `${uid.split('.').pop()}-${row.id}`;
      const slug = await generateUniqueSlug(strapi, uid, base, row.id);
      await strapi.entityService.update(uid, row.id, { data: { slug } });
    }

    strapi.log.info(`Backfilled slugs for ${uid}: ${rows.length}`);
  }
}

async function backfillImageAltText(strapi: any) {
  const fallbackAlt = 'Description pending';

  const customImages = await strapi.entityService.findMany('api::image.image', {
    filters: {
      $or: [
        { altText: { $null: true } },
        { altText: { $eq: '' } },
      ],
    },
    publicationState: 'preview',
    fields: ['id', 'title'],
  });

  let updatedCustom = 0;

  for (const image of customImages) {
    const altText = image.title?.trim() || fallbackAlt;
    await strapi.entityService.update('api::image.image', image.id, {
      data: { altText },
    });
    updatedCustom += 1;
  }

  const uploadFiles = await strapi.db.query('plugin::upload.file').findMany({
    where: {
      mime: { $startsWith: 'image/' },
      $or: [
        { alternativeText: { $null: true } },
        { alternativeText: { $eq: '' } },
      ],
    },
    select: ['id', 'name'],
  });

  let updatedUploads = 0;

  for (const file of uploadFiles) {
    const altText = file.name?.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || fallbackAlt;
    await strapi.db.query('plugin::upload.file').update({
      where: { id: file.id },
      data: { alternativeText: altText || fallbackAlt },
    });
    updatedUploads += 1;
  }

  strapi.log.info(`Alt text backfilled: ${updatedCustom} custom images, ${updatedUploads} upload files.`);
}

async function ensureUserProfiles(strapi: any) {
  const defaultAvatarRaw = process.env.DEFAULT_AVATAR_ASSET_ID;
  const defaultAvatarId = defaultAvatarRaw ? Number(defaultAvatarRaw) : undefined;
  const canPatchAvatar = typeof defaultAvatarId === 'number' && Number.isFinite(defaultAvatarId);

  const users = await strapi.db.query('plugin::users-permissions.user').findMany({
    populate: ['user_profile'],
  });

  let created = 0;
  let avatarPatched = 0;

  for (const user of users) {
    const userId = user.id;
    let profile = user.user_profile;

    if (!profile) {
      profile = await strapi.entityService.create('api::user-profile.user-profile', {
        data: {
          fullName: user.username || user.email || `User ${userId}`,
          users_permissions_user: userId,
        },
      });
      created += 1;
    }

    if (canPatchAvatar && defaultAvatarId && !profile.profilePicture) {
      await strapi.entityService.update('api::user-profile.user-profile', profile.id, {
        data: {
          profilePicture: defaultAvatarId,
        },
      });
      avatarPatched += 1;
    }
  }

  strapi.log.info(`User profiles ensured: ${created} created, ${avatarPatched} avatars patched.`);
}

async function publishDrafts(strapi: any) {
  const publishable: Array<[string, boolean]> = [
    ['api::media-item.media-item', true],
    ['api::video.video', true],
    ['api::lesson.lesson', true],
    ['api::course.course', true],
    ['api::event.event', true],
    ['api::blog-post.blog-post', true],
    ['api::article.article', true],
    // Category / Tag / Speaker have draftAndPublish disabled
    ['api::category.category', false],
    ['api::tag.tag', false],
    ['api::speaker.speaker', false],
  ];

  for (const [uid, supportsDraft] of publishable) {
    if (!supportsDraft) {
      continue;
    }

    const drafts = await strapi.entityService.findMany(uid, {
      filters: { publishedAt: { $null: true } },
      publicationState: 'preview',
      fields: ['id'],
    });

    for (const row of drafts) {
      await strapi.entityService.update(uid, row.id, {
        data: { publishedAt: new Date().toISOString() },
      });
    }

    strapi.log.info(`Published ${drafts.length} entries for ${uid}`);
  }
}

export default async ({ strapi }: { strapi: any }) => {
  await backfillMediaItems(strapi);
  await backfillVideoSlugs(strapi);
  await backfillGenericSlugs(strapi);
  await backfillImageAltText(strapi);
  await ensureUserProfiles(strapi);
  await publishDrafts(strapi);

  strapi.log.info('Backfill complete.');
};
