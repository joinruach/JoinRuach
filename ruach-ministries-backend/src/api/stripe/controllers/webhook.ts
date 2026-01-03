import Stripe from "stripe";
import {
  ensureStripeClient,
  syncMembershipFromSubscription,
} from "../../../services/stripe-sync";
import { enqueueDonationThankYouEmail } from "../../../services/donation-thankyou-queue";

declare const strapi: any;

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

type WebhookContext = {
  req: NodeJS.ReadableStream & { setEncoding(encoding: string): void };
  request: { headers: Record<string, string | string[] | undefined> };
  throw(status: number, message: string): never;
  status?: number;
  body?: unknown;
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

async function loadSubscription(
  stripe: Stripe,
  subscriptionRef?: string | Stripe.Subscription | null
): Promise<Stripe.Subscription | null> {
  if (!subscriptionRef) return null;
  if (typeof subscriptionRef === "string") {
    return await stripe.subscriptions.retrieve(subscriptionRef, {
      expand: ["items.data.price.product"],
    });
  }
  return subscriptionRef;
}

async function handleMembershipCheckoutSession(session: Stripe.Checkout.Session) {
  const stripe = ensureStripeClient();
  const subscription = await loadSubscription(stripe, session.subscription);
  if (!subscription) return;

  await syncMembershipFromSubscription(subscription, {
    customerEmail:
      session.customer_details?.email ?? session.customer_email ?? null,
    strapiUserId: session.metadata?.strapiUserId ?? session.metadata?.userId ?? null,
  });
}

async function resolveUserFromSession(session: Stripe.Checkout.Session) {
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const email =
    session.customer_details?.email ??
    session.customer_email ??
    session.customer_details?.email ??
    null;

  if (customerId) {
    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { stripeCustomerId: customerId } });
    if (user) {
      return user;
    }
  }

  if (email) {
    const normalized = email.toLowerCase();
    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { email: normalized } });
    if (user) {
      return user;
    }
  }

  return null;
}

async function handleCourseCheckoutSession(session: Stripe.Checkout.Session) {
  const courseSlug = session.metadata?.courseSlug?.trim();
  if (!courseSlug) {
    strapi.log.warn("[stripe-webhook] Course session missing courseSlug");
    return;
  }

  if (!session.id) return;

  const existing = await strapi.db
    .query("api::course-license.course-license")
    .findOne({ where: { stripeCheckoutSessionId: session.id } });
  if (existing) return;

  const user = await resolveUserFromSession(session);
  if (!user) {
    strapi.log.warn(
      `[stripe-webhook] Course session ${session.id} missing associated user`
    );
    return;
  }

  await strapi.entityService.create("api::course-license.course-license", {
    data: {
      courseSlug,
      grantedAt: new Date(),
      source: "purchase",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? undefined,
      user: user.id,
    } as any,
  });
}

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.type === "donation") {
    await handleDonationCompleted(session);
    return;
  }

  if (session.metadata?.type === "course") {
    await handleCourseCheckoutSession(session);
    return;
  }

  if (session.mode === "subscription" && session.metadata?.type === "membership") {
    await handleMembershipCheckoutSession(session);
    return;
  }

  if (session.mode !== "subscription") return;
  if (!session.subscription) return;

  const stripe = ensureStripeClient();
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });

  await syncMembershipFromSubscription(subscription, {
    customerEmail:
      session.customer_details?.email ?? session.customer_email ?? null,
    strapiUserId: session.metadata?.strapiUserId ?? session.metadata?.userId ?? null,
  });
}

async function handleDonationCompleted(session: Stripe.Checkout.Session) {
  if (!session.id) return;

  const existing = await strapi.db
    .query("api::donation.donation")
    .findOne({ where: { stripeSessionId: session.id } });
  if (existing) return;

  const amountTotal = typeof session.amount_total === "number" ? session.amount_total : null;
  const currency = typeof session.currency === "string" ? session.currency : null;
  if (amountTotal === null || currency === null) {
    strapi.log.warn(
      `[stripe-webhook] Donation session ${session.id} missing amount_total/currency`
    );
    return;
  }

  const email =
    session.customer_details?.email ?? session.customer_email ?? null;
  const source = session.metadata?.source ?? "unknown";
  const donatedAt = new Date(session.created * 1000);

  await strapi.entityService.create("api::donation.donation", {
    data: {
      stripeSessionId: session.id,
      amount: amountTotal,
      currency,
      email,
      source,
      donatedAt,
    } as any,
  });

  await enqueueDonationThankYouEmail(strapi, session.id);
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  await syncMembershipFromSubscription(subscription, {
    strapiUserId: subscription.metadata?.strapiUserId ?? subscription.metadata?.userId ?? null,
  });
}

export default {
  async handle(ctx: WebhookContext) {
    try {
      if (!STRIPE_WEBHOOK_SECRET) {
        strapi.log.error("[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET");
        ctx.throw(500, "Stripe webhook secret not configured");
        return;
      }

      const stripe = ensureStripeClient();
      const signature = ctx.request.headers["stripe-signature"];

      if (!signature) {
        ctx.throw(400, "Missing Stripe signature header");
        return;
      }

      const rawBody = await readRawBody(ctx);
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
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
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription?.id;
          if (!subscriptionId) {
            break;
          }
          const stripe = ensureStripeClient();
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price.product"],
          });
          await syncMembershipFromSubscription(subscription, {
            strapiUserId:
              invoice.metadata?.strapiUserId ?? invoice.metadata?.userId ?? null,
            customerEmail: invoice.customer_email ?? null,
          });
          break;
        }
        case "customer.updated": {
          const customer = event.data.object as Stripe.Customer;
          if (customer.id) {
            const user = await strapi.db
              .query("plugin::users-permissions.user")
              .findOne({ where: { stripeCustomerId: customer.id } });
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
