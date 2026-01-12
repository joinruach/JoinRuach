import createSlugFreezeLifecycle from "../../../../utils/freeze-slug";
import { revalidateContent } from "../../../../utils/cache-revalidation";

const slugLifecycle = createSlugFreezeLifecycle("api::series.series");

function buildRevalidationTags(result: Record<string, any>) {
  const tags = ["media-library", "series"];
  if (result.slug) {
    tags.push(`collection:${result.slug}`);
    tags.push(`series:${result.slug}`);
  }
  return tags;
}

export default {
  ...slugLifecycle,

  async afterCreate(event: any) {
    if (slugLifecycle?.afterCreate) {
      await slugLifecycle.afterCreate(event);
    }
    const { result } = event;
    if (result.publishedAt) {
      await revalidateContent("api::series.series", result, buildRevalidationTags(result));
    }
  },

  async afterUpdate(event: any) {
    if (slugLifecycle?.afterUpdate) {
      await slugLifecycle.afterUpdate(event);
    }
    const { result } = event;
    if (result.publishedAt) {
      await revalidateContent("api::series.series", result, buildRevalidationTags(result));
    }
  },

  async afterDelete(event: any) {
    const { result } = event;
    await revalidateContent("api::series.series", result, buildRevalidationTags(result));
  },
};
