import createSlugFreezeLifecycle from '../../../../utils/freeze-slug';
import { revalidateContent } from '../../../../utils/cache-revalidation';

const slugLifecycle = createSlugFreezeLifecycle('api::article.article');

export default {
  ...slugLifecycle,

  async afterCreate(event: any) {
    if (slugLifecycle?.afterCreate) {
      await slugLifecycle.afterCreate(event);
    }
    const { result } = event;
    if (result.publishedAt) {
      await revalidateContent('api::article.article', result, ['articles']);
    }
  },

  async afterUpdate(event: any) {
    if (slugLifecycle?.afterUpdate) {
      await slugLifecycle.afterUpdate(event);
    }
    const { result } = event;
    if (result.publishedAt) {
      await revalidateContent('api::article.article', result, ['articles']);
    }
  },

  async afterDelete(event: any) {
    const { result } = event;
    await revalidateContent('api::article.article', result, ['articles']);
  },
};
