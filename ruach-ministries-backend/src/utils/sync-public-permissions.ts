import type { Core } from '@strapi/strapi';

const PUBLIC_ROLE_TYPE = 'public';

const PUBLIC_DISABLED_UIDS = new Set<`api::${string}.${string}`>([
  'api::article.article',
  'api::audio-file.audio-file',
  'api::gallery.gallery',
  'api::reply.reply',
  'api::testimonial.testimonial',
  'api::trending-video.trending-video',
]);

const VIDEO_UID: `api::${string}.${string}` = 'api::video.video';

type PublicPermission = {
  id: number;
  action: string;
  enabled: boolean;
};

const shouldEnableVideoAction = (action: string) => {
  const lastDot = action.lastIndexOf('.');
  if (lastDot === -1) {
    return false;
  }

  const actionName = action.slice(lastDot + 1);
  return actionName === 'find' || actionName === 'findOne';
};

const shouldEnableApiAction = (action: string) => {
  const lastDot = action.lastIndexOf('.');
  if (lastDot === -1) {
    return false;
  }

  const actionName = action.slice(lastDot + 1);
  return actionName === 'find' || actionName === 'findOne';
};

export const syncPublicPermissions = async (strapi: Core.Strapi) => {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({
      where: { type: PUBLIC_ROLE_TYPE },
      populate: ['permissions'],
    });

  if (!publicRole?.permissions?.length) {
    strapi.log.warn('Public role not found or has no permissions to sync.');
    return;
  }

  const updates: Array<Promise<unknown>> = [];

  for (const permission of publicRole.permissions as PublicPermission[]) {
    const lastDot = permission.action.lastIndexOf('.');
    if (lastDot === -1) {
      continue;
    }

    const uid = permission.action.slice(0, lastDot) as `api::${string}.${string}`;

    // Disable permissions for explicitly disabled content types
    if (PUBLIC_DISABLED_UIDS.has(uid)) {
      if (permission.enabled) {
        updates.push(
          strapi.db.query('plugin::users-permissions.permission').update({
            where: { id: permission.id },
            data: { enabled: false },
          }),
        );
      }
      continue;
    }

    // Special handling for video content type
    if (uid === VIDEO_UID) {
      const enable = shouldEnableVideoAction(permission.action);
      if (permission.enabled !== enable) {
        updates.push(
          strapi.db.query('plugin::users-permissions.permission').update({
            where: { id: permission.id },
            data: { enabled: enable },
          }),
        );
      }
      continue;
    }

    // Enable find and findOne for all other API content types
    if (uid.startsWith('api::')) {
      const enable = shouldEnableApiAction(permission.action);
      if (permission.enabled !== enable) {
        updates.push(
          strapi.db.query('plugin::users-permissions.permission').update({
            where: { id: permission.id },
            data: { enabled: enable },
          }),
        );
      }
    }
  }

  if (updates.length) {
    await Promise.all(updates);
    strapi.log.info(`Public role permissions synced (${updates.length} updates).`);
  }
};

