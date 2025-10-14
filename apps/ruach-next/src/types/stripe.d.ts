declare module "stripe" {
  type StringRecord = Record<string, string | null | undefined>;

  namespace Stripe {
    namespace Subscription {
      type Status =
        | "trialing"
        | "active"
        | "past_due"
        | "unpaid"
        | "canceled"
        | "paused"
        | "incomplete"
        | "incomplete_expired"
        | "ended";
    }

    interface Product {
      id: string;
      name?: string | null;
    }

    interface DeletedProduct {
      id: string;
      deleted: true;
    }

    interface Price {
      id?: string;
      nickname?: string | null;
      product?: string | Product | DeletedProduct | null;
    }

    interface SubscriptionItem {
      price?: Price | null;
    }

    interface Subscription {
      id: string;
      status: Subscription.Status;
      items: {
        data: SubscriptionItem[];
      };
      customer: string | Customer | null;
      current_period_end?: number | null;
      metadata?: StringRecord | null;
    }

    interface Customer {
      id: string;
      email?: string | null;
    }

    namespace Checkout {
      interface Session {
        id: string;
        mode?: string | null;
        subscription?: string | Subscription | null;
        customer?: string | Customer | null;
        customer_email?: string | null;
        customer_details?: {
          email?: string | null;
        } | null;
        metadata?: StringRecord | null;
        url?: string | null;
      }
    }

    interface Event {
      id: string;
      type: string;
      data: {
        object: unknown;
      };
    }
  }

  export default class Stripe {
    constructor(apiKey: string, config?: { apiVersion?: string });

    subscriptions: {
      retrieve(
        subscriptionId: string,
        params?: { expand?: string[] }
      ): Promise<Stripe.Subscription>;
    };

    checkout: {
      sessions: {
        create(params: {
          mode: string;
          line_items: Array<{ price: string; quantity?: number }>;
          success_url: string;
          cancel_url: string;
          allow_promotion_codes?: boolean;
          subscription_data?: { metadata?: Record<string, string> };
          customer?: string;
          customer_email?: string;
          metadata?: Record<string, string>;
        }): Promise<Stripe.Checkout.Session>;
      };
    };

    billingPortal: {
      sessions: {
        create(params: {
          customer: string;
          return_url: string;
        }): Promise<{ url: string | null }>;
      };
    };

    webhooks: {
      constructEvent(
        payload: string | Buffer,
        signature: string,
        secret: string
      ): Stripe.Event;
    };
  }
}
