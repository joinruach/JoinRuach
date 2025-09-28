import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::user-profile.user-profile", ({ strapi }) => ({
  async find(ctx) {
    ctx.query = { ...ctx.query, populate: "users_permissions_user" };
    return await super.find(ctx);
  },

  async findOne(ctx) {
    ctx.query = { ...ctx.query, populate: "users_permissions_user" };
    return await super.findOne(ctx);
  }
}));
