import createSlugFreezeLifecycle from '../../../../utils/freeze-slug';
import { revalidateContent } from '../../../../utils/cache-revalidation';

const slugLifecycle = createSlugFreezeLifecycle('api::course.course');

export default {
  ...slugLifecycle,

  async afterCreate(event: any) {
    if (slugLifecycle?.afterCreate) {
      await slugLifecycle.afterCreate(event);
    }
    const { result } = event;
    if (result.publishedAt) {
      await revalidateContent('api::course.course', result, ['courses']);
    }
  },

  async afterUpdate(event: any) {
    if (slugLifecycle?.afterUpdate) {
      await slugLifecycle.afterUpdate(event);
    }
    const { result } = event;
    if (result.publishedAt) {
      await revalidateContent('api::course.course', result, ['courses']);
    }
  },

  async afterDelete(event: any) {
    const { result } = event;
    await revalidateContent('api::course.course', result, ['courses']);
  },
};
