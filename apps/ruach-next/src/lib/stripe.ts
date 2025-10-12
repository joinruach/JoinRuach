import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!client) {
    client = new Stripe(secret, { apiVersion: "2024-06-20" });
  }

  return client;
}
