import Stripe from "stripe";

declare const strapi: any;

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_API_VERSION =
  (process.env.STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"] | undefined) ??
  "2025-12-15.clover";
const ACTIVE_ROLE_NAME = process.env.STRIPE_ACTIVE_ROLE_NAME || "Partner";
const DEFAULT_ROLE_NAME = process.env.STRIPE_FALLBACK_ROLE_NAME || "Authenticated";

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "trialing",
  "active",
  "past_due",
  "paused",
]);

const MEMBERSHIP_TIERS = new Set(["supporter", "partner", "builder"]);
const ACCESS_LEVELS = new Set(["basic", "full", "leader"]);

let stripeClient: Stripe | null = null;

function isStripeProduct(
  product: Stripe.Product | Stripe.DeletedProduct
): product is Stripe.Product {
  return !("deleted" in product && product.deleted === true);
}

function resolveProductName(
  product: Stripe.Product | Stripe.DeletedProduct | string | null | undefined
): string | null {
  if (!product || typeof product === "string") {
    return null;
  }
  if (!isStripeProduct(product)) {
    return null;
  }
  return product.name ?? null;
}

function ensureStripeClient() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY env var is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
    });
  }
  return stripeClient;
}

async function getRoleIdByName(name: string): Promise<number | null> {
  const role = await strapi.db
    .query("plugin::users-permissions.role")
    .findOne({ where: { name } });
  return role?.id ?? null;
}

async function findUser(options: {
  stripeCustomerId?: string;
  email?: string | null;
  strapiUserId?: string | number | null;
}) {
  const { stripeCustomerId, email, strapiUserId } = options;

  if (strapiUserId) {
    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: Number(strapiUserId) },
        populate: ["role"],
      });
    if (user) return user;
  }

  if (stripeCustomerId) {
    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { stripeCustomerId },
        populate: ["role"],
      });
    if (user) return user;
  }

  if (email) {
    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { email: email.toLowerCase() },
        populate: ["role"],
      });
    if (user) return user;
  }

  return null;
}

async function updateUserRole(user: any, shouldBeActive: boolean) {
  if (!user) return;

  let role = user.role;

  if (!role || typeof role === "number") {
    const roleId = typeof role === "number" ? role : undefined;
    if (roleId) {
      role = await strapi.db
        .query("plugin::users-permissions.role")
        .findOne({ where: { id: roleId } });
    }
  }

  const currentRoleName: string | undefined = (role as any)?.name;

  if (currentRoleName === "Super Admin") {
    return;
  }

  if (!shouldBeActive && currentRoleName === DEFAULT_ROLE_NAME) {
    return;
  }

  const desiredRoleName = shouldBeActive ? ACTIVE_ROLE_NAME : DEFAULT_ROLE_NAME;

  if (currentRoleName === desiredRoleName) {
    return;
  }

  const roleId = await getRoleIdByName(desiredRoleName);
  if (!roleId) {
    strapi.log.warn(
      `[stripe-sync] Could not find role "${desiredRoleName}" while toggling membership for user ${user.id}`
    );
    return;
  }

  await strapi.entityService.update("plugin::users-permissions.user", user.id, {
    data: { role: roleId },
  });
}

function normalizeEnumValue(value: string | null | undefined) {
  if (!value) return null;
  return value.trim().toLowerCase();
}

function resolveMembershipTier(metadataValue?: string | null) {
  const normalized = normalizeEnumValue(metadataValue);
  if (!normalized) return null;
  return MEMBERSHIP_TIERS.has(normalized) ? normalized : null;
}

function resolveAccessLevel(metadataValue?: string | null) {
  const normalized = normalizeEnumValue(metadataValue);
  if (!normalized) return null;
  return ACCESS_LEVELS.has(normalized) ? normalized : null;
}

function extractItemMetadata(
  subscription: Stripe.Subscription
): {
  tier?: string | null;
  accessLevel?: string | null;
  planName?: string | null;
} {
  const firstItem = subscription.items?.data?.[0] ?? null;
  const price = firstItem?.price ?? null;
  const tier =
    resolveMembershipTier(subscription.metadata?.tier) ??
    resolveMembershipTier(price?.metadata?.tier);
  const accessLevel =
    resolveAccessLevel(subscription.metadata?.access_level ?? subscription.metadata?.accessLevel) ??
    resolveAccessLevel(price?.metadata?.access_level ?? price?.metadata?.accessLevel);

  const metadataPlanName =
    subscription.metadata?.plan_name ??
    subscription.metadata?.planName ??
    price?.nickname ??
    resolveProductName(price?.product ?? null);

  return {
    tier,
    accessLevel,
    planName: metadataPlanName ?? null,
  };
}

export async function applySubscriptionToUser(
  subscription: Stripe.Subscription,
  context: {
    customerEmail?: string | null;
    strapiUserId?: string | number | null;
  } = {}
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) {
    strapi.log.warn("[stripe-sync] Subscription missing customer id");
    return;
  }

  const metadata = extractItemMetadata(subscription);

  const firstItem = subscription.items?.data?.[0] ?? null;
  const planNickname =
    metadata.planName ?? resolveProductName(firstItem?.price?.product ?? null);

  const subscriptionPeriodEnd =
    (subscription as { current_period_end?: number }).current_period_end ?? 0;
  const maxItemPeriodEnd = (subscription.items?.data ?? []).reduce(
    (max, item) =>
      Math.max(
        max,
        ((item as { current_period_end?: number }).current_period_end ?? 0)
      ),
    0
  );
  const periodEndValue = Math.max(subscriptionPeriodEnd, maxItemPeriodEnd);
  const currentPeriodEnd = periodEndValue
    ? new Date(periodEndValue * 1000).toISOString()
    : null;
  const createdAt = subscription.created
    ? new Date(subscription.created * 1000).toISOString()
    : null;
  const endedAt =
    (subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null) ??
    (subscription.ended_at
      ? new Date(subscription.ended_at * 1000).toISOString()
      : null);

  const membershipStatus = subscription.status;
  const isActive = ACTIVE_STATUSES.has(subscription.status);

  const user = await findUser({
    stripeCustomerId: customerId,
    email: context.customerEmail ?? null,
    strapiUserId: context.strapiUserId ?? null,
  });

  if (!user) {
    strapi.log.warn(
      `[stripe-sync] Unable to locate Strapi user for subscription ${subscription.id}`
    );
    return;
  }

  const updateData: Record<string, unknown> = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    membershipStatus,
    membershipPlanName: planNickname ?? subscription.id,
    activeMembership: isActive,
  };

  if (currentPeriodEnd) {
    updateData.membershipCurrentPeriodEnd = currentPeriodEnd;
  }
  updateData.membershipTier = metadata.tier ?? (user.membershipTier ?? "supporter");
  updateData.accessLevel = metadata.accessLevel ?? (user.accessLevel ?? "basic");
  if (createdAt) {
    updateData.membershipStartedAt = createdAt;
  }
  if (endedAt) {
    updateData.membershipEndedAt = endedAt;
  }

  await strapi.entityService.update("plugin::users-permissions.user", user.id, {
    data: updateData as any,
  });

  await updateUserRole(user, isActive);

  strapi.log.info(
    `[stripe-sync] Synced subscription ${subscription.id} (${membershipStatus}) for user ${user.id}`
  );
}

export async function fetchLatestSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const stripe = ensureStripeClient();
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 5,
    status: "all",
    expand: ["data.items.data.price.product"],
  });

  if (!subscriptions.data.length) {
    return null;
  }

  return subscriptions.data.reduce((latest, current) => {
    const latestEnd =
      ((latest as { current_period_end?: number }).current_period_end ?? 0) ||
      ((latest.items?.data[0] as { current_period_end?: number })?.current_period_end ?? 0);
    const currentEnd =
      ((current as { current_period_end?: number }).current_period_end ?? 0) ||
      ((current.items?.data[0] as { current_period_end?: number })?.current_period_end ?? 0);
    return currentEnd > latestEnd ? current : latest;
  });
}

export async function markMembershipInactive(userId: number) {
  await strapi.entityService.update("plugin::users-permissions.user", userId, {
    data: {
      membershipStatus: "canceled",
      activeMembership: false,
    },
  });
}

export { ensureStripeClient, ACTIVE_STATUSES };
