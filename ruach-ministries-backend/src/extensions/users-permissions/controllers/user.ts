import { factories } from "@strapi/strapi";

export default factories.createCoreController("plugin::users-permissions.user", ({ strapi }) => ({
  async find(ctx) {
    ctx.query = { ...ctx.query, populate: "user_profile" };
    return await super.find(ctx);
  },

  async findOne(ctx) {
    ctx.query = { ...ctx.query, populate: "user_profile" };
    return await super.findOne(ctx);
  }
}));
