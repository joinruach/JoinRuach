import {
  fetchLatestSubscription,
  markMembershipInactive,
  syncMembershipFromSubscription,
} from "../../../services/stripe-sync";

declare const strapi: any;

async function getAuthenticatedUser(ctx: { state: { user?: { id?: string | number } }; unauthorized: (msg?: string) => never }) {
  const userId = ctx.state.user?.id;
  if (!userId) {
    ctx.unauthorized("Authentication required");
    return null;
  }

  const user = await strapi.db
    .query("plugin::users-permissions.user")
    .findOne({
      where: { id: Number(userId) },
      select: ["id", "email", "stripeCustomerId"],
    });

  if (!user) {
    ctx.unauthorized("User not found");
    return null;
  }

  return user;
}

async function syncLatestSubscription(ctx: any) {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    return;
  }

  if (!user.stripeCustomerId) {
    ctx.badRequest("Stripe customer not linked");
    return;
  }

  const subscription = await fetchLatestSubscription(user.stripeCustomerId);
  if (!subscription) {
    await markMembershipInactive(user.id);
    ctx.status = 200;
    ctx.body = { success: true, subscription: null };
    return;
  }

  await syncMembershipFromSubscription(subscription, {
    strapiUserId: user.id,
    customerEmail: user.email ?? null,
  });

  ctx.status = 200;
  ctx.body = { success: true, subscription: subscription.id };
}

export default {
  async syncLatest(ctx: any) {
    await syncLatestSubscription(ctx);
  },
  async syncCustomer(ctx: any) {
    await syncLatestSubscription(ctx);
  },
};
