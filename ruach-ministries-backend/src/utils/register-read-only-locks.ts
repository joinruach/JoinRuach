// eslint-disable-next-line @typescript-eslint/no-var-requires
const { errors } = require('@strapi/utils');
import type { Core } from '@strapi/strapi';

const READ_ONLY_UIDS = [
  'api::about.about',
  'api::article.article',
  'api::audio-file.audio-file',
  'api::contact-info.contact-info',
  'api::gallery.gallery',
  'api::hero-section.hero-section',
  'api::reply.reply',
  'api::setting.setting',
  'api::testimonial.testimonial',
  'api::trending-video.trending-video',
  'api::video.video',
];

const isSuperAdmin = (ctx: unknown): boolean => {
  if (!ctx || typeof ctx !== 'object') {
    return false;
  }

  const user = (ctx as Record<string, unknown>).state as
    | undefined
    | {
        user?: {
          roles?: Array<{ code?: string }>;
        };
      };

  if (!user?.user?.roles || !Array.isArray(user.user.roles)) {
    return false;
  }

  return user.user.roles.some((role) => role.code === 'strapi-super-admin');
};

const isAdminRequest = (ctx: unknown): boolean => {
  if (!ctx || typeof ctx !== 'object') {
    return false;
  }

  const user = (ctx as Record<string, unknown>).state as
    | undefined
    | {
        user?: {
          roles?: unknown;
        };
      };

  return Array.isArray(user?.user?.roles);
};

const forbidEditorMutation = (strapi: Core.Strapi) => {
  const ctx = strapi.requestContext.get();

  if (!ctx) {
    // Allow background jobs and scripts with no attached request context.
    return;
  }

  if (!isAdminRequest(ctx)) {
    // Content API users (e.g. authenticated/public) are already governed by role permissions.
    return;
  }

  if (isSuperAdmin(ctx)) {
    return;
  }

  throw new errors.ForbiddenError('This collection is read-only for editors.');
};

export const registerReadOnlyLocks = (strapi: Core.Strapi) => {
  strapi.db.lifecycles.subscribe({
    models: READ_ONLY_UIDS,
    beforeCreate() {
      forbidEditorMutation(strapi);
    },
    beforeUpdate() {
      forbidEditorMutation(strapi);
    },
    beforeDelete() {
      forbidEditorMutation(strapi);
    },
  });
};
