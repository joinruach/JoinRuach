import { errors } from '@strapi/utils';

type WhereClause = {
  id?: number | string;
  documentId?: string;
  filters?: Record<string, unknown>;
};

type BeforeUpdateEvent = {
  params: {
    data?: { slug?: string } & Record<string, unknown>;
    where?: WhereClause;
  };
};

function resolveId(where: WhereClause | undefined) {
  if (!where) return undefined;
  if (where.id) return where.id;
  const filters = where.filters as Record<string, any> | undefined;
  if (!filters) return undefined;
  if (typeof filters.id === 'object' && filters.id !== null && '$eq' in filters.id) {
    return (filters.id as Record<string, unknown>)['$eq'];
  }
  if (filters.id) return filters.id as number | string;
  if (typeof filters.documentId === 'object' && filters.documentId !== null && '$eq' in filters.documentId) {
    return (filters.documentId as Record<string, unknown>)['$eq'];
  }
  return filters.documentId as number | string | undefined;
}

export function createSlugFreezeLifecycle(uid: string) {
  return {
    async beforeUpdate(event: BeforeUpdateEvent) {
      const data = event.params?.data;
      if (!data || typeof data.slug === 'undefined') {
        return;
      }

      const id = resolveId(event.params?.where);
      if (!id) return;

      const current = await strapi.entityService.findOne(uid, id, {
        fields: ['slug', 'publishedAt'],
      });

      if (!current) return;
      const hasPublishState = Object.prototype.hasOwnProperty.call(current, 'publishedAt');

      const slugChanged = data.slug && data.slug !== current.slug;
      if (!slugChanged) return;

      if (!hasPublishState) {
        throw new errors.ValidationError('Slug is immutable after creation.');
      }

      if (current.publishedAt) {
        throw new errors.ValidationError('Slug is immutable after publish.');
      }
    },
  };
}

export default createSlugFreezeLifecycle;
