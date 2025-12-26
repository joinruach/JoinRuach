import Stripe from "stripe";

declare const strapi: any;

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const ACTIVE_ROLE_NAME = process.env.STRIPE_ACTIVE_ROLE_NAME || "Partner";
const DEFAULT_ROLE_NAME = process.env.STRIPE_FALLBACK_ROLE_NAME || "Authenticated";

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "trialing",
  "active",
  "past_due",
  "paused",
]);

let stripeClient: Stripe | null = null;

type WebhookContext = {
  req: NodeJS.ReadableStream & { setEncoding(encoding: string): void };
  request: { headers: Record<string, string | string[] | undefined> };
  throw(status: number, message: string): never;
  status?: number;
  body?: unknown;
};

const isStripeProduct = (
  product: Stripe.Product | Stripe.DeletedProduct
): product is Stripe.Product => {
  return !("deleted" in product && product.deleted === true);
};

const resolveProductName = (
  product: Stripe.Product | Stripe.DeletedProduct | string | null | undefined
): string | null => {
  if (!product || typeof product === "string") {
    return null;
  }
  if (!isStripeProduct(product)) {
    return null;
  }
  return product.name ?? null;
};

const ensureStripe = () => {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY env var is not configured");
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET env var is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    });
  }
  return stripeClient;
};

async function readRawBody(ctx: WebhookContext): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    ctx.req.setEncoding("utf8");
    ctx.req.on("data", (chunk) => {
      data += chunk;
    });
    ctx.req.on("end", () => resolve(data));
    ctx.req.on("error", reject);
  });
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
      `[stripe-webhook] Could not find role "${desiredRoleName}" while toggling membership for user ${user.id}`
    );
    return;
  }

  await strapi.entityService.update("plugin::users-permissions.user", user.id, {
    data: { role: roleId },
  });
}

async function applySubscriptionToUser(
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
    strapi.log.warn("[stripe-webhook] Subscription missing customer id");
    return;
  }

  const firstItem = subscription.items?.data?.[0] ?? null;
  const price = firstItem?.price ?? null;
  const planNickname = price?.nickname ?? resolveProductName(price?.product ?? null);

  const maxItemPeriodEnd = (subscription.items?.data ?? []).reduce(
    (max, item) => Math.max(max, item.current_period_end ?? 0),
    0
  );
  const currentPeriodEnd = maxItemPeriodEnd
    ? new Date(maxItemPeriodEnd * 1000).toISOString()
    : null;

  const membershipStatus = subscription.status;
  const isActive = ACTIVE_STATUSES.has(subscription.status);

  const user = await findUser({
    stripeCustomerId: customerId,
    email: context.customerEmail,
    strapiUserId: context.strapiUserId,
  });

  if (!user) {
    strapi.log.warn(
      `[stripe-webhook] Unable to locate Strapi user for subscription ${subscription.id}`
    );
    return;
  }

  const updateData: Record<string, unknown> = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    membershipStatus,
    membershipPlanName: planNickname,
    activeMembership: isActive,
  };

  if (currentPeriodEnd) {
    updateData.membershipCurrentPeriodEnd = currentPeriodEnd;
  }

  await strapi.entityService.update("plugin::users-permissions.user", user.id, {
    data: updateData as any,
  });

  await updateUserRole(user, isActive);

  strapi.log.info(
    `[stripe-webhook] Synced subscription ${subscription.id} (${membershipStatus}) for user ${user.id}`
  );
}

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;
  if (!session.subscription) return;

  const stripe = ensureStripe();
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });

  await applySubscriptionToUser(subscription, {
    customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
    strapiUserId: session.metadata?.strapiUserId ?? session.metadata?.userId ?? null,
  });
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  await applySubscriptionToUser(subscription, {
    strapiUserId: subscription.metadata?.strapiUserId ?? subscription.metadata?.userId ?? null,
  });
}

export default {
  async handle(ctx: WebhookContext) {
    try {
      const stripe = ensureStripe();
      const signature = ctx.request.headers["stripe-signature"];

      if (!signature) {
        ctx.throw(400, "Missing Stripe signature header");
        return;
      }

      const rawBody = await readRawBody(ctx);
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          STRIPE_WEBHOOK_SECRET!
        );
      } catch (error) {
        strapi.log.error("[stripe-webhook] Signature verification failed", error);
        ctx.throw(400, "Stripe signature verification failed");
        return;
      }

      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSession(event.data.object as Stripe.Checkout.Session);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
        case "customer.subscription.paused":
        case "customer.subscription.resumed":
          await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
          break;
        case "customer.updated": {
          const customer = event.data.object as Stripe.Customer;
          if (customer.id) {
            const user = await findUser({
              stripeCustomerId: customer.id,
              email: (customer.email as string) ?? null,
            });
            if (user && !user.stripeCustomerId) {
              await strapi.entityService.update(
                "plugin::users-permissions.user",
                user.id,
                {
                  data: {
                    stripeCustomerId: customer.id,
                  } as any,
                }
              );
            }
          }
          break;
        }
        default:
          strapi.log.debug(`[stripe-webhook] Unhandled event type ${event.type}`);
      }

      ctx.status = 200;
      ctx.body = { received: true };
    } catch (error) {
      strapi.log.error("[stripe-webhook] Error processing webhook", error);
      ctx.throw(500, "Stripe webhook processing failed");
    }
  },
};
