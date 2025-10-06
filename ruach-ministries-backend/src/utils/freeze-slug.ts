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

function resolveId(where: WhereClause | undefined): number | string | undefined {
  if (!where) return undefined;
  if (typeof where.id === 'string' || typeof where.id === 'number') return where.id;
  const filters = where.filters as Record<string, any> | undefined;
  if (!filters) return undefined;
  if (typeof filters.id === 'object' && filters.id !== null && '$eq' in filters.id) {
    const eqValue = (filters.id as { $eq?: number | string }).$eq;
    if (typeof eqValue === 'string' || typeof eqValue === 'number') {
      return eqValue;
    }
  }
  if (typeof filters.id === 'string' || typeof filters.id === 'number') {
    return filters.id;
  }
  if (typeof filters.documentId === 'object' && filters.documentId !== null && '$eq' in filters.documentId) {
    const eqValue = (filters.documentId as { $eq?: number | string }).$eq;
    if (typeof eqValue === 'string' || typeof eqValue === 'number') {
      return eqValue;
    }
  }
  if (typeof filters.documentId === 'string' || typeof filters.documentId === 'number') {
    return filters.documentId;
  }
  return undefined;
}

function throwValidationError(message: string): never {
  const ctor = ((strapi as any)?.errors?.ValidationError ??
    (strapi as any)?.utils?.errors?.ValidationError ??
    Error) as new (msg: string) => Error & { status?: number };
  const error = new ctor(message) as Error & { status?: number };
  if (typeof error.status !== 'number') {
    error.status = 400;
  }
  if (!error.name || error.name === 'Error') {
    error.name = 'ValidationError';
  }
  throw error;
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

      const current = (await strapi.entityService.findOne(uid as never, id, {
        fields: ['slug', 'publishedAt'],
      })) as { slug?: string | null; publishedAt?: string | Date | null } | null;

      if (!current) return;
      const hasPublishState = Object.prototype.hasOwnProperty.call(current, 'publishedAt');

      const slugChanged = typeof data.slug === 'string' && data.slug !== current.slug;
      if (!slugChanged) return;

      if (!hasPublishState) {
        throwValidationError('Slug is immutable after creation.');
      }

      if (current.publishedAt) {
        throwValidationError('Slug is immutable after publish.');
      }
    },
  };
}

export default createSlugFreezeLifecycle;
