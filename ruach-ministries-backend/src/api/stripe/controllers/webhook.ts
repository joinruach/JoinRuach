import Stripe from "stripe";
import { applySubscriptionToUser, ensureStripeClient } from "../../../services/stripe-sync";

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

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;
  if (!session.subscription) return;

  const stripe = ensureStripeClient();
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });

  await applySubscriptionToUser(subscription, {
    customerEmail:
      session.customer_details?.email ?? session.customer_email ?? null,
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
